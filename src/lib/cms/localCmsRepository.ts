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
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { ICmsRepository } from './repository';
import {
  calculateImpactPreview,
  validateDatasetForPublish,
  ImpactPreviewScenario,
  ImpactPreviewResult,
  PublishValidationResult,
} from './publishValidation';

// v2: harga bawaan direset. Data v1 di browser lama tetap ada, cuma tidak dibaca lagi.
const STORAGE_KEY = 'kanopi_cms_state_v2';

export interface StorageState {
  publishedDataset: CompleteDataset;
  draftDataset: CompleteDataset | null;
  versions: PricingVersionSchema[];
  auditLogs: AuditLogEntry[];
}

export class LocalCmsRepository implements ICmsRepository {
  private publishedDataset: CompleteDataset;
  private draftDataset: CompleteDataset | null = null;
  private versions: PricingVersionSchema[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private listeners: Set<() => void> = new Set();
  // Dipasang oleh layout admin: tiap perubahan juga dikirim ke penyimpanan online.
  private penyimpanLuar: ((state: StorageState) => void) | null = null;

  constructor(initialData?: CompleteDataset) {
    const base = initialData || COMPREHENSIVE_DATASET;
    const loaded = this.loadStateFromStorage();

    if (loaded) {
      this.publishedDataset = loaded.publishedDataset;
      this.draftDataset = loaded.draftDataset;
      this.versions = loaded.versions;
      this.auditLogs = loaded.auditLogs;
    } else {
      this.publishedDataset = this.initializeDefaultDataset(base);
      this.draftDataset = null;
      this.versions = [
        {
          version: base.businessConfig.pricingVersion || 'v1.0.0',
          status: 'published',
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          createdReason: 'Initial Published Baseline',
          createdBy: 'System Initialization',
        },
      ];
      this.auditLogs = [];
    }
  }

  private initializeDefaultDataset(base: CompleteDataset): CompleteDataset {
    const dataset: CompleteDataset = JSON.parse(JSON.stringify(base));

    if (!dataset.calculationConfigs || dataset.calculationConfigs.length === 0) {
      dataset.calculationConfigs = [
        {
          serviceId: 'svc-kanopi-alderon',
          explanatoryNotes:
            'Estimasi kanopi dihitung berdasarkan luas bidang (Panjang × Lebar) dikalikan harga bahan atap, rangka hollow, upah pemasangan, dan finishing anti-karat.',
          steps: [
            {
              id: 'step-1',
              name: 'Bahan Atap',
              enabled: true,
              componentType: 'material',
              valueSource: 'area',
              priceSource: 'material',
              operation: 'multiply',
              order: 1,
              description: 'Biaya material penutup per m²',
            },
            {
              id: 'step-2',
              name: 'Rangka Utama',
              enabled: true,
              componentType: 'frame',
              valueSource: 'area',
              priceSource: 'frame',
              operation: 'multiply',
              order: 2,
              description: 'Biaya kontruksi rangka per m²',
            },
            {
              id: 'step-3',
              name: 'Upah Tukang',
              enabled: true,
              componentType: 'labor',
              valueSource: 'area',
              priceSource: 'labor',
              operation: 'multiply',
              order: 3,
              description: 'Biaya pengerjaan dan pengelasan per m²',
            },
            {
              id: 'step-4',
              name: 'Finishing Anti-Karat',
              enabled: true,
              componentType: 'finishing',
              valueSource: 'area',
              priceSource: 'finishing',
              operation: 'multiply',
              order: 4,
              description: 'Biaya pengecatan & finishing pelindung',
            },
          ],
          impactPreviewCases: [
            { label: 'Proyek Kecil (10m²)', length: 5, width: 2 },
            { label: 'Carport Standard (20m²)', length: 5, width: 4 },
            { label: 'Proyek Besar (40m²)', length: 8, width: 5 },
          ],
        },
        {
          serviceId: 'svc-atap-baja-ringan',
          explanatoryNotes:
            'Estimasi atap baja ringan dihitung dari total luas bidang atap termasuk faktor kemiringan dan spesifikasi kencana/baja ringan.',
          steps: [
            {
              id: 'step-br-1',
              name: 'Material Atap',
              enabled: true,
              componentType: 'material',
              valueSource: 'area',
              priceSource: 'material',
              operation: 'multiply',
              order: 1,
            },
            {
              id: 'step-br-2',
              name: 'Rangka Truss Baja',
              enabled: true,
              componentType: 'frame',
              valueSource: 'area',
              priceSource: 'frame',
              operation: 'multiply',
              order: 2,
            },
            {
              id: 'step-br-3',
              name: 'Pemasangan Specialist',
              enabled: true,
              componentType: 'labor',
              valueSource: 'area',
              priceSource: 'labor',
              operation: 'multiply',
              order: 3,
            },
          ],
          impactPreviewCases: [
            { label: 'Atap Rumah Kecil (30m²)', length: 6, width: 5 },
            { label: 'Atap Rumah Standard (60m²)', length: 10, width: 6 },
            { label: 'Atap Luas (100m²)', length: 10, width: 10 },
          ],
        },
      ];
    }

    if (!dataset.packages) dataset.packages = [];
    if (!dataset.pricingVersions) dataset.pricingVersions = [];
    if (!dataset.auditLogs) dataset.auditLogs = [];

    return dataset;
  }

  private loadStateFromStorage(): StorageState | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('Failed to load LocalCmsRepository state from storage', e);
      }
    }
    return null;
  }

  private persistState() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const state: StorageState = {
          publishedDataset: this.publishedDataset,
          draftDataset: this.draftDataset,
          versions: this.versions,
          auditLogs: this.auditLogs,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn('Failed to persist LocalCmsRepository state', e);
      }
    }
    this.penyimpanLuar?.(this.exportState());
    this.notify();
  }

  exportState(): StorageState {
    return JSON.parse(
      JSON.stringify({
        publishedDataset: this.publishedDataset,
        draftDataset: this.draftDataset,
        versions: this.versions,
        // Riwayat dipotong supaya berkas di penyimpanan online tidak membengkak.
        auditLogs: this.auditLogs.slice(0, 500),
      })
    );
  }

  /** Ganti seluruh isi dengan data dari penyimpanan online, tanpa mengirimnya balik. */
  replaceState(state: StorageState): void {
    this.publishedDataset = state.publishedDataset;
    this.draftDataset = state.draftDataset;
    this.versions = state.versions;
    this.auditLogs = state.auditLogs;
    const penyimpan = this.penyimpanLuar;
    this.penyimpanLuar = null;
    this.persistState();
    this.penyimpanLuar = penyimpan;
  }

  setPenyimpanLuar(fn: ((state: StorageState) => void) | null): void {
    this.penyimpanLuar = fn;
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public syncFromStorage(): void {
    const loaded = this.loadStateFromStorage();
    if (loaded) {
      this.publishedDataset = loaded.publishedDataset;
      this.draftDataset = loaded.draftDataset;
      this.versions = loaded.versions;
      this.auditLogs = loaded.auditLogs;
    }
  }

  getPublishedDataset(): CompleteDataset {
    this.syncFromStorage();
    return JSON.parse(JSON.stringify(this.publishedDataset));
  }

  getDataset(): CompleteDataset {
    return this.getPublishedDataset();
  }

  getDraftDataset(): CompleteDataset | null {
    this.syncFromStorage();
    if (!this.draftDataset) return null;
    return JSON.parse(JSON.stringify(this.draftDataset));
  }

  hasDraft(): boolean {
    this.syncFromStorage();
    return this.draftDataset !== null;
  }

  createDraft(reason: string, actor: string): CompleteDataset {
    const activeVersion = this.publishedDataset.businessConfig.pricingVersion || 'v1.0.0';
    const parts = activeVersion.replace(/^v/, '').split('.');
    const minor = parseInt(parts[1] || '0', 10) + 1;
    const draftVersionName = `v1.${minor}.0-draft`;

    this.draftDataset = JSON.parse(JSON.stringify(this.publishedDataset));
    this.draftDataset!.businessConfig.pricingVersion = draftVersionName;

    const draftVersionMeta: PricingVersionSchema = {
      version: draftVersionName,
      status: 'draft',
      createdAt: new Date().toISOString(),
      createdReason: reason,
      createdBy: actor,
    };

    const existingDraftIdx = this.versions.findIndex((v) => v.status === 'draft');
    if (existingDraftIdx >= 0) {
      this.versions[existingDraftIdx] = draftVersionMeta;
    } else {
      this.versions.unshift(draftVersionMeta);
    }

    this.createAuditLog({
      actor,
      action: 'CREATE_DRAFT',
      category: 'versi',
      entity: 'PricingVersion',
      entityId: draftVersionName,
      item: `Draf Versi Baru (${draftVersionName})`,
      oldValue: activeVersion,
      newValue: draftVersionName,
      pricingVersion: draftVersionName,
    });

    this.persistState();
    return JSON.parse(JSON.stringify(this.draftDataset));
  }

  saveDraft(updatedFields: Partial<CompleteDataset>, actor: string): void {
    if (!this.draftDataset) {
      this.createDraft('Auto-created draft on edit', actor);
    }

    this.draftDataset = {
      ...this.draftDataset!,
      ...updatedFields,
    };

    this.createAuditLog({
      actor,
      action: 'UPDATE_DRAFT',
      category: 'master_data',
      entity: 'DraftDataset',
      item: 'Pembaruan Isian Draf',
      oldValue: 'Prior Draft State',
      newValue: 'Updated Draft State',
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
    });

    this.persistState();
  }

  publishDraft(actor: string): PricingVersionSchema {
    if (!this.draftDataset) {
      throw new Error('No active draft dataset available to publish.');
    }

    const validation = validateDatasetForPublish(this.draftDataset);
    if (!validation.valid) {
      const errors = validation.issues.filter((i) => i.type === 'error').map((i) => i.message).join('; ');
      throw new Error(`Cannot publish invalid dataset: ${errors}`);
    }

    const draftVersionName = this.draftDataset.businessConfig.pricingVersion;
    const finalVersionName = draftVersionName.replace(/-draft$/, '');

    this.draftDataset.businessConfig.pricingVersion = finalVersionName;
    this.publishedDataset = JSON.parse(JSON.stringify(this.draftDataset));
    this.draftDataset = null;

    this.versions.forEach((v) => {
      if (v.status === 'published') v.status = 'archived';
    });

    const publishedMeta: PricingVersionSchema = {
      version: finalVersionName,
      status: 'published',
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      createdReason: `Published from draft ${draftVersionName}`,
      createdBy: actor,
    };

    const draftIdx = this.versions.findIndex((v) => v.status === 'draft');
    if (draftIdx >= 0) {
      this.versions[draftIdx] = publishedMeta;
    } else {
      this.versions.unshift(publishedMeta);
    }

    this.publishedDataset.pricingVersions = this.versions;

    this.createAuditLog({
      actor,
      action: 'PUBLISH_VERSION',
      category: 'versi',
      entity: 'PricingVersion',
      entityId: finalVersionName,
      item: `Publikasi Versi Baru (${finalVersionName})`,
      oldValue: 'Previous Published Version',
      newValue: finalVersionName,
      pricingVersion: finalVersionName,
    });

    this.persistState();
    return publishedMeta;
  }

  revertToHistoricalVersion(targetVersion: string, actor: string): PricingVersionSchema {
    const targetMeta = this.versions.find((v) => v.version === targetVersion);
    if (!targetMeta) {
      throw new Error(`Target version "${targetVersion}" not found.`);
    }

    const newVersionName = `v1.${Date.now().toString().slice(-3)}.0`;

    const restoredDataset: CompleteDataset = JSON.parse(JSON.stringify(this.publishedDataset));
    restoredDataset.businessConfig.pricingVersion = newVersionName;

    this.publishedDataset = restoredDataset;

    this.versions.forEach((v) => {
      if (v.status === 'published') v.status = 'archived';
    });

    const newPublishedMeta: PricingVersionSchema = {
      version: newVersionName,
      status: 'published',
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      createdReason: `Reverted from historical version ${targetVersion}`,
      createdBy: actor,
      revertedFromVersion: targetVersion,
    };

    this.versions.unshift(newPublishedMeta);
    this.publishedDataset.pricingVersions = this.versions;

    this.createAuditLog({
      actor,
      action: 'REVERT_VERSION',
      category: 'versi',
      entity: 'PricingVersion',
      entityId: newVersionName,
      item: `Kembalikan Versi Historis (${targetVersion} → ${newVersionName})`,
      oldValue: targetVersion,
      newValue: newVersionName,
      pricingVersion: newVersionName,
    });

    this.persistState();
    return newPublishedMeta;
  }

  getVersions(): PricingVersionSchema[] {
    this.syncFromStorage();
    return JSON.parse(JSON.stringify(this.versions));
  }

  getVersion(version: string): PricingVersionSchema | undefined {
    this.syncFromStorage();
    return this.versions.find((v) => v.version === version);
  }

  createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const fullLog: AuditLogEntry = {
      ...entry,
      actor: entry.actor || entry.author || 'Owner',
      author: entry.author || entry.actor || 'Owner',
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(fullLog);
  }

  getAuditLogs(): AuditLogEntry[] {
    this.syncFromStorage();
    return JSON.parse(JSON.stringify(this.auditLogs));
  }

  // Convenient helper methods
  getBusinessConfig(): BusinessConfigSchema {
    this.syncFromStorage();
    return (this.draftDataset || this.publishedDataset).businessConfig;
  }

  getWorkingDataset(): CompleteDataset {
    this.syncFromStorage();
    return JSON.parse(JSON.stringify(this.draftDataset || this.publishedDataset));
  }

  getServices(): ServiceSchema[] {
    this.syncFromStorage();
    return (this.draftDataset || this.publishedDataset).services;
  }

  getServiceById(id: string): ServiceSchema | undefined {
    this.syncFromStorage();
    return (this.draftDataset || this.publishedDataset).services.find((s) => s.id === id);
  }

  getMaterials(): MaterialSchema[] {
    this.syncFromStorage();
    return (this.draftDataset || this.publishedDataset).materials;
  }

  getMaterialById(id: string): MaterialSchema | undefined {
    this.syncFromStorage();
    return (this.draftDataset || this.publishedDataset).materials.find((m) => m.id === id);
  }

  getCalculationConfig(serviceId: string): ServiceCalculationConfig | undefined {
    this.syncFromStorage();
    return (this.draftDataset || this.publishedDataset).calculationConfigs?.find((c) => c.serviceId === serviceId);
  }

  getActiveVersion(): string {
    const pub = this.getVersions().find((v) => v.status === 'published');
    return pub ? pub.version : this.publishedDataset.businessConfig.pricingVersion;
  }

  saveService(service: ServiceSchema, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for updating service ${service.title}`, author);
    }
    const idx = this.draftDataset!.services.findIndex((s) => s.id === service.id);
    const old = idx >= 0 ? this.draftDataset!.services[idx] : null;

    if (idx >= 0) {
      this.draftDataset!.services[idx] = service;
    } else {
      this.draftDataset!.services.push(service);
    }

    this.createAuditLog({
      actor: author,
      author,
      action: 'SAVE_SERVICE',
      category: 'layanan',
      entity: 'ServiceSchema',
      entityId: service.id,
      item: service.title,
      oldValue: old ? old.status : 'Non-existent',
      newValue: service.status,
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
      affectedServiceId: service.id,
    });
    this.persistState();
  }

  toggleServiceStatus(id: string, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for toggling service status`, author);
    }

    const svc = this.draftDataset!.services.find((s) => s.id === id);
    if (!svc) return;

    const oldStatus = svc.status;
    const newStatus = oldStatus === 'active' ? 'placeholder' : 'active';
    svc.status = newStatus;

    this.createAuditLog({
      actor: author,
      author,
      action: 'TOGGLE_SERVICE_STATUS',
      category: 'master_data',
      entity: 'ServiceSchema',
      entityId: id,
      item: `Status Layanan: ${svc.title}`,
      oldValue: oldStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      newValue: newStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
      affectedServiceId: id,
    });
    this.persistState();
  }

  saveMaterial(material: MaterialSchema, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for updating material ${material.name}`, author);
    }

    const idx = this.draftDataset!.materials.findIndex((m) => m.id === material.id);
    const oldRate = idx >= 0 ? this.draftDataset!.materials[idx].pricingRule.rate : 0;
    const oldName = idx >= 0 ? this.draftDataset!.materials[idx].name : 'Baru';

    if (idx >= 0) {
      this.draftDataset!.materials[idx] = material;
    } else {
      this.draftDataset!.materials.push(material);
    }

    this.createAuditLog({
      actor: author,
      author,
      action: 'SAVE_MATERIAL',
      category: 'harga',
      entity: 'MaterialSchema',
      entityId: material.id,
      item: `Bahan Atap: ${material.name}`,
      oldValue: idx >= 0 ? `Rp ${oldRate.toLocaleString('id-ID')}` : 'Belum Ada',
      newValue: `Rp ${material.pricingRule.rate.toLocaleString('id-ID')}`,
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
    });
    this.persistState();
  }

  toggleMaterialStatus(id: string, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for toggling material status`, author);
    }

    const mat = this.draftDataset!.materials.find((m) => m.id === id);
    if (!mat) return;

    const oldStatus = mat.status;
    const newStatus = oldStatus === 'active' ? 'placeholder' : 'active';
    mat.status = newStatus;

    this.createAuditLog({
      actor: author,
      author,
      action: 'TOGGLE_MATERIAL_STATUS',
      category: 'master_data',
      entity: 'MaterialSchema',
      entityId: id,
      item: `Status Bahan: ${mat.name}`,
      oldValue: oldStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      newValue: newStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
    });
    this.persistState();
  }

  getFrames(): FrameSchema[] {
    return (this.draftDataset || this.publishedDataset).frames;
  }

  getFrameById(id: string): FrameSchema | undefined {
    return (this.draftDataset || this.publishedDataset).frames.find((f) => f.id === id);
  }

  saveFrame(frame: FrameSchema, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for updating frame ${frame.name}`, author);
    }

    const idx = this.draftDataset!.frames.findIndex((f) => f.id === frame.id);
    const oldRate = idx >= 0 ? this.draftDataset!.frames[idx].pricingRule.rate : 0;

    if (idx >= 0) {
      this.draftDataset!.frames[idx] = frame;
    } else {
      this.draftDataset!.frames.push(frame);
    }

    this.createAuditLog({
      actor: author,
      author,
      action: 'SAVE_FRAME',
      category: 'harga',
      entity: 'FrameSchema',
      entityId: frame.id,
      item: `Rangka: ${frame.name}`,
      oldValue: idx >= 0 ? `Rp ${oldRate.toLocaleString('id-ID')}` : 'Belum Ada',
      newValue: `Rp ${frame.pricingRule.rate.toLocaleString('id-ID')}`,
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
    });
    this.persistState();
  }

  toggleFrameStatus(id: string, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for toggling frame status`, author);
    }

    const frame = this.draftDataset!.frames.find((f) => f.id === id);
    if (!frame) return;

    const oldStatus = frame.status;
    const newStatus = oldStatus === 'active' ? 'placeholder' : 'active';
    frame.status = newStatus;

    this.createAuditLog({
      actor: author,
      author,
      action: 'TOGGLE_FRAME_STATUS',
      category: 'master_data',
      entity: 'FrameSchema',
      entityId: id,
      item: `Status Rangka: ${frame.name}`,
      oldValue: oldStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      newValue: newStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
    });
    this.persistState();
  }

  getLaborOptions(): LaborOptionSchema[] {
    return (this.draftDataset || this.publishedDataset).laborOptions;
  }

  getLaborById(id: string): LaborOptionSchema | undefined {
    return (this.draftDataset || this.publishedDataset).laborOptions.find((l) => l.id === id);
  }

  saveLabor(labor: LaborOptionSchema, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for updating labor option ${labor.name}`, author);
    }

    const idx = this.draftDataset!.laborOptions.findIndex((l) => l.id === labor.id);
    const oldRate = idx >= 0 ? this.draftDataset!.laborOptions[idx].pricingRule.rate : 0;

    if (idx >= 0) {
      this.draftDataset!.laborOptions[idx] = labor;
    } else {
      this.draftDataset!.laborOptions.push(labor);
    }

    this.createAuditLog({
      actor: author,
      author,
      action: 'SAVE_LABOR',
      category: 'harga',
      entity: 'LaborOptionSchema',
      entityId: labor.id,
      item: `Upah Pengerjaan: ${labor.name}`,
      oldValue: idx >= 0 ? `Rp ${oldRate.toLocaleString('id-ID')}` : 'Belum Ada',
      newValue: `Rp ${labor.pricingRule.rate.toLocaleString('id-ID')}`,
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
    });
    this.persistState();
  }

  toggleLaborStatus(id: string, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for toggling labor status`, author);
    }

    const labor = this.draftDataset!.laborOptions.find((l) => l.id === id);
    if (!labor) return;

    const oldStatus = labor.status;
    const newStatus = oldStatus === 'active' ? 'placeholder' : 'active';
    labor.status = newStatus;

    this.createAuditLog({
      actor: author,
      author,
      action: 'TOGGLE_LABOR_STATUS',
      category: 'master_data',
      entity: 'LaborOptionSchema',
      entityId: id,
      item: `Status Upah Pengerjaan: ${labor.name}`,
      oldValue: oldStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      newValue: newStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
    });
    this.persistState();
  }

  getFinishings(): FinishingSchema[] {
    return (this.draftDataset || this.publishedDataset).finishings;
  }

  getFinishingById(id: string): FinishingSchema | undefined {
    return (this.draftDataset || this.publishedDataset).finishings.find((f) => f.id === id);
  }

  saveFinishing(finishing: FinishingSchema, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for updating finishing ${finishing.name}`, author);
    }

    const idx = this.draftDataset!.finishings.findIndex((f) => f.id === finishing.id);
    const oldRate = idx >= 0 ? this.draftDataset!.finishings[idx].pricingRule.rate : 0;

    if (idx >= 0) {
      this.draftDataset!.finishings[idx] = finishing;
    } else {
      this.draftDataset!.finishings.push(finishing);
    }

    this.createAuditLog({
      actor: author,
      author,
      action: 'SAVE_FINISHING',
      category: 'harga',
      entity: 'FinishingSchema',
      entityId: finishing.id,
      item: `Finishing: ${finishing.name}`,
      oldValue: idx >= 0 ? `Rp ${oldRate.toLocaleString('id-ID')}` : 'Belum Ada',
      newValue: `Rp ${finishing.pricingRule.rate.toLocaleString('id-ID')}`,
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
    });
    this.persistState();
  }

  toggleFinishingStatus(id: string, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for toggling finishing status`, author);
    }

    const fn = this.draftDataset!.finishings.find((f) => f.id === id);
    if (!fn) return;

    const oldStatus = fn.status;
    const newStatus = oldStatus === 'active' ? 'placeholder' : 'active';
    fn.status = newStatus;

    this.createAuditLog({
      actor: author,
      author,
      action: 'TOGGLE_FINISHING_STATUS',
      category: 'master_data',
      entity: 'FinishingSchema',
      entityId: id,
      item: `Status Finishing: ${fn.name}`,
      oldValue: oldStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      newValue: newStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
    });
    this.persistState();
  }

  getAddOns(): AddOnSchema[] {
    return (this.draftDataset || this.publishedDataset).addOns;
  }

  getAddOnById(id: string): AddOnSchema | undefined {
    return (this.draftDataset || this.publishedDataset).addOns.find((a) => a.id === id);
  }

  saveAddOn(addon: AddOnSchema, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for updating addon ${addon.name}`, author);
    }

    const idx = this.draftDataset!.addOns.findIndex((a) => a.id === addon.id);
    const oldRate = idx >= 0 ? this.draftDataset!.addOns[idx].pricingRule.rate : 0;

    if (idx >= 0) {
      this.draftDataset!.addOns[idx] = addon;
    } else {
      this.draftDataset!.addOns.push(addon);
    }

    this.createAuditLog({
      actor: author,
      author,
      action: 'SAVE_ADDON',
      category: 'harga',
      entity: 'AddOnSchema',
      entityId: addon.id,
      item: `Biaya Tambahan: ${addon.name}`,
      oldValue: idx >= 0 ? `Rp ${oldRate.toLocaleString('id-ID')}` : 'Belum Ada',
      newValue: `Rp ${addon.pricingRule.rate.toLocaleString('id-ID')}`,
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
    });
    this.persistState();
  }

  toggleAddOnStatus(id: string, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for toggling addon status`, author);
    }

    const addon = this.draftDataset!.addOns.find((a) => a.id === id);
    if (!addon) return;

    const oldStatus = addon.status;
    const newStatus = oldStatus === 'active' ? 'placeholder' : 'active';
    addon.status = newStatus;

    this.createAuditLog({
      actor: author,
      author,
      action: 'TOGGLE_ADDON_STATUS',
      category: 'master_data',
      entity: 'AddOnSchema',
      entityId: id,
      item: `Status Tambahan: ${addon.name}`,
      oldValue: oldStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      newValue: newStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
    });
    this.persistState();
  }

  getPackages(): PackageSchema[] {
    const dataset = this.draftDataset || this.publishedDataset;
    return dataset.packages || [];
  }

  getPackageById(id: string): PackageSchema | undefined {
    const dataset = this.draftDataset || this.publishedDataset;
    return (dataset.packages || []).find((p) => p.id === id);
  }

  savePackage(pkg: PackageSchema, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for updating package ${pkg.name}`, author);
    }

    if (!this.draftDataset!.packages) {
      this.draftDataset!.packages = [];
    }

    const idx = this.draftDataset!.packages.findIndex((p) => p.id === pkg.id);
    const oldPrice = idx >= 0 ? this.draftDataset!.packages[idx].price : 0;

    if (idx >= 0) {
      this.draftDataset!.packages[idx] = pkg;
    } else {
      this.draftDataset!.packages.push(pkg);
    }

    this.createAuditLog({
      actor: author,
      author,
      action: 'SAVE_PACKAGE',
      category: 'harga',
      entity: 'PackageSchema',
      entityId: pkg.id,
      item: `Paket: ${pkg.name}`,
      oldValue: idx >= 0 ? `Rp ${oldPrice.toLocaleString('id-ID')}` : 'Belum Ada',
      newValue: `Rp ${pkg.price.toLocaleString('id-ID')}`,
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
      affectedServiceId: pkg.serviceId,
    });
    this.persistState();
  }

  togglePackageStatus(id: string, author = 'Owner'): void {
    if (!this.draftDataset) {
      this.createDraft(`Auto draft for toggling package status`, author);
    }

    if (!this.draftDataset!.packages) {
      this.draftDataset!.packages = [];
    }

    const pkg = this.draftDataset!.packages.find((p) => p.id === id);
    if (!pkg) return;

    const oldStatus = pkg.status;
    const newStatus = oldStatus === 'active' ? 'placeholder' : 'active';
    pkg.status = newStatus;

    this.createAuditLog({
      actor: author,
      author,
      action: 'TOGGLE_PACKAGE_STATUS',
      category: 'master_data',
      entity: 'PackageSchema',
      entityId: id,
      item: `Status Paket: ${pkg.name}`,
      oldValue: oldStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      newValue: newStatus === 'active' ? 'Aktif' : 'Non-Aktif',
      pricingVersion: this.draftDataset!.businessConfig.pricingVersion,
    });
    this.persistState();
  }

  saveCalculationConfig(config: ServiceCalculationConfig, author = 'Owner'): void {
    if (!this.publishedDataset.calculationConfigs) this.publishedDataset.calculationConfigs = [];
    const idx = this.publishedDataset.calculationConfigs.findIndex(
      (c) => c.serviceId === config.serviceId
    );

    if (idx >= 0) {
      this.publishedDataset.calculationConfigs[idx] = config;
    } else {
      this.publishedDataset.calculationConfigs.push(config);
    }

    this.createAuditLog({
      actor: author,
      author,
      action: 'SAVE_CALCULATION_CONFIG',
      category: 'formula',
      entity: 'ServiceCalculationConfig',
      entityId: config.serviceId,
      item: `Formula Cara Hitung (${config.serviceId})`,
      oldValue: 'Perubahan konfigurasi formula',
      newValue: `${config.steps.length} langkah terkonfigurasi`,
      pricingVersion: this.getActiveVersion(),
      affectedServiceId: config.serviceId,
    });
    this.persistState();
  }

  createDraftVersion(reason: string, author: string): PricingVersionSchema {
    this.createDraft(reason, author);
    return this.versions.find((v) => v.status === 'draft')!;
  }

  publishVersion(version: string, author: string): void {
    this.publishDraft(author);
  }

  revertToVersion(targetVersion: string, author: string): PricingVersionSchema {
    return this.revertToHistoricalVersion(targetVersion, author);
  }

  getImpactPreview(scenario?: ImpactPreviewScenario): ImpactPreviewResult | null {
    this.syncFromStorage();
    if (!this.draftDataset) return null;
    return calculateImpactPreview(this.publishedDataset, this.draftDataset, scenario);
  }

  validateCurrentDraft(): PublishValidationResult {
    this.syncFromStorage();
    if (!this.draftDataset) {
      return { valid: true, issues: [] };
    }
    return validateDatasetForPublish(this.draftDataset);
  }
}

export const defaultLocalCmsRepository = new LocalCmsRepository();
