'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import {
  ServiceSchema,
  MeasurementType,
  MaterialSchema,
  FrameSchema,
  LaborOptionSchema,
  FinishingSchema,
  AddOnSchema,
} from '../../../types/domain';
import {
  AdminBadge,
  AdminButton,
  AdminTable,
  Column,
  AdminTabs,
  TabItem,
} from '../../../components/admin/ui';
import {
  MasterDataHeader,
  MasterDataFilter,
  MasterDataModal,
  MasterDataConfirmDialog,
  StatusFilterOption,
} from '../../../components/admin/master-data';
import { Edit3, Power, Wrench, Clock, CheckCircle2, ShieldCheck, Upload, Image as ImageIcon, Trash2, RefreshCw } from 'lucide-react';
import {
  validateImageFile,
  readImageAsDataUrl,
  getFallbackServiceImage,
} from '../../../lib/cms/mediaStorage';

const CATEGORY_OPTIONS = [
  { value: 'canopy', label: 'Kanopi Rumah' },
  { value: 'baja_ringan', label: 'Rangka Baja Ringan' },
  { value: 'gate', label: 'Pagar & Pintu Besi' },
  { value: 'railing', label: 'Railing Tangga / Balkon' },
  { value: 'tralis', label: 'Tralis Jendela' },
  { value: 'plafon', label: 'Plafon PVC / Gypsum' },
  { value: 'carport', label: 'Carport & Garasi' },
  { value: 'gerobak', label: 'Gerobak Usaha' },
  { value: 'booth', label: 'Booth Jualan' },
  { value: 'renovasi', label: 'Renovasi Atap' },
  { value: 'other', label: 'Lainnya' },
];

const MEASUREMENT_LABEL_MAP: Record<MeasurementType, { label: string; desc: string }> = {
  m2: { label: 'Per m² (Luas)', desc: 'Kalkulasi berdasarkan Panjang × Lebar' },
  meter: { label: 'Per Meter Lari', desc: 'Kalkulasi berdasarkan Panjang lari' },
  unit: { label: 'Per Unit / Pcs', desc: 'Kalkulasi harga satuan per unit' },
  package: { label: 'Paket Fixed', desc: 'Harga terikat tetap per paket' },
  dimensions: { label: '3D Dimensi (P×L×T)', desc: 'Kalkulasi volume kubikasi' },
  mixed: { label: 'Kalkulasi Campuran', desc: 'Kombinasi m², paket, dan unit' },
};

interface ServiceFormState {
  id?: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: ServiceSchema['category'];
  featured: boolean;
  measurementType: MeasurementType;
  minimumValue: number;
  minDays: number;
  maxDays: number;
  allowedMaterialIds: string[];
  allowedFrameIds: string[];
  allowedLaborIds: string[];
  allowedFinishingIds: string[];
  allowedAddOnIds: string[];
  imageUrl?: string;
  status: 'active' | 'placeholder';
}

export default function AdminLayananPage() {
  const [services, setServices] = useState<ServiceSchema[]>([]);
  const [materials, setMaterials] = useState<MaterialSchema[]>([]);
  const [frames, setFrames] = useState<FrameSchema[]>([]);
  const [laborOptions, setLaborOptions] = useState<LaborOptionSchema[]>([]);
  const [finishings, setFinishings] = useState<FinishingSchema[]>([]);
  const [addOns, setAddOns] = useState<AddOnSchema[]>([]);

  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [activeVersion, setActiveVersion] = useState<string>('v1.0.0');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<ServiceFormState | null>(null);
  const [formTab, setFormTab] = useState('info');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [imageValidationError, setImageValidationError] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Confirm Status Toggle
  const [toggleTarget, setToggleTarget] = useState<ServiceSchema | null>(null);

  useEffect(() => {
    const updateData = () => {
      const working = defaultCmsRepository.getWorkingDataset();
      setServices(working.services);
      setMaterials(working.materials || []);
      setFrames(working.frames || []);
      setLaborOptions(working.laborOptions || []);
      setFinishings(working.finishings || []);
      setAddOns(working.addOns || []);
      setHasDraft(defaultCmsRepository.hasDraft());
      setActiveVersion(defaultCmsRepository.getActiveVersion());
    };

    updateData();
    return defaultCmsRepository.subscribe(updateData);
  }, []);

  // Image Upload Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[DEBUG] handleFileChange triggered:', file?.name, file?.type, file?.size);
    if (!file || !formState) {
      console.log('[DEBUG] handleFileChange early return: no file or no formState');
      return;
    }
    const valResult = validateImageFile(file);
    if (!valResult.valid) {
      console.log('[DEBUG] validation failed:', valResult.error);
      setImageValidationError(valResult.error || 'File foto tidak valid.');
      return;
    }
    setImageValidationError('');
    try {
      const dataUrl = await readImageAsDataUrl(file);
      console.log('[DEBUG] dataUrl generated successfully, length:', dataUrl.length);
      setFormState((prev) => (prev ? { ...prev, imageUrl: dataUrl } : null));
    } catch (err) {
      console.log('[DEBUG] error reading image dataUrl:', err);
      setImageValidationError('Gagal membaca file foto.');
    }
  };

  const handleRemoveImage = () => {
    setImageValidationError('');
    setFormState((prev) => (prev ? { ...prev, imageUrl: '' } : null));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter Logic
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      const matchesSearch =
        svc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.category.toLowerCase().includes(searchQuery.toLowerCase());

      const isActive = svc.status === 'active';
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [services, searchQuery, statusFilter]);

  const activeCount = useMemo(() => services.filter((s) => s.status === 'active').length, [services]);
  const inactiveCount = useMemo(
    () => services.filter((s) => s.status !== 'active').length,
    [services]
  );

  // Handlers
  const handleOpenCreate = () => {
    setFormState({
      slug: `layanan-${Date.now()}`,
      title: '',
      shortDescription: '',
      fullDescription: '',
      category: 'canopy',
      featured: true,
      measurementType: 'm2',
      minimumValue: 10,
      minDays: 3,
      maxDays: 7,
      allowedMaterialIds: materials.map((m) => m.id),
      allowedFrameIds: frames.map((f) => f.id),
      allowedLaborIds: laborOptions.map((l) => l.id),
      allowedFinishingIds: finishings.map((fn) => fn.id),
      allowedAddOnIds: addOns.map((a) => a.id),
      imageUrl: undefined,
      status: 'active',
    });
    setFormTab('info');
    setFormErrors({});
    setImageValidationError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (svc: ServiceSchema) => {
    const minBillingVal =
      svc.minimumBilling?.minimumArea ||
      svc.minimumBilling?.minimumLength ||
      svc.minimumBilling?.minimumQuantity ||
      0;

    const minDays = svc.durationRanges?.[0]?.minDays || 3;
    const maxDays = svc.durationRanges?.[0]?.maxDays || 7;

    setFormState({
      id: svc.id,
      slug: svc.slug,
      title: svc.title,
      shortDescription: svc.shortDescription,
      fullDescription: svc.fullDescription,
      category: svc.category,
      featured: svc.featured,
      measurementType: svc.measurementType,
      minimumValue: minBillingVal,
      minDays,
      maxDays,
      allowedMaterialIds: [...(svc.allowedMaterialIds || [])],
      allowedFrameIds: [...(svc.allowedFrameIds || [])],
      allowedLaborIds: [...(svc.allowedLaborIds || [])],
      allowedFinishingIds: [...(svc.allowedFinishingIds || [])],
      allowedAddOnIds: [...(svc.allowedAddOnIds || [])],
      imageUrl: svc.imageUrl,
      status: svc.status,
    });
    setFormTab('info');
    setFormErrors({});
    setImageValidationError('');
    setIsModalOpen(true);
  };

  const validateForm = (form: ServiceFormState) => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'Nama layanan wajib diisi.';
    if (!form.shortDescription.trim()) errors.shortDescription = 'Deskripsi singkat wajib diisi.';
    return errors;
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] handleSubmitForm called with formState:', formState);
    if (!formState) return;

    const errors = validateForm(formState);
    if (Object.keys(errors).length > 0) {
      console.log('[DEBUG] validateForm errors:', errors);
      setFormErrors(errors);
      setFormTab('info');
      return;
    }

    const minBillingObj =
      formState.minimumValue > 0
        ? formState.measurementType === 'meter'
          ? { minimumLength: formState.minimumValue }
          : formState.measurementType === 'unit'
          ? { minimumQuantity: formState.minimumValue }
          : { minimumArea: formState.minimumValue }
        : undefined;

    const updatedService: ServiceSchema = {
      id: formState.id || `svc-${Date.now()}`,
      slug: formState.slug || formState.title.toLowerCase().replace(/\s+/g, '-'),
      title: formState.title.trim(),
      shortDescription: formState.shortDescription.trim(),
      fullDescription: formState.fullDescription.trim() || formState.shortDescription.trim(),
      category: formState.category,
      featured: formState.featured,
      measurementType: formState.measurementType,
      pricingRules: [],
      minimumBilling: minBillingObj,
      allowedMaterialIds: formState.allowedMaterialIds,
      allowedFrameIds: formState.allowedFrameIds,
      allowedLaborIds: formState.allowedLaborIds,
      allowedFinishingIds: formState.allowedFinishingIds,
      allowedAddOnIds: formState.allowedAddOnIds,
      allowedSiteConditionIds: [],
      durationRanges: [
        {
          minUnits: 0,
          maxUnits: null,
          minDays: Number(formState.minDays),
          maxDays: Number(formState.maxDays),
        },
      ],
      imageUrl: formState.imageUrl && formState.imageUrl.trim().length > 0 ? formState.imageUrl.trim() : undefined,
      source: 'owner',
      status: formState.status,
    };

    console.log('[DEBUG] Calling saveService with updatedService.imageUrl:', updatedService.imageUrl);
    defaultCmsRepository.saveService(updatedService, 'Owner');
    setIsModalOpen(false);
    setFormState(null);
  };

  const handleConfirmToggle = () => {
    if (!toggleTarget) return;
    defaultCmsRepository.toggleServiceStatus(toggleTarget.id, 'Owner');
    setToggleTarget(null);
  };

  const toggleArrayItem = (array: string[], itemId: string): string[] => {
    if (array.includes(itemId)) {
      return array.filter((id) => id !== itemId);
    }
    return [...array, itemId];
  };

  // Table Columns
  const columns: Column<ServiceSchema>[] = [
    {
      header: 'Nama & Deskripsi Layanan',
      accessor: (row) => (
        <div className="space-y-1 py-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">{row.title}</span>
            {row.featured && <AdminBadge variant="amber">Unggulan</AdminBadge>}
          </div>
          <div className="text-xs text-slate-500 max-w-md line-clamp-2">{row.shortDescription}</div>
        </div>
      ),
    },
    {
      header: 'Kategori',
      accessor: (row) => {
        const cat = CATEGORY_OPTIONS.find((c) => c.value === row.category);
        return <AdminBadge variant="default">{cat ? cat.label : row.category}</AdminBadge>;
      },
    },
    {
      header: 'Cara Ukur',
      accessor: (row) => {
        const meta = MEASUREMENT_LABEL_MAP[row.measurementType] || {
          label: row.measurementType,
          desc: '',
        };
        return (
          <div>
            <div className="font-semibold text-slate-800 text-xs">{meta.label}</div>
            <div className="text-[11px] text-slate-500">{meta.desc}</div>
          </div>
        );
      },
    },
    {
      header: 'Minimum & Waktu',
      accessor: (row) => {
        const minVal =
          row.minimumBilling?.minimumArea ||
          row.minimumBilling?.minimumLength ||
          row.minimumBilling?.minimumQuantity;

        const dur = row.durationRanges?.[0];
        const durText = dur ? `${dur.minDays}–${dur.maxDays} Hari` : 'Bervariasi';

        return (
          <div className="text-xs space-y-0.5">
            <div className="font-semibold text-slate-800">
              {minVal ? `Min: ${minVal} ${row.measurementType === 'meter' ? 'm' : 'm²'}` : 'Tanpa Minimum'}
            </div>
            <div className="text-slate-500 flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{durText}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Pilihan Terhubung',
      accessor: (row) => (
        <div className="flex flex-wrap gap-1 text-[10px]">
          <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
            {row.allowedMaterialIds?.length || 0} Bahan
          </span>
          <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
            {row.allowedFrameIds?.length || 0} Rangka
          </span>
          <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
            {row.allowedLaborIds?.length || 0} Upah
          </span>
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

  const modalTabs: TabItem[] = [
    { id: 'info', label: '1. Informasi Utama' },
    { id: 'measurement', label: '2. Cara Ukur & Waktu' },
    { id: 'materials', label: '3. Bahan & Rangka' },
    { id: 'other', label: '4. Upah & Finishing' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <MasterDataHeader
        title="Layanan & Produk Usaha"
        description="Kelola jenis pekerjaan yang tersedia dan pilihan bahan/upah yang terhubung."
        totalCount={services.length}
        hasDraft={hasDraft}
        activeVersion={activeVersion}
        actionLabel="Tambah Layanan"
        onAction={handleOpenCreate}
        helpHref="/admin/panduan#s2-data-produk"
        helpLabel="Panduan Produk"
      />

      {/* Filter Bar */}
      <MasterDataFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchPlaceholder="Cari nama layanan, deskripsi, atau kategori..."
        totalCount={services.length}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
      />

      {/* Main Table */}
      <AdminTable
        columns={columns}
        data={filteredServices}
        keyExtractor={(row) => row.id}
        emptyMessage="Tidak ada layanan yang sesuai dengan pencarian atau filter Anda."
      />

      {/* Sectioned Create / Edit Modal */}
      {formState && (
        <MasterDataModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={formState.id ? `Edit Layanan: ${formState.title}` : 'Tambah Layanan Baru'}
          subtitle="Atur informasi produk, cara ukur, dan pilihan material yang dapat dipilih pelanggan"
          onSubmit={handleSubmitForm}
          submitLabel={formState.id ? 'Simpan Perubahan' : 'Tambah Layanan'}
        >
          {/* Modal Tab Navigation */}
          <AdminTabs tabs={modalTabs} activeTab={formTab} onTabChange={setFormTab} className="mb-4" />

          {/* TAB 1: INFORMASI UTAMA */}
          {formTab === 'info' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Layanan / Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="Misal: Kanopi Minimalis Alderon"
                  className={`w-full text-sm p-2.5 rounded-lg border ${
                    formErrors.title ? 'border-rose-300 ring-1 ring-rose-500' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
                {formErrors.title && <p className="text-xs text-rose-600 mt-1">{formErrors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Produk</label>
                  <select
                    value={formState.category}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        category: e.target.value as ServiceSchema['category'],
                      })
                    }
                    className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Publikasi</label>
                  <select
                    value={formState.status}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        status: e.target.value as 'active' | 'placeholder',
                      })
                    }
                    className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="active">Aktif (Tampil di Website)</option>
                    <option value="placeholder">Tidak Aktif (Disembunyikan)</option>
                  </select>
                </div>
              </div>

              {/* Foto Katalog Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>Foto Katalog Produk</span>
                  </label>
                  {formState.imageUrl ? (
                    <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                      Foto Kustom Aktif
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                      Menggunakan Fallback Default
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-36 h-28 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 relative shrink-0">
                    <img
                      src={formState.imageUrl || getFallbackServiceImage(formState.slug)}
                      alt="Preview Foto Katalog"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      onInput={handleFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-2">
                      <AdminButton
                        type="button"
                        size="sm"
                        variant={formState.imageUrl ? 'outline' : 'primary'}
                        icon={formState.imageUrl ? <RefreshCw className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {formState.imageUrl ? 'Ganti Foto' : 'Upload Foto'}
                      </AdminButton>

                      {formState.imageUrl && (
                        <AdminButton
                          type="button"
                          size="sm"
                          variant="danger"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={handleRemoveImage}
                        >
                          Hapus Foto
                        </AdminButton>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Format didukung: JPG, PNG, WebP (Maksimal 5 MB).
                    </p>

                    {imageValidationError && (
                      <p className="text-xs text-rose-600 font-semibold">{imageValidationError}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi Singkat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.shortDescription}
                  onChange={(e) => setFormState({ ...formState, shortDescription: e.target.value })}
                  placeholder="Misal: Rangka hollow galvanis anti karat + atap UPVC Alderon twinwall."
                  className={`w-full text-sm p-2.5 rounded-lg border ${
                    formErrors.shortDescription
                      ? 'border-rose-300 ring-1 ring-rose-500'
                      : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
                {formErrors.shortDescription && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.shortDescription}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Lengkap Cakupan Pekerjaan</label>
                <textarea
                  rows={3}
                  value={formState.fullDescription}
                  onChange={(e) => setFormState({ ...formState, fullDescription: e.target.value })}
                  placeholder="Penjelasan lengkap garansi, spesifikasi teknis, dan keunggulan..."
                  className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={formState.featured}
                  onChange={(e) => setFormState({ ...formState, featured: e.target.checked })}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="featured-check" className="text-xs font-semibold text-slate-800">
                  Tampilkan sebagai Produk Unggulan di Halaman Utama Website
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: CARA UKUR & MINIMUM */}
          {formTab === 'measurement' && (
            <div className="space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode / Cara Ukur Utama</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {(Object.keys(MEASUREMENT_LABEL_MAP) as MeasurementType[]).map((key) => {
                    const item = MEASUREMENT_LABEL_MAP[key];
                    const isSelected = formState.measurementType === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setFormState({ ...formState, measurementType: key })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{item.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs">Minimum Perhitungan Pekerjaan</h4>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nilai Minimum (m² / Meter / Unit)
                  </label>
                  <input
                    type="number"
                    value={formState.minimumValue}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        minimumValue: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Jika ukuran pekerjaan dari pelanggan lebih kecil dari nilai minimum, perhitungan harga akan menggunakan batas minimum ini. Isi 0 jika tidak ada batas minimum.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Waktu Pengerjaan Minimum (Hari)</label>
                  <input
                    type="number"
                    value={formState.minDays}
                    onChange={(e) =>
                      setFormState({ ...formState, minDays: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Waktu Pengerjaan Maksimum (Hari)</label>
                  <input
                    type="number"
                    value={formState.maxDays}
                    onChange={(e) =>
                      setFormState({ ...formState, maxDays: parseInt(e.target.value, 10) || 7 })
                    }
                    className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BAHAN & RANGKA TERKAIT */}
          {formTab === 'materials' && (
            <div className="space-y-6 text-xs">
              {/* Materials checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Bahan Atap / Penutup yang Diizinkan</label>
                  <span className="text-[11px] text-slate-500">
                    {formState.allowedMaterialIds.length} Dipilih
                  </span>
                </div>
                {materials.length === 0 ? (
                  <p className="text-slate-500 italic">Belum ada bahan atap yang tersedia.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {materials.map((mat) => {
                      const isChecked = formState.allowedMaterialIds.includes(mat.id);
                      return (
                        <label
                          key={mat.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                            isChecked ? 'bg-amber-50 border-amber-300 font-semibold' : 'bg-white border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setFormState({
                                ...formState,
                                allowedMaterialIds: toggleArrayItem(
                                  formState.allowedMaterialIds,
                                  mat.id
                                ),
                              })
                            }
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                          />
                          <div className="truncate">
                            <div className="text-xs text-slate-900 truncate">{mat.name}</div>
                            <div className="text-[10px] text-slate-500">
                              Rp {mat.pricingRule?.rate?.toLocaleString('id-ID')} / {mat.pricingRule?.unitLabel || 'm²'}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Frames checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Opsi Rangka yang Diizinkan</label>
                  <span className="text-[11px] text-slate-500">
                    {formState.allowedFrameIds.length} Dipilih
                  </span>
                </div>
                {frames.length === 0 ? (
                  <p className="text-slate-500 italic">Belum ada rangka yang tersedia.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {frames.map((frame) => {
                      const isChecked = formState.allowedFrameIds.includes(frame.id);
                      return (
                        <label
                          key={frame.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                            isChecked ? 'bg-amber-50 border-amber-300 font-semibold' : 'bg-white border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setFormState({
                                ...formState,
                                allowedFrameIds: toggleArrayItem(
                                  formState.allowedFrameIds,
                                  frame.id
                                ),
                              })
                            }
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                          />
                          <div className="truncate">
                            <div className="text-xs text-slate-900 truncate">{frame.name}</div>
                            <div className="text-[10px] text-slate-500">
                              Rp {frame.pricingRule?.rate?.toLocaleString('id-ID')} / {frame.pricingRule?.unitLabel || 'm²'}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: UPAH & FINISHING */}
          {formTab === 'other' && (
            <div className="space-y-6 text-xs">
              {/* Labor Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Opsi Upah Pengerjaan</label>
                  <span className="text-[11px] text-slate-500">
                    {formState.allowedLaborIds.length} Dipilih
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {laborOptions.map((labor) => {
                    const isChecked = formState.allowedLaborIds.includes(labor.id);
                    return (
                      <label
                        key={labor.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                          isChecked ? 'bg-amber-50 border-amber-300 font-semibold' : 'bg-white border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setFormState({
                              ...formState,
                              allowedLaborIds: toggleArrayItem(
                                formState.allowedLaborIds,
                                labor.id
                              ),
                            })
                          }
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                        <div className="truncate">
                          <div className="text-xs text-slate-900 truncate">{labor.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Rp {labor.pricingRule?.rate?.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Finishing Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Opsi Cat & Finishing</label>
                  <span className="text-[11px] text-slate-500">
                    {formState.allowedFinishingIds.length} Dipilih
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {finishings.map((fn) => {
                    const isChecked = formState.allowedFinishingIds.includes(fn.id);
                    return (
                      <label
                        key={fn.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                          isChecked ? 'bg-amber-50 border-amber-300 font-semibold' : 'bg-white border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setFormState({
                              ...formState,
                              allowedFinishingIds: toggleArrayItem(
                                formState.allowedFinishingIds,
                                fn.id
                              ),
                            })
                          }
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                        <div className="truncate">
                          <div className="text-xs text-slate-900 truncate">{fn.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Rp {fn.pricingRule?.rate?.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* AddOns Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Biaya Tambahan / Fitur Ekstra</label>
                  <span className="text-[11px] text-slate-500">
                    {formState.allowedAddOnIds.length} Dipilih
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {addOns.map((addon) => {
                    const isChecked = formState.allowedAddOnIds.includes(addon.id);
                    return (
                      <label
                        key={addon.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                          isChecked ? 'bg-amber-50 border-amber-300 font-semibold' : 'bg-white border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setFormState({
                              ...formState,
                              allowedAddOnIds: toggleArrayItem(
                                formState.allowedAddOnIds,
                                addon.id
                              ),
                            })
                          }
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                        <div className="truncate">
                          <div className="text-xs text-slate-900 truncate">{addon.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Rp {addon.pricingRule?.rate?.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </MasterDataModal>
      )}

      {/* Confirmation Dialog */}
      <MasterDataConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={
          toggleTarget?.status === 'active'
            ? `Nonaktifkan ${toggleTarget?.title}?`
            : `Aktifkan ${toggleTarget?.title}?`
        }
        description={
          toggleTarget?.status === 'active'
            ? 'Layanan ini akan disembunyikan dari daftar pilihan kalkulator estimasi di website utama.'
            : 'Layanan ini akan kembali muncul di daftar pilihan kalkulator estimasi setelah draf diterbitkan.'
        }
        confirmLabel={toggleTarget?.status === 'active' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
      />
    </div>
  );
}
