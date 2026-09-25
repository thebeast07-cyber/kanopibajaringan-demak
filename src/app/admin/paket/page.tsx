'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { PackageSchema, ServiceSchema } from '../../../types/domain';
import {
  AdminBadge,
  AdminButton,
  AdminTable,
  Column,
} from '../../../components/admin/ui';
import {
  MasterDataHeader,
  MasterDataFilter,
  MasterDataModal,
  MasterDataConfirmDialog,
  StatusFilterOption,
} from '../../../components/admin/master-data';
import { Edit3, Power, Package as PackageIcon, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface PackageFormState {
  id?: string;
  name: string;
  description: string;
  serviceId: string;
  price: number;
  includedItems: string[];
  status: 'active' | 'placeholder';
}

export default function AdminPaketPage() {
  const [packages, setPackages] = useState<PackageSchema[]>([]);
  const [services, setServices] = useState<ServiceSchema[]>([]);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [activeVersion, setActiveVersion] = useState<string>('v1.0.0');

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PackageFormState | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirm Toggle State
  const [toggleTarget, setToggleTarget] = useState<PackageSchema | null>(null);

  useEffect(() => {
    const update = () => {
      setPackages(defaultCmsRepository.getPackages());
      setServices(defaultCmsRepository.getServices());
      setHasDraft(defaultCmsRepository.hasDraft());
      setActiveVersion(defaultCmsRepository.getActiveVersion());
    };

    update();
    return defaultCmsRepository.subscribe(update);
  }, []);

  // Map service ID to service title
  const serviceMap = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((s) => map.set(s.id, s.title));
    return map;
  }, [services]);

  // Filter Logic
  const filteredPackages = useMemo(() => {
    return packages.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.includedItems.some((inc) => inc.toLowerCase().includes(searchQuery.toLowerCase()));

      const isActive = item.status === 'active';
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [packages, searchQuery, statusFilter]);

  const activeCount = useMemo(
    () => packages.filter((p) => p.status === 'active').length,
    [packages]
  );
  const inactiveCount = useMemo(
    () => packages.filter((p) => p.status !== 'active').length,
    [packages]
  );

  // Form Handlers
  const handleOpenCreate = () => {
    const defaultServiceId = services.length > 0 ? services[0].id : '';
    setEditingItem({
      name: '',
      description: '',
      serviceId: defaultServiceId,
      price: 500000,
      includedItems: ['Pemasangan Standard (Termasuk)', 'Garansi Kebocoran 6 Bulan'],
      status: 'active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PackageSchema) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      description: item.description,
      serviceId: item.serviceId,
      price: item.price,
      includedItems: [...item.includedItems],
      status: item.status,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const errors: Record<string, string> = {};

    if (!editingItem.name.trim()) {
      errors.name = 'Nama paket wajib diisi.';
    }
    if (!editingItem.serviceId) {
      errors.serviceId = 'Layanan terkait wajib dipilih.';
    }
    if (editingItem.price < 0) {
      errors.price = 'Harga paket tidak boleh negatif.';
    }
    const cleanItems = editingItem.includedItems.filter((i) => i.trim().length > 0);
    if (cleanItems.length === 0) {
      errors.includedItems = 'Minimal 1 isi paket wajib diisi.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload: PackageSchema = {
      id: editingItem.id || `pkg-${Date.now()}`,
      name: editingItem.name.trim(),
      description: editingItem.description.trim(),
      serviceId: editingItem.serviceId,
      price: Number(editingItem.price),
      includedItems: cleanItems,
      source: 'owner',
      status: editingItem.status,
    };

    defaultCmsRepository.savePackage(payload, 'Owner');
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleConfirmToggle = () => {
    if (!toggleTarget) return;
    defaultCmsRepository.togglePackageStatus(toggleTarget.id, 'Owner');
    setToggleTarget(null);
  };

  // Dynamic Included Items Form Operations
  const handleItemChange = (index: number, value: string) => {
    if (!editingItem) return;
    const nextItems = [...editingItem.includedItems];
    nextItems[index] = value;
    setEditingItem({ ...editingItem, includedItems: nextItems });
  };

  const handleAddItem = () => {
    if (!editingItem) return;
    setEditingItem({
      ...editingItem,
      includedItems: [...editingItem.includedItems, ''],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!editingItem) return;
    const nextItems = editingItem.includedItems.filter((_, i) => i !== index);
    setEditingItem({ ...editingItem, includedItems: nextItems });
  };

  // Table Columns
  const columns: Column<PackageSchema>[] = [
    {
      header: 'Nama Paket',
      accessor: (item: PackageSchema) => (
        <div>
          <div className="font-semibold text-slate-900">{item.name}</div>
          <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</div>
        </div>
      ),
    },
    {
      header: 'Layanan',
      accessor: (item: PackageSchema) => {
        const serviceName = serviceMap.get(item.serviceId);
        if (serviceName) {
          return <span className="text-sm font-medium text-slate-700">{serviceName}</span>;
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Layanan terkait tidak ditemukan
          </span>
        );
      },
    },
    {
      header: 'Isi Paket',
      accessor: (item: PackageSchema) => (
        <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5 max-w-xs">
          {item.includedItems.map((inc: string, idx: number) => (
            <li key={idx} className="truncate">
              {inc}
            </li>
          ))}
        </ul>
      ),
    },
    {
      header: 'Harga Paket',
      accessor: (item: PackageSchema) => (
        <span className="text-sm font-bold text-slate-900">
          Rp {item.price.toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (item: PackageSchema) => (
        <AdminBadge variant={item.status === 'active' ? 'success' : 'default'}>
          {item.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
        </AdminBadge>
      ),
    },
    {
      header: 'Aksi',
      className: 'text-right',
      accessor: (item: PackageSchema) => (
        <div className="flex items-center justify-end gap-1.5">
          <AdminButton
            size="sm"
            variant="ghost"
            onClick={() => handleOpenEdit(item)}
            title="Edit Paket"
          >
            <Edit3 className="w-4 h-4 text-slate-600" />
          </AdminButton>
          <AdminButton
            size="sm"
            variant="ghost"
            onClick={() => setToggleTarget(item)}
            title={item.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
          >
            <Power
              className={`w-4 h-4 ${
                item.status === 'active' ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />
          </AdminButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <MasterDataHeader
        title="Paket"
        description="Kelola paket pekerjaan dan isi layanan yang ditawarkan."
        totalCount={packages.length}
        hasDraft={hasDraft}
        activeVersion={activeVersion}
        actionLabel="+ Tambah Paket"
        onAction={handleOpenCreate}
      />

      <MasterDataFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari paket..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalCount={packages.length}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
      />

      <AdminTable
        columns={columns}
        data={filteredPackages}
        keyExtractor={(item) => item.id}
        emptyMessage={
          searchQuery || statusFilter !== 'all'
            ? 'Tidak ada paket pekerjaan yang memenuhi filter.'
            : 'Belum ada paket pekerjaan. Klik "+ Tambah Paket" untuk membuat paket baru.'
        }
      />

      {/* Modal Form */}
      <MasterDataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem?.id ? 'Edit Paket Pekerjaan' : 'Tambah Paket Pekerjaan Baru'}
        subtitle="Sesuaikan rincian paket, isi bundel layanan, dan harga penawaran."
        onSubmit={handleSaveSubmit}
        submitLabel={editingItem?.id ? 'Simpan Perubahan' : 'Buat Paket'}
      >
        {editingItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Paket <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="Contoh: Paket Kanopi Alderon Double Layer Standard"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formErrors.name && (
                <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Ringkas
              </label>
              <textarea
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                placeholder="Penjelasan keunggulan atau kecocokan paket ini..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Layanan Terkait <span className="text-red-500">*</span>
              </label>
              <select
                value={editingItem.serviceId}
                onChange={(e) => setEditingItem({ ...editingItem, serviceId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.title}
                  </option>
                ))}
              </select>
              {formErrors.serviceId && (
                <p className="text-xs text-red-500 mt-1">{formErrors.serviceId}</p>
              )}
              {!serviceMap.has(editingItem.serviceId) && editingItem.serviceId && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Layanan terkait tidak ditemukan di master data.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Isi Bundel Paket <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Tambah Item
                </button>
              </div>

              <div className="space-y-2">
                {editingItem.includedItems.map((itemStr, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={itemStr}
                      onChange={(e) => handleItemChange(idx, e.target.value)}
                      placeholder={`Item ke-${idx + 1}, misal: Atap Alderon Twinwall 10mm`}
                      className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {editingItem.includedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        title="Hapus Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {formErrors.includedItems && (
                <p className="text-xs text-red-500 mt-1">{formErrors.includedItems}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Paket (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step={5000}
                value={editingItem.price}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formErrors.price && (
                <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={editingItem.status}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    status: e.target.value as 'active' | 'placeholder',
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Aktif</option>
                <option value="placeholder">Tidak Aktif</option>
              </select>
            </div>
          </div>
        )}
      </MasterDataModal>

      {/* Confirm Dialog */}
      <MasterDataConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={
          toggleTarget?.status === 'active'
            ? 'Nonaktifkan Paket Pekerjaan?'
            : 'Aktifkan Paket Pekerjaan?'
        }
        description={
          toggleTarget?.status === 'active'
            ? `Paket "${toggleTarget.name}" tidak akan muncul dalam penawaran aktif draf.`
            : `Paket "${toggleTarget?.name}" akan diaktifkan dalam draf penawaran.`
        }
        confirmLabel={
          toggleTarget?.status === 'active' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'
        }
        variant={toggleTarget?.status === 'active' ? 'warning' : 'primary'}
      />
    </div>
  );
}
