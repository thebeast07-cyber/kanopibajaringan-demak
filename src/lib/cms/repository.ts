import {
  CompleteDataset,
  ServiceSchema,
  MaterialSchema,
  LaborOptionSchema,
  FinishingSchema,
  AddOnSchema,
  FrameSchema,
  PackageSchema,
  ServiceCalculationConfig,
  PricingVersionSchema,
  AuditLogEntry,
  BusinessConfigSchema,
} from '../../types/domain';
import { defaultLocalCmsRepository } from './localCmsRepository';

/**
 * Business-level CMS Repository Abstraction
 * Completely decouples business operations, domain logic, and UI from the storage layer.
 */
export interface ICmsRepository {
  /**
   * Returns the currently active published dataset used by public applications.
   */
  getPublishedDataset(): CompleteDataset;

  /**
   * Alias for getPublishedDataset() for backward compatibility.
   */
  getDataset(): CompleteDataset;

  /**
   * Returns the active working draft dataset if one exists, otherwise null.
   */
  getDraftDataset(): CompleteDataset | null;

  /**
   * Creates a new working draft initialized from the current published dataset.
   */
  createDraft(reason: string, actor: string): CompleteDataset;

  /**
   * Updates fields within the active working draft.
   */
  saveDraft(updatedFields: Partial<CompleteDataset>, actor: string): void;

  /**
   * Promotes the active draft to a new immutable Published version.
   */
  publishDraft(actor: string): PricingVersionSchema;

  /**
   * Creates a new version initialized from a historical version and publishes it.
   */
  revertToHistoricalVersion(targetVersion: string, actor: string): PricingVersionSchema;

  /**
   * Returns all version metadata (Draft, Published, Archived).
   */
  getVersions(): PricingVersionSchema[];

  /**
   * Returns metadata for a specific version.
   */
  getVersion(version: string): PricingVersionSchema | undefined;

  /**
   * Appends an entry to the audit log.
   */
  createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void;

  /**
   * Returns the full audit log history.
   */
  getAuditLogs(): AuditLogEntry[];

  /**
   * Subscribes to reactive state changes. Returns an unsubscribe function.
   */
  subscribe(listener: () => void): () => void;

  // Convenient entity & calculation accessors
  getBusinessConfig(): BusinessConfigSchema;
  getWorkingDataset(): CompleteDataset;
  getServices(): ServiceSchema[];
  getServiceById(id: string): ServiceSchema | undefined;
  getMaterials(): MaterialSchema[];
  getMaterialById(id: string): MaterialSchema | undefined;
  getFrames(): FrameSchema[];
  getFrameById(id: string): FrameSchema | undefined;
  getLaborOptions(): LaborOptionSchema[];
  getLaborById(id: string): LaborOptionSchema | undefined;
  getFinishings(): FinishingSchema[];
  getFinishingById(id: string): FinishingSchema | undefined;
  getAddOns(): AddOnSchema[];
  getAddOnById(id: string): AddOnSchema | undefined;
  getPackages(): PackageSchema[];
  getPackageById(id: string): PackageSchema | undefined;
  getCalculationConfig(serviceId: string): ServiceCalculationConfig | undefined;
  getActiveVersion(): string;
  hasDraft(): boolean;

  // Helper entity mutations
  saveService(service: ServiceSchema, author?: string): void;
  toggleServiceStatus(id: string, author?: string): void;
  saveMaterial(material: MaterialSchema, author?: string): void;
  toggleMaterialStatus(id: string, author?: string): void;
  saveFrame(frame: FrameSchema, author?: string): void;
  toggleFrameStatus(id: string, author?: string): void;
  saveLabor(labor: LaborOptionSchema, author?: string): void;
  toggleLaborStatus(id: string, author?: string): void;
  saveFinishing(finishing: FinishingSchema, author?: string): void;
  toggleFinishingStatus(id: string, author?: string): void;
  saveAddOn(addon: AddOnSchema, author?: string): void;
  toggleAddOnStatus(id: string, author?: string): void;
  savePackage(pkg: PackageSchema, author?: string): void;
  togglePackageStatus(id: string, author?: string): void;
  saveCalculationConfig(config: ServiceCalculationConfig, author?: string): void;

  createDraftVersion(reason: string, author: string): PricingVersionSchema;
  publishVersion(version: string, author: string): void;
  revertToVersion(targetVersion: string, author: string): PricingVersionSchema;

  getImpactPreview(scenario?: import('./publishValidation').ImpactPreviewScenario): import('./publishValidation').ImpactPreviewResult | null;
  validateCurrentDraft(): import('./publishValidation').PublishValidationResult;
}

export const defaultCmsRepository: ICmsRepository = defaultLocalCmsRepository;

