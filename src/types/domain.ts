/**
 * CORE DOMAIN MODEL & CMS-READY SCHEMAS
 * Single source of truth for Services, Pricing Rules, Components, Estimates, Formulas & Snapshots.
 */

export type PricingComponent =
  | 'base'
  | 'material'
  | 'frame'
  | 'labor'
  | 'finishing'
  | 'addon'
  | 'adjustment'
  | 'custom';

export type PricingModel =
  | 'per_m2'
  | 'per_m'
  | 'per_unit'
  | 'fixed'
  | 'percentage'
  | 'multiplier'
  | 'package';

export type MeasurementType = 'm2' | 'meter' | 'unit' | 'package' | 'dimensions' | 'mixed';

export type FormulaValueSource =
  | 'area'
  | 'length'
  | 'width'
  | 'height'
  | 'quantity'
  | 'fixed_value'
  | 'subtotal'
  | 'custom_input';

export type FormulaVariable = FormulaValueSource | string;

export type FormulaPriceSource =
  | 'material'
  | 'frame'
  | 'labor'
  | 'finishing'
  | 'addon'
  | 'package'
  | 'custom_rate'
  | 'fixed_amount'
  | 'percentage_rate';

export type FormulaOperator =
  | 'multiply'
  | 'add'
  | 'fixed'
  | 'percentage'
  | 'multiplier'
  | 'minimum_override';

export interface CustomInputConfig {
  label: string;
  unit?: string;
  defaultValue?: number;
}

export interface FormulaStepConfig {
  id: string;
  name: string; // Operational Indonesian label (e.g., "Bahan Atap", "Rangka", "Transport", "Pengerjaan", "Finishing", "Faktor Lokasi", "Branding", "Custom")
  description?: string;
  enabled?: boolean;
  order: number;
  componentType?: PricingComponent | string;
  valueSource?: FormulaValueSource;
  priceSource?: FormulaPriceSource;
  variable?: string; // Optional backward-compatible alias
  sourceId?: string; // Optional reference to specific material, frame, labor, or addon ID
  operation?: FormulaOperator;
  operator?: FormulaOperator; // Optional backward-compatible alias for operation
  customRate?: number; // Explicit override rate if not using catalog entity rate
  customInputConfig?: CustomInputConfig; // Optional metadata for custom_input valueSource
  notes?: string;
}

export interface ImpactPreviewCase {
  label: string; // e.g., "Proyek Kecil (10m²)", "1 Unit Standard", or "Gerobak Standard"
  length?: number;
  width?: number;
  height?: number;
  quantity?: number;
}

export interface ServiceCalculationConfig {
  serviceId: string;
  steps: FormulaStepConfig[];
  minimumBilling?: MinimumBillingSchema;
  explanatoryNotes?: string; // Owner explanatory notes for Buku Hitungan
  impactPreviewCases?: ImpactPreviewCase[];
}

export interface PackageSchema {
  id: string;
  name: string;
  description: string;
  serviceId: string;
  price: number;
  includedItems: string[]; // Generic bundled item descriptions
  source: 'owner' | 'development';
  status: 'active' | 'placeholder';
}

export type PricingVersionStatus = 'draft' | 'review' | 'published' | 'archived';

export interface PricingVersionSchema {
  version: string;
  status: PricingVersionStatus;
  createdAt: string;
  publishedAt?: string;
  createdReason: string;
  createdBy: string;
  revertedFromVersion?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor?: string;
  author?: string; // Backward-compatible alias for actor
  action?: string; // e.g., "UPDATE_PRICE", "CREATE_DRAFT_VERSION", "PUBLISH_VERSION"
  category: 'harga' | 'layanan' | 'formula' | 'versi' | 'master_data';
  entity?: string;
  entityId?: string;
  item: string;
  oldValue: string;
  newValue: string;
  pricingVersion: string;
  affectedServiceId?: string;
}

export interface PricingRuleSchema {
  id: string;
  targetComponent: PricingComponent;
  model: PricingModel;
  rate: number; // Unit rate, flat amount, percentage (e.g. 0.15 for 15%), or multiplier (e.g. 1.15)
  unitLabel?: string;
  description?: string;
}

export interface LaborOptionSchema {
  id: string;
  name: string;
  description: string;
  pricingRule: PricingRuleSchema;
  active: boolean;
  sortOrder: number;
  source: 'owner' | 'development';
  status: 'active' | 'placeholder';
}

export interface MaterialSchema {
  id: string;
  name: string;
  category: string;
  specification: string;
  pricingRule: PricingRuleSchema;
  warrantyInfo?: string;
  source: 'owner' | 'development';
  status: 'active' | 'placeholder';
}

export interface FrameSchema {
  id: string;
  name: string;
  specification: string;
  pricingRule: PricingRuleSchema;
  source: 'owner' | 'development';
  status: 'active' | 'placeholder';
}

export interface FinishingSchema {
  id: string;
  name: string;
  description: string;
  pricingRule: PricingRuleSchema;
  source: 'owner' | 'development';
  status: 'active' | 'placeholder';
}

export interface AddOnSchema {
  id: string;
  name: string;
  category?: string; // Optional generic grouping category (e.g. Aksesoris, Interior, Branding, Fitur Listrik)
  description: string;
  pricingRule: PricingRuleSchema;
  source: 'owner' | 'development';
  status: 'active' | 'placeholder';
}

export interface SiteConditionSchema {
  id: string;
  name: string;
  description: string;
  pricingRule: PricingRuleSchema;
  source: 'owner' | 'development';
  status: 'active' | 'placeholder';
}

export interface DurationRangeSchema {
  minUnits: number;
  maxUnits: number | null; // null means no upper limit (JSON/CMS safe)
  minDays: number;
  maxDays: number;
}

export interface MinimumBillingSchema {
  minimumArea?: number;
  minimumLength?: number;
  minimumQuantity?: number;
}

export interface BahanStandarSchema {
  bagian: string; // mis. "Atap", "Rangka", "Cat"
  bahan: string;
}

export interface ServiceSchema {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category:
    | 'canopy'
    | 'baja_ringan'
    | 'gate'
    | 'railing'
    | 'tralis'
    | 'plafon'
    | 'carport'
    | 'gerobak'
    | 'booth'
    | 'renovasi'
    | 'other';
  featured: boolean;
  measurementType: MeasurementType;
  pricingRules: PricingRuleSchema[];
  minimumBilling?: MinimumBillingSchema;
  allowedMaterialIds: string[];
  allowedFrameIds: string[];
  allowedLaborIds: string[];
  allowedFinishingIds: string[];
  allowedAddOnIds: string[];
  allowedSiteConditionIds: string[];
  durationRanges: DurationRangeSchema[];
  // Bahan yang dipakai di harga borongan. Cuma keterangan buat pelanggan, tidak
  // ikut dihitung; allowedMaterialIds tetap kosong supaya harga bahan tidak dobel.
  bahanStandar?: BahanStandarSchema[];
  imageUrl?: string;
  source: 'owner' | 'development';
  status: 'active' | 'placeholder';
}

export interface EstimatorInput {
  serviceId: string;
  length?: number;
  width?: number;
  height?: number;
  quantity?: number;
  materialId?: string;
  frameId?: string;
  laborId?: string;
  finishingId?: string;
  addonIds?: string[];
  siteConditionIds?: string[];
  customInputs?: Record<string, number>;
  notes?: string;
}

export interface EstimateSnapshot {
  estimateId: string;
  pricingVersion: string;
  calculatedAt: string;
  input: EstimatorInput;
  billableUnits: {
    actual: number;
    applied: number;
    unitType: MeasurementType;
  };
  breakdown: {
    baseCost: number;
    laborCost: number;
    materialCost: number;
    frameCost: number;
    finishingCost: number;
    addOnsCost: number;
    subtotal: number;
    percentageAdjustmentsTotal: number;
    multiplierAdjustmentsTotal: number;
    total: number;
  };
  estimate: {
    min: number;
    max: number;
  };
  duration: {
    minDays: number;
    maxDays: number;
    text: string;
  };
}

export interface CalculationResult {
  snapshot: EstimateSnapshot;
}

export interface LocationSchema {
  city: string;
  district: string;
  province: string;
}

export interface PortfolioSchema {
  id: string;
  slug: string;
  title: string;
  serviceId: string;
  location: LocationSchema;
  completionYear: number;
  thumbnailUrl: string;
  galleryImages: string[];
  specsSummary: string;
  testimonialQuote?: string;
}

export interface FaqSchema {
  id: string;
  category: 'estimator' | 'survey' | 'warranty' | 'materials' | 'payment_process';
  question: string;
  answer: string;
  order: number;
}

export interface BusinessConfigSchema {
  businessName: string;
  tagline: string;
  pricingVersion: string;
  frontlineContact: {
    name: string;
    whatsappNumber: string;
    email: string;
    role: string;
  };
  serviceAreas: string[];
  surveyDisclaimer: string;
  guaranteeTerms: string;
}

export interface CompleteDataset {
  businessConfig: BusinessConfigSchema;
  services: ServiceSchema[];
  laborOptions: LaborOptionSchema[];
  materials: MaterialSchema[];
  frames: FrameSchema[];
  finishings: FinishingSchema[];
  addOns: AddOnSchema[];
  siteConditions: SiteConditionSchema[];
  portfolios: PortfolioSchema[];
  faqs: FaqSchema[];
  packages?: PackageSchema[];
  calculationConfigs?: ServiceCalculationConfig[];
  pricingVersions?: PricingVersionSchema[];
  auditLogs?: AuditLogEntry[];
}

export type CmsDataset = CompleteDataset;


