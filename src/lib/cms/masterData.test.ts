import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalCmsRepository } from './localCmsRepository';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { MaterialSchema } from '../../types/domain';

test('STEP 4A — Master Data CRUD Foundation & Draft Isolation Tests', async (t) => {
  await t.test('1. Creating/Saving a material creates a draft and does NOT mutate published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const initialPubCount = repo.getPublishedDataset().materials.length;

    assert.equal(repo.hasDraft(), false, 'Should start with no active draft');

    const newMaterial: MaterialSchema = {
      id: 'mat-test-101',
      name: 'Spandek Transparan Premium 1.0mm',
      category: 'Spandek / Trimdek',
      specification: 'Spandek transparan bening hemat energi',
      pricingRule: {
        id: 'pr-test-101',
        targetComponent: 'material',
        model: 'per_m2',
        rate: 220000,
        unitLabel: 'm²',
      },
      warrantyInfo: 'Garansi 10 Tahun',
      source: 'owner',
      status: 'active',
    };

    repo.saveMaterial(newMaterial, 'TestOwner');

    assert.equal(repo.hasDraft(), true, 'Draft must be auto-created on material edit');
    assert.equal(
      repo.getPublishedDataset().materials.length,
      initialPubCount,
      'Published dataset must remain untouched before publishing'
    );
    assert.equal(
      repo.getMaterials().length,
      initialPubCount + 1,
      'Working materials dataset should contain the newly added material'
    );

    const savedInWorking = repo.getMaterialById('mat-test-101');
    assert.ok(savedInWorking, 'Saved material must exist in working dataset');
    assert.equal(savedInWorking?.pricingRule.rate, 220000);
  });

  await t.test('2. Updating an existing material updates draft dataset and leaves published dataset unchanged', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const publishedMaterials = repo.getPublishedDataset().materials;
    const targetMat = publishedMaterials[0];

    const initialPublishedRate = targetMat.pricingRule.rate;
    const updatedRate = initialPublishedRate + 50000;

    const updatedMaterial: MaterialSchema = {
      ...targetMat,
      pricingRule: {
        ...targetMat.pricingRule,
        rate: updatedRate,
      },
    };

    repo.saveMaterial(updatedMaterial, 'TestOwner');

    const pubAfterEdit = repo.getPublishedDataset().materials.find((m) => m.id === targetMat.id);
    assert.equal(
      pubAfterEdit?.pricingRule.rate,
      initialPublishedRate,
      'Published material rate must remain unchanged'
    );

    const workingAfterEdit = repo.getMaterialById(targetMat.id);
    assert.equal(
      workingAfterEdit?.pricingRule.rate,
      updatedRate,
      'Working material rate must reflect edited value'
    );
  });

  await t.test('3. Toggle material status updates status in working dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const publishedMat = repo.getPublishedDataset().materials[0];
    const initialStatus = publishedMat.status;

    repo.toggleMaterialStatus(publishedMat.id, 'TestOwner');

    const pubAfterToggle = repo.getPublishedDataset().materials.find((m) => m.id === publishedMat.id);
    assert.equal(
      pubAfterToggle?.status,
      initialStatus,
      'Published material status must not mutate on draft toggle'
    );

    const workingAfterToggle = repo.getMaterialById(publishedMat.id);
    const expectedStatus = initialStatus === 'active' ? 'placeholder' : 'active';
    assert.equal(
      workingAfterToggle?.status,
      expectedStatus,
      'Working material status must toggle correctly'
    );
  });

  await t.test('4. Audit log records SAVE_MATERIAL and TOGGLE_MATERIAL_STATUS entries', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const mat = repo.getMaterials()[0];

    repo.saveMaterial(
      {
        ...mat,
        pricingRule: { ...mat.pricingRule, rate: 195000 },
      },
      'AdminAuditUser'
    );

    repo.toggleMaterialStatus(mat.id, 'AdminAuditUser');

    const logs = repo.getAuditLogs();

    const saveLog = logs.find((l) => l.action === 'SAVE_MATERIAL');
    assert.ok(saveLog, 'Audit log must record SAVE_MATERIAL action');
    assert.equal(saveLog?.actor, 'AdminAuditUser');

    const toggleLog = logs.find((l) => l.action === 'TOGGLE_MATERIAL_STATUS');
    assert.ok(toggleLog, 'Audit log must record TOGGLE_MATERIAL_STATUS action');
    assert.equal(toggleLog?.actor, 'AdminAuditUser');
  });

  await t.test('5. Publishing draft promotes master data changes to published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const mat = repo.getMaterials()[0];

    repo.saveMaterial(
      {
        ...mat,
        name: 'Alderon UPVC Twinwall Special',
        pricingRule: { ...mat.pricingRule, rate: 350000 },
      },
      'PublisherUser'
    );

    assert.notEqual(
      repo.getPublishedDataset().materials[0].name,
      'Alderon UPVC Twinwall Special',
      'Before publish, published dataset remains on baseline name'
    );

    repo.publishDraft('PublisherUser');

    assert.equal(repo.hasDraft(), false, 'Draft must be cleared after publishing');
    assert.equal(
      repo.getPublishedDataset().materials[0].name,
      'Alderon UPVC Twinwall Special',
      'Published dataset must reflect updated material name after publishing'
    );
    assert.equal(
      repo.getPublishedDataset().materials[0].pricingRule.rate,
      350000,
      'Published dataset rate must reflect updated rate after publishing'
    );
  });
});
