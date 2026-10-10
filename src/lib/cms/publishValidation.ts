import {
  CompleteDataset,
  EstimateSnapshot,
} from '../../types/domain';
import { calculateEstimate } from '../estimator/pricingEngine';

// ==========================================
// 1. IMPACT PREVIEW CONTRACT & TYPES
// ==========================================

export interface ImpactPreviewScenario {
  serviceId: string;
  length?: number;
  width?: number;
  quantity?: number;
  materialId?: string;
  frameId?: string;
  laborId?: string;
  finishingId?: string;
  addonIds?: string[];
  siteConditionIds?: string[];
  customInputs?: Record<string, number>;
}

export interface ImpactComponentDiff {
  name: string;
  publishedCost: number;
  draftCost: number;
  difference: number;
}

export interface ImpactPreviewResult {
  serviceId: string;
  serviceTitle: string;
  publishedVersion: string;
  draftVersion: string;
  publishedTotal: number;
  draftTotal: number;
  difference: number;
  absoluteDifference: number;
  percentageDifference: number;
  durationTextPublished: string;
  durationTextDraft: string;
  componentDiffs: ImpactComponentDiff[];
  hasChange: boolean;
  publishedSnapshot: EstimateSnapshot;
  draftSnapshot: EstimateSnapshot;
}

export const DEFAULT_BASELINE_SCENARIO: ImpactPreviewScenario = {
  serviceId: 'svc-kanopi-alderon',
  length: 5,
  width: 4,
};

/**
 * Calculates impact preview comparing current published dataset vs working draft dataset.
 * Uses the EXACT SAME calculateEstimate pricing engine logic (zero formula duplication).
 */
export function calculateImpactPreview(
  publishedDataset: CompleteDataset,
  draftDataset: CompleteDataset,
  scenario: ImpactPreviewScenario = DEFAULT_BASELINE_SCENARIO
): ImpactPreviewResult {
  const service =
    draftDataset.services.find((s) => s.id === scenario.serviceId) ||
    publishedDataset.services.find((s) => s.id === scenario.serviceId) ||
    publishedDataset.services[0];

  const serviceId = service.id;
  const serviceTitle = service.title;

  const matPub = publishedDataset.materials.find((m) => service.allowedMaterialIds.includes(m.id))?.id;
  const framePub = publishedDataset.frames.find((f) => service.allowedFrameIds.includes(f.id))?.id;
  const laborPub = publishedDataset.laborOptions.find((l) => service.allowedLaborIds.includes(l.id))?.id;
  const finishPub = publishedDataset.finishings.find((fn) => service.allowedFinishingIds.includes(fn.id))?.id;

  const matDraft = draftDataset.materials.find((m) => service.allowedMaterialIds.includes(m.id))?.id;
  const frameDraft = draftDataset.frames.find((f) => service.allowedFrameIds.includes(f.id))?.id;
  const laborDraft = draftDataset.laborOptions.find((l) => service.allowedLaborIds.includes(l.id))?.id;
  const finishDraft = draftDataset.finishings.find((fn) => service.allowedFinishingIds.includes(fn.id))?.id;

  const inputPub = {
    serviceId,
    length: scenario.length ?? 5,
    width: scenario.width ?? 4,
    quantity: scenario.quantity ?? 1,
    materialId: scenario.materialId || matPub || '',
    frameId: scenario.frameId || framePub || '',
    laborId: scenario.laborId || laborPub || '',
    finishingId: scenario.finishingId || finishPub || '',
    addonIds: scenario.addonIds || [],
    siteConditionIds: scenario.siteConditionIds || [],
    customInputs: scenario.customInputs || {},
  };

  const inputDraft = {
    ...inputPub,
    materialId: scenario.materialId || matDraft || matPub || '',
    frameId: scenario.frameId || frameDraft || framePub || '',
    laborId: scenario.laborId || laborDraft || laborPub || '',
    finishingId: scenario.finishingId || finishDraft || finishPub || '',
  };

  const pubResult = calculateEstimate(inputPub, publishedDataset);
  const draftResult = calculateEstimate(inputDraft, draftDataset);

  const pubSnap = pubResult.snapshot;
  const draftSnap = draftResult.snapshot;

  const publishedTotal = pubSnap.breakdown.total;
  const draftTotal = draftSnap.breakdown.total;
  const difference = draftTotal - publishedTotal;
  const absoluteDifference = Math.abs(difference);
  const percentageDifference =
    publishedTotal === 0 ? 0 : Number(((difference / publishedTotal) * 100).toFixed(2));

  const componentDiffs: ImpactComponentDiff[] = [
    {
      name: 'Harga Borongan',
      publishedCost: pubSnap.breakdown.baseCost,
      draftCost: draftSnap.breakdown.baseCost,
      difference: draftSnap.breakdown.baseCost - pubSnap.breakdown.baseCost,
    },
    {
      name: 'Material Penutup',
      publishedCost: pubSnap.breakdown.materialCost,
      draftCost: draftSnap.breakdown.materialCost,
      difference: draftSnap.breakdown.materialCost - pubSnap.breakdown.materialCost,
    },
    {
      name: 'Pilihan Rangka',
      publishedCost: pubSnap.breakdown.frameCost,
      draftCost: draftSnap.breakdown.frameCost,
      difference: draftSnap.breakdown.frameCost - pubSnap.breakdown.frameCost,
    },
    {
      name: 'Jasa Pemasangan',
      publishedCost: pubSnap.breakdown.laborCost,
      draftCost: draftSnap.breakdown.laborCost,
      difference: draftSnap.breakdown.laborCost - pubSnap.breakdown.laborCost,
    },
    {
      name: 'Finishing / Cat',
      publishedCost: pubSnap.breakdown.finishingCost,
      draftCost: draftSnap.breakdown.finishingCost,
      difference: draftSnap.breakdown.finishingCost - pubSnap.breakdown.finishingCost,
    },
  ];

  return {
    serviceId,
    serviceTitle,
    publishedVersion: publishedDataset.businessConfig.pricingVersion,
    draftVersion: draftDataset.businessConfig.pricingVersion,
    publishedTotal,
    draftTotal,
    difference,
    absoluteDifference,
    percentageDifference,
    durationTextPublished: pubSnap.duration.text,
    durationTextDraft: draftSnap.duration.text,
    componentDiffs,
    hasChange: difference !== 0,
    publishedSnapshot: pubSnap,
    draftSnapshot: draftSnap,
  };
}

// ==========================================
// 2. PUBLISH STRUCTURAL VALIDATION CONTRACT
// ==========================================

export interface ValidationIssue {
  type: 'error' | 'warning';
  code: string;
  message: string;
  field?: string;
  entityId?: string;
}

export interface PublishValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Performs strict structural validation on a dataset prior to publishing.
 * Does NOT enforce subjective business policies (e.g. minimum price thresholds or profit margin limits).
 */
export function validateDatasetForPublish(dataset: CompleteDataset): PublishValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Business Config
  if (!dataset.businessConfig) {
    issues.push({
      type: 'error',
      code: 'MISSING_CONFIG',
      message: 'Business configuration is missing.',
    });
  } else if (!dataset.businessConfig.pricingVersion) {
    issues.push({
      type: 'error',
      code: 'MISSING_VERSION',
      message: 'Pricing version string is missing in business config.',
      field: 'businessConfig.pricingVersion',
    });
  }

  // 2. Services
  const activeServices = (dataset.services || []).filter((s) => s.status === 'active');
  if (activeServices.length === 0) {
    issues.push({
      type: 'error',
      code: 'NO_ACTIVE_SERVICES',
      message: 'Dataset must contain at least one active service.',
    });
  }

  for (const svc of dataset.services || []) {
    if (!svc.id || !svc.title) {
      issues.push({
        type: 'error',
        code: 'INVALID_SERVICE_IDENTITY',
        message: `Service missing ID or Title: ${svc.id || 'unknown'}`,
        entityId: svc.id,
      });
    }

    if (!['m2', 'meter', 'unit'].includes(svc.measurementType)) {
      issues.push({
        type: 'error',
        code: 'INVALID_MEASUREMENT_TYPE',
        message: `Service "${svc.title}" has invalid measurement type: ${svc.measurementType}`,
        entityId: svc.id,
      });
    }

    // Reference validation for allowed IDs
    for (const matId of svc.allowedMaterialIds || []) {
      const exists = (dataset.materials || []).some((m) => m.id === matId);
      if (!exists) {
        issues.push({
          type: 'error',
          code: 'BROKEN_MATERIAL_REFERENCE',
          message: `Service "${svc.title}" references non-existent material ID "${matId}"`,
          entityId: svc.id,
        });
      }
    }

    for (const frameId of svc.allowedFrameIds || []) {
      const exists = (dataset.frames || []).some((f) => f.id === frameId);
      if (!exists) {
        issues.push({
          type: 'error',
          code: 'BROKEN_FRAME_REFERENCE',
          message: `Service "${svc.title}" references non-existent frame ID "${frameId}"`,
          entityId: svc.id,
        });
      }
    }

    for (const laborId of svc.allowedLaborIds || []) {
      const exists = (dataset.laborOptions || []).some((l) => l.id === laborId);
      if (!exists) {
        issues.push({
          type: 'error',
          code: 'BROKEN_LABOR_REFERENCE',
          message: `Service "${svc.title}" references non-existent labor ID "${laborId}"`,
          entityId: svc.id,
        });
      }
    }

    for (const fnId of svc.allowedFinishingIds || []) {
      const exists = (dataset.finishings || []).some((f) => f.id === fnId);
      if (!exists) {
        issues.push({
          type: 'error',
          code: 'BROKEN_FINISHING_REFERENCE',
          message: `Service "${svc.title}" references non-existent finishing ID "${fnId}"`,
          entityId: svc.id,
        });
      }
    }
  }

  // 3. Materials, Frames, Labor, Finishing pricing rules
  const validateRules = (
    items: { id: string; name: string; pricingRule?: { model: string; rate: number } }[],
    category: string
  ) => {
    const validModels = ['per_m2', 'per_m', 'per_unit', 'fixed', 'package', 'percentage', 'multiplier'];
    for (const item of items) {
      if (!item.pricingRule) {
        issues.push({
          type: 'error',
          code: 'MISSING_PRICING_RULE',
          message: `${category} "${item.name}" is missing pricingRule`,
          entityId: item.id,
        });
      } else {
        if (!validModels.includes(item.pricingRule.model)) {
          issues.push({
            type: 'error',
            code: 'INVALID_PRICING_MODEL',
            message: `${category} "${item.name}" has invalid pricing model "${item.pricingRule.model}"`,
            entityId: item.id,
          });
        }
        if (typeof item.pricingRule.rate !== 'number' || isNaN(item.pricingRule.rate) || item.pricingRule.rate < 0) {
          issues.push({
            type: 'error',
            code: 'INVALID_PRICING_RATE',
            message: `${category} "${item.name}" has invalid pricing rate ${item.pricingRule.rate}`,
            entityId: item.id,
          });
        }
      }
    }
  };

  validateRules(dataset.materials || [], 'Material');
  validateRules(dataset.frames || [], 'Frame');
  validateRules(dataset.laborOptions || [], 'LaborOption');
  validateRules(dataset.finishings || [], 'Finishing');
  validateRules(dataset.addOns || [], 'AddOn');

  const errors = issues.filter((i) => i.type === 'error');
  return {
    valid: errors.length === 0,
    issues,
  };
}
