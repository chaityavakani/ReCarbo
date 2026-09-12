import { prisma } from '../utils/prisma';
import { MatchingService } from './matchingService';
import { SettingsService } from './settingsService';
import * as https from 'https';

const sslAgent = new https.Agent({ rejectUnauthorized: false });

async function callAI(prompt: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === '<your_groq_api_key_here>') return null;

  const body = JSON.stringify({
    model: 'groq/compound-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 350,
    temperature: 0.3,
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'Content-Length': Buffer.byteLength(body),
        },
        agent: sslAgent,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json.choices?.[0]?.message?.content?.trim() || null);
          } catch {
            console.error('[Groq] Parse error:', data.slice(0, 200));
            resolve(null);
          }
        });
      }
    );
    req.on('error', (err) => {
      console.error('[Groq] Request error:', err.message);
      resolve(null);
    });
    req.write(body);
    req.end();
  });
}

export interface ParsedSearchFilters {
  quantityKg?: number;
  minPurityPercentage?: number;
  maxPricePerKg?: number;
  maxDistanceKm?: number;
  targetCity?: string;
  preferredState?: string;
  industry?: string;
}

export interface AssistantChatResponse {
  reply: string;
  actionType: 'MATCH_RECOMMENDATION' | 'SUPPLIER_COMPARISON' | 'UTILIZATION_ADVICE' | 'GENERAL_QA';
  generatedByAI: boolean;
  structuredData?: {
    matches?: any[];
    comparison?: any;
    filtersParsed?: ParsedSearchFilters;
    utilizationTip?: any;
  };
}

export class AIAssistantService {
  static parseNaturalLanguageQuery(text: string): ParsedSearchFilters {
    const lower = text.toLowerCase();
    const filters: ParsedSearchFilters = {};

    const tonneMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:tonnes?|tons?|t\b)/);
    if (tonneMatch) {
      filters.quantityKg = parseFloat(tonneMatch[1]) * 1000;
    } else {
      const kgMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)/);
      if (kgMatch) filters.quantityKg = parseFloat(kgMatch[1]);
    }

    const purityMatch = lower.match(/(?:at least|min|minimum|>=|≥)?\s*(\d+(?:\.\d+)?)\s*%/);
    if (purityMatch) {
      filters.minPurityPercentage = parseFloat(purityMatch[1]);
    } else if (lower.includes('pharma') || lower.includes('beverage') || lower.includes('ultra')) {
      filters.minPurityPercentage = 99.5;
    } else if (lower.includes('food') || lower.includes('polymer')) {
      filters.minPurityPercentage = 99.0;
    } else if (lower.includes('concrete') || lower.includes('cement') || lower.includes('mineral')) {
      filters.minPurityPercentage = 95.0;
    }

    const priceMatch = lower.match(/(?:under|max|budget|below|less than|within|inr|rs\.?|₹)\s*(?:inr|rs\.?|₹)?\s*(\d+(?:\.\d+)?)/i);
    if (priceMatch) {
      const val = parseFloat(priceMatch[1]);
      if (val < 100) filters.maxPricePerKg = val;
    }

    const distMatch = lower.match(/within\s*(\d+)\s*(?:km|kilometers?)/);
    if (distMatch) filters.maxDistanceKm = parseInt(distMatch[1], 10);

    const cities = ['ahmedabad', 'surat', 'bharuch', 'dahej', 'hazira', 'vadodara', 'nandesari', 'sanand'];
    for (const city of cities) {
      if (lower.includes(city)) {
        filters.targetCity = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }

    if (lower.includes('liquid') || lower.includes('cryogenic')) {
      filters.preferredState = 'Liquid';
    } else if (lower.includes('gas') || lower.includes('compressed')) {
      filters.preferredState = 'Compressed Gas';
    } else if (lower.includes('dry ice') || lower.includes('solid')) {
      filters.preferredState = 'Solid';
    }

    if (lower.includes('concrete') || lower.includes('cement')) {
      filters.industry = 'Cement & Concrete';
    } else if (lower.includes('polymer') || lower.includes('plastic')) {
      filters.industry = 'Polymer Synthesis';
    } else if (lower.includes('greenhouse') || lower.includes('agri')) {
      filters.industry = 'Agriculture';
    } else if (lower.includes('fuel') || lower.includes('saf') || lower.includes('aviation')) {
      filters.industry = 'Clean Energy / SAF';
    }

    return filters;
  }

  static async handleChatQuery(
    message: string,
    history: any[] = [],
    userId?: string
  ): Promise<AssistantChatResponse> {
    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();

    if (
      lower.includes('compare') ||
      lower.includes(' vs ') ||
      lower.includes('versus') ||
      (lower.includes('why is') && lower.includes('better than'))
    ) {
      return await this.handleComparisonQuery(trimmed);
    }

    const parsedFilters = this.parseNaturalLanguageQuery(trimmed);
    const hasSearchIntent =
      parsedFilters.quantityKg !== undefined ||
      parsedFilters.minPurityPercentage !== undefined ||
      parsedFilters.maxPricePerKg !== undefined ||
      parsedFilters.maxDistanceKm !== undefined ||
      lower.includes('need') ||
      lower.includes('want') ||
      lower.includes('looking for') ||
      lower.includes('find') ||
      lower.includes('search') ||
      lower.includes('supply') ||
      lower.includes('source');

    if (hasSearchIntent) return await this.handleMatchingSearch(parsedFilters, trimmed);

    if (
      lower.includes('concrete') ||
      lower.includes('polymer') ||
      lower.includes('greenhouse') ||
      lower.includes('saf') ||
      lower.includes('aviation') ||
      lower.includes('utiliz') ||
      lower.includes('cryogenic')
    ) {
      return await this.handleUtilizationAdvisory(lower);
    }

    return await this.handlePlatformInquiry(lower);
  }

  private static async handleMatchingSearch(
    filters: ParsedSearchFilters,
    rawQuery: string
  ): Promise<AssistantChatResponse> {
    const quantityKg = filters.quantityKg || 25000;
    const minPurity = filters.minPurityPercentage || 95.0;
    const maxPrice = filters.maxPricePerKg;
    const buyerCity = filters.targetCity || 'Ahmedabad';

    const listings = await prisma.cO2Listing.findMany({
      where: {
        status: 'ACTIVE',
        purityPercentage: { gte: minPurity },
        ...(maxPrice && { pricePerKg: { lte: maxPrice } }),
        ...(filters.preferredState && { stateOfMatter: filters.preferredState }),
      },
      include: { supplierCompany: true },
      orderBy: { pricePerKg: 'asc' },
    });

    const activeSettings = await SettingsService.getActivePlatformFee();

    const results = listings.map((l) => {
      const distanceKm = MatchingService.calculateDistanceKm(
        l.supplierCompany.latitude, l.supplierCompany.longitude,
        null, null,
        l.supplierCompany.city, buyerCity
      );

      const availQty = l.quantityAvailableKg;
      const qtyScore = availQty >= quantityKg
        ? (availQty / quantityKg <= 2 ? 100 : Math.max(85, Math.round(100 - (availQty / quantityKg - 2) * 5)))
        : Math.max(30, Math.round((availQty / quantityKg) * 90));
      const purityScore = Math.min(100, Math.round(85 + (l.purityPercentage - minPurity) * 15));
      const distScore = Math.max(10, Math.min(100, Math.round(100 - distanceKm * 0.1)));
      const priceScore = maxPrice
        ? Math.min(100, Math.max(40, Math.round(75 + ((maxPrice - l.pricePerKg) / maxPrice) * 60)))
        : Math.min(100, Math.max(40, Math.round(75 + (4.5 - l.pricePerKg) * 10)));
      const availScore = Math.min(100, Math.round(l.supplierCompany.trustScore || 85));
      const overallScore = Number((qtyScore * 0.3 + purityScore * 0.25 + distScore * 0.2 + priceScore * 0.15 + availScore * 0.1).toFixed(1));

      const subtotal = quantityKg * l.pricePerKg + quantityKg * distanceKm * activeSettings.transportRatePerKmKg + 2500;
      const landedCost = subtotal + (subtotal * activeSettings.feePercentage) / 100;

      return {
        listingId: l.id, title: l.title,
        supplierName: l.supplierCompany.name, supplierCity: l.supplierCompany.city,
        purityPercentage: l.purityPercentage,
        quantityAvailableTonnes: Number((l.quantityAvailableKg / 1000).toFixed(1)),
        pricePerKg: l.pricePerKg, stateOfMatter: l.stateOfMatter, captureMethod: l.captureMethod,
        distanceKm, landedCostEstimate: Math.round(landedCost),
        landedCostPerKg: Number((landedCost / quantityKg).toFixed(2)),
        overallScore, scores: { quantity: qtyScore, purity: purityScore, distance: distScore, price: priceScore, availability: availScore },
      };
    });

    results.sort((a, b) => b.overallScore - a.overallScore);

    if (results.length === 0) {
      const aiReply = await callAI(
        `You are ReCarbo AI for a CO2 marketplace in Gujarat, India.\n` +
        `A buyer asked: "${rawQuery}"\n` +
        `No listings matched. In 2 sentences, suggest they relax purity or price filters.`
      );
      return {
        reply: aiReply || 'No active listings match your criteria. Try relaxing the purity threshold or maximum price.',
        actionType: 'MATCH_RECOMMENDATION',
        generatedByAI: !!aiReply,
        structuredData: { filtersParsed: filters, matches: [] },
      };
    }

    const top = results[0];
    const contextLines = results.slice(0, 3).map((r, i) =>
      `#${i + 1} ${r.supplierName} (${r.supplierCity}): ${r.purityPercentage}% purity, ₹${r.pricePerKg.toFixed(2)}/kg, ${r.quantityAvailableTonnes}T, ${r.distanceKm}km away, score ${r.overallScore}%, landed ₹${r.landedCostPerKg}/kg`
    ).join('\n');

    const aiReply = await callAI(
      `You are ReCarbo AI, assistant for a B2B industrial CO2 marketplace in Gujarat, India.\n` +
      `Buyer asked: "${rawQuery}"\n\n` +
      `Matching engine results (use ONLY these numbers, do not invent any):\n${contextLines}\n\n` +
      `Write 3-4 sentences recommending the best match and why. Be specific with the numbers above.`
    );

    const fallback =
      `Found **${results.length} eligible listing(s)**. 🏆 **Top Match: ${top.supplierName} (${top.overallScore}% fit)**\n` +
      `• ${top.purityPercentage}% purity ${top.stateOfMatter} — ${top.quantityAvailableTonnes}T in ${top.supplierCity}\n` +
      `• ₹${top.pricePerKg.toFixed(2)}/kg base (landed ₹${top.landedCostPerKg}/kg incl. ${top.distanceKm}km freight)\n` +
      (results.length > 1 ? `• Runner-up: **${results[1].supplierName}** at ${results[1].overallScore}% fit, ₹${results[1].pricePerKg.toFixed(2)}/kg` : '');

    return {
      reply: aiReply || fallback,
      actionType: 'MATCH_RECOMMENDATION',
      generatedByAI: !!aiReply,
      structuredData: { filtersParsed: filters, matches: results },
    };
  }

  private static async handleComparisonQuery(rawQuery: string): Promise<AssistantChatResponse> {
    const allListings = await prisma.cO2Listing.findMany({
      include: { supplierCompany: true },
      orderBy: { createdAt: 'desc' },
    });

    const lower = rawQuery.toLowerCase();
    const named = allListings.filter((l) =>
      lower.includes(l.supplierCompany.name.toLowerCase()) ||
      lower.includes(l.title.toLowerCase().slice(0, 10))
    );
    const candidates = named.length >= 2 ? named.slice(0, 2) : allListings.slice(0, 2);

    if (candidates.length < 2) {
      return { reply: 'At least two listings are needed to perform a comparison.', actionType: 'SUPPLIER_COMPARISON', generatedByAI: false };
    }

    const [a, b] = candidates;
    const comparisonFacts =
      `Supplier A: ${a.supplierCompany.name} (${a.supplierCompany.city}) — ${a.purityPercentage}% purity, ₹${a.pricePerKg.toFixed(2)}/kg, ${(a.quantityAvailableKg / 1000).toFixed(1)}T, trust ${a.supplierCompany.trustScore.toFixed(1)}/100, ${a.supplierCompany.isVerified ? 'Verified' : 'Unverified'}, ${a.stateOfMatter}, ${a.captureMethod}.\n` +
      `Supplier B: ${b.supplierCompany.name} (${b.supplierCompany.city}) — ${b.purityPercentage}% purity, ₹${b.pricePerKg.toFixed(2)}/kg, ${(b.quantityAvailableKg / 1000).toFixed(1)}T, trust ${b.supplierCompany.trustScore.toFixed(1)}/100, ${b.supplierCompany.isVerified ? 'Verified' : 'Unverified'}, ${b.stateOfMatter}, ${b.captureMethod}.`;

    const aiReply = await callAI(
      `You are ReCarbo AI for a CO2 marketplace in Gujarat, India.\n` +
      `Compare these two CO2 suppliers using ONLY the data below. Give a structured comparison with a clear recommendation.\n\n` +
      `${comparisonFacts}\n\nDo not invent any numbers. Be concise and direct.`
    );

    const diffPurity = (a.purityPercentage - b.purityPercentage).toFixed(1);
    const fallback =
      `**${a.supplierCompany.name} vs ${b.supplierCompany.name}**\n\n` +
      `• Purity: ${a.purityPercentage}% vs ${b.purityPercentage}% (${parseFloat(diffPurity) > 0 ? a.supplierCompany.name + ' higher' : b.supplierCompany.name + ' higher'})\n` +
      `• Price: ₹${a.pricePerKg.toFixed(2)}/kg vs ₹${b.pricePerKg.toFixed(2)}/kg\n` +
      `• Capacity: ${(a.quantityAvailableKg / 1000).toFixed(1)}T vs ${(b.quantityAvailableKg / 1000).toFixed(1)}T\n` +
      `• Trust: ${a.supplierCompany.trustScore.toFixed(1)} vs ${b.supplierCompany.trustScore.toFixed(1)}/100`;

    return {
      reply: aiReply || fallback,
      actionType: 'SUPPLIER_COMPARISON',
      generatedByAI: !!aiReply,
      structuredData: {
        comparison: {
          supplierA: { id: a.id, name: a.supplierCompany.name, purity: a.purityPercentage, price: a.pricePerKg, capacityTonnes: a.quantityAvailableKg / 1000, trustScore: a.supplierCompany.trustScore, city: a.supplierCompany.city },
          supplierB: { id: b.id, name: b.supplierCompany.name, purity: b.purityPercentage, price: b.pricePerKg, capacityTonnes: b.quantityAvailableKg / 1000, trustScore: b.supplierCompany.trustScore, city: b.supplierCompany.city },
        },
      },
    };
  }

  private static async handleUtilizationAdvisory(lower: string): Promise<AssistantChatResponse> {
    let domainFacts = '';
    if (lower.includes('concrete') || lower.includes('cement')) {
      domainFacts = 'CO2 mineral carbonation in concrete: requires ≥95% purity. CO2 reacts with calcium silicate hydrates to form CaCO3 nanocrystals, increasing 28-day compressive strength by 10-15% and permanently sequestering CO2.';
    } else if (lower.includes('polymer') || lower.includes('plastic')) {
      domainFacts = 'CO2 in polymer synthesis: requires ≥99.5% cryogenic liquid (<10ppm moisture). CO2 replaces petroleum-derived propylene oxide to synthesize polyether carbonate polyols, replacing 20-40% of fossil feedstock.';
    } else if (lower.includes('greenhouse') || lower.includes('agri')) {
      domainFacts = 'CO2 for greenhouse enrichment: requires ≥99.0% food-grade. Dosed at 800-1200 ppm to boost crop yields by 20-40%.';
    } else if (lower.includes('saf') || lower.includes('aviation') || lower.includes('fuel')) {
      domainFacts = 'CO2 for SAF: CO2 + green hydrogen via Fischer-Tropsch synthesis produces drop-in kerosene.';
    } else {
      domainFacts = 'ReCarbo CO2 utilization: (1) Concrete ≥95%, (2) Polymer ≥99.5%, (3) Greenhouse ≥99.0%, (4) SAF via Fischer-Tropsch.';
    }

    const aiReply = await callAI(
      `You are ReCarbo AI for a CO2 marketplace in Gujarat, India.\n` +
      `User asked: "${lower}"\nFacts: ${domainFacts}\n` +
      `Give a helpful 3-4 sentence answer using only the facts above. Do not invent data.`
    );

    const fallbacks: Record<string, string> = {
      concrete: '**Mineral Carbonation (Concrete):** Requires ≥95% purity CO2. Reacts with C-S-H to form CaCO3 nanocrystals, boosting 28-day strength by 10-15% while permanently sequestering CO2.',
      polymer: '**Polymer Synthesis:** Requires ≥99.5% cryogenic liquid CO2. Replaces petroleum-derived propylene oxide — replacing 20-40% of fossil feedstock.',
      greenhouse: '**Greenhouse Enrichment:** Requires ≥99.0% food-grade CO2. Dosed at 800-1200 ppm to boost crop yields by 20-40%.',
      saf: '**Sustainable Aviation Fuel:** CO2 + green hydrogen via Fischer-Tropsch produces drop-in kerosene.',
    };
    const fallbackKey = Object.keys(fallbacks).find((k) => lower.includes(k)) || 'concrete';

    return {
      reply: aiReply || fallbacks[fallbackKey],
      actionType: 'UTILIZATION_ADVICE',
      generatedByAI: !!aiReply,
    };
  }

  private static async handlePlatformInquiry(lower: string): Promise<AssistantChatResponse> {
    const [listingsCount, totalVolume, fee] = await Promise.all([
      prisma.cO2Listing.count({ where: { status: 'ACTIVE' } }),
      prisma.cO2Listing.aggregate({ _sum: { quantityAvailableKg: true }, where: { status: 'ACTIVE' } }),
      SettingsService.getActivePlatformFee(),
    ]);

    const tonnes = ((totalVolume._sum.quantityAvailableKg || 0) / 1000).toFixed(1);
    const platformFacts =
      `ReCarbo: B2B circular carbon marketplace, Gujarat, India. Active supply: ${tonnes} Tonnes across ${listingsCount} listings. ` +
      `Platform fee: ${fee.feePercentage}%. Logistics: ₹${fee.transportRatePerKmKg}/km/kg. ` +
      `Matching: 5-factor scoring (30% Qty + 25% Purity + 20% Distance + 15% Price + 10% Trust).`;

    const aiReply = await callAI(
      `You are ReCarbo AI. Answer using ONLY the facts below.\nFacts: ${platformFacts}\nQuestion: ${lower}\nBe concise. Do not invent data.`
    );

    const fallback =
      `ReCarbo is a B2B circular carbon marketplace in Gujarat.\n\n` +
      `• **Active Supply:** ${tonnes} Tonnes across ${listingsCount} listings\n` +
      `• **Platform Fee:** ${fee.feePercentage}%\n` +
      `• **Logistics Rate:** ₹${fee.transportRatePerKmKg}/km/kg\n` +
      `• **Matching:** 5-factor (Qty 30% + Purity 25% + Distance 20% + Price 15% + Trust 10%)\n\n` +
      `Try: "I need 50T CO2 >99% in Sanand" or "Compare supplier A vs B"`;

    return {
      reply: aiReply || fallback,
      actionType: 'GENERAL_QA',
      generatedByAI: !!aiReply,
    };
  }
}
