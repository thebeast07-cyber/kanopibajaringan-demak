import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalCmsRepository } from './localCmsRepository';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { LaborOptionSchema } from '../../types/domain';

test('STEP 4C: Labor Master Data CRUD & Draft Isolation Tests', async (t) => {
  await t.test('1. Creating a new labor option creates a draft and does NOT mutate published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const initialPubCount = repo.getPublishedDataset().laborOptions.length;

    assert.equal(repo.hasDraft(), false, 'Should start with no active draft');

    const newLabor: LaborOptionSchema = {
      id: 'labor-test-custom-01',
      name: 'Pengerjaan Tingkat Tinggi / Difficult Access (>4m)',
      description: 'Upah pengerjaan dengan risiko ketinggian dan perancah khusus',
      pricingRule: {
        id: 'pr-labor-test-01',
        targetComponent: 'labor',
        model: 'per_m2',
        rate: 115000,
        unitLabel: 'm²',
      },
      active: true,
      sortOrder: 1,
      source: 'owner',
      status: 'active',
    };

    repo.saveLabor(newLabor, 'TestOwner');

    assert.equal(repo.hasDraft(), true, 'Draft must be auto-created on labor edit');
    assert.equal(
      repo.getPublishedDataset().laborOptions.length,
      initialPubCount,
      'Published dataset must remain untouched before publishing'
    );
    assert.equal(
      repo.getLaborOptions().length,
      initialPubCount + 1,
      'Working labor dataset should contain newly added labor option'
    );

    const savedInWorking = repo.getLaborById('labor-test-custom-01');
    assert.ok(savedInWorking, 'Saved labor option must exist in working dataset');
    assert.equal(savedInWorking?.pricingRule.rate, 115000);
  });

  await t.test('2. Updating an existing labor option updates draft and leaves published dataset unchanged', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const publishedLabor = repo.getPublishedDataset().laborOptions[0];
    const initialRate = publishedLabor.pricingRule.rate;
    const updatedRate = initialRate + 25000;

    const updatedLabor: LaborOptionSchema = {
      ...publishedLabor,
      pricingRule: {
        ...publishedLabor.pricingRule,
        rate: updatedRate,
      },
    };

    repo.saveLabor(updatedLabor, 'TestOwner');

    const pubAfterEdit = repo.getPublishedDataset().laborOptions.find((l) => l.id === publishedLabor.id);
    assert.equal(
      pubAfterEdit?.pricingRule.rate,
      initialRate,
      'Published labor rate must remain unchanged before publishing'
    );

    const workingAfterEdit = repo.getLaborById(publishedLabor.id);
    assert.equal(
      workingAfterEdit?.pricingRule.rate,
      updatedRate,
      'Working labor rate must reflect edited rate'
    );
  });

  await t.test('3. Toggling labor status toggles status in draft dataset and records audit log', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const targetLabor = repo.getPublishedDataset().laborOptions[0];
    const initialStatus = targetLabor.status;

    repo.toggleLaborStatus(targetLabor.id, 'TestOwner');

    const pubAfterToggle = repo.getPublishedDataset().laborOptions.find((l) => l.id === targetLabor.id);
    assert.equal(
      pubAfterToggle?.status,
      initialStatus,
      'Published dataset status must remain immutable'
    );

    const workingAfterToggle = repo.getLaborById(targetLabor.id);
    const expectedStatus = initialStatus === 'active' ? 'placeholder' : 'active';
    assert.equal(
      workingAfterToggle?.status,
      expectedStatus,
      'Working dataset status must toggle correctly'
    );

    const logs = repo.getAuditLogs();
    const toggleLog = logs.find((l) => l.action === 'TOGGLE_LABOR_STATUS');
    assert.ok(toggleLog, 'Audit log must record TOGGLE_LABOR_STATUS action');
  });

  await t.test('4. Publishing draft promotes labor option changes to published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const targetLabor = repo.getLaborOptions()[0];

    repo.saveLabor(
      {
        ...targetLabor,
        name: 'Pengerjaan Tukang Expert Published',
        pricingRule: { ...targetLabor.pricingRule, rate: 150000 },
      },
      'PublisherUser'
    );

    assert.notEqual(
      repo.getPublishedDataset().laborOptions[0].name,
      'Pengerjaan Tukang Expert Published',
      'Published dataset should not update before publish'
    );

    repo.publishDraft('PublisherUser');

    assert.equal(repo.hasDraft(), false, 'Draft must be cleared after publishing');
    assert.equal(
      repo.getPublishedDataset().laborOptions[0].name,
      'Pengerjaan Tukang Expert Published',
      'Published dataset must reflect updated labor name after publishing'
    );
    assert.equal(
      repo.getPublishedDataset().laborOptions[0].pricingRule.rate,
      150000,
      'Published dataset rate must reflect updated rate after publishing'
    );
  });
});
