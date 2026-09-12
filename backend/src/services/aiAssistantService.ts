import { prisma } from '../utils/prisma';
import { MatchingService } from './matchingService';
import { SettingsService } from './settingsService';
import https from 'https';

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

/**
 * Call Hugging Face Inference API with a prompt.
 * Falls back to null on any error so the caller can use a templated reply.
 */
async function callHuggingFace(prompt: string): Promise<string | null> {
  if (!HF_TOKEN) return null;

  return new Promise((resolve) => {
    const body = JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 350, temperature: 0.3, return_full_text: false },
    });

    const req = https.request(
      {
        hostname: 'api-inference.huggingface.co',
        path: `/models/${HF_MODEL}`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            // HF returns array: [{ generated_text: '...' }]
            const text = parsed?.[0]?.generated_text?.trim();
            resolve(text || null);
          } catch {
            resolve(null);
          }
        });
      }
    );

    req.on('error', () => resolve(null));
    req.setTimeout(15000, () => { req.destroy(); resolve(null); });
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
  structuredData?: {
    matches?: any[];
    comparison?: any;
    filtersParsed?: ParsedSearchFilters;
    utilizationTip?: any;
  };
}

export class AIAssistantService {
  /**
   * Parse free-text buyer query into structured criteria
   */
  static parseNaturalLanguageQuery(text: string): ParsedSearchFilters {
    const lower = text.toLowerCase();
    const filters: ParsedSearchFilters = {};

    // 1. Quantity extraction (tonnes / tons / T / kg)
    const tonneMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:tonnes?|tons?|t\b)/);
    if (tonneMatch) {
      filters.quantityKg = parseFloat(tonneMatch[1]) * 1000;
    } else {
      const kgMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)/);
      if (kgMatch) {
        filters.quantityKg = parseFloat(kgMatch[1]);
      }
    }

    // 2. Purity extraction
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

    // 3. Max Price extraction
    const priceMatch = lower.match(/(?:under|max|budget|below|less than|within|inr|rs\.?|₹)\s*(?:inr|rs\.?|₹)?\s*(\d+(?:\.\d+)?)/i);
    if (priceMatch) {
      const val = parseFloat(priceMatch[1]);
      if (val < 100) {
        filters.maxPricePerKg = val;
      }
    }

    // 4. Distance / Location extraction
    const distMatch = lower.match(/within\s*(\d+)\s*(?:km|kilometers?)/);
    if (distMatch) {
      filters.maxDistanceKm = parseInt(distMatch[1], 10);
    }

    const cities = ['ahmedabad', 'surat', 'bharuch', 'dahej', 'hazira', 'vadodara', 'nandesari', 'sanand'];
    for (const city of cities) {
      if (lower.includes(city)) {
        filters.targetCity = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }

    // 5. State of Matter
    if (lower.includes('liquid') || lower.includes('cryogenic')) {
      filters.preferredState = 'Liquid';
    } else if (lower.includes('gas') || lower.includes('compressed')) {
      filters.preferredState = 'Compressed Gas';
    } else if (lower.includes('dry ice') || lower.includes('solid')) {
      filters.preferredState = 'Solid';
    }

    // 6. Industry Application
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

  /**
   * Process incoming user prompt against live database
   */
  static async handleChatQuery(
    message: string,
    history: any[] = [],
    userId?: string
  ): Promise<AssistantChatResponse> {
    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();

    // 1. Comparison query check
    if (
      lower.includes('compare') ||
      lower.includes(' vs ') ||
      lower.includes('versus') ||
      (lower.includes('why is') && lower.includes('better than'))
    ) {
      return await this.handleComparisonQuery(trimmed);
    }

    // 2. Matching / Sourcing query check
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

    if (hasSearchIntent) {
      return await this.handleMatchingSearch(parsedFilters, trimmed);
    }

    // 3. Utilization Sector Advisory check
    if (
      lower.includes('concrete') ||
      lower.includes('polymer') ||
      lower.includes('greenhouse') ||
      lower.includes('saf') ||
      lower.includes('aviation') ||
      lower.includes('utiliz') ||
      lower.includes('cryogenic')
    ) {
      return this.handleUtilizationAdvisory(lower);
    }

    // 4. General Platform inquiry
    return await this.handlePlatformInquiry(lower);
  }

  /**
   * Search real listings and score deterministically
   */
  private static async handleMatchingSearch(
    filters: ParsedSearchFilters,
    rawQuery: string
  ): Promise<AssistantChatResponse> {
    const quantityKg = filters.quantityKg || 25000;
    const minPurity = filters.minPurityPercentage || 95.0;
    const maxPrice = filters.maxPricePerKg;
    const buyerCity = filters.targetCity || 'Ahmedabad';

    // Fetch live active listings from DB
    const listings = await prisma.cO2Listing.findMany({
      where: {
        status: 'ACTIVE',
        ...(minPurity && { purityPercentage: { gte: minPurity } }),
        ...(maxPrice && { pricePerKg: { lte: maxPrice } }),
        ...(filters.preferredState && { stateOfMatter: filters.preferredState }),
      },
      include: {
        supplierCompany: true,
      },
      orderBy: { pricePerKg: 'asc' },
    });

    const activeSettings = await SettingsService.getActivePlatformFee();

    // Deterministic evaluation against each listing
    const results = listings.map((l) => {
      const distanceKm = MatchingService.calculateDistanceKm(
        l.supplierCompany.latitude,
        l.supplierCompany.longitude,
        null,
        null,
        l.supplierCompany.city,
        buyerCity
      );

      // Factor 1: Quantity Fit (30%)
      const reqQty = quantityKg;
      const availQty = l.quantityAvailableKg;
      let qtyScore = 100;
      if (availQty >= reqQty) {
        const ratio = availQty / reqQty;
        qtyScore = ratio <= 2 ? 100 : Math.max(85, Math.round(100 - (ratio - 2) * 5));
      } else {
        qtyScore = Math.max(30, Math.round((availQty / reqQty) * 90));
      }

      // Factor 2: Purity Fit (25%)
      const purityDiff = l.purityPercentage - minPurity;
      const purityScore = Math.min(100, Math.round(85 + purityDiff * 15));

      // Factor 3: Distance Fit (20%)
      const distScore = Math.max(10, Math.min(100, Math.round(100 - distanceKm * 0.1)));

      // Factor 4: Price Fit (15%)
      let priceScore = 80;
      if (maxPrice) {
        const savings = maxPrice - l.pricePerKg;
        priceScore = Math.min(100, Math.max(40, Math.round(75 + (savings / maxPrice) * 60)));
      } else {
        priceScore = Math.min(100, Math.max(40, Math.round(75 + (4.5 - l.pricePerKg) * 10)));
      }

      // Factor 5: Availability / Trust (10%)
      const availScore = Math.min(100, Math.round(l.supplierCompany.trustScore || 85));

      // Total Deterministic Score
      const overallScore = Number(
        (
          qtyScore * 0.3 +
          purityScore * 0.25 +
          distScore * 0.2 +
          priceScore * 0.15 +
          availScore * 0.1
        ).toFixed(1)
      );

      // Financials
      const co2Cost = quantityKg * l.pricePerKg;
      const transportCost = quantityKg * distanceKm * activeSettings.transportRatePerKmKg;
      const handlingCost = 2500;
      const subtotal = co2Cost + transportCost + handlingCost;
      const platformFee = (subtotal * activeSettings.feePercentage) / 100;
      const landedCost = subtotal + platformFee;

      return {
        listingId: l.id,
        title: l.title,
        supplierName: l.supplierCompany.name,
        supplierCity: l.supplierCompany.city,
        purityPercentage: l.purityPercentage,
        quantityAvailableTonnes: Number((l.quantityAvailableKg / 1000).toFixed(1)),
        pricePerKg: l.pricePerKg,
        stateOfMatter: l.stateOfMatter,
        captureMethod: l.captureMethod,
        distanceKm,
        landedCostEstimate: Math.round(landedCost),
        landedCostPerKg: Number((landedCost / quantityKg).toFixed(2)),
        overallScore,
        scores: {
          quantity: qtyScore,
          purity: purityScore,
          distance: distScore,
          price: priceScore,
          availability: availScore,
        },
      };
    });

    results.sort((a, b) => b.overallScore - a.overallScore);

    if (results.length === 0) {
      return {
        reply: 'I searched the live ReCarbo marketplace with your criteria, but no active listings currently satisfy all hard eligibility filters. Consider relaxing the purity threshold or maximum price in your requirement post.',
        actionType: 'MATCH_RECOMMENDATION',
        structuredData: { filtersParsed: filters, matches: [] },
      };
    }

    const top = results[0];

    // Build a compact context string for HF — only facts, no invented numbers
    const contextLines = results.slice(0, 3).map((r, i) =>
      `#${i + 1} ${r.supplierName} (${r.supplierCity}): ${r.purityPercentage}% purity, ₹${r.pricePerKg.toFixed(2)}/kg, ${r.quantityAvailableTonnes}T available, ${r.distanceKm}km away, overall score ${r.overallScore}%, landed cost ₹${r.landedCostPerKg}/kg`
    ).join('\n');

    const hfPrompt =
      `<s>[INST] You are ReCarbo AI, an assistant for a B2B industrial CO2 marketplace in Gujarat, India.\n` +
      `A buyer asked: "${rawQuery}"\n\n` +
      `The deterministic matching engine found these results from the live database:\n${contextLines}\n\n` +
      `Write a concise 3-4 sentence response recommending the best match and briefly explaining why, using only the numbers above. Do not invent any data. [/INST]`;

    const hfReply = await callHuggingFace(hfPrompt);

    // Fallback to templated reply if HF is unavailable
    const reply = hfReply ||
      'I evaluated our live Gujarat carbon pool for your request. Found **' + results.length + ' eligible listing(s)** with deterministic 5-factor scoring:\n\n' +
      '🏆 **Top Match: ' + top.supplierName + ' (' + top.overallScore + '% fit)**\n' +
      '• **Purity:** ' + top.purityPercentage + '% ' + top.stateOfMatter + ' (' + top.captureMethod + ')\n' +
      '• **Supply Capacity:** ' + top.quantityAvailableTonnes + ' Tonnes in ' + top.supplierCity + '\n' +
      '• **Economics:** ₹' + top.pricePerKg.toFixed(2) + '/kg base CO2 (Est. Landed: ₹' + top.landedCostPerKg.toFixed(2) + '/kg incl. transport ~' + top.distanceKm + 'km & ' + activeSettings.feePercentage + '% fee)\n' +
      '• **Score Breakdown:** Quantity: ' + top.scores.quantity + '% (30%), Purity: ' + top.scores.purity + '% (25%), Distance: ' + top.scores.distance + '% (20%), Price: ' + top.scores.price + '% (15%), Reliability: ' + top.scores.availability + '% (10%).\n\n' +
      (results.length > 1
        ? 'A secondary option is **' + results[1].supplierName + '** with an overall score of **' + results[1].overallScore + '%** at ₹' + results[1].pricePerKg.toFixed(2) + '/kg.'
        : 'This stream directly fulfills your technical criteria.');

    return {
      reply,
      actionType: 'MATCH_RECOMMENDATION',
      structuredData: { filtersParsed: filters, matches: results },
    };
  }

  /**
   * Compare two suppliers or listings objectively with real DB data
   */
  private static async handleComparisonQuery(rawQuery: string): Promise<AssistantChatResponse> {
    const listings = await prisma.cO2Listing.findMany({
      include: { supplierCompany: true },
      take: 2,
      orderBy: { createdAt: 'desc' },
    });

    if (listings.length < 2) {
      return {
        reply: 'At least two active listings are required in the marketplace to perform a side-by-side comparison.',
        actionType: 'SUPPLIER_COMPARISON',
      };
    }

    const [a, b] = listings;
    const diffPurity = (a.purityPercentage - b.purityPercentage).toFixed(1);
    const diffPrice = (a.pricePerKg - b.pricePerKg).toFixed(2);

    const comparisonFacts =
      `Supplier A: ${a.supplierCompany.name} (${a.supplierCompany.city}) — ${a.purityPercentage}% purity, ₹${a.pricePerKg.toFixed(2)}/kg, ${(a.quantityAvailableKg/1000).toFixed(1)}T, trust ${a.supplierCompany.trustScore.toFixed(1)}/100, ${a.supplierCompany.isVerified ? 'Verified' : 'Unverified'}, ${a.stateOfMatter}, ${a.captureMethod}.\n` +
      `Supplier B: ${b.supplierCompany.name} (${b.supplierCompany.city}) — ${b.purityPercentage}% purity, ₹${b.pricePerKg.toFixed(2)}/kg, ${(b.quantityAvailableKg/1000).toFixed(1)}T, trust ${b.supplierCompany.trustScore.toFixed(1)}/100, ${b.supplierCompany.isVerified ? 'Verified' : 'Unverified'}, ${b.stateOfMatter}, ${b.captureMethod}.`;

    const hfPrompt =
      `<s>[INST] You are ReCarbo AI for a CO2 marketplace in Gujarat, India.\n` +
      `Compare these two suppliers using only the data below. Give a structured comparison and a clear recommendation.\n\n` +
      `${comparisonFacts}\n\n` +
      `Do not invent any numbers. Be concise. [/INST]`;

    const hfReply = await callHuggingFace(hfPrompt);

    const reply = hfReply ||
      '**Deterministic Comparison: ' + a.supplierCompany.name + ' vs. ' + b.supplierCompany.name + '**\n\n' +
      '1. **Purity & Physical State:**\n' +
      '   • **' + a.supplierCompany.name + ':** ' + a.purityPercentage + '% (' + a.stateOfMatter + ', ' + a.captureMethod + ')\n' +
      '   • **' + b.supplierCompany.name + ':** ' + b.purityPercentage + '% (' + b.stateOfMatter + ', ' + b.captureMethod + ')\n' +
      '   • *Verdict:* ' + (parseFloat(diffPurity) > 0 ? a.supplierCompany.name + ' has +' + diffPurity + '% higher purity.' : b.supplierCompany.name + ' meets requirements for standard mineral carbonation.') + '\n\n' +
      '2. **Pricing & Capacity:**\n' +
      '   • **' + a.supplierCompany.name + ':** ₹' + a.pricePerKg.toFixed(2) + '/kg (' + (a.quantityAvailableKg/1000).toFixed(1) + 'T)\n' +
      '   • **' + b.supplierCompany.name + ':** ₹' + b.pricePerKg.toFixed(2) + '/kg (' + (b.quantityAvailableKg/1000).toFixed(1) + 'T)';

    return {
      reply,
      actionType: 'SUPPLIER_COMPARISON',
      structuredData: {
        comparison: {
          supplierA: {
            id: a.id,
            name: a.supplierCompany.name,
            purity: a.purityPercentage,
            price: a.pricePerKg,
            capacityTonnes: a.quantityAvailableKg / 1000,
            trustScore: a.supplierCompany.trustScore,
            city: a.supplierCompany.city,
          },
          supplierB: {
            id: b.id,
            name: b.supplierCompany.name,
            purity: b.purityPercentage,
            price: b.pricePerKg,
            capacityTonnes: b.quantityAvailableKg / 1000,
            trustScore: b.supplierCompany.trustScore,
            city: b.supplierCompany.city,
          },
        },
      },
    };
  }

  /**
   * Utilization Sector Advice grounded in climate-tech engineering standards
   */
  private static handleUtilizationAdvisory(lower: string): AssistantChatResponse {
    if (lower.includes('concrete') || lower.includes('cement')) {
      return {
        reply: '**Productive Utilization in Mineral Carbonation (Concrete Curing):**\n\n' +
          '• **Purity Requirement:** ≥95.0% (Pressurized Gas or Liquid stream).\n' +
          '• **Mechanism:** Injected CO2 reacts with calcium silicate hydrates (C-S-H) in precast concrete to form calcium carbonate (CaCO3) nanocrystals.\n' +
          '• **Benefits:** Increases 28-day compressive strength by 10-15% while permanently locking CO2 into the mineral matrix, reducing required Portland cement binder by ~5-8%.\n' +
          '• **Marketplace Recommendation:** The Hazira Compressed Gas stream (98.5% purity) at ₹3.20/kg offers the lowest landed cost for cement plants in Bharuch and Vadodara.',
        actionType: 'UTILIZATION_ADVICE',
      };
    }

    if (lower.includes('polymer') || lower.includes('plastic')) {
      return {
        reply: '**Productive Utilization in Sustainable Polymer Synthesis:**\n\n' +
          '• **Purity Requirement:** ≥99.5% (Food/pharma grade Cryogenic Liquid, <10 ppm moisture, <5 ppm oxygen).\n' +
          '• **Mechanism:** CO2 replaces petroleum-derived propylene oxide or phosgene to synthesize polyether carbonate polyols and polycarbonates.\n' +
          '• **Benefits:** Replaces up to 20-40% of fossil feedstock by weight in foams, coatings, and engineering thermoplastics.\n' +
          '• **Marketplace Recommendation:** The Dahej Amine Absorption stream (99.8% purity) is certified for polymer offtake with active delivery to the Sanand/Ahmedabad industrial cluster.',
        actionType: 'UTILIZATION_ADVICE',
      };
    }

    return {
      reply: '**Circular Carbon Offtake Pathways on ReCarbo:**\n\n' +
        'ReCarbo routes captured industrial CO2 toward verified commercial utilization applications:\n' +
        '1. **Concrete Mineralization:** 95%+ purity CO2 mineralized permanently into precast concrete blocks.\n' +
        '2. **Polymer Synthesis:** 99.5%+ cryogenic liquid CO2 copolymerized into polyols and polycarbonates.\n' +
        '3. **Commercial Greenhouses:** 99.0%+ food-grade CO2 dosed up to 1000 ppm to boost crop yields by 30-40%.\n' +
        '4. **Sustainable Aviation Fuel (SAF):** Fischer-Tropsch syngas synthesis with green hydrogen for drop-in kerosene.',
      actionType: 'UTILIZATION_ADVICE',
    };
  }

  /**
   * Platform Statistics & Ecosystem Q&A
   */
  private static async handlePlatformInquiry(lower: string): Promise<AssistantChatResponse> {
    const [listingsCount, totalVolume, fee] = await Promise.all([
      prisma.cO2Listing.count({ where: { status: 'ACTIVE' } }),
      prisma.cO2Listing.aggregate({
        _sum: { quantityAvailableKg: true },
        where: { status: 'ACTIVE' },
      }),
      SettingsService.getActivePlatformFee(),
    ]);

    const tonnes = ((totalVolume._sum.quantityAvailableKg || 0) / 1000).toFixed(1);

    const platformFacts =
      `ReCarbo is a B2B circular carbon marketplace in Gujarat, India. ` +
      `Active supply: ${tonnes} Tonnes across ${listingsCount} verified listings. ` +
      `Platform fee: ${fee.feePercentage}%. Logistics rate: ₹${fee.transportRatePerKmKg}/km/kg. ` +
      `Matching uses 5-factor scoring: 30% Quantity + 25% Purity + 20% Distance + 15% Price + 10% Trust.`;

    const hfPrompt =
      `<s>[INST] You are ReCarbo AI. Answer the user's question using only the platform facts below.\n` +
      `Platform facts: ${platformFacts}\n` +
      `User question: ${lower}\n` +
      `Be concise and helpful. Do not invent data. [/INST]`;

    const hfReply = await callHuggingFace(hfPrompt);

    const fallback =
      'ReCarbo is an AI-powered B2B circular carbon marketplace. Currently:\n\n' +
      '• **Active Supply:** ' + tonnes + ' Tonnes across ' + listingsCount + ' verified listing(s).\n' +
      '• **Platform Fee:** ' + fee.feePercentage + '% (governed by Admin Settings).\n' +
      '• **Logistics Rate:** ₹' + fee.transportRatePerKmKg + '/km/kg for cryogenic tanker freight.\n' +
      '• **Matching Engine:** 5-factor scoring (30% Qty + 25% Purity + 20% Dist + 15% Price + 10% Avail).\n\n' +
      'Ask me to find CO2 matching your specs (e.g. "I need 50T CO2 >99% in Sanand") or compare suppliers!';

    return {
      reply: hfReply || fallback,
      actionType: 'GENERAL_QA',
    };
  }
}
