import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateImpactPreview,
  validateDatasetForPublish,
} from './publishValidation';
import { LocalCmsRepository } from './localCmsRepository';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { datasetHargaUji } from '../estimator/fixtureHargaUji';
import { CompleteDataset } from '../../types/domain';

test('PHASE 5D: Impact Preview, Publish Validation & Version Immutability Tests', async (t) => {
  const publishedDataset: CompleteDataset = datasetHargaUji();

  await t.test('1. calculateImpactPreview uses exact pricingEngine without formula duplication', () => {
    const draftDataset: CompleteDataset = JSON.parse(JSON.stringify(publishedDataset));
    draftDataset.businessConfig.pricingVersion = 'v1.1.0-draft';

    // Naikkan tarif borongan kanopi alderon dari 785,000 ke 885,000
    // (+100,000/m² × 20m² = +2,000,000)
    const svc = draftDataset.services.find((s) => s.id === 'svc-kanopi-alderon');
    if (svc) {
      svc.pricingRules[0].rate = 885000;
    }

    const preview = calculateImpactPreview(publishedDataset, draftDataset, {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4,
    });

    assert.equal(preview.serviceId, 'svc-kanopi-alderon');
    assert.equal(preview.publishedTotal, 15700000);
    assert.equal(preview.draftTotal, 17700000);
    assert.equal(preview.difference, 2000000);
    assert.equal(preview.percentageDifference, 12.74);
    assert.equal(preview.hasChange, true);
    assert.equal(preview.componentDiffs.find((c) => c.name === 'Harga Borongan')?.difference, 2000000);
  });

  await t.test('2. validateDatasetForPublish enforces strict structural validity', () => {
    const validResult = validateDatasetForPublish(publishedDataset);
    assert.equal(validResult.valid, true);
    assert.equal(validResult.issues.filter((i) => i.type === 'error').length, 0);

    // Test broken material reference
    const brokenDataset: CompleteDataset = JSON.parse(JSON.stringify(publishedDataset));
    brokenDataset.services[0].allowedMaterialIds.push('non-existent-material-id-999');

    const invalidResult = validateDatasetForPublish(brokenDataset);
    assert.equal(invalidResult.valid, false);
    assert.ok(invalidResult.issues.some((i) => i.code === 'BROKEN_MATERIAL_REFERENCE'));
  });

  await t.test('3. Version Immutability: Reverting creates new version without mutating historical versions', () => {
    const repo = new LocalCmsRepository(publishedDataset);

    // Initial version
    const initialVersion = repo.getActiveVersion();

    // Create draft and change a material price
    repo.createDraft('Draf Kenaikan Harga', 'Owner');
    const draft = repo.getDraftDataset()!;
    draft.materials[0].pricingRule.rate = 500000;
    repo.saveDraft(draft, 'Owner');

    // Publish draft -> Promotes to new published version
    const publishedV2 = repo.publishDraft('Owner');
    assert.equal(publishedV2.status, 'published');
    assert.notEqual(publishedV2.version, initialVersion);

    // Revert to initial historical version -> Creates a new version (e.g. V3) rather than mutating V1
    const revertedV3 = repo.revertToHistoricalVersion(initialVersion, 'Owner');
    assert.equal(revertedV3.status, 'published');
    assert.notEqual(revertedV3.version, initialVersion);
    assert.equal(revertedV3.revertedFromVersion, initialVersion);

    // Verify historical initial version metadata remains archived & untouched
    const historicalMeta = repo.getVersion(initialVersion);
    assert.equal(historicalMeta?.status, 'archived');
  });

  await t.test('4. publishDraft blocks invalid datasets with broken references', () => {
    const repo = new LocalCmsRepository(publishedDataset);
    repo.createDraft('Draft Broken Reference', 'Owner');

    const draft = repo.getDraftDataset()!;
    draft.services[0].allowedMaterialIds = ['invalid-mat-id'];
    repo.saveDraft(draft, 'Owner');

    assert.throws(() => {
      repo.publishDraft('Owner');
    }, /Cannot publish invalid dataset/);
  });

  await t.test('5. PHASE 6B: AddOnSchema.category is optional and retains structural validity', () => {
    const datasetWithCategory: CompleteDataset = JSON.parse(JSON.stringify(publishedDataset));

    // Uncategorized addon
    delete datasetWithCategory.addOns[0].category;

    // Categorized addon
    if (datasetWithCategory.addOns[1]) {
      datasetWithCategory.addOns[1].category = 'Aksesoris & Storage';
    }

    const validation = validateDatasetForPublish(datasetWithCategory);
    assert.equal(validation.valid, true);
  });

  await t.test('6. PHASE 6B: AddOnSchema.category does NOT affect pricing engine calculation', () => {
    const repo = new LocalCmsRepository(publishedDataset);
    repo.createDraft('Category Addon Test', 'Owner');

    const draft = repo.getDraftDataset()!;
    const addon = draft.addOns[0];
    const initialRate = addon.pricingRule.rate;

    // Run baseline preview before category modification
    const preview1 = calculateImpactPreview(publishedDataset, draft);

    // Attach category string metadata
    addon.category = 'Fitur Listrik & Lighting';
    repo.saveDraft(draft, 'Owner');

    // Run preview after category modification
    const preview2 = calculateImpactPreview(publishedDataset, draft);

    // Totals must remain identical (category has ZERO impact on calculation)
    assert.equal(preview1.draftTotal, preview2.draftTotal);
    assert.equal(preview1.publishedTotal, preview2.publishedTotal);
    assert.equal(addon.pricingRule.rate, initialRate);
  });
});
