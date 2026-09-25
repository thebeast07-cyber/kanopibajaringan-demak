'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import { MaterialSchema } from '../../../types/domain';
import {
  AdminBadge,
  AdminButton,
  AdminTable,
  Column,
  AdminCard,
} from '../../../components/admin/ui';
import {
  MasterDataHeader,
  MasterDataFilter,
  MasterDataModal,
  MasterDataConfirmDialog,
  StatusFilterOption,
} from '../../../components/admin/master-data';
import { Edit3, Power, Layers, Check, ShieldCheck } from 'lucide-react';

interface MaterialFormState {
  id?: string;
  name: string;
  category: string;
  specification: string;
  rate: number;
  unitLabel: string;
  warrantyInfo: string;
  status: 'active' | 'placeholder';
}

const CATEGORY_OPTIONS = [
  'Spandek / Trimdek',
  'Alderon / UPVC',
  'Polycarbonate',
  'Solartuff / Solarflat',
  'Genteng Metal',
  'Plafon PVC',
  'Lainnya',
];

export default function AdminBahanPage() {
  const [materials, setMaterials] = useState<MaterialSchema[]>([]);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [activeVersion, setActiveVersion] = useState<string>('v1.0.0');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialFormState | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirmation dialog state
  const [toggleTarget, setToggleTarget] = useState<MaterialSchema | null>(null);

  useEffect(() => {
    const update = () => {
      setMaterials(defaultCmsRepository.getMaterials());
      setHasDraft(defaultCmsRepository.hasDraft());
      setActiveVersion(defaultCmsRepository.getActiveVersion());
    };

    update();
    return defaultCmsRepository.subscribe(update);
  }, []);

  // Filter logic
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specification.toLowerCase().includes(searchQuery.toLowerCase());

      const isItemActive = item.status === 'active';
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isItemActive) ||
        (statusFilter === 'inactive' && !isItemActive);

      return matchesSearch && matchesStatus;
    });
  }, [materials, searchQuery, statusFilter]);

  const activeCount = useMemo(
    () => materials.filter((m) => m.status === 'active').length,
    [materials]
  );
  const inactiveCount = useMemo(
    () => materials.filter((m) => m.status !== 'active').length,
    [materials]
  );

  // Form Handlers
  const handleOpenCreate = () => {
    setEditingItem({
      name: '',
      category: CATEGORY_OPTIONS[0],
      specification: '',
      rate: 150000,
      unitLabel: 'm²',
      warrantyInfo: '',
      status: 'active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mat: MaterialSchema) => {
    setEditingItem({
      id: mat.id,
      name: mat.name,
      category: mat.category,
      specification: mat.specification,
      rate: mat.pricingRule?.rate || 0,
      unitLabel: mat.pricingRule?.unitLabel || 'm²',
      warrantyInfo: mat.warrantyInfo || '',
      status: mat.status,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (form: MaterialFormState) => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Nama bahan wajib diisi.';
    if (form.rate < 0) errors.rate = 'Harga tidak boleh kurang dari 0.';
    if (!form.category.trim()) errors.category = 'Kategori wajib dipilih.';
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

    const materialData: MaterialSchema = {
      id: editingItem.id || `mat-custom-${Date.now()}`,
      name: editingItem.name.trim(),
      category: editingItem.category.trim(),
      specification: editingItem.specification.trim(),
      pricingRule: {
        id: `pr-${editingItem.id || Date.now()}`,
        targetComponent: 'material',
        model: 'per_m2',
        rate: Number(editingItem.rate),
        unitLabel: editingItem.unitLabel || 'm²',
        description: `Harga per ${editingItem.unitLabel || 'm²'}`,
      },
      warrantyInfo: editingItem.warrantyInfo.trim() || undefined,
      source: 'owner',
      status: editingItem.status,
    };

    defaultCmsRepository.saveMaterial(materialData, 'Owner');
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Status Toggle Handler
  const handleConfirmToggle = () => {
    if (!toggleTarget) return;
    defaultCmsRepository.toggleMaterialStatus(toggleTarget.id, 'Owner');
    setToggleTarget(null);
  };

  // Table Columns Definition
  const columns: Column<MaterialSchema>[] = [
    {
      header: 'Nama & Spesifikasi Bahan',
      accessor: (row) => (
        <div className="space-y-1 py-1">
          <div className="font-bold text-slate-900 text-sm">{row.name}</div>
          <div className="text-xs text-slate-500 max-w-md line-clamp-1">{row.specification}</div>
          {row.warrantyInfo && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
              <ShieldCheck className="w-3 h-3 text-amber-600" />
              <span>{row.warrantyInfo}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Kategori',
      accessor: (row) => (
        <AdminBadge variant="default" size="sm">
          {row.category}
        </AdminBadge>
      ),
    },
    {
      header: 'Harga Satuan',
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
        title="Bahan & Material Penutup"
        description="Kelola bahan penutup atap yang digunakan dalam kalkulasi estimasi (misal: Spandek, Alderon, Polycarbonate)."
        totalCount={materials.length}
        hasDraft={hasDraft}
        activeVersion={activeVersion}
        helpHref="/admin/panduan#s4-bahan"
        helpLabel="Panduan Bahan"
        actionLabel="Tambah Bahan"
        onAction={handleOpenCreate}
      />

      {/* Filter Bar */}
      <MasterDataFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchPlaceholder="Cari nama bahan, kategori, atau spesifikasi..."
        totalCount={materials.length}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
      />

      {/* Main Table */}
      <AdminTable
        columns={columns}
        data={filteredMaterials}
        keyExtractor={(row) => row.id}
        emptyMessage="Tidak ada bahan yang sesuai dengan pencarian atau filter Anda."
      />

      {/* Create / Edit Modal Form */}
      {editingItem && (
        <MasterDataModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem.id ? `Edit Bahan: ${editingItem.name}` : 'Tambah Bahan Baru'}
          subtitle="Isi rincian bahan penutup atap untuk digunakan dalam perhitungan estimator"
          onSubmit={handleSubmitForm}
          submitLabel={editingItem.id ? 'Simpan Perubahan' : 'Tambah Bahan'}
        >
          {/* Form Fields */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Bahan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="Misal: Spandek Transparan 0.8mm"
                className={`w-full text-sm p-2.5 rounded-lg border ${
                  formErrors.name ? 'border-rose-300 ring-1 ring-rose-500' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-amber-500`}
              />
              {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Harga per Satuan (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={editingItem.rate}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, rate: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="150000"
                  className={`w-full text-sm font-bold text-emerald-700 p-2.5 rounded-lg border ${
                    formErrors.rate ? 'border-rose-300 ring-1 ring-rose-500' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
                {formErrors.rate && <p className="text-xs text-rose-600 mt-1">{formErrors.rate}</p>}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Spesifikasi & Keterangan</label>
              <textarea
                rows={2}
                value={editingItem.specification}
                onChange={(e) => setEditingItem({ ...editingItem, specification: e.target.value })}
                placeholder="Misal: Spandek gelombang 0.35mm bahan galvalum anti karat"
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Garansi / Catatan Khusus</label>
              <input
                type="text"
                value={editingItem.warrantyInfo}
                onChange={(e) => setEditingItem({ ...editingItem, warrantyInfo: e.target.value })}
                placeholder="Misal: Garansi bocor 5 tahun"
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Bahan</label>
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
                <option value="placeholder">Tidak Aktif (Disembunyikan dari estimator)</option>
              </select>
            </div>
          </div>
        </MasterDataModal>
      )}

      {/* Toggle Status Confirmation Dialog */}
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
            ? 'Bahan ini akan disembunyikan dari daftar pilihan estimator publik. Data draf perubahan akan diperbarui.'
            : 'Bahan ini akan kembali tersedia dalam daftar pilihan estimator publik setelah draf diterbitkan.'
        }
        confirmLabel={toggleTarget?.status === 'active' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
      />
    </div>
  );
}
