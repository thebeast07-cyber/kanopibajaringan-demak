'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { FinishingSchema } from '../../../types/domain';
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
import { Edit3, Power, Paintbrush } from 'lucide-react';

interface FinishingFormState {
  id?: string;
  name: string;
  description: string;
  rate: number;
  unitLabel: string;
  status: 'active' | 'placeholder';
}

const UNIT_LABEL_OPTIONS = [
  { value: 'm²', label: 'Per m² (Luas Pekerjaan)' },
  { value: 'meter', label: 'Per Meter Lari' },
  { value: 'unit', label: 'Per Unit / Pcs' },
  { value: 'paket', label: 'Per Paket Borongan' },
];

export default function AdminFinishingPage() {
  const [finishings, setFinishings] = useState<FinishingSchema[]>([]);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [activeVersion, setActiveVersion] = useState<string>('v1.0.0');

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinishingFormState | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirm Toggle State
  const [toggleTarget, setToggleTarget] = useState<FinishingSchema | null>(null);

  useEffect(() => {
    const update = () => {
      setFinishings(defaultCmsRepository.getFinishings());
      setHasDraft(defaultCmsRepository.hasDraft());
      setActiveVersion(defaultCmsRepository.getActiveVersion());
    };

    update();
    return defaultCmsRepository.subscribe(update);
  }, []);

  // Filter Logic
  const filteredFinishings = useMemo(() => {
    return finishings.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const isActive = item.status === 'active';
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [finishings, searchQuery, statusFilter]);

  const activeCount = useMemo(
    () => finishings.filter((f) => f.status === 'active').length,
    [finishings]
  );
  const inactiveCount = useMemo(
    () => finishings.filter((f) => f.status !== 'active').length,
    [finishings]
  );

  // Form Handlers
  const handleOpenCreate = () => {
    setEditingItem({
      name: '',
      description: '',
      rate: 35000,
      unitLabel: 'm²',
      status: 'active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fn: FinishingSchema) => {
    setEditingItem({
      id: fn.id,
      name: fn.name,
      description: fn.description || '',
      rate: fn.pricingRule?.rate || 0,
      unitLabel: fn.pricingRule?.unitLabel || 'm²',
      status: fn.status,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (form: FinishingFormState) => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Nama finishing wajib diisi.';
    if (form.rate < 0) errors.rate = 'Biaya finishing tidak boleh kurang dari 0.';
    return errors;
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const errors = validateForm(editingItem);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const finishingData: FinishingSchema = {
      id: editingItem.id || `fn-custom-${Date.now()}`,
      name: editingItem.name.trim(),
      description: editingItem.description.trim(),
      pricingRule: {
        id: `pr-${editingItem.id || Date.now()}`,
        targetComponent: 'finishing',
        model: 'per_m2',
        rate: Number(editingItem.rate),
        unitLabel: editingItem.unitLabel || 'm²',
        description: `Biaya finishing per ${editingItem.unitLabel || 'm²'}`,
      },
      source: 'owner',
      status: editingItem.status,
    };

    defaultCmsRepository.saveFinishing(finishingData, 'Owner');
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleConfirmToggle = () => {
    if (!toggleTarget) return;
    defaultCmsRepository.toggleFinishingStatus(toggleTarget.id, 'Owner');
    setToggleTarget(null);
  };

  // Table Columns
  const columns: Column<FinishingSchema>[] = [
    {
      header: 'Nama Finishing & Deskripsi',
      accessor: (row) => (
        <div className="space-y-1 py-1">
          <div className="font-bold text-slate-900 text-sm">{row.name}</div>
          <div className="text-xs text-slate-500 max-w-md line-clamp-2">{row.description}</div>
        </div>
      ),
    },
    {
      header: 'Basis Satuan',
      accessor: (row) => (
        <AdminBadge variant="default" size="sm">
          {row.pricingRule?.unitLabel || 'm²'}
        </AdminBadge>
      ),
    },
    {
      header: 'Biaya Finishing',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm">
            Rp {row.pricingRule?.rate?.toLocaleString('id-ID') || 0}
          </span>
          <span className="text-xs text-slate-500 font-medium"> / {row.pricingRule?.unitLabel || 'm²'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <AdminBadge variant={row.status === 'active' ? 'success' : 'default'}>
          {row.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
        </AdminBadge>
      ),
    },
    {
      header: 'Aksi',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <AdminButton
            size="sm"
            variant="outline"
            onClick={() => handleOpenEdit(row)}
            icon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Edit
          </AdminButton>
          <AdminButton
            size="sm"
            variant={row.status === 'active' ? 'ghost' : 'secondary'}
            onClick={() => setToggleTarget(row)}
            icon={<Power className="w-3.5 h-3.5" />}
          >
            {row.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
          </AdminButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <MasterDataHeader
        title="Finishing & Cat"
        description="Kelola pilihan finishing, opsi pengecatan duco, zinc chromate, dan coating yang tersedia untuk layanan."
        totalCount={finishings.length}
        hasDraft={hasDraft}
        activeVersion={activeVersion}
        helpHref="/admin/panduan#s7-finishing"
        helpLabel="Panduan Finishing"
        actionLabel="Tambah Finishing"
        onAction={handleOpenCreate}
      />

      {/* Filter Bar */}
      <MasterDataFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchPlaceholder="Cari nama finishing atau deskripsi..."
        totalCount={finishings.length}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
      />

      {/* Main Table */}
      <AdminTable
        columns={columns}
        data={filteredFinishings}
        keyExtractor={(row) => row.id}
        emptyMessage="Tidak ada opsi finishing yang sesuai dengan pencarian atau filter Anda."
      />

      {/* Create / Edit Modal Form */}
      {editingItem && (
        <MasterDataModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem.id ? `Edit Finishing: ${editingItem.name}` : 'Tambah Finishing Baru'}
          subtitle="Isi rincian biaya finishing atau cat untuk digunakan dalam perhitungan estimator"
          onSubmit={handleSubmitForm}
          submitLabel={editingItem.id ? 'Simpan Perubahan' : 'Tambah Finishing'}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Opsi Finishing <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="Misal: Cat Duco Black Matte Automotive Grade"
                className={`w-full text-sm p-2.5 rounded-lg border ${
                  formErrors.name ? 'border-rose-300 ring-1 ring-rose-500' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-amber-500`}
              />
              {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Biaya Finishing (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={editingItem.rate}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, rate: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="35000"
                  className={`w-full text-sm font-bold text-emerald-700 p-2.5 rounded-lg border ${
                    formErrors.rate ? 'border-rose-300 ring-1 ring-rose-500' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
                {formErrors.rate && <p className="text-xs text-rose-600 mt-1">{formErrors.rate}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Basis Satuan</label>
                <select
                  value={editingItem.unitLabel}
                  onChange={(e) => setEditingItem({ ...editingItem, unitLabel: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {UNIT_LABEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Deskripsi Finishing</label>
              <textarea
                rows={3}
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                placeholder="Penjelasan teknik pengecatan, pelapisan epoxy anti karat, dan keawetan..."
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Finishing</label>
              <select
                value={editingItem.status}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    status: e.target.value as 'active' | 'placeholder',
                  })
                }
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="active">Aktif (Dapat dipilih di estimator)</option>
                <option value="placeholder">Tidak Aktif (Disembunyikan)</option>
              </select>
            </div>
          </div>
        </MasterDataModal>
      )}

      {/* Confirmation Dialog */}
      <MasterDataConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={
          toggleTarget?.status === 'active'
            ? `Nonaktifkan ${toggleTarget?.name}?`
            : `Aktifkan ${toggleTarget?.name}?`
        }
        description={
          toggleTarget?.status === 'active'
            ? 'Opsi finishing ini akan disembunyikan dari pilihan estimator publik setelah draf diterbitkan.'
            : 'Opsi finishing ini akan kembali tersedia dalam pilihan estimator publik setelah draf diterbitkan.'
        }
        confirmLabel={toggleTarget?.status === 'active' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
      />
    </div>
  );
}
