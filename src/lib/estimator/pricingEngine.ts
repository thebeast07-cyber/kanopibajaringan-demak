import {
  EstimatorInput,
  ServiceSchema,
  CalculationResult,
  EstimateSnapshot,
  PricingRuleSchema,
  MeasurementType,
  CompleteDataset,
} from '../../types/domain';

/**
 * Tarif borongan layanan, atau null kalau pemilik belum mengisinya.
 * Tarif 0 dianggap kosong: harga Rp 0 tidak pernah boleh tampil ke pelanggan.
 */
export function getTarifBorongan(service: ServiceSchema): PricingRuleSchema | null {
  const rule = service.pricingRules?.[0];
  return rule && rule.rate > 0 ? rule : null;
}

export function getMinimumPengerjaan(service: ServiceSchema): number | null {
  const m = service.minimumBilling;
  const value =
    service.measurementType === 'm2'
      ? m?.minimumArea
      : service.measurementType === 'meter'
      ? m?.minimumLength
      : m?.minimumQuantity;
  return value && value > 0 ? value : null;
}

export function calculateBillableUnits(
  input: EstimatorInput,
  service: ServiceSchema
): { actual: number; applied: number; unitType: MeasurementType } {
  const unitType = service.measurementType;
  let actual = 0;

  if (unitType === 'm2') {
    actual = (input.length || 0) * (input.width || 0);
  } else if (unitType === 'meter') {
    actual = input.length || 0;
  } else if (unitType === 'unit') {
    actual = input.quantity || 1;
  }

  let minThreshold = 0;
  if (service.minimumBilling) {
    if (unitType === 'm2' && service.minimumBilling.minimumArea) {
      minThreshold = service.minimumBilling.minimumArea;
    } else if (unitType === 'meter' && service.minimumBilling.minimumLength) {
      minThreshold = service.minimumBilling.minimumLength;
    } else if (unitType === 'unit' && service.minimumBilling.minimumQuantity) {
      minThreshold = service.minimumBilling.minimumQuantity;
    }
  }

  const applied = Math.max(actual, minThreshold);

  return { actual, applied, unitType };
}

export function evaluatePricingRule(
  rule: PricingRuleSchema,
  billableUnits: number,
  subtotalForAdjustments = 0
): number {
  switch (rule.model) {
    case 'per_m2':
    case 'per_m':
    case 'per_unit':
      return rule.rate * billableUnits;
    case 'fixed':
    case 'package':
      return rule.rate;
    case 'percentage':
      // Explicit percentage semantics: rate = 0.15 means 15% of subtotal
      return subtotalForAdjustments * rule.rate;
    case 'multiplier':
      // Explicit multiplier semantics: rate = 1.15 means subtotal * 1.15 (net addition = subtotal * (rate - 1))
      return subtotalForAdjustments * (rule.rate - 1);
    default:
      return 0;
  }
}

export function calculateDurationRange(
  billableUnits: number,
  service: ServiceSchema
): { minDays: number; maxDays: number; text: string } {
  // Belum diisi pemilik: teks kosong, bukan angka tebakan. Tampilan yang cek `text`.
  if (!service.durationRanges || service.durationRanges.length === 0) {
    return { minDays: 0, maxDays: 0, text: '' };
  }

  for (const range of service.durationRanges) {
    const isAboveMin = billableUnits >= range.minUnits;
    const isBelowMax = range.maxUnits === null || billableUnits <= range.maxUnits;

    if (isAboveMin && isBelowMax) {
      const text =
        range.minDays === range.maxDays
          ? `${range.minDays} hari kerja`
          : `${range.minDays} - ${range.maxDays} hari kerja`;
      return { minDays: range.minDays, maxDays: range.maxDays, text };
    }
  }

  const fallback = service.durationRanges[service.durationRanges.length - 1];
  return {
    minDays: fallback.minDays,
    maxDays: fallback.maxDays,
    text: `${fallback.minDays} - ${fallback.maxDays} hari kerja`,
  };
}

export function calculateEstimate(
  input: EstimatorInput,
  dataset: CompleteDataset
): CalculationResult {
  const service = dataset.services.find((s) => s.id === input.serviceId);
  if (!service) {
    throw new Error(`Service with ID "${input.serviceId}" not found.`);
  }

  const billableUnits = calculateBillableUnits(input, service);

  // 1. Base Service Cost
  let baseCost = 0;
  for (const rule of service.pricingRules) {
    baseCost += evaluatePricingRule(rule, billableUnits.applied);
  }

  // 2. Material Cost
  let materialCost = 0;
  if (input.materialId) {
    const mat = dataset.materials.find((m) => m.id === input.materialId);
    if (mat) {
      materialCost += evaluatePricingRule(mat.pricingRule, billableUnits.applied);
    }
  }

  // 3. Frame Cost
  let frameCost = 0;
  if (input.frameId) {
    const frame = dataset.frames.find((f) => f.id === input.frameId);
    if (frame) {
      frameCost += evaluatePricingRule(frame.pricingRule, billableUnits.applied);
    }
  }

  // 4. Labor Cost
  let laborCost = 0;
  if (input.laborId) {
    const labor = dataset.laborOptions.find((l) => l.id === input.laborId);
    if (labor) {
      laborCost += evaluatePricingRule(labor.pricingRule, billableUnits.applied);
    }
  }

  // 5. Finishing Cost
  let finishingCost = 0;
  if (input.finishingId) {
    const finishing = dataset.finishings.find((f) => f.id === input.finishingId);
    if (finishing) {
      finishingCost += evaluatePricingRule(finishing.pricingRule, billableUnits.applied);
    }
  }

  // 6. AddOns Cost
  let addOnsCost = 0;
  if (input.addonIds && input.addonIds.length > 0) {
    for (const addonId of input.addonIds) {
      const addon = dataset.addOns.find((a) => a.id === addonId);
      if (addon) {
        addOnsCost += evaluatePricingRule(addon.pricingRule, billableUnits.applied);
      }
    }
  }

  // Component Subtotal
  const subtotal = baseCost + materialCost + frameCost + laborCost + finishingCost + addOnsCost;

  // 7. Site Adjustments (Percentage vs Multiplier evaluated against Subtotal)
  let percentageAdjustmentsTotal = 0;
  let multiplierAdjustmentsTotal = 0;

  if (input.siteConditionIds && input.siteConditionIds.length > 0) {
    for (const condId of input.siteConditionIds) {
      const cond = dataset.siteConditions.find((c) => c.id === condId);
      if (cond) {
        if (cond.pricingRule.model === 'percentage') {
          percentageAdjustmentsTotal += evaluatePricingRule(cond.pricingRule, billableUnits.applied, subtotal);
        } else if (cond.pricingRule.model === 'multiplier') {
          multiplierAdjustmentsTotal += evaluatePricingRule(cond.pricingRule, billableUnits.applied, subtotal);
        } else {
          // Fixed site fees
          percentageAdjustmentsTotal += evaluatePricingRule(cond.pricingRule, billableUnits.applied, subtotal);
        }
      }
    }
  }

  const finalTotal = Math.round(subtotal + percentageAdjustmentsTotal + multiplierAdjustmentsTotal);

  const duration = calculateDurationRange(billableUnits.applied, service);

  const estimateId = `EST-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

  const snapshot: EstimateSnapshot = {
    estimateId,
    pricingVersion: dataset.businessConfig.pricingVersion,
    calculatedAt: new Date().toISOString(),
    input,
    billableUnits,
    breakdown: {
      baseCost: Math.round(baseCost),
      laborCost: Math.round(laborCost),
      materialCost: Math.round(materialCost),
      frameCost: Math.round(frameCost),
      finishingCost: Math.round(finishingCost),
      addOnsCost: Math.round(addOnsCost),
      subtotal: Math.round(subtotal),
      percentageAdjustmentsTotal: Math.round(percentageAdjustmentsTotal),
      multiplierAdjustmentsTotal: Math.round(multiplierAdjustmentsTotal),
      total: finalTotal,
    },
    estimate: {
      min: finalTotal,
      max: finalTotal, // Deterministic estimate: min === max
    },
    duration,
  };

  return { snapshot };
}
