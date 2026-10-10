import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalCmsRepository } from './localCmsRepository';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { AddOnSchema } from '../../types/domain';

test('STEP 4E: Add-On Master Data CRUD & Draft Isolation Tests', async (t) => {
  await t.test('1. Creating a new add-on creates a draft and does NOT mutate published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const initialPubCount = repo.getPublishedDataset().addOns.length;

    assert.equal(repo.hasDraft(), false, 'Should start with no active draft');

    const newAddOn: AddOnSchema = {
      id: 'addon-test-custom-01',
      name: 'Talang Water Drain PVC High Flow',
      description: 'Talang pembuangan air hujan PVC lengkap dengan corong dan P-trap',
      pricingRule: {
        id: 'pr-addon-test-01',
        targetComponent: 'addon',
        model: 'fixed',
        rate: 180000,
        unitLabel: 'meter',
      },
      source: 'owner',
      status: 'active',
    };

    repo.saveAddOn(newAddOn, 'TestOwner');

    assert.equal(repo.hasDraft(), true, 'Draft must be auto-created on add-on edit');
    assert.equal(
      repo.getPublishedDataset().addOns.length,
      initialPubCount,
      'Published dataset must remain untouched before publishing'
    );
    assert.equal(
      repo.getAddOns().length,
      initialPubCount + 1,
      'Working add-ons dataset should contain newly added add-on option'
    );

    const savedInWorking = repo.getAddOnById('addon-test-custom-01');
    assert.ok(savedInWorking, 'Saved add-on option must exist in working dataset');
    assert.equal(savedInWorking?.pricingRule.rate, 180000);
  });

  await t.test('2. Updating an existing add-on updates draft and leaves published dataset unchanged', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const publishedAddOn = repo.getPublishedDataset().addOns[0];
    const initialRate = publishedAddOn.pricingRule.rate;
    const updatedRate = initialRate + 20000;

    const updatedAddOn: AddOnSchema = {
      ...publishedAddOn,
      pricingRule: {
        ...publishedAddOn.pricingRule,
        rate: updatedRate,
      },
    };

    repo.saveAddOn(updatedAddOn, 'TestOwner');

    const pubAfterEdit = repo.getPublishedDataset().addOns.find((a) => a.id === publishedAddOn.id);
    assert.equal(
      pubAfterEdit?.pricingRule.rate,
      initialRate,
      'Published add-on rate must remain unchanged before publishing'
    );

    const workingAfterEdit = repo.getAddOnById(publishedAddOn.id);
    assert.equal(
      workingAfterEdit?.pricingRule.rate,
      updatedRate,
      'Working add-on rate must reflect edited rate'
    );
  });

  await t.test('3. Toggling add-on status toggles status in draft dataset and records audit log', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const targetAddOn = repo.getPublishedDataset().addOns[0];
    const initialStatus = targetAddOn.status;

    repo.toggleAddOnStatus(targetAddOn.id, 'TestOwner');

    const pubAfterToggle = repo.getPublishedDataset().addOns.find((a) => a.id === targetAddOn.id);
    assert.equal(
      pubAfterToggle?.status,
      initialStatus,
      'Published dataset status must remain immutable'
    );

    const workingAfterToggle = repo.getAddOnById(targetAddOn.id);
    const expectedStatus = initialStatus === 'active' ? 'placeholder' : 'active';
    assert.equal(
      workingAfterToggle?.status,
      expectedStatus,
      'Working dataset status must toggle correctly'
    );

    const logs = repo.getAuditLogs();
    const toggleLog = logs.find((l) => l.action === 'TOGGLE_ADDON_STATUS');
    assert.ok(toggleLog, 'Audit log must record TOGGLE_ADDON_STATUS action');
  });

  await t.test('4. Publishing draft promotes add-on option changes to published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const targetAddOn = repo.getAddOns()[0];

    repo.saveAddOn(
      {
        ...targetAddOn,
        name: 'Lampu LED Strip Warm White Published',
        pricingRule: { ...targetAddOn.pricingRule, rate: 250000 },
      },
      'PublisherUser'
    );

    assert.notEqual(
      repo.getPublishedDataset().addOns[0].name,
      'Lampu LED Strip Warm White Published',
      'Published dataset should not update before publish'
    );

    repo.publishDraft('PublisherUser');

    assert.equal(repo.hasDraft(), false, 'Draft must be cleared after publishing');
    assert.equal(
      repo.getPublishedDataset().addOns[0].name,
      'Lampu LED Strip Warm White Published',
      'Published dataset must reflect updated add-on name after publishing'
    );
    assert.equal(
      repo.getPublishedDataset().addOns[0].pricingRule.rate,
      250000,
      'Published dataset rate must reflect updated rate after publishing'
    );
  });
});
