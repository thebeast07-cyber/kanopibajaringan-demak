import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalCmsRepository } from './localCmsRepository';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { FinishingSchema } from '../../types/domain';

test('STEP 4D — Finishing Master Data CRUD & Draft Isolation Tests', async (t) => {
  await t.test('1. Creating a new finishing option creates a draft and does NOT mutate published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const initialPubCount = repo.getPublishedDataset().finishings.length;

    assert.equal(repo.hasDraft(), false, 'Should start with no active draft');

    const newFinishing: FinishingSchema = {
      id: 'fn-test-custom-01',
      name: 'Powder Coating Oven Heavy Duty',
      description: 'Finishing cat oven khusus tahan gores dan cuaca ekstrem',
      pricingRule: {
        id: 'pr-fn-test-01',
        targetComponent: 'finishing',
        model: 'per_m2',
        rate: 65000,
        unitLabel: 'm²',
      },
      source: 'owner',
      status: 'active',
    };

    repo.saveFinishing(newFinishing, 'TestOwner');

    assert.equal(repo.hasDraft(), true, 'Draft must be auto-created on finishing edit');
    assert.equal(
      repo.getPublishedDataset().finishings.length,
      initialPubCount,
      'Published dataset must remain untouched before publishing'
    );
    assert.equal(
      repo.getFinishings().length,
      initialPubCount + 1,
      'Working finishing dataset should contain newly added finishing option'
    );

    const savedInWorking = repo.getFinishingById('fn-test-custom-01');
    assert.ok(savedInWorking, 'Saved finishing option must exist in working dataset');
    assert.equal(savedInWorking?.pricingRule.rate, 65000);
  });

  await t.test('2. Updating an existing finishing option updates draft and leaves published dataset unchanged', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const publishedFinishing = repo.getPublishedDataset().finishings[0];
    const initialRate = publishedFinishing.pricingRule.rate;
    const updatedRate = initialRate + 15000;

    const updatedFinishing: FinishingSchema = {
      ...publishedFinishing,
      pricingRule: {
        ...publishedFinishing.pricingRule,
        rate: updatedRate,
      },
    };

    repo.saveFinishing(updatedFinishing, 'TestOwner');

    const pubAfterEdit = repo.getPublishedDataset().finishings.find((f) => f.id === publishedFinishing.id);
    assert.equal(
      pubAfterEdit?.pricingRule.rate,
      initialRate,
      'Published finishing rate must remain unchanged before publishing'
    );

    const workingAfterEdit = repo.getFinishingById(publishedFinishing.id);
    assert.equal(
      workingAfterEdit?.pricingRule.rate,
      updatedRate,
      'Working finishing rate must reflect edited rate'
    );
  });

  await t.test('3. Toggling finishing status toggles status in draft dataset and records audit log', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const targetFinishing = repo.getPublishedDataset().finishings[0];
    const initialStatus = targetFinishing.status;

    repo.toggleFinishingStatus(targetFinishing.id, 'TestOwner');

    const pubAfterToggle = repo.getPublishedDataset().finishings.find((f) => f.id === targetFinishing.id);
    assert.equal(
      pubAfterToggle?.status,
      initialStatus,
      'Published dataset status must remain immutable'
    );

    const workingAfterToggle = repo.getFinishingById(targetFinishing.id);
    const expectedStatus = initialStatus === 'active' ? 'placeholder' : 'active';
    assert.equal(
      workingAfterToggle?.status,
      expectedStatus,
      'Working dataset status must toggle correctly'
    );

    const logs = repo.getAuditLogs();
    const toggleLog = logs.find((l) => l.action === 'TOGGLE_FINISHING_STATUS');
    assert.ok(toggleLog, 'Audit log must record TOGGLE_FINISHING_STATUS action');
  });

  await t.test('4. Publishing draft promotes finishing option changes to published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const targetFinishing = repo.getFinishings()[0];

    repo.saveFinishing(
      {
        ...targetFinishing,
        name: 'Cat Duco Matte Premium Published',
        pricingRule: { ...targetFinishing.pricingRule, rate: 80000 },
      },
      'PublisherUser'
    );

    assert.notEqual(
      repo.getPublishedDataset().finishings[0].name,
      'Cat Duco Matte Premium Published',
      'Published dataset should not update before publish'
    );

    repo.publishDraft('PublisherUser');

    assert.equal(repo.hasDraft(), false, 'Draft must be cleared after publishing');
    assert.equal(
      repo.getPublishedDataset().finishings[0].name,
      'Cat Duco Matte Premium Published',
      'Published dataset must reflect updated finishing name after publishing'
    );
    assert.equal(
      repo.getPublishedDataset().finishings[0].pricingRule.rate,
      80000,
      'Published dataset rate must reflect updated rate after publishing'
    );
  });
});
