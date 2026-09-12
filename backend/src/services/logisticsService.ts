import { prisma } from '../utils/prisma';
import { SettingsService } from './settingsService';
import { MatchingService } from './matchingService';

export interface CalculateLogisticsParams {
  quantityKg: number;
  pricePerKg?: number;
  originLat?: number;
  originLng?: number;
  originCity?: string;
  destLat?: number;
  destLng?: number;
  destCity?: string;
  distanceKm?: number;
  transportMode?: string; // 'CRYOGENIC_TANKER' | 'TUBE_TRAILER' | 'DRY_ICE_REEFER'
  userId?: string;
}

export interface ProductCo2EstimateParams {
  application: 'CONCRETE_CURING' | 'POLYMER_SYNTHESIS' | 'METHANOL_E_FUEL' | 'BEVERAGE_CARBONATION' | 'ALGAE_GREENHOUSE';
  productionUnits: number;
  unitPricePerKg?: number;
}

export class LogisticsService {
  /**
   * Transport mode equipment configuration
   */
  static getTransportModeMultiplier(mode?: string): { multiplier: number; label: string; specs: string } {
    switch (mode) {
      case 'TUBE_TRAILER':
        return {
          multiplier: 0.85,
          label: 'Pressurized Tube Trailer',
          specs: 'Gaseous CO2 (200 bar, ambient temp)',
        };
      case 'DRY_ICE_REEFER':
        return {
          multiplier: 1.2,
          label: 'Insulated Cryogenic Reefer',
          specs: 'Solid Dry Ice blocks/pellets (-78.5°C)',
        };
      case 'CRYOGENIC_TANKER':
      default:
        return {
          multiplier: 1.0,
          label: 'Liquid Cryogenic Road Tanker',
          specs: 'Pressurized Liquid CO2 (-20°C, 20 bar)',
        };
    }
  }

  /**
   * Calculate exact distance and landed cost with dynamic admin settings
   */
  static async calculateCost(params: CalculateLogisticsParams) {
    const {
      quantityKg,
      pricePerKg = 4.5,
      originLat,
      originLng,
      originCity = 'Dahej',
      destLat,
      destLng,
      destCity = 'Sanand',
      transportMode = 'CRYOGENIC_TANKER',
      userId,
    } = params;

    // Determine transit distance
    let distance = params.distanceKm;
    if (!distance || distance <= 0) {
      distance = MatchingService.calculateDistanceKm(
        originLat,
        originLng,
        destLat,
        destLng,
        originCity,
        destCity
      );
    }

    // Dynamic Admin Settings
    const activeSettings = await SettingsService.getActivePlatformFee();
    const feePercentage = activeSettings.feePercentage;
    const baseTransportRate = activeSettings.transportRatePerKmKg;

    const modeConfig = this.getTransportModeMultiplier(transportMode);
    const effectiveTransportRate = baseTransportRate * modeConfig.multiplier;

    // Financial calculations strictly in KG
    const co2Cost = quantityKg * pricePerKg;
    const transportCost = quantityKg * distance * effectiveTransportRate;
    const handlingCost = 2500; // Standard cryogenic QA & terminal handling
    const subtotal = co2Cost + transportCost + handlingCost;
    const platformFee = (subtotal * feePercentage) / 100;
    const totalAmount = subtotal + platformFee;
    const landedCostPerKg = Number((totalAmount / (quantityKg || 1)).toFixed(2));

    // Travel time estimate: ~45 km/h average commercial freight speed in Gujarat
    const estimatedHours = Number((distance / 45).toFixed(1));

    const result = {
      quantityKg,
      quantityTonnes: Number((quantityKg / 1000).toFixed(2)),
      distanceKm: distance,
      estimatedHours,
      origin: originCity,
      destination: destCity,
      transportMode: modeConfig.label,
      transportSpecs: modeConfig.specs,
      rates: {
        pricePerKg,
        transportRatePerKmKg: effectiveTransportRate,
        platformFeePercentage: feePercentage,
      },
      costs: {
        co2Cost: Math.round(co2Cost),
        transportCost: Math.round(transportCost),
        handlingCost: Math.round(handlingCost),
        platformFee: Math.round(platformFee),
        totalAmount: Math.round(totalAmount),
        landedCostPerKg,
      },
    };

    // Save to calculation table if userId provided
    if (userId) {
      try {
        await prisma.calculation.create({
          data: {
            userId,
            quantityKg,
            distanceKm: distance,
            purityPercentage: 99.5,
            transportMethod: modeConfig.label,
            estimatedCo2Cost: co2Cost,
            estimatedTransportCost: transportCost,
            estimatedHandlingFee: handlingCost,
            estimatedPlatformFee: platformFee,
            estimatedTotal: totalAmount,
          },
        });
      } catch (e) {
        // Calculation record logging is non-blocking
      }
    }

    return result;
  }

  /**
   * Calculate required CO2 volume based on industrial product manufacturing
   */
  static estimateProductCo2Demand(params: ProductCo2EstimateParams) {
    const { application, productionUnits, unitPricePerKg = 4.5 } = params;

    let co2FactorPerUnit = 0; // kg CO2 per production unit
    let unitLabel = 'units';
    let applicationName = '';
    let climateBenefitDescription = '';

    switch (application) {
      case 'CONCRETE_CURING':
        co2FactorPerUnit = 15.0; // 15 kg CO2 per m³ concrete
        unitLabel = 'm³ Precast Concrete';
        applicationName = 'Precast Concrete Carbonation Curing';
        climateBenefitDescription = 'Permanently binds mineralized CO2 as CaCO3 crystals inside concrete matrix.';
        break;
      case 'POLYMER_SYNTHESIS':
        co2FactorPerUnit = 0.25; // 0.25 kg CO2 per kg polymer
        unitLabel = 'kg Polycarbonate / Polyol';
        applicationName = 'CO2-based Polymers & Polyols';
        climateBenefitDescription = 'Replaces fossil petrochemical building blocks with captured carbon feedstock.';
        break;
      case 'METHANOL_E_FUEL':
        co2FactorPerUnit = 1.37; // 1.37 kg CO2 per litre methanol
        unitLabel = 'Litres E-Methanol';
        applicationName = 'Synthetic E-Methanol / Aviation Fuel';
        climateBenefitDescription = 'Recycles captured CO2 with green hydrogen for net-zero transport fuels.';
        break;
      case 'BEVERAGE_CARBONATION':
        co2FactorPerUnit = 6.0; // 6 kg CO2 per 1,000L beverage
        unitLabel = '1,000 Litres Beverage (kL)';
        applicationName = 'Food & Beverage Carbonation';
        climateBenefitDescription = 'Ultra-high purity food grade carbonation substituting commercial sources.';
        break;
      case 'ALGAE_GREENHOUSE':
        co2FactorPerUnit = 50.0; // 50 kg CO2 per unit area/day
        unitLabel = 'Greenhouse Cycles / Batches';
        applicationName = 'Controlled Agro Enrichment';
        climateBenefitDescription = 'Accelerates photosynthesis and bio-mass yields with clean industrial carbon.';
        break;
    }

    const totalCo2RequiredKg = Math.round(productionUnits * co2FactorPerUnit);
    const totalCo2Tonnes = Number((totalCo2RequiredKg / 1000).toFixed(2));
    const estimatedRawCo2Cost = Math.round(totalCo2RequiredKg * unitPricePerKg);

    return {
      application,
      applicationName,
      productionUnits,
      unitLabel,
      co2FactorPerUnit,
      totalCo2RequiredKg,
      totalCo2Tonnes,
      unitPricePerKg,
      estimatedRawCo2Cost,
      climateBenefitDescription,
    };
  }
}
