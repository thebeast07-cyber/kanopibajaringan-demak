import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalCmsRepository } from './localCmsRepository';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import { ServiceSchema } from '../../types/domain';

test('STEP 4B — Service Master Data CRUD & Draft Isolation Tests', async (t) => {
  await t.test('1. Creating a new service creates a draft and does NOT mutate published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const initialPubCount = repo.getPublishedDataset().services.length;

    assert.equal(repo.hasDraft(), false, 'Should start with no active draft');

    const newService: ServiceSchema = {
      id: 'svc-test-custom-01',
      slug: 'kanopi-balkon-minimalis',
      title: 'Kanopi Balkon Minimalis',
      shortDescription: 'Layanan pemasangan kanopi khusus balkon lantai dua',
      fullDescription: 'Kanopi lantai 2 menggunakan besi hollow heavy duty dan atap solarflat 3mm.',
      category: 'canopy',
      featured: true,
      measurementType: 'm2',
      pricingRules: [],
      minimumBilling: { minimumArea: 12 },
      allowedMaterialIds: ['mat-spandek-transparan-001'],
      allowedFrameIds: ['frame-hollow-galvanis-40x40'],
      allowedLaborIds: ['labor-standard-canopy'],
      allowedFinishingIds: ['finishing-cat-duco-black'],
      allowedAddOnIds: ['addon-lampu-led-strip'],
      allowedSiteConditionIds: [],
      durationRanges: [{ minUnits: 0, maxUnits: null, minDays: 4, maxDays: 8 }],
      source: 'owner',
      status: 'active',
    };

    repo.saveService(newService, 'TestOwner');

    assert.equal(repo.hasDraft(), true, 'Draft must be auto-created on service edit');
    assert.equal(
      repo.getPublishedDataset().services.length,
      initialPubCount,
      'Published dataset must remain untouched before publishing'
    );
    assert.equal(
      repo.getServices().length,
      initialPubCount + 1,
      'Working services dataset should contain the newly added service'
    );

    const savedInWorking = repo.getServiceById('svc-test-custom-01');
    assert.ok(savedInWorking, 'Saved service must exist in working dataset');
    assert.equal(savedInWorking?.title, 'Kanopi Balkon Minimalis');
    assert.deepEqual(savedInWorking?.allowedMaterialIds, ['mat-spandek-transparan-001']);
  });

  await t.test('2. Updating an existing service preserves relation IDs and leaves published dataset unchanged', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const publishedService = repo.getPublishedDataset().services[0];
    const initialTitle = publishedService.title;

    const updatedService: ServiceSchema = {
      ...publishedService,
      title: 'Kanopi Alderon Twinwall Heavy Duty (Edited)',
      allowedMaterialIds: ['mat-alderon-twinwall-001', 'mat-spandek-001'],
    };

    repo.saveService(updatedService, 'TestOwner');

    const pubAfterEdit = repo.getPublishedDataset().services.find((s) => s.id === publishedService.id);
    assert.equal(
      pubAfterEdit?.title,
      initialTitle,
      'Published service title must remain unchanged before publishing'
    );

    const workingAfterEdit = repo.getServiceById(publishedService.id);
    assert.equal(
      workingAfterEdit?.title,
      'Kanopi Alderon Twinwall Heavy Duty (Edited)',
      'Working service title must reflect edited title'
    );
    assert.deepEqual(
      workingAfterEdit?.allowedMaterialIds,
      ['mat-alderon-twinwall-001', 'mat-spandek-001'],
      'Relation IDs must be preserved in draft dataset'
    );
  });

  await t.test('3. Toggling service status toggles status in draft dataset and records audit log', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const targetService = repo.getPublishedDataset().services[0];
    const initialStatus = targetService.status;

    repo.toggleServiceStatus(targetService.id, 'TestOwner');

    const pubAfterToggle = repo.getPublishedDataset().services.find((s) => s.id === targetService.id);
    assert.equal(
      pubAfterToggle?.status,
      initialStatus,
      'Published dataset status must remain immutable'
    );

    const workingAfterToggle = repo.getServiceById(targetService.id);
    const expectedStatus = initialStatus === 'active' ? 'placeholder' : 'active';
    assert.equal(
      workingAfterToggle?.status,
      expectedStatus,
      'Working dataset status must toggle correctly'
    );

    const logs = repo.getAuditLogs();
    const toggleLog = logs.find((l) => l.action === 'TOGGLE_SERVICE_STATUS');
    assert.ok(toggleLog, 'Audit log must record TOGGLE_SERVICE_STATUS action');
    assert.equal(toggleLog?.affectedServiceId, targetService.id);
  });

  await t.test('4. Publishing draft promotes service changes to published dataset', () => {
    const repo = new LocalCmsRepository(COMPREHENSIVE_DATASET);
    const targetService = repo.getServices()[0];

    repo.saveService(
      {
        ...targetService,
        title: 'Kanopi Premium Published Version',
      },
      'PublisherUser'
    );

    assert.notEqual(
      repo.getPublishedDataset().services[0].title,
      'Kanopi Premium Published Version',
      'Published dataset should not update before publish'
    );

    repo.publishDraft('PublisherUser');

    assert.equal(repo.hasDraft(), false, 'Draft must be cleared after publishing');
    assert.equal(
      repo.getPublishedDataset().services[0].title,
      'Kanopi Premium Published Version',
      'Published dataset must reflect updated title after publishing'
    );
  });
});
