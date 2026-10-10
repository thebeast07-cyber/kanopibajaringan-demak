import {
  EstimatorInput,
  CompleteDataset,
  ServiceSchema,
  FormulaStepConfig,
  ServiceCalculationConfig,
  EstimateSnapshot,
  MeasurementType,
} from '../../types/domain';
import { calculateBillableUnits, calculateDurationRange } from './pricingEngine';

export interface FormulaEngineStepDetail {
  stepId: string;
  name: string;
  description?: string;
  enabled: boolean;
  value: number;
  unitLabel: string;
  rate: number;
  subtotal: number;
  explanation: string;
}

export interface FormulaEngineResult {
  serviceId: string;
  serviceTitle: string;
  pricingVersion: string;
  inputs: EstimatorInput;
  billableUnits: {
    actual: number;
    applied: number;
    unitType: MeasurementType;
    minimumApplied: boolean;
  };
  steps: FormulaEngineStepDetail[];
  subtotal: number;
  adjustmentsTotal: number;
  grandTotal: number;
  duration: {
    minDays: number;
    maxDays: number;
    text: string;
  };
  explanatoryNotes: string;
  snapshot: EstimateSnapshot;
}

export interface BukuHitunganStepDetail {
  stepNumber: number;
  name: string;
  description?: string;
  formulaText: string;
  unitRate: number;
  subtotal: number;
}

export interface BukuHitunganDocument {
  serviceTitle: string;
  pricingVersion: string;
  inputSummary: {
    dimensionsText: string;
    actualUnitsText: string;
    appliedUnitsText: string;
    minimumApplied: boolean;
  };
  steps: BukuHitunganStepDetail[];
  subtotal: number;
  adjustmentsTotal: number;
  grandTotal: number;
  durationText: string;
  explanatoryNotes: string;
}

export interface CustomInputDescriptor {
  key: string;
  stepId: string;
  label: string;
  unit?: string;
  defaultValue?: number;
  order: number;
  required?: boolean;
}

export function getCustomInputDescriptors(
  config?: ServiceCalculationConfig
): CustomInputDescriptor[] {
  if (!config || !config.steps || config.steps.length === 0) {
    return [];
  }

  const activeSteps = config.steps
    .filter((s) => s.enabled !== false && s.valueSource === 'custom_input')
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return activeSteps.map((step) => {
    const cfg = step.customInputConfig;
    return {
      key: step.id,
      stepId: step.id,
      label: cfg?.label || step.name,
      unit: cfg?.unit || 'item',
      defaultValue: cfg?.defaultValue ?? 1,
      order: step.order || 0,
      required: false,
    };
  });
}

export function evaluateFormulaEngine(
  input: EstimatorInput,
  dataset: CompleteDataset
): FormulaEngineResult {
  const service = dataset.services.find((s) => s.id === input.serviceId);
  if (!service) {
    throw new Error(`Service with ID "${input.serviceId}" not found.`);
  }

  const billable = calculateBillableUnits(input, service);
  const minimumApplied = billable.applied > billable.actual;

  const config = dataset.calculationConfigs?.find((c) => c.serviceId === input.serviceId);
  const stepsConfig: FormulaStepConfig[] =
    (config?.steps && config.steps.length > 0
      ? config.steps
      : getDefaultStepsForService(service, input, dataset)
    ).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  const stepDetails: FormulaEngineStepDetail[] = [];
  let runningSubtotal = 0;
  let runningAdjustments = 0;

  let materialCost = 0;
  let frameCost = 0;
  let laborCost = 0;
  let finishingCost = 0;
  let addOnsCost = 0;
  let baseCost = 0;

  for (const step of stepsConfig) {
    if (step.enabled === false) continue;

    // 1. Resolve Value
    let val = 0;
    let unitLabel: string = billable.unitType;

    const valSource = step.valueSource || 'area';

    if (valSource === 'area') {
      val = billable.applied;
      unitLabel = service.measurementType === 'm2' ? 'm²' : (billable.unitType as string);
    } else if (valSource === 'length') {
      val = input.length || 0;
      unitLabel = 'meter';
    } else if (valSource === 'width') {
      val = input.width || 0;
      unitLabel = 'meter';
    } else if (valSource === 'height') {
      val = input.height || 0;
      unitLabel = 'meter';
    } else if (valSource === 'quantity') {
      val = input.quantity || 1;
      unitLabel = 'unit';
    } else if (valSource === 'fixed_value') {
      val = 1;
      unitLabel = 'paket';
    } else if (valSource === 'subtotal') {
      val = runningSubtotal;
      unitLabel = 'subtotal';
    } else if (valSource === 'custom_input') {
      const cfg = step.customInputConfig;
      const customValFromInput =
        input.customInputs?.[step.id] ??
        input.customInputs?.[step.name] ??
        (cfg?.label ? input.customInputs?.[cfg.label] : undefined);

      if (customValFromInput !== undefined) {
        val = customValFromInput;
      } else if (cfg?.defaultValue !== undefined) {
        val = cfg.defaultValue;
      } else {
        val = input.quantity || input.length || 1;
      }

      unitLabel = cfg?.unit || 'item';
    }

    // 2. Resolve Price Rate
    let rate = 0;
    const priceSrc = step.priceSource || 'material';

    if (priceSrc === 'material' && input.materialId) {
      const mat = dataset.materials.find((m) => m.id === input.materialId);
      rate = mat?.pricingRule.rate || 0;
    } else if (priceSrc === 'frame' && input.frameId) {
      const frame = dataset.frames.find((f) => f.id === input.frameId);
      rate = frame?.pricingRule.rate || 0;
    } else if (priceSrc === 'labor' && input.laborId) {
      const labor = dataset.laborOptions.find((l) => l.id === input.laborId);
      rate = labor?.pricingRule.rate || 0;
    } else if (priceSrc === 'finishing' && input.finishingId) {
      const fn = dataset.finishings.find((f) => f.id === input.finishingId);
      rate = fn?.pricingRule.rate || 0;
    } else if (priceSrc === 'addon' && input.addonIds && input.addonIds.length > 0) {
      for (const addonId of input.addonIds) {
        const addon = dataset.addOns.find((a) => a.id === addonId);
        if (addon) rate += addon.pricingRule.rate;
      }
    } else if (priceSrc === 'package' && step.sourceId) {
      const pkg = dataset.packages?.find((p) => p.id === step.sourceId);
      rate = pkg?.price || step.customRate || 0;
    } else if (priceSrc === 'custom_rate' || priceSrc === 'fixed_amount') {
      rate = step.customRate || 0;
    } else if (priceSrc === 'percentage_rate') {
      rate = step.customRate || 0;
    }

    // 3. Evaluate Operation
    let stepSubtotal = 0;
    const op = step.operation || step.operator || 'multiply';

    if (op === 'multiply') {
      stepSubtotal = Math.round(val * rate);
      runningSubtotal += stepSubtotal;
    } else if (op === 'add') {
      stepSubtotal = Math.round(val + rate);
      runningSubtotal += stepSubtotal;
    } else if (op === 'fixed') {
      stepSubtotal = Math.round(rate);
      runningSubtotal += stepSubtotal;
    } else if (op === 'percentage') {
      // Explicit percentage semantics: rate = 0.15 means 15% of current subtotal
      stepSubtotal = Math.round(runningSubtotal * rate);
      runningAdjustments += stepSubtotal;
    } else if (op === 'multiplier') {
      // Explicit multiplier semantics: rate = 1.15 means subtotal * 1.15 (net addition = subtotal * (rate - 1))
      stepSubtotal = Math.round(runningSubtotal * (rate - 1));
      runningAdjustments += stepSubtotal;
    } else if (op === 'minimum_override') {
      if (val < rate) {
        val = rate;
      }
      stepSubtotal = 0;
    }

    // Classify into snapshot cost buckets
    if (priceSrc === 'material') materialCost += stepSubtotal;
    else if (priceSrc === 'frame') frameCost += stepSubtotal;
    else if (priceSrc === 'labor') laborCost += stepSubtotal;
    else if (priceSrc === 'finishing') finishingCost += stepSubtotal;
    else if (priceSrc === 'addon') addOnsCost += stepSubtotal;
    else baseCost += stepSubtotal;

    // Generate Operational Explanation Text
    let explanation = `${step.name}: ${val} ${unitLabel} × Rp ${rate.toLocaleString('id-ID')} = Rp ${stepSubtotal.toLocaleString('id-ID')}`;
    if (op === 'percentage') {
      explanation = `${step.name}: ${(rate * 100).toFixed(0)}% dari subtotal = Rp ${stepSubtotal.toLocaleString('id-ID')}`;
    } else if (op === 'fixed') {
      explanation = `${step.name}: Fixed Amount = Rp ${stepSubtotal.toLocaleString('id-ID')}`;
    }

    stepDetails.push({
      stepId: step.id,
      name: step.name,
      description: step.description,
      enabled: step.enabled ?? true,
      value: val,
      unitLabel,
      rate,
      subtotal: stepSubtotal,
      explanation,
    });
  }

  const grandTotal = Math.max(0, runningSubtotal + runningAdjustments);
  const duration = calculateDurationRange(billable.applied, service);
  const pricingVersion = dataset.businessConfig.pricingVersion || 'v1.0.0';
  const estimateId = `EST-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

  const snapshot: EstimateSnapshot = {
    estimateId,
    pricingVersion,
    calculatedAt: new Date().toISOString(),
    input,
    billableUnits: billable,
    breakdown: {
      baseCost,
      laborCost,
      materialCost,
      frameCost,
      finishingCost,
      addOnsCost,
      subtotal: runningSubtotal,
      percentageAdjustmentsTotal: runningAdjustments,
      multiplierAdjustmentsTotal: 0,
      total: grandTotal,
    },
    estimate: {
      min: grandTotal,
      max: grandTotal,
    },
    duration,
  };

  const explanatoryNotes =
    config?.explanatoryNotes ||
    'Estimasi biaya awal transparan sebelum survei lokasi gratis oleh tim teknis.';

  return {
    serviceId: service.id,
    serviceTitle: service.title,
    pricingVersion,
    inputs: input,
    billableUnits: {
      actual: billable.actual,
      applied: billable.applied,
      unitType: billable.unitType,
      minimumApplied,
    },
    steps: stepDetails,
    subtotal: runningSubtotal,
    adjustmentsTotal: runningAdjustments,
    grandTotal,
    duration,
    explanatoryNotes,
    snapshot,
  };
}

function getDefaultStepsForService(
  service: ServiceSchema,
  input: EstimatorInput,
  dataset: CompleteDataset
): FormulaStepConfig[] {
  const steps: FormulaStepConfig[] = [];
  let order = 1;

  if (input.materialId) {
    const mat = dataset.materials.find((m) => m.id === input.materialId);
    steps.push({
      id: `def-step-mat-${order}`,
      name: `Bahan Atap (${mat?.name || 'Material'})`,
      enabled: true,
      componentType: 'material',
      valueSource: 'area',
      priceSource: 'material',
      operation: 'multiply',
      order: order++,
    });
  }

  if (input.frameId) {
    const frame = dataset.frames.find((f) => f.id === input.frameId);
    steps.push({
      id: `def-step-frame-${order}`,
      name: `Rangka Utama (${frame?.name || 'Rangka'})`,
      enabled: true,
      componentType: 'frame',
      valueSource: 'area',
      priceSource: 'frame',
      operation: 'multiply',
      order: order++,
    });
  }

  if (input.laborId) {
    const labor = dataset.laborOptions.find((l) => l.id === input.laborId);
    steps.push({
      id: `def-step-labor-${order}`,
      name: `Upah Tukang (${labor?.name || 'Pengerjaan'})`,
      enabled: true,
      componentType: 'labor',
      valueSource: 'area',
      priceSource: 'labor',
      operation: 'multiply',
      order: order++,
    });
  }

  if (input.finishingId) {
    const fn = dataset.finishings.find((f) => f.id === input.finishingId);
    steps.push({
      id: `def-step-finishing-${order}`,
      name: `Finishing Cat (${fn?.name || 'Finishing'})`,
      enabled: true,
      componentType: 'finishing',
      valueSource: 'area',
      priceSource: 'finishing',
      operation: 'multiply',
      order: order++,
    });
  }

  return steps;
}

/**
 * Turns FormulaEngineResult directly into a human-readable BukuHitunganDocument.
 * Does NOT duplicate calculation logic. Formats already calculated values into operational Indonesian text.
 */
export function generateBukuHitungan(
  input: EstimatorInput,
  dataset: CompleteDataset
): BukuHitunganDocument {
  const result = evaluateFormulaEngine(input, dataset);
  const billable = result.billableUnits;

  let dimensionsText = `${billable.actual} ${billable.unitType}`;
  if (billable.unitType === 'm2' && input.length && input.width) {
    dimensionsText = `${input.length}m × ${input.width}m = ${billable.actual} m²`;
  } else if (billable.unitType === 'meter' && input.length) {
    dimensionsText = `${input.length} meter`;
  } else if (billable.unitType === 'unit' && input.quantity) {
    dimensionsText = `${input.quantity} unit`;
  }

  const stepsDetails: BukuHitunganStepDetail[] = result.steps.map((step, idx) => ({
    stepNumber: idx + 1,
    name: step.name,
    description: step.description,
    formulaText: `${step.value} ${step.unitLabel} × Rp ${step.rate.toLocaleString('id-ID')}`,
    unitRate: step.rate,
    subtotal: step.subtotal,
  }));

  return {
    serviceTitle: result.serviceTitle,
    pricingVersion: result.pricingVersion,
    inputSummary: {
      dimensionsText,
      actualUnitsText: `${billable.actual} ${billable.unitType}`,
      appliedUnitsText: `${billable.applied} ${billable.unitType}`,
      minimumApplied: billable.minimumApplied,
    },
    steps: stepsDetails,
    subtotal: result.subtotal,
    adjustmentsTotal: result.adjustmentsTotal,
    grandTotal: result.grandTotal,
    durationText: result.duration.text,
    explanatoryNotes: result.explanatoryNotes,
  };
}
