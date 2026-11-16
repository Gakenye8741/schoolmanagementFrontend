import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  useGetSchoolByIdQuery,
  useUpdateSchoolSettingsMutation,
  useUpdateSchoolContactMutation,
  useUpdateSchoolLocalizationMutation,
  useUpdateSchoolCurriculumMutation,
  useUpdateSchoolPrincipalMutation,
  useUpdateSchoolBrandingMutation,
} from '../../features/Apis/School.Api';
import {
  Building2,
  MapPin,
  Palette,
  Globe,
  BookOpen,
  UserCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Pencil,
  Loader2,
  ChevronRight,
} from 'lucide-react';

type TabKey = 'identity' | 'contact' | 'branding' | 'localization' | 'curriculum' | 'principal';
type Tone = 'primary' | 'secondary' | 'accent' | 'info' | 'warning' | 'success';

/* ═══════════════════════════════════════════════════════
   SECTION CONFIG
   ═══════════════════════════════════════════════════════ */

const SECTIONS: {
  key: TabKey;
  label: string;
  title: string;
  subtitle: string;
  icon: any;
  tone: Tone;
}[] = [
  { key: 'identity', label: 'Identity', title: 'School identity', subtitle: 'Name, motto and official registration details.', icon: Building2, tone: 'primary' },
  { key: 'contact', label: 'Contact', title: 'Contact & location', subtitle: 'Where parents and partners can find and reach you.', icon: MapPin, tone: 'secondary' },
  { key: 'branding', label: 'Branding', title: 'Branding & theme', subtitle: 'Colors, logo and imagery used across the portal.', icon: Palette, tone: 'accent' },
  { key: 'localization', label: 'Localization', title: 'Localization', subtitle: 'Default timezone and currency for fees and dates.', icon: Globe, tone: 'info' },
  { key: 'curriculum', label: 'Curriculum', title: 'Curriculum & type', subtitle: 'School category and the curriculum you teach.', icon: BookOpen, tone: 'warning' },
  { key: 'principal', label: 'Principal', title: 'Principal', subtitle: 'The name printed on official report cards.', icon: UserCheck, tone: 'success' },
];

// Static maps so Tailwind can see every class
const TONE_BG: Record<Tone, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
  info: 'bg-info',
  warning: 'bg-warning',
  success: 'bg-success',
};
const TONE_SOFT: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  accent: 'bg-accent/10 text-accent',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
};
const TONE_BTN: Record<Tone, string> = {
  primary: 'bg-primary text-primary-content',
  secondary: 'bg-secondary text-secondary-content',
  accent: 'bg-accent text-accent-content',
  info: 'bg-info text-info-content',
  warning: 'bg-warning text-warning-content',
  success: 'bg-success text-success-content',
};

const inputCls =
  'w-full px-4 py-3 bg-base-100 border border-base-300 rounded-xl text-sm placeholder:text-base-content/30 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition';

const hasValue = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== '';

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function SchoolDetailsManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const schoolId = user?.schoolId || user?.user?.schoolId;

  const { data: school, isLoading, refetch } = useGetSchoolByIdQuery(schoolId!, {
    skip: !schoolId,
  });

  const [updateSchoolSettings, settingsState] = useUpdateSchoolSettingsMutation();
  const [updateSchoolContact, contactState] = useUpdateSchoolContactMutation();
  const [updateSchoolLocalization, locState] = useUpdateSchoolLocalizationMutation();
  const [updateSchoolCurriculum, currState] = useUpdateSchoolCurriculumMutation();
  const [updateSchoolPrincipal, princState] = useUpdateSchoolPrincipalMutation();
  const [updateSchoolBranding, brandState] = useUpdateSchoolBrandingMutation();

  const [activeTab, setActiveTab] = useState<TabKey>('identity');
  const [openModal, setOpenModal] = useState<TabKey | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  /* ── Form state ── */
  const [identity, setIdentity] = useState({
    name: '', shortName: '', motto: '', registrationNumber: '', knecCode: '', establishedYear: '',
  });
  const [contact, setContact] = useState({
    address: '', county: '', subCounty: '', phone: '', alternativePhone: '', email: '', website: '',
  });
  const [branding, setBranding] = useState({
    primaryColor: '#2563EB', secondaryColor: '#38BDF8', accentColor: '#F59E0B',
    gradientFrom: '', gradientTo: '', gradientDirection: 'to-r',
    logoUrl: '', faviconUrl: '', coverImageUrl: '',
  });
  const [localization, setLocalization] = useState({ timezone: 'Africa/Nairobi', currency: 'KES' });
  const [curriculum, setCurriculum] = useState({ schoolType: '', curriculumType: '' });
  const [principalName, setPrincipalName] = useState('');

  useEffect(() => {
    if (!school) return;
    setIdentity({
      name: school.name || '',
      shortName: school.shortName || '',
      motto: school.motto || '',
      registrationNumber: school.registrationNumber || '',
      knecCode: school.knecCode || '',
      establishedYear: school.establishedYear ? String(school.establishedYear) : '',
    });
    setContact({
      address: school.address || '',
      county: school.county || '',
      subCounty: school.subCounty || '',
      phone: school.phone || '',
      alternativePhone: school.alternativePhone || '',
      email: school.email || '',
      website: school.website || '',
    });
    setBranding({
      primaryColor: school.primaryColor || '#2563EB',
      secondaryColor: school.secondaryColor || '#38BDF8',
      accentColor: school.accentColor || '#F59E0B',
      gradientFrom: school.gradientFrom || '',
      gradientTo: school.gradientTo || '',
      gradientDirection: school.gradientDirection || 'to-r',
      logoUrl: school.logoUrl || '',
      faviconUrl: school.faviconUrl || '',
      coverImageUrl: school.coverImageUrl || '',
    });
    setLocalization({
      timezone: school.timezone || 'Africa/Nairobi',
      currency: school.currency || 'KES',
    });
    setCurriculum({
      schoolType: school.schoolType || '',
      curriculumType: school.curriculumType || '',
    });
    setPrincipalName(school.principalName || '');
  }, [school]);

  /* ── Modal behaviour: ESC to close + lock page scroll ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!openModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openModal]);

  /* ── Completion stats ── */
  const sectionProgress = useMemo(() => {
    const s: any = school || {};
    const groups: Record<TabKey, unknown[]> = {
      identity: [s.name, s.shortName, s.motto, s.registrationNumber, s.knecCode, s.establishedYear],
      contact: [s.address, s.county, s.subCounty, s.phone, s.alternativePhone, s.email, s.website],
      branding: [s.primaryColor, s.secondaryColor, s.accentColor, s.logoUrl, s.faviconUrl, s.coverImageUrl],
      localization: [s.timezone, s.currency],
      curriculum: [s.schoolType, s.curriculumType],
      principal: [s.principalName],
    };
    const out = {} as Record<TabKey, { done: number; total: number }>;
    let done = 0;
    let total = 0;
    (Object.keys(groups) as TabKey[]).forEach((k) => {
      const d = groups[k].filter(hasValue).length;
      out[k] = { done: d, total: groups[k].length };
      done += d;
      total += groups[k].length;
    });
    return { sections: out, percent: total ? Math.round((done / total) * 100) : 0 };
  }, [school]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage('');
    setOpenModal(null);
    setTimeout(() => setSuccessMessage(''), 4000);
  };
  const showError = (err: any) => {
    setErrorMessage(err?.data?.message || 'Update failed. Please try again.');
    setSuccessMessage('');
  };

  /* ── Submit handlers ── */
  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSchoolSettings({
        schoolId: schoolId!,
        settings: {
          name: identity.name,
          shortName: identity.shortName,
          motto: identity.motto,
          registrationNumber: identity.registrationNumber,
          knecCode: identity.knecCode,
          establishedYear: Number(identity.establishedYear) || undefined,
        },
      }).unwrap();
      showSuccess('School identity updated.');
      refetch();
    } catch (err) { showError(err); }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSchoolContact({ schoolId: schoolId!, contact }).unwrap();
      showSuccess('Contact & location updated.');
      refetch();
    } catch (err) { showError(err); }
  };

  const handleBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSchoolBranding({
        schoolId: schoolId!,
        branding: {
          ...branding,
          logoUrl: branding.logoUrl || null,
          faviconUrl: branding.faviconUrl || null,
          coverImageUrl: branding.coverImageUrl || null,
          gradientFrom: branding.gradientFrom || null,
          gradientTo: branding.gradientTo || null,
        },
      }).unwrap();
      showSuccess('Branding updated.');
      refetch();
    } catch (err) { showError(err); }
  };

  const handleLocalizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSchoolLocalization({ schoolId: schoolId!, localization }).unwrap();
      showSuccess('Localization updated.');
      refetch();
    } catch (err) { showError(err); }
  };

  const handleCurriculumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSchoolCurriculum({ schoolId: schoolId!, curriculum }).unwrap();
      showSuccess('Curriculum updated.');
      refetch();
    } catch (err) { showError(err); }
  };

  const handlePrincipalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSchoolPrincipal({
        schoolId: schoolId!,
        principalName: principalName || null,
      }).unwrap();
      showSuccess('Principal updated.');
      refetch();
    } catch (err) { showError(err); }
  };

  const active = SECTIONS.find((s) => s.key === activeTab)!;
  const modalMeta = SECTIONS.find((s) => s.key === openModal);

  /* ── Fallback states ── */
  if (!schoolId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-8 bg-error/10 border border-error/20 text-error rounded-3xl">
          <AlertCircle className="w-6 h-6 mb-2" />
          <p className="font-bold">No school is linked to your account.</p>
          <p className="text-sm mt-1">Please contact your Super Admin for assistance.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const heroGradient = `linear-gradient(120deg, ${school?.primaryColor || '#2563EB'}, ${school?.secondaryColor || '#38BDF8'})`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 bg-base-100 text-base-content min-h-screen">
      {/* ═════════ HERO ═════════ */}
      <header
        className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 text-white shadow-xl"
        style={{ background: heroGradient }}
      >
        {school?.coverImageUrl && (
          <img
            src={school.coverImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        )}
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {school?.logoUrl ? (
              <img
                src={school.logoUrl}
                alt="School logo"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-white/20 p-1.5 ring-1 ring-white/30 shrink-0"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 ring-1 ring-white/30 flex items-center justify-center font-black text-3xl shrink-0">
                {(school?.name || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black leading-tight truncate">
                {school?.name || 'Your school'}
              </h1>
              <p className="text-sm text-white/80 truncate">
                {school?.motto || 'Add a motto to show it here'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur">
                  <span className={`w-2 h-2 rounded-full ${school?.isActive ? 'bg-emerald-300' : 'bg-red-300'}`} />
                  {school?.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur">
                  Plan: {school?.subscriptionPlan || 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Completion */}
          <div className="lg:w-64 rounded-2xl bg-black/20 backdrop-blur p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">Profile complete</p>
              <p className="text-2xl font-black">{sectionProgress.percent}%</p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${sectionProgress.percent}%` }}
              />
            </div>
            <p className="text-xs text-white/75 mt-2">
              Fill in every section so report cards and the portal look right.
            </p>
          </div>
        </div>
      </header>

      {/* Alerts */}
      <div aria-live="polite">
        {successMessage && (
          <div className="mt-6 p-4 bg-success/10 border border-success/20 text-success rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-6 p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="ml-auto text-xs underline">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ═════════ BODY: section nav + content ═════════ */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Section nav */}
        <nav aria-label="Settings sections" className="lg:sticky lg:top-6 self-start">
          <ul className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = activeTab === s.key;
              const p = sectionProgress.sections[s.key];
              const complete = p.done === p.total;
              return (
                <li key={s.key} className="shrink-0 lg:shrink">
                  <button
                    onClick={() => {
                      setActiveTab(s.key);
                      setSuccessMessage('');
                      setErrorMessage('');
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition border ${
                      isActive
                        ? 'bg-base-200 border-base-300 shadow-sm'
                        : 'border-transparent hover:bg-base-200/60'
                    }`}
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TONE_SOFT[s.tone]}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-bold ${isActive ? '' : 'text-base-content/70'}`}>
                        {s.label}
                      </span>
                      <span className="block text-xs text-base-content/50">
                        {complete ? 'Complete' : `${p.done} of ${p.total} filled`}
                      </span>
                    </span>
                    {complete ? (
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 hidden lg:block" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-base-content/30 shrink-0 hidden lg:block" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content panel */}
        <section className="bg-base-200/50 border border-base-300 rounded-3xl p-5 sm:p-8 min-w-0">
          <SectionHeader
            title={active.title}
            subtitle={active.subtitle}
            tone={active.tone}
            onEdit={() => setOpenModal(active.key)}
          />

          {activeTab === 'identity' && (
            <FieldGrid
              fields={[
                { label: 'School name', value: school?.name },
                { label: 'Short name', value: school?.shortName },
                { label: 'Motto', value: school?.motto },
                { label: 'Registration no.', value: school?.registrationNumber },
                { label: 'KNEC code', value: school?.knecCode },
                { label: 'Established', value: school?.establishedYear },
              ]}
            />
          )}

          {activeTab === 'contact' && (
            <FieldGrid
              fields={[
                { label: 'Physical address', value: school?.address, full: true },
                { label: 'County', value: school?.county },
                { label: 'Sub-county', value: school?.subCounty },
                { label: 'Phone', value: school?.phone },
                { label: 'Alternative phone', value: school?.alternativePhone },
                { label: 'Email', value: school?.email },
                { label: 'Website', value: school?.website },
              ]}
            />
          )}

          {activeTab === 'branding' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-base-100 border border-base-300 rounded-2xl p-5">
                <p className="text-sm font-bold mb-4">Colors</p>
                <div className="space-y-3">
                  <ColorRow label="Primary" value={school?.primaryColor} />
                  <ColorRow label="Secondary" value={school?.secondaryColor} />
                  <ColorRow label="Accent" value={school?.accentColor} />
                </div>
              </div>
              <div className="bg-base-100 border border-base-300 rounded-2xl p-5">
                <p className="text-sm font-bold mb-4">Assets</p>
                <div className="space-y-3 text-sm">
                  <AssetRow label="Logo" value={school?.logoUrl} />
                  <AssetRow label="Favicon" value={school?.faviconUrl} />
                  <AssetRow label="Cover image" value={school?.coverImageUrl} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'localization' && (
            <FieldGrid
              fields={[
                { label: 'Timezone', value: school?.timezone },
                { label: 'Currency', value: school?.currency },
              ]}
            />
          )}

          {activeTab === 'curriculum' && (
            <FieldGrid
              fields={[
                { label: 'School type', value: school?.schoolType },
                { label: 'Curriculum', value: school?.curriculumType },
              ]}
            />
          )}

          {activeTab === 'principal' && (
            <FieldGrid fields={[{ label: 'Principal name', value: school?.principalName }]} />
          )}
        </section>
      </div>

      {/* ═════════ MODAL (portal → covers the whole screen incl. sidebar) ═════════ */}
      {openModal && modalMeta && (
        <Modal
          title={`Edit ${modalMeta.label.toLowerCase()}`}
          subtitle={modalMeta.subtitle}
          icon={modalMeta.icon}
          tone={modalMeta.tone}
          onClose={() => setOpenModal(null)}
        >
          {openModal === 'identity' && (
            <form onSubmit={handleIdentitySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="School name *">
                  <input type="text" data-autofocus value={identity.name} onChange={(e) => setIdentity({ ...identity, name: e.target.value })} required className={inputCls} />
                </Field>
                <Field label="Short name">
                  <input type="text" value={identity.shortName} onChange={(e) => setIdentity({ ...identity, shortName: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <Field label="Motto / tagline">
                <input type="text" value={identity.motto} onChange={(e) => setIdentity({ ...identity, motto: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Registration no.">
                  <input type="text" value={identity.registrationNumber} onChange={(e) => setIdentity({ ...identity, registrationNumber: e.target.value })} className={inputCls} />
                </Field>
                <Field label="KNEC code">
                  <input type="text" value={identity.knecCode} onChange={(e) => setIdentity({ ...identity, knecCode: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Established year">
                  <input type="number" value={identity.establishedYear} onChange={(e) => setIdentity({ ...identity, establishedYear: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <ModalFooter onCancel={() => setOpenModal(null)} loading={settingsState.isLoading} tone="primary" label="Save identity" />
            </form>
          )}

          {openModal === 'contact' && (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <Field label="Physical address">
                <input type="text" data-autofocus value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="County">
                  <input type="text" value={contact.county} onChange={(e) => setContact({ ...contact, county: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Sub-county">
                  <input type="text" value={contact.subCounty} onChange={(e) => setContact({ ...contact, subCounty: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Phone">
                  <input type="text" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Alternative phone">
                  <input type="text" value={contact.alternativePhone} onChange={(e) => setContact({ ...contact, alternativePhone: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Email">
                  <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Website">
                  <input type="url" value={contact.website} onChange={(e) => setContact({ ...contact, website: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <ModalFooter onCancel={() => setOpenModal(null)} loading={contactState.isLoading} tone="secondary" label="Save contact" />
            </form>
          )}

          {openModal === 'branding' && (
            <form onSubmit={handleBrandingSubmit} className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <ColorField label="Primary" value={branding.primaryColor} onChange={(v) => setBranding({ ...branding, primaryColor: v })} />
                <ColorField label="Secondary" value={branding.secondaryColor} onChange={(v) => setBranding({ ...branding, secondaryColor: v })} />
                <ColorField label="Accent" value={branding.accentColor} onChange={(v) => setBranding({ ...branding, accentColor: v })} />
              </div>

              <div>
                <p className="text-xs font-bold text-base-content/60 mb-2">Live preview</p>
                <div
                  className="rounded-2xl p-5 text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }}
                >
                  <div className="flex items-center gap-3">
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt="logo" className="w-12 h-12 rounded-xl object-cover bg-white/20 p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg">
                        {(identity.name || 'S').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-black leading-tight truncate">{identity.name || 'School name'}</p>
                      <p className="text-[11px] opacity-80 truncate">{identity.motto || 'Your motto'}</p>
                    </div>
                    <span
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-black/80 shrink-0"
                      style={{ backgroundColor: branding.accentColor }}
                    >
                      Accent
                    </span>
                  </div>
                </div>
              </div>

              <Field label="Logo URL">
                <input type="url" value={branding.logoUrl} onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })} placeholder="https://..." className={inputCls} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Favicon URL">
                  <input type="url" value={branding.faviconUrl} onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Cover image URL">
                  <input type="url" value={branding.coverImageUrl} onChange={(e) => setBranding({ ...branding, coverImageUrl: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <ModalFooter onCancel={() => setOpenModal(null)} loading={brandState.isLoading} tone="accent" label="Save branding" />
            </form>
          )}

          {openModal === 'localization' && (
            <form onSubmit={handleLocalizationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Timezone">
                  <select data-autofocus value={localization.timezone} onChange={(e) => setLocalization({ ...localization, timezone: e.target.value })} className={inputCls}>
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                    <option value="Africa/Kampala">Africa/Kampala (EAT)</option>
                    <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam (EAT)</option>
                    <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </Field>
                <Field label="Currency">
                  <select value={localization.currency} onChange={(e) => setLocalization({ ...localization, currency: e.target.value })} className={inputCls}>
                    <option value="KES">KES — Kenyan Shilling</option>
                    <option value="UGX">UGX — Ugandan Shilling</option>
                    <option value="TZS">TZS — Tanzanian Shilling</option>
                    <option value="USD">USD — US Dollar</option>
                  </select>
                </Field>
              </div>
              <ModalFooter onCancel={() => setOpenModal(null)} loading={locState.isLoading} tone="info" label="Save localization" />
            </form>
          )}

          {openModal === 'curriculum' && (
            <form onSubmit={handleCurriculumSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="School type">
                  <select data-autofocus value={curriculum.schoolType} onChange={(e) => setCurriculum({ ...curriculum, schoolType: e.target.value })} className={inputCls}>
                    <option value="">Select...</option>
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Mixed">Mixed (Primary + Secondary)</option>
                    <option value="Boys">Boys only</option>
                    <option value="Girls">Girls only</option>
                  </select>
                </Field>
                <Field label="Curriculum type">
                  <select value={curriculum.curriculumType} onChange={(e) => setCurriculum({ ...curriculum, curriculumType: e.target.value })} className={inputCls}>
                    <option value="">Select...</option>
                    <option value="CBC">CBC</option>
                    <option value="8-4-4">8-4-4</option>
                    <option value="IGCSE">IGCSE</option>
                    <option value="IB">IB</option>
                  </select>
                </Field>
              </div>
              <ModalFooter onCancel={() => setOpenModal(null)} loading={currState.isLoading} tone="warning" label="Save curriculum" />
            </form>
          )}

          {openModal === 'principal' && (
            <form onSubmit={handlePrincipalSubmit} className="space-y-4">
              <Field label="Principal name">
                <input type="text" data-autofocus value={principalName} onChange={(e) => setPrincipalName(e.target.value)} placeholder="e.g. Mary Wanjiku" className={inputCls} />
              </Field>
              <p className="text-xs text-base-content/60">
                Leave empty to remove the principal name from report cards.
              </p>
              <ModalFooter onCancel={() => setOpenModal(null)} loading={princState.isLoading} tone="success" label="Save principal" />
            </form>
          )}
        </Modal>
      )}

      <style>{`
        @keyframes sdm-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sdm-pop {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sdm-fade { animation: sdm-fade 0.2s ease-out both; }
        .sdm-pop  { animation: sdm-pop 0.26s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .sdm-fade, .sdm-pop { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════ */

function SectionHeader({
  title, subtitle, tone, onEdit,
}: {
  title: string;
  subtitle: string;
  tone: Tone;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-1.5 h-10 ${TONE_BG[tone]} rounded-full shrink-0`} />
        <div className="min-w-0">
          <h2 className="text-xl font-black">{title}</h2>
          <p className="text-sm text-base-content/60">{subtitle}</p>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-content font-bold text-sm hover:opacity-90 active:scale-[0.98] transition shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Pencil className="w-4 h-4" /> Edit
      </button>
    </div>
  );
}

function FieldGrid({ fields }: { fields: { label: string; value: any; full?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map((f, i) => (
        <div
          key={i}
          className={`bg-base-100 border border-base-300 rounded-2xl px-4 py-3 ${f.full ? 'sm:col-span-2' : ''}`}
        >
          <dt className="text-xs font-semibold text-base-content/50 mb-0.5">{f.label}</dt>
          <dd className="text-sm font-semibold break-words">
            {hasValue(f.value) ? (
              String(f.value)
            ) : (
              <span className="text-base-content/30 italic font-normal">Not set</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ColorRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl border border-base-300 shrink-0"
        style={{ backgroundColor: value || '#e5e7eb' }}
      />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-base-content/50">{label}</p>
        <p className="text-sm font-mono truncate">{value || 'Not set'}</p>
      </div>
    </div>
  );
}

function AssetRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-base-content/60">{label}</span>
      {hasValue(value) ? (
        <span className="inline-flex items-center gap-1 text-success font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Added
        </span>
      ) : (
        <span className="text-base-content/30 italic">Not set</span>
      )}
    </div>
  );
}

/**
 * Modal is rendered with a portal straight into <body>, so it escapes any
 * parent stacking context (layout, sidebar, navbar). The backdrop blurs the
 * ENTIRE screen, including the sidebar.
 */
function Modal({
  title, subtitle, icon: Icon, tone, onClose, children,
}: {
  title: string;
  subtitle: string;
  icon: any;
  tone: Tone;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]');
    el?.focus();
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Full-screen blurred backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md sdm-fade"
        style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden bg-base-100 text-base-content rounded-t-3xl sm:rounded-3xl border border-base-300 shadow-2xl sdm-pop"
      >
        <div className="flex items-start gap-3 p-5 sm:p-6 border-b border-base-300 shrink-0">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${TONE_SOFT[tone]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black">{title}</h3>
            <p className="text-sm text-base-content/60">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-base-200 transition shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function ModalFooter({
  onCancel, loading, tone, label,
}: {
  onCancel: () => void;
  loading: boolean;
  tone: Tone;
  label: string;
}) {
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 mt-2 border-t border-base-300">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-6 py-3 rounded-xl border border-base-300 hover:bg-base-200 transition font-bold text-sm disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className={`flex-1 ${TONE_BTN[tone]} font-bold py-3 px-6 rounded-xl shadow-md disabled:opacity-60 transition active:scale-[0.99] flex items-center justify-center gap-2 text-sm`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Saving…
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> {label}
          </>
        )}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-base-content/60 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function ColorField({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 rounded-xl border border-base-300 cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 bg-base-200/60 border border-base-300 rounded-lg text-[11px] font-mono text-center"
        />
      </div>
    </Field>
  );
}