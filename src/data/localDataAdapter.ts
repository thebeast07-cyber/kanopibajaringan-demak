import {
  CompleteDataset,
  ServiceSchema,
  MaterialSchema,
  FrameSchema,
  LaborOptionSchema,
  FinishingSchema,
  AddOnSchema,
  SiteConditionSchema,
  PortfolioSchema,
  FaqSchema,
  BusinessConfigSchema,
} from '../types/domain';
import { defaultLocalCmsRepository } from '../lib/cms/localCmsRepository';

export interface IDataAdapter {
  getDataset(): CompleteDataset;
  getBusinessConfig(): BusinessConfigSchema;
  getServices(): ServiceSchema[];
  getServiceById(id: string): ServiceSchema | undefined;
  getServiceBySlug(slug: string): ServiceSchema | undefined;
  getMaterialsForService(service: ServiceSchema): MaterialSchema[];
  getFramesForService(service: ServiceSchema): FrameSchema[];
  getLaborOptionsForService(service: ServiceSchema): LaborOptionSchema[];
  getFinishingsForService(service: ServiceSchema): FinishingSchema[];
  getAddOnsForService(service: ServiceSchema): AddOnSchema[];
  getSiteConditionsForService(service: ServiceSchema): SiteConditionSchema[];
  getPortfolios(): PortfolioSchema[];
  getFaqs(): FaqSchema[];
}

export class LocalDataAdapter implements IDataAdapter {
  private repo = defaultLocalCmsRepository;

  getDataset(): CompleteDataset {
    return this.repo.getPublishedDataset();
  }

  getBusinessConfig(): BusinessConfigSchema {
    return this.getDataset().businessConfig;
  }

  getServices(): ServiceSchema[] {
    return this.getDataset().services.filter((s) => s.status === 'active');
  }

  getServiceById(id: string): ServiceSchema | undefined {
    return this.getDataset().services.find((s) => s.id === id);
  }

  getServiceBySlug(slug: string): ServiceSchema | undefined {
    return this.getDataset().services.find((s) => s.slug === slug);
  }

  getMaterialsForService(service: ServiceSchema): MaterialSchema[] {
    const dataset = this.getDataset();
    return dataset.materials.filter(
      (m) => service.allowedMaterialIds.includes(m.id) && m.status === 'active'
    );
  }

  getFramesForService(service: ServiceSchema): FrameSchema[] {
    const dataset = this.getDataset();
    return dataset.frames.filter(
      (f) => service.allowedFrameIds.includes(f.id) && f.status === 'active'
    );
  }

  getLaborOptionsForService(service: ServiceSchema): LaborOptionSchema[] {
    const dataset = this.getDataset();
    return dataset.laborOptions.filter(
      (l) => service.allowedLaborIds.includes(l.id) && l.active
    );
  }

  getFinishingsForService(service: ServiceSchema): FinishingSchema[] {
    const dataset = this.getDataset();
    return dataset.finishings.filter(
      (fn) => service.allowedFinishingIds.includes(fn.id) && fn.status === 'active'
    );
  }

  getAddOnsForService(service: ServiceSchema): AddOnSchema[] {
    const dataset = this.getDataset();
    return dataset.addOns.filter(
      (a) => service.allowedAddOnIds.includes(a.id) && a.status === 'active'
    );
  }

  getSiteConditionsForService(service: ServiceSchema): SiteConditionSchema[] {
    const dataset = this.getDataset();
    return dataset.siteConditions.filter(
      (sc) => service.allowedSiteConditionIds.includes(sc.id) && sc.status === 'active'
    );
  }

  getPortfolios(): PortfolioSchema[] {
    return this.getDataset().portfolios;
  }

  getFaqs(): FaqSchema[] {
    return this.getDataset().faqs.sort((a, b) => a.order - b.order);
  }
}

export const defaultDataAdapter = new LocalDataAdapter();


