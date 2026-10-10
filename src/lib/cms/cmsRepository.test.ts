import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalCmsRepository } from './localCmsRepository';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { calculateEstimate } from '../estimator/pricingEngine';

test('Step 1B — CMS Repository Layer Tests', async (t) => {
  await t.test('1. Initial dataset can be loaded from comprehensiveDataset.ts', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const dataset = repo.getPublishedDataset();

    assert.ok(dataset.services.length > 0);
    // Nama usaha itu isian pemilik yang bisa berubah kapan saja; yang penting
    // repository mengembalikannya utuh, bukan nilainya persis apa.
    assert.equal(dataset.businessConfig.businessName, COMPREHENSIVE_DATASET.businessConfig.businessName);
    assert.ok(dataset.businessConfig.businessName.length > 0);
  });

  await t.test('2. Published dataset can be read', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const pub = repo.getPublishedDataset();

    assert.ok(pub.materials.length > 0);
    assert.equal(repo.getDraftDataset(), null);
  });

  await t.test('3. Draft can be created from published data', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const draft = repo.createDraft('Testing draft creation', 'Admin User');

    assert.ok(draft !== null);
    assert.ok(draft.businessConfig.pricingVersion.includes('draft'));
    assert.ok(repo.getDraftDataset() !== null);
  });

  await t.test('4. Editing draft does not mutate published data', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const beforePubRate = repo.getPublishedDataset().materials[0].pricingRule.rate;

    repo.createDraft('Prepare rate change', 'Owner');
    const draft = repo.getDraftDataset()!;
    draft.materials[0].pricingRule.rate = 999000;

    repo.saveDraft(draft, 'Owner');

    const afterPubRate = repo.getPublishedDataset().materials[0].pricingRule.rate;
    assert.equal(afterPubRate, beforePubRate);
    assert.equal(repo.getDraftDataset()!.materials[0].pricingRule.rate, 999000);
  });

  await t.test('5. Draft can be saved and retrieved', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    repo.createDraft('Draft save test', 'Owner');

    const draft = repo.getDraftDataset()!;
    draft.businessConfig.tagline = 'Tagline Draf Baru';

    repo.saveDraft(draft, 'Owner');
    assert.equal(repo.getDraftDataset()!.businessConfig.tagline, 'Tagline Draf Baru');
  });

  await t.test('6. Published version remains immutable', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const initialVersion = repo.getPublishedDataset().businessConfig.pricingVersion;

    const draft = repo.createDraft('Updating prices', 'Owner');
    draft.materials[0].pricingRule.rate = 350000;
    repo.saveDraft(draft, 'Owner');

    const publishedMeta = repo.publishDraft('Owner');

    assert.notEqual(publishedMeta.version, initialVersion);
    assert.equal(repo.getPublishedDataset().businessConfig.pricingVersion, publishedMeta.version);
  });

  await t.test('7. Publishing creates a new version and clears draft', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    repo.createDraft('Publish new version', 'Owner');
    const pubMeta = repo.publishDraft('Owner');

    assert.equal(pubMeta.status, 'published');
    assert.equal(repo.getDraftDataset(), null);
    assert.ok(repo.getVersions().some((v) => v.version === pubMeta.version && v.status === 'published'));
  });

  await t.test('8. Historical versions remain readable and revert creates new version', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const v1 = repo.getPublishedDataset().businessConfig.pricingVersion;

    repo.createDraft('V2 draft', 'Owner');
    const v2Meta = repo.publishDraft('Owner');

    const restoredMeta = repo.revertToHistoricalVersion(v1, 'Owner');

    assert.equal(restoredMeta.revertedFromVersion, v1);
    assert.notEqual(restoredMeta.version, v1); // Did not overwrite v1!
    assert.equal(repo.getVersion(v1)?.version, v1); // v1 remains intact in history
  });

  await t.test('9. Audit log records mutations', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    repo.createDraft('Log test', 'Test Actor');
    repo.publishDraft('Test Actor');

    const logs = repo.getAuditLogs();
    assert.ok(logs.length >= 2);
    assert.equal(logs[0].actor, 'Test Actor');
  });

  await t.test('10. Existing dataset remains compatible', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const pub = repo.getPublishedDataset();

    assert.equal(pub.services.length, COMPREHENSIVE_DATASET.services.length);
    assert.equal(pub.materials.length, COMPREHENSIVE_DATASET.materials.length);
  });

  await t.test('11. Existing pricing engine tests still calculate correctly with published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const pub = repo.getPublishedDataset();

    const input = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4,
      materialId: 'mat-alderon-twinwall',
    };

    const res = calculateEstimate(input, pub);
    assert.ok(res.snapshot.breakdown.total > 0);
    assert.equal(res.snapshot.pricingVersion, pub.businessConfig.pricingVersion);
  });
});
