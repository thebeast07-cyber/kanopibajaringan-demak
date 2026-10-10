import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { calculateEstimate } from '../estimator/pricingEngine';
import { resolveServiceImage, getFallbackServiceImage, validateImageFile } from './mediaStorage';
import { validateDatasetForPublish } from './publishValidation';
import { ServiceSchema } from '../../types/domain';

describe('PHASE 6F.1 — Catalog Image Management & Resolution', () => {
  it('1. Service without imageUrl remains valid and passes dataset publish validation', () => {
    const serviceWithoutImage: ServiceSchema = {
      ...COMPREHENSIVE_DATASET.services[0],
      imageUrl: undefined,
    };
    const dataset = {
      ...COMPREHENSIVE_DATASET,
      services: [serviceWithoutImage, ...COMPREHENSIVE_DATASET.services.slice(1)],
    };

    const valResult = validateDatasetForPublish(dataset);
    assert.equal(valResult.valid, true, 'Dataset without service imageUrl must remain valid');
  });

  it('2. Service with imageUrl remains valid and passes dataset publish validation', () => {
    const serviceWithImage: ServiceSchema = {
      ...COMPREHENSIVE_DATASET.services[0],
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };
    const dataset = {
      ...COMPREHENSIVE_DATASET,
      services: [serviceWithImage, ...COMPREHENSIVE_DATASET.services.slice(1)],
    };

    const valResult = validateDatasetForPublish(dataset);
    assert.equal(valResult.valid, true, 'Dataset with service imageUrl must be valid');
  });

  it('3. imageUrl has ZERO impact on pricing calculation', () => {
    const baseService = COMPREHENSIVE_DATASET.services[0];
    const input = {
      serviceId: baseService.id,
      length: 5,
      width: 4,
      materialId: baseService.allowedMaterialIds[0],
      frameId: baseService.allowedFrameIds[0],
      laborId: baseService.allowedLaborIds[0],
      finishingId: baseService.allowedFinishingIds[0],
      addonIds: [],
    };

    const dsWithoutImage = { ...COMPREHENSIVE_DATASET };
    const dsWithImage = {
      ...COMPREHENSIVE_DATASET,
      services: [
        { ...baseService, imageUrl: 'https://example.com/custom-image.jpg' },
        ...COMPREHENSIVE_DATASET.services.slice(1),
      ],
    };

    const estWithout = calculateEstimate(input, dsWithoutImage);
    const estWith = calculateEstimate(input, dsWithImage);

    assert.equal(
      estWithout.snapshot.breakdown.total,
      estWith.snapshot.breakdown.total,
      'Total price must be identical regardless of imageUrl'
    );
    assert.equal(
      estWithout.snapshot.billableUnits.applied,
      estWith.snapshot.billableUnits.applied,
      'Billable area must be identical regardless of imageUrl'
    );
    // jaring pengaman: kalau field-nya salah ketik lagi, nilainya undefined dan tes ini gagal
    assert.ok(
      typeof estWithout.snapshot.breakdown.total === 'number' && estWithout.snapshot.breakdown.total > 0,
      'Total price must be a real number, not undefined'
    );
  });

  it('4. Fallback image still resolves when imageUrl is absent', () => {
    const service = { slug: 'svc-kanopi-alderon', imageUrl: undefined };
    const resolved = resolveServiceImage(service);
    const fallback = getFallbackServiceImage('svc-kanopi-alderon');

    assert.equal(resolved, fallback);
    assert.ok(resolved.includes('unsplash.com'));
  });

  it('5. Custom image takes priority when imageUrl exists', () => {
    const customUrl = 'https://example.com/uploaded-kanopi.webp';
    const service = { slug: 'svc-kanopi-alderon', imageUrl: customUrl };
    const resolved = resolveServiceImage(service);

    assert.equal(resolved, customUrl, 'Custom imageUrl must take precedence over fallback');
  });

  it('6. Image file validation enforces format and size constraints', () => {
    const validFile = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const invalidFormat = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
    const oversizedFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

    assert.equal(validateImageFile(validFile).valid, true);
    assert.equal(validateImageFile(invalidFormat).valid, false);
    assert.equal(validateImageFile(invalidFormat).error, 'Format foto harus JPG, PNG, atau WebP.');
    assert.equal(validateImageFile(oversizedFile).valid, false);
    assert.equal(validateImageFile(oversizedFile).error, 'Ukuran foto maksimal 5 MB.');
  });
});
