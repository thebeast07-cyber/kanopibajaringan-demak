import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalCmsRepository } from './localCmsRepository';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { FrameSchema } from '../../types/domain';

test('STEP 4F: Frame Master Data CRUD & Draft Isolation Tests', async (t) => {
  await t.test('1. Creating a new frame option creates a draft and does NOT mutate published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const initialPubCount = repo.getPublishedDataset().frames.length;

    assert.equal(repo.hasDraft(), false, 'Should start with no active draft');

    const newFrame: FrameSchema = {
      id: 'frame-test-custom-01',
      name: 'Rangka Besi H-Beam / WF Heavy Structural',
      specification: 'Rangka besi WF 150x75 untuk konstruksi bentangan lebar tanpa tiang tengah',
      pricingRule: {
        id: 'pr-frame-test-01',
        targetComponent: 'frame',
        model: 'per_m2',
        rate: 320000,
        unitLabel: 'm²',
      },
      source: 'owner',
      status: 'active',
    };

    repo.saveFrame(newFrame, 'TestOwner');

    assert.equal(repo.hasDraft(), true, 'Draft must be auto-created on frame edit');
    assert.equal(
      repo.getPublishedDataset().frames.length,
      initialPubCount,
      'Published dataset must remain untouched before publishing'
    );
    assert.equal(
      repo.getFrames().length,
      initialPubCount + 1,
      'Working frames dataset should contain newly added frame option'
    );

    const savedInWorking = repo.getFrameById('frame-test-custom-01');
    assert.ok(savedInWorking, 'Saved frame option must exist in working dataset');
    assert.equal(savedInWorking?.pricingRule.rate, 320000);
  });

  await t.test('2. Updating an existing frame option updates draft and leaves published dataset unchanged', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const publishedFrame = repo.getPublishedDataset().frames[0];
    const initialRate = publishedFrame.pricingRule.rate;
    const updatedRate = initialRate + 30000;

    const updatedFrame: FrameSchema = {
      ...publishedFrame,
      pricingRule: {
        ...publishedFrame.pricingRule,
        rate: updatedRate,
      },
    };

    repo.saveFrame(updatedFrame, 'TestOwner');

    const pubAfterEdit = repo.getPublishedDataset().frames.find((f) => f.id === publishedFrame.id);
    assert.equal(
      pubAfterEdit?.pricingRule.rate,
      initialRate,
      'Published frame rate must remain unchanged before publishing'
    );

    const workingAfterEdit = repo.getFrameById(publishedFrame.id);
    assert.equal(
      workingAfterEdit?.pricingRule.rate,
      updatedRate,
      'Working frame rate must reflect edited rate'
    );
  });

  await t.test('3. Toggling frame status toggles status in draft dataset and records audit log', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const targetFrame = repo.getPublishedDataset().frames[0];
    const initialStatus = targetFrame.status;

    repo.toggleFrameStatus(targetFrame.id, 'TestOwner');

    const pubAfterToggle = repo.getPublishedDataset().frames.find((f) => f.id === targetFrame.id);
    assert.equal(
      pubAfterToggle?.status,
      initialStatus,
      'Published dataset status must remain immutable'
    );

    const workingAfterToggle = repo.getFrameById(targetFrame.id);
    const expectedStatus = initialStatus === 'active' ? 'placeholder' : 'active';
    assert.equal(
      workingAfterToggle?.status,
      expectedStatus,
      'Working dataset status must toggle correctly'
    );

    const logs = repo.getAuditLogs();
    const toggleLog = logs.find((l) => l.action === 'TOGGLE_FRAME_STATUS');
    assert.ok(toggleLog, 'Audit log must record TOGGLE_FRAME_STATUS action');
  });

  await t.test('4. Service allowedFrameIds relation remains stable when frames are added or updated', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const service = repo.getServices()[0];
    const initialFrameCount = service.allowedFrameIds.length;

    const newFrame: FrameSchema = {
      id: 'frame-test-custom-02',
      name: 'Baja Ringan C75 Super Taso',
      specification: 'Rangka baja ringan C75.75 tebal 0.75mmSNI',
      pricingRule: {
        id: 'pr-frame-test-02',
        targetComponent: 'frame',
        model: 'per_m2',
        rate: 140000,
        unitLabel: 'm²',
      },
      source: 'owner',
      status: 'active',
    };

    repo.saveFrame(newFrame, 'TestOwner');

    const updatedService = {
      ...service,
      allowedFrameIds: [...service.allowedFrameIds, newFrame.id],
    };

    repo.saveService(updatedService, 'TestOwner');

    const workingSvc = repo.getServiceById(service.id);
    assert.equal(workingSvc?.allowedFrameIds.length, initialFrameCount + 1);
    assert.ok(workingSvc?.allowedFrameIds.includes('frame-test-custom-02'));
  });

  await t.test('5. Publishing draft promotes frame option changes to published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const targetFrame = repo.getFrames()[0];

    repo.saveFrame(
      {
        ...targetFrame,
        name: 'Hollow Galvanis 40x40 Super Heavy Published',
        pricingRule: { ...targetFrame.pricingRule, rate: 210000 },
      },
      'PublisherUser'
    );

    assert.notEqual(
      repo.getPublishedDataset().frames[0].name,
      'Hollow Galvanis 40x40 Super Heavy Published',
      'Published dataset should not update before publish'
    );

    repo.publishDraft('PublisherUser');

    assert.equal(repo.hasDraft(), false, 'Draft must be cleared after publishing');
    assert.equal(
      repo.getPublishedDataset().frames[0].name,
      'Hollow Galvanis 40x40 Super Heavy Published',
      'Published dataset must reflect updated frame name after publishing'
    );
    assert.equal(
      repo.getPublishedDataset().frames[0].pricingRule.rate,
      210000,
      'Published dataset rate must reflect updated rate after publishing'
    );
  });
});
