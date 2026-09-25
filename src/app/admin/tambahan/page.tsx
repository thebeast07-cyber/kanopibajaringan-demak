'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { AddOnSchema } from '../../../types/domain';
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
import { Edit3, Power, Tag, Filter } from 'lucide-react';

interface AddOnFormState {
  id?: string;
  name: string;
  category?: string;
  description: string;
  rate: number;
  unitLabel: string;
  status: 'active' | 'placeholder';
}

const UNIT_LABEL_OPTIONS = [
  { value: 'unit', label: 'Per Unit / Pcs / Item' },
  { value: 'm²', label: 'Per m² (Luas)' },
  { value: 'meter', label: 'Per Meter Lari' },
  { value: 'paket', label: 'Per Paket Borongan' },
  { value: 'titik', label: 'Per Titik Instalasi' },
];

export default function AdminTambahanPage() {
  const [addOns, setAddOns] = useState<AddOnSchema[]>([]);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [activeVersion, setActiveVersion] = useState<string>('v1.0.0');

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AddOnFormState | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirm Toggle State
  const [toggleTarget, setToggleTarget] = useState<AddOnSchema | null>(null);

  useEffect(() => {
    const update = () => {
      setAddOns(defaultCmsRepository.getAddOns());
      setHasDraft(defaultCmsRepository.hasDraft());
      setActiveVersion(defaultCmsRepository.getActiveVersion());
    };

    update();
    return defaultCmsRepository.subscribe(update);
  }, []);

  // Unique Categories dynamically derived from addOns data
  const availableCategories = useMemo(() => {
    const cats = addOns
      .map((item) => item.category)
      .filter((c): c is string => Boolean(c && c.trim().length > 0));
    return Array.from(new Set(cats)).sort();
  }, [addOns]);

  // Filter Logic
  const filteredAddOns = useMemo(() => {
    return addOns.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const isActive = item.status === 'active';
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive);

      const matchesCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'uncategorized' && (!item.category || item.category.trim() === '')) ||
        item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [addOns, searchQuery, statusFilter, categoryFilter]);

  const activeCount = useMemo(
    () => addOns.filter((a) => a.status === 'active').length,
    [addOns]
  );
  const inactiveCount = useMemo(
    () => addOns.filter((a) => a.status !== 'active').length,
    [addOns]
  );

  // Form Handlers
  const handleOpenCreate = () => {
    setEditingItem({
      name: '',
      category: '',
      description: '',
      rate: 150000,
      unitLabel: 'unit',
      status: 'active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addon: AddOnSchema) => {
    setEditingItem({
      id: addon.id,
      name: addon.name,
      category: addon.category || '',
      description: addon.description || '',
      rate: addon.pricingRule?.rate || 0,
      unitLabel: addon.pricingRule?.unitLabel || 'unit',
      status: addon.status,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (form: AddOnFormState) => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Nama opsi tambahan wajib diisi.';
    if (form.rate < 0) errors.rate = 'Harga tidak boleh kurang dari 0.';
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

    const addonData: AddOnSchema = {
      id: editingItem.id || `addon-custom-${Date.now()}`,
      name: editingItem.name.trim(),
      category: editingItem.category?.trim() || undefined,
      description: editingItem.description.trim(),
      pricingRule: {
        id: `pr-${editingItem.id || Date.now()}`,
        targetComponent: 'addon',
        model: 'fixed',
        rate: Number(editingItem.rate),
        unitLabel: editingItem.unitLabel || 'unit',
        description: `Tarif tambahan per ${editingItem.unitLabel || 'unit'}`,
      },
      source: 'owner',
      status: editingItem.status,
    };

    defaultCmsRepository.saveAddOn(addonData, 'Owner');
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleConfirmToggle = () => {
    if (!toggleTarget) return;
    defaultCmsRepository.toggleAddOnStatus(toggleTarget.id, 'Owner');
    setToggleTarget(null);
  };

  // Table Columns
  const columns: Column<AddOnSchema>[] = [
    {
      header: 'Nama Tambahan & Kategori',
      accessor: (row) => (
        <div className="space-y-1 py-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-xs sm:text-sm">{row.name}</span>
            {row.category && (
              <AdminBadge variant="amber" size="sm">
                <Tag className="w-2.5 h-2.5 inline mr-1" />
                {row.category}
              </AdminBadge>
            )}
          </div>
          <div className="text-xs text-slate-500 max-w-md line-clamp-2">{row.description}</div>
        </div>
      ),
    },
    {
      header: 'Basis Satuan',
      accessor: (row) => (
        <AdminBadge variant="default" size="sm">
          {row.pricingRule?.unitLabel || 'unit'}
        </AdminBadge>
      ),
    },
    {
      header: 'Harga Tambahan',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs sm:text-sm">
            Rp {row.pricingRule?.rate?.toLocaleString('id-ID') || 0}
          </span>
          <span className="text-xs text-slate-500 font-medium"> / {row.pricingRule?.unitLabel || 'unit'}</span>
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
        <div className="flex items-center gap-1.5 sm:gap-2">
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
    <div className="space-y-6 pb-12 w-full max-w-full">
      {/* Header */}
      <MasterDataHeader
        title="Biaya & Opsi Tambahan"
        description="Kelola pilihan tambahan dan fitur ekstra (misal: Aksesoris, Interior, Branding, Kelistrikan, Bongkar kanopi lama) yang dapat digunakan dalam layanan."
        totalCount={addOns.length}
        hasDraft={hasDraft}
        activeVersion={activeVersion}
        helpHref="/admin/panduan#s8-tambahan"
        helpLabel="Panduan Tambahan"
        actionLabel="Tambah Tambahan"
        onAction={handleOpenCreate}
      />

      {/* Filter Bar with Category Select Filter */}
      <div className="space-y-3">
        <MasterDataFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          searchPlaceholder="Cari nama tambahan, kategori, atau deskripsi..."
          totalCount={addOns.length}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
        />

        {/* Dynamic Category Filter Bar (Responsive for 320px+) */}
        {availableCategories.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold shrink-0">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>Filter Kategori:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  categoryFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Semua Kategori
              </button>

              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    categoryFilter === cat
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <button
                onClick={() => setCategoryFilter('uncategorized')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  categoryFilter === 'uncategorized'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Tanpa Kategori
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <AdminTable
        columns={columns}
        data={filteredAddOns}
        keyExtractor={(row) => row.id}
        emptyMessage="Tidak ada opsi tambahan yang sesuai dengan pencarian atau filter Anda."
      />

      {/* Create / Edit Modal Form (Responsive from 320px up) */}
      {editingItem && (
        <MasterDataModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem.id ? `Edit Tambahan: ${editingItem.name}` : 'Tambah Opsi Tambahan Baru'}
          subtitle="Isi rincian opsi tambahan atau fitur ekstra untuk digunakan dalam kalkulator estimator"
          onSubmit={handleSubmitForm}
          submitLabel={editingItem.id ? 'Simpan Perubahan' : 'Tambah Tambahan'}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Opsi Tambahan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="Misal: Lampu LED Strip Warm White In-Frame"
                className={`w-full text-xs sm:text-sm p-2.5 rounded-lg border ${
                  formErrors.name ? 'border-rose-300 ring-1 ring-rose-500' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-amber-500`}
              />
              {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kategori Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={editingItem.category || ''}
                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                placeholder="Misal: Aksesoris, Interior, Branding, Fitur Listrik"
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Isi kategori bebas untuk mengelompokkan opsi tambahan pada estimator publik (misal: Interior, Aksesoris, Branding).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Harga Tambahan (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={editingItem.rate}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, rate: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="150000"
                  className={`w-full text-xs sm:text-sm font-bold text-emerald-700 p-2.5 rounded-lg border ${
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
                  className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
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
              <label className="block font-semibold text-slate-700 mb-1">Deskripsi & Keterangan</label>
              <textarea
                rows={3}
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                placeholder="Penjelasan ringkas cakupan fitur tambahan..."
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Tambahan</label>
              <select
                value={editingItem.status}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    status: e.target.value as 'active' | 'placeholder',
                  })
                }
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
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
            ? 'Opsi tambahan ini akan disembunyikan dari pilihan estimator publik setelah draf diterbitkan.'
            : 'Opsi tambahan ini akan kembali tersedia dalam pilihan estimator publik setelah draf diterbitkan.'
        }
        confirmLabel={toggleTarget?.status === 'active' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
      />
    </div>
  );
}

