import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalCmsRepository } from './localCmsRepository';
import { PackageSchema } from '../../types/domain';

test('STEP 4G — Package Master Data CRUD & Draft Isolation Tests', async (t) => {
  await t.test(
    '1. Creating a new package creates a draft and does NOT mutate published dataset',
    () => {
      const repo = new LocalCmsRepository();
      const initialPublishedPackages = repo.getPublishedDataset().packages || [];

      const newPackage: PackageSchema = {
        id: 'pkg-test-alderon-deluxe',
        name: 'Paket Alderon Deluxe Test',
        description: 'Paket super lengkap atap twinwall dan rangka tebal.',
        serviceId: 'svc-kanopi-alderon',
        price: 850000,
        includedItems: ['Atap Alderon Twinwall', 'Rangka Double Frame 50x100'],
        source: 'owner',
        status: 'active',
      };

      assert.equal(repo.hasDraft(), false);

      repo.savePackage(newPackage, 'TestOwner');

      assert.equal(repo.hasDraft(), true);

      // Draft must have the new package
      const workingPackages = repo.getPackages();
      const createdInDraft = workingPackages.find((p) => p.id === 'pkg-test-alderon-deluxe');
      assert.ok(createdInDraft);
      assert.equal(createdInDraft.name, 'Paket Alderon Deluxe Test');
      assert.equal(createdInDraft.price, 850000);
      assert.deepEqual(createdInDraft.includedItems, [
        'Atap Alderon Twinwall',
        'Rangka Double Frame 50x100',
      ]);

      // Published dataset must remain unchanged
      const currentPublished = repo.getPublishedDataset().packages || [];
      assert.equal(currentPublished.length, initialPublishedPackages.length);
      assert.equal(
        currentPublished.some((p) => p.id === 'pkg-test-alderon-deluxe'),
        false
      );
    }
  );

  await t.test(
    '2. Updating an existing package updates draft and leaves published dataset unchanged',
    () => {
      const repo = new LocalCmsRepository();
      const packages = repo.getPackages();
      assert.ok(packages.length > 0, 'Seed packages must be present');

      const target = packages[0];
      const originalPrice = target.price;

      const updatedPackage: PackageSchema = {
        ...target,
        name: `${target.name} (Updated)`,
        price: originalPrice + 100000,
        includedItems: [...target.includedItems, 'Bonus Garansi Extra 1 Tahun'],
      };

      repo.savePackage(updatedPackage, 'TestOwner');

      // Working package should reflect update
      const updatedInDraft = repo.getPackageById(target.id);
      assert.ok(updatedInDraft);
      assert.equal(updatedInDraft.name, `${target.name} (Updated)`);
      assert.equal(updatedInDraft.price, originalPrice + 100000);
      assert.ok(updatedInDraft.includedItems.includes('Bonus Garansi Extra 1 Tahun'));

      // Published package should remain unchanged
      const published = repo.getPublishedDataset().packages || [];
      const publishedOriginal = published.find((p) => p.id === target.id);
      assert.ok(publishedOriginal);
      assert.equal(publishedOriginal.price, originalPrice);
    }
  );

  await t.test(
    '3. Toggling package status toggles status in draft dataset and records audit log',
    () => {
      const repo = new LocalCmsRepository();
      const packages = repo.getPackages();
      const target = packages[0];
      const initialStatus = target.status;

      repo.togglePackageStatus(target.id, 'TestOwner');

      const updatedInDraft = repo.getPackageById(target.id);
      assert.ok(updatedInDraft);
      const expectedStatus = initialStatus === 'active' ? 'placeholder' : 'active';
      assert.equal(updatedInDraft.status, expectedStatus);

      // Audit log check
      const logs = repo.getAuditLogs();
      const toggleLog = logs.find(
        (l) => l.action === 'TOGGLE_PACKAGE_STATUS' && l.entityId === target.id
      );
      assert.ok(toggleLog);
      assert.equal(toggleLog.item, `Status Paket: ${target.name}`);
    }
  );

  await t.test(
    '4. Service relation (serviceId) remains stable when package is edited',
    () => {
      const repo = new LocalCmsRepository();
      const packages = repo.getPackages();
      const target = packages[0];

      const editedPackage: PackageSchema = {
        ...target,
        price: target.price + 50000,
      };

      repo.savePackage(editedPackage, 'TestOwner');

      const fetched = repo.getPackageById(target.id);
      assert.ok(fetched);
      assert.equal(fetched.serviceId, target.serviceId);
    }
  );

  await t.test(
    '5. Publishing draft promotes package changes to published dataset',
    () => {
      const repo = new LocalCmsRepository();

      const newPackage: PackageSchema = {
        id: 'pkg-to-publish',
        name: 'Paket Siap Publish',
        description: 'Paket baru yang akan dipublikasikan.',
        serviceId: 'svc-kanopi-alderon',
        price: 990000,
        includedItems: ['Item 1', 'Item 2'],
        source: 'owner',
        status: 'active',
      };

      repo.savePackage(newPackage, 'TestOwner');
      assert.equal(repo.hasDraft(), true);

      repo.publishDraft('TestOwner');
      assert.equal(repo.hasDraft(), false);

      const publishedPackages = repo.getPublishedDataset().packages || [];
      const publishedPackage = publishedPackages.find((p) => p.id === 'pkg-to-publish');
      assert.ok(publishedPackage);
      assert.equal(publishedPackage.name, 'Paket Siap Publish');
      assert.equal(publishedPackage.price, 990000);
    }
  );
});
