'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { defaultCmsRepository } from '../../../lib/cms/repository';
import {
  ServiceSchema,
  MeasurementType,
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
  m2: { label: 'Per m² (Luas)', desc: 'Pelanggan isi panjang × lebar' },
  meter: { label: 'Per Meter Lari', desc: 'Pelanggan isi panjang saja' },
  unit: { label: 'Per Unit / Pcs', desc: 'Pelanggan isi jumlah unit' },
  package: { label: 'Paket Fixed', desc: 'Harga terikat tetap per paket' },
  dimensions: { label: '3D Dimensi (P×L×T)', desc: 'Kalkulasi volume kubikasi' },
  mixed: { label: 'Kalkulasi Campuran', desc: 'Kombinasi m², paket, dan unit' },
};

// Hanya tiga cara ukur ini yang dimengerti kalkulator. Sisanya (package/dimensions/mixed)
// masih ada di schema untuk data lama, tapi jangan ditawarkan — hasilnya Rp 0.
const SELECTABLE_MEASUREMENTS: MeasurementType[] = ['m2', 'meter', 'unit'];

const UNIT_LABEL_MAP: Record<string, string> = { m2: 'm²', meter: 'meter', unit: 'unit' };

function unitLabelFor(type: MeasurementType): string {
  return UNIT_LABEL_MAP[type] || 'unit';
}

function pricingModelFor(type: MeasurementType): 'per_m2' | 'per_m' | 'per_unit' {
  if (type === 'm2') return 'per_m2';
  if (type === 'meter') return 'per_m';
  return 'per_unit';
}

interface ServiceFormState {
  id?: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: ServiceSchema['category'];
  featured: boolean;
  measurementType: MeasurementType;
  rate: number;
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
      rate: 0,
      minimumValue: 10,
      minDays: 3,
      maxDays: 7,
      // Model borongan: harga sudah all-in di tarif. Komponen dibiarkan kosong —
      // kalau diisi, harganya dihitung dua kali.
      allowedMaterialIds: [],
      allowedFrameIds: [],
      allowedLaborIds: [],
      allowedFinishingIds: [],
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
      rate: svc.pricingRules?.[0]?.rate ?? 0,
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
    if (!form.rate || form.rate <= 0) {
      errors.rate = `Tarif borongan wajib diisi, misal 900000 untuk Rp 900.000 / ${unitLabelFor(
        form.measurementType
      )}.`;
    }
    if (form.maxDays < form.minDays) {
      errors.maxDays = 'Waktu maksimum tidak boleh lebih cepat dari waktu minimum.';
    }
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
      // lempar owner ke tab yang error-nya ada, bukan selalu tab 1
      setFormTab(errors.title || errors.shortDescription ? 'info' : 'pricing');
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

    const serviceId = formState.id || `svc-${Date.now()}`;

    const updatedService: ServiceSchema = {
      id: serviceId,
      slug: formState.slug || formState.title.toLowerCase().replace(/\s+/g, '-'),
      title: formState.title.trim(),
      shortDescription: formState.shortDescription.trim(),
      fullDescription: formState.fullDescription.trim() || formState.shortDescription.trim(),
      category: formState.category,
      featured: formState.featured,
      measurementType: formState.measurementType,
      pricingRules: [
        {
          id: `rule-${serviceId}-borongan`,
          targetComponent: 'base',
          model: pricingModelFor(formState.measurementType),
          rate: formState.rate,
          unitLabel: unitLabelFor(formState.measurementType),
          description: `Harga borongan per ${unitLabelFor(
            formState.measurementType
          )} — sudah termasuk bahan, rangka, upah pasang, dan finishing`,
        },
      ],
      minimumBilling: minBillingObj,
      // Sengaja dikosongkan: harga sudah all-in di tarif borongan di atas.
      // Kalau komponen ini diisi, kalkulator menambahkannya lagi di atas tarif.
      allowedMaterialIds: [],
      allowedFrameIds: [],
      allowedLaborIds: [],
      allowedFinishingIds: [],
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
      header: 'Harga Borongan',
      accessor: (row) => {
        const rate = row.pricingRules?.[0]?.rate;
        const unit = row.pricingRules?.[0]?.unitLabel || unitLabelFor(row.measurementType);
        const meta = MEASUREMENT_LABEL_MAP[row.measurementType];

        if (!rate) {
          return (
            <div className="text-xs">
              <div className="font-bold text-rose-600">Belum diisi</div>
              <div className="text-[11px] text-rose-500">Harga muncul Rp 0 di kalkulator</div>
            </div>
          );
        }

        return (
          <div className="text-xs">
            <div className="font-bold text-slate-900">
              Rp {rate.toLocaleString('id-ID')} <span className="font-normal text-slate-500">/ {unit}</span>
            </div>
            <div className="text-[11px] text-slate-500">{meta ? meta.desc : row.measurementType}</div>
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
              {minVal ? `Min: ${minVal} ${unitLabelFor(row.measurementType)}` : 'Tanpa Minimum'}
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
    { id: 'pricing', label: '2. Harga & Cara Ukur' },
    { id: 'other', label: '3. Biaya Tambahan' },
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

          {/* TAB 2: HARGA BORONGAN & CARA UKUR */}
          {formTab === 'pricing' && (
            <div className="space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dihitung per apa?</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                  {SELECTABLE_MEASUREMENTS.map((key) => {
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
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900">{item.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Tarif Borongan per {unitLabelFor(formState.measurementType)}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Harga bersih sudah termasuk bahan, rangka, upah pasang, dan finishing. Satu angka ini
                    yang dipakai kalkulator di website.
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={formState.rate || ''}
                    placeholder="900000"
                    onChange={(e) =>
                      setFormState({ ...formState, rate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-base font-bold text-slate-900 pl-10 pr-20 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                    / {unitLabelFor(formState.measurementType)}
                  </span>
                </div>
                {formErrors.rate && <p className="text-xs text-rose-600">{formErrors.rate}</p>}

                {formState.rate > 0 && (
                  <p className="text-[11px] text-slate-700 bg-white border border-amber-200 rounded-lg px-3 py-2">
                    {formState.measurementType === 'm2'
                      ? `Pelanggan isi 5 m × 2 m (10 m²) → Rp ${(
                          formState.rate * Math.max(10, formState.minimumValue || 0)
                        ).toLocaleString('id-ID')}`
                      : formState.measurementType === 'meter'
                      ? `Pelanggan isi 4 meter → Rp ${(
                          formState.rate * Math.max(4, formState.minimumValue || 0)
                        ).toLocaleString('id-ID')}`
                      : `Pelanggan isi 2 unit → Rp ${(
                          formState.rate * Math.max(2, formState.minimumValue || 0)
                        ).toLocaleString('id-ID')}`}
                    {formState.minimumValue > 0 && (
                      <span className="text-slate-500">
                        {' '}
                        (minimum {formState.minimumValue} {unitLabelFor(formState.measurementType)})
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs">Minimum Pengerjaan</h4>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Minimal {unitLabelFor(formState.measurementType)} yang ditagih
                  </label>
                  <input
                    type="number"
                    min={0}
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
                    Kalau pesanan pelanggan lebih kecil dari angka ini, tetap dihitung segini. Isi 0 kalau
                    tidak ada batas minimum.
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
                  {formErrors.maxDays && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.maxDays}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BIAYA TAMBAHAN */}
          {formTab === 'other' && (
            <div className="space-y-6 text-xs">
              <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                Bahan, rangka, upah, dan finishing sudah masuk ke tarif borongan di tab sebelumnya — jadi
                tidak dipilih di sini lagi. Yang di bawah ini biaya ekstra yang dibahas saat survei.
              </p>

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
