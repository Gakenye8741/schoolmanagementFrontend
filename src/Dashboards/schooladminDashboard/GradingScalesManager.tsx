import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  Award, Layers, Calculator, ShieldCheck, Sparkles, Building,
  PlusCircle, Edit3, Trash2, CheckCircle2, AlertCircle, X,
  Loader2, Save, Copy, Star, StarOff, Wand2, ChevronDown,
  ChevronRight, Search, TrendingUp, Percent, Hash, Target,
  AlertTriangle, BarChart3, ArrowRight, Info,
} from 'lucide-react';

import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import {
  useSeedScaleMutation,
  useCreateScaleMutation,
  useGetScalesBySchoolQuery,
  useSearchScalesQuery,
  useGetScaleByIdQuery,
  useUpdateScaleMutation,
  useSetDefaultScaleMutation,
  useGetDefaultScaleQuery,
  useCopyScaleMutation,
  useGetBandsByScaleQuery,
  useCreateBandMutation,
  useBulkCreateBandsMutation,
  useUpdateBandMutation,
  useDeleteBandMutation,
  useDeleteAllBandsMutation,
  useResolveMarkMutation,
  useValidateScaleQuery,
  type GradingScale,
  type GradingBand,
  type ScaleTemplate,
} from '../../features/Apis/gradeScake.Api';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const TEMPLATES: Array<{
  id: ScaleTemplate;
  name: string;
  description: string;
  tone: string;
}> = [
  { id: 'KCSE', name: 'KCSE', description: 'A–E, 12-point scale', tone: 'bg-primary/10 text-primary border-primary/30' },
  { id: 'CBC', name: 'CBC', description: '4 levels (EE/ME/AE/BE)', tone: 'bg-success/10 text-success border-success/30' },
  { id: 'PERCENTAGE_A_E', name: 'Percentage A–E', description: 'Simple 5-band percentage scale', tone: 'bg-warning/10 text-warning border-warning/30' },
  { id: 'IGCSE_1_9', name: 'IGCSE 1–9', description: '9-band IGCSE scale', tone: 'bg-info/10 text-info border-info/30' },
];

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
function extractScales(data: any): GradingScale[] {
  if (!data) return [];
  const raw = data.scales ?? data.data ?? data;
  return Array.isArray(raw) ? raw : [];
}

function extractBands(data: any): GradingBand[] {
  if (!data) return [];
  const raw = data.bands ?? data.data ?? data;
  return Array.isArray(raw) ? raw : [];
}

function fmtNum(v: string | number | null | undefined, digits = 2): string {
  if (v === null || v === undefined) return '—';
  const n = typeof v === 'number' ? v : Number(v);
  if (isNaN(n)) return String(v);
  return n.toFixed(digits);
}

function bandTone(grade: string): { bg: string; text: string; solid: string } {
  const g = grade.toUpperCase();
  if (g.startsWith('A') || g === 'EE' || g === 'E') return { bg: 'bg-success/10', text: 'text-success', solid: 'bg-success' };
  if (g.startsWith('B') || g === 'ME' || g === 'M') return { bg: 'bg-info/10', text: 'text-info', solid: 'bg-info' };
  if (g.startsWith('C') || g === 'AE' || g === 'A') return { bg: 'bg-warning/10', text: 'text-warning', solid: 'bg-warning' };
  if (g.startsWith('D') || g === 'BE' || g === 'B') return { bg: 'bg-orange-500/10', text: 'text-orange-600', solid: 'bg-orange-500' };
  return { bg: 'bg-error/10', text: 'text-error', solid: 'bg-error' };
}

type Tab = 'scales' | 'bands' | 'resolve' | 'validation';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function GradingScalesManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const [activeTab, setActiveTab] = useState<Tab>('scales');
  const [selectedScaleId, setSelectedScaleId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-base-100 text-base-content min-h-screen">
      {/* ─────────── HEADER ─────────── */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 p-8 sm:p-10 rounded-3xl border shadow-sm"
        style={{ borderColor: `${secondaryColor}40` }}
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-xs"
              style={{ backgroundColor: secondaryColor }}
            >
              <Award className="w-3.5 h-3.5" /> Grading
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">
              Grading Scales Manager
            </h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Define grading scales, configure bands, and validate coverage for {schoolName}.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-base-100/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-base-300 shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl" style={{ borderLeft: `4px solid ${secondaryColor}` }}>
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Institution</p>
              <p className="text-lg font-black text-primary truncate max-w-[200px]">{schoolName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── TABS ─────────── */}
      <div className="flex flex-wrap gap-3 border-b border-base-300 pb-4">
        {[
          { id: 'scales' as Tab, label: 'Scales', icon: Award },
          { id: 'bands' as Tab, label: 'Bands', icon: Layers },
          { id: 'resolve' as Tab, label: 'Resolve Mark', icon: Calculator },
          { id: 'validation' as Tab, label: 'Validation', icon: ShieldCheck },
        ].map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSuccessMessage(''); setErrorMessage(''); }}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                active
                  ? 'bg-primary text-primary-content shadow-lg shadow-primary/20'
                  : 'bg-base-200/50 hover:bg-base-200 opacity-75'
              }`}
              style={active ? { borderBottom: `4px solid ${secondaryColor}` } : {}}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          );
        })}
      </div>

      {/* ─────────── ALERTS ─────────── */}
      {successMessage && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-2xl flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold flex-1">{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────── CONTENT ─────────── */}
      {activeTab === 'scales' && (
        <ScalesTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          onSelectScale={(id) => { setSelectedScaleId(id); setActiveTab('bands'); }}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'bands' && (
        <BandsTab
          schoolId={currentSchoolId}
          selectedScaleId={selectedScaleId}
          onSelectScale={setSelectedScaleId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'resolve' && (
        <ResolveTab
          schoolId={currentSchoolId}
          selectedScaleId={selectedScaleId}
          onSelectScale={setSelectedScaleId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      )}
      {activeTab === 'validation' && (
        <ValidationTab
          schoolId={currentSchoolId}
          selectedScaleId={selectedScaleId}
          onSelectScale={setSelectedScaleId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SCALES TAB
   ════════════════════════════════════════════════════════════════ */
function ScalesTab({
  schoolId, primaryColor, secondaryColor, onSelectScale, setSuccessMessage, setErrorMessage,
}: SectionProps & { onSelectScale: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    isDefault: false,
  });
  const [search, setSearch] = useState('');

  // Copy form
  const [showCopy, setShowCopy] = useState(false);
  const [copySource, setCopySource] = useState('');
  const [copyName, setCopyName] = useState('');

  const { data: scalesData, isLoading } = useGetScalesBySchoolQuery(schoolId, { skip: !schoolId });
  const { data: defaultData } = useGetDefaultScaleQuery(schoolId, { skip: !schoolId });
  const { data: searchData } = useSearchScalesQuery(
    { schoolId, query: search },
    { skip: !schoolId || search.trim().length < 2 }
  );

  const scales = useMemo(() => extractScales(scalesData), [scalesData]);
  const filtered = useMemo(() => {
    if (!search.trim()) return scales;
    return extractScales(searchData);
  }, [search, searchData, scales]);

  const defaultScale = (defaultData as any)?.scale as GradingScale | undefined;

  const [seedScale, { isLoading: seeding }] = useSeedScaleMutation();
  const [createScale, { isLoading: creating }] = useCreateScaleMutation();
  const [updateScale, { isLoading: updating }] = useUpdateScaleMutation();
  const [setDefault] = useSetDefaultScaleMutation();
  const [copyScale, { isLoading: copying }] = useCopyScaleMutation();

  const resetForm = () => {
    setForm({ name: '', description: '', isDefault: false });
    setIsEditing(false); setEditingId(null);
  };

  const handleEdit = (s: GradingScale) => {
    setForm({
      name: s.name,
      description: s.description ?? '',
      isDefault: s.isDefault,
    });
    setIsEditing(true); setEditingId(s.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');

    if (!form.name.trim()) return setErrorMessage('Scale name is required.');

    const payload = {
      schoolId,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      isDefault: form.isDefault,
    };

    try {
      if (isEditing && editingId) {
        await updateScale({
          scaleId: editingId,
          patch: { name: payload.name, description: payload.description, isDefault: payload.isDefault },
        }).unwrap();
        setSuccessMessage(`Scale "${payload.name}" updated.`);
      } else {
        await createScale(payload).unwrap();
        setSuccessMessage(`Scale "${payload.name}" created.`);
      }
      resetForm();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Operation failed.');
    }
  };

  const handleSeed = async (template: ScaleTemplate, name: string) => {
    setSuccessMessage(''); setErrorMessage('');
    try {
      await seedScale({ schoolId, template }).unwrap();
      setSuccessMessage(`${name} scale seeded successfully.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || `${name} seed failed.`);
    }
  };

  const handleSetDefault = async (scaleId: string, name: string) => {
    setSuccessMessage(''); setErrorMessage('');
    try {
      await setDefault({ schoolId, scaleId }).unwrap();
      setSuccessMessage(`"${name}" set as default.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to set default.');
    }
  };

  const handleCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!copySource) return setErrorMessage('Select a source scale.');
    if (!copyName.trim()) return setErrorMessage('New name is required.');

    try {
      await copyScale({
        schoolId,
        sourceScaleId: copySource,
        newName: copyName.trim(),
      }).unwrap();
      setSuccessMessage(`Copied to "${copyName.trim()}".`);
      setCopyName('');
      setCopySource('');
      setShowCopy(false);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Copy failed.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── LEFT: Forms ── */}
      <div className="lg:col-span-5 space-y-6">
        {/* Seed templates */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Seed Standard Scale</h2>
              <p className="text-[11px] opacity-60">Quick-start from a template</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSeed(t.id, t.name)}
                disabled={seeding}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left hover:shadow-md transition-all cursor-pointer disabled:opacity-60 ${t.tone}`}
              >
                <div className="shrink-0 p-2 bg-white/60 rounded-lg">
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black">{t.name}</p>
                  <p className="text-[10px] opacity-70">{t.description}</p>
                </div>
                <PlusCircle className="w-4 h-4 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        {/* Create / edit custom scale */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">
                {isEditing ? 'Edit Scale' : 'New Custom Scale'}
              </h2>
            </div>
            {isEditing && (
              <button onClick={resetForm} className="text-xs text-error font-bold hover:underline cursor-pointer">
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Custom 4-Band Scale"
                required
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description of the scale"
                rows={2}
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <label className={`flex items-center gap-2 px-4 py-3 bg-base-100 border rounded-2xl text-xs font-bold cursor-pointer ${
              form.isDefault ? 'border-primary/40 bg-primary/5' : 'border-base-300'
            }`}>
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="checkbox checkbox-primary checkbox-xs"
              />
              <Star className="w-3.5 h-3.5 text-primary" />
              Set as default scale
            </label>

            <button
              type="submit"
              disabled={creating || updating}
              className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-2 disabled:opacity-60"
              style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
            >
              {creating || updating ? 'Saving…' : isEditing ? 'Update Scale' : 'Create Scale'}
            </button>
          </form>
        </div>

        {/* Copy scale collapsible */}
        {scales.length > 0 && (
          <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
            <button
              type="button"
              onClick={() => setShowCopy(!showCopy)}
              className="w-full flex items-center justify-between gap-3 pb-2 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Copy className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-black tracking-tight">Copy Scale</h2>
                  <p className="text-[11px] opacity-60">Duplicate an existing scale</p>
                </div>
              </div>
              {showCopy ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
            </button>

            {showCopy && (
              <form onSubmit={handleCopy} className="space-y-3">
                <select
                  value={copySource}
                  onChange={(e) => setCopySource(e.target.value)}
                  className="w-full px-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="">-- Source scale --</option>
                  {scales.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={copyName}
                  onChange={(e) => setCopyName(e.target.value)}
                  placeholder="New scale name (e.g. KCSE 2027)"
                  className="w-full px-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  disabled={copying || !copySource || !copyName.trim()}
                  className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                >
                  {copying ? 'Copying…' : 'Copy Scale'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: List ── */}
      <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-base-300 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">All Scales</h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{filtered.length} total</span>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scales…"
            className="w-full pl-10 pr-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Default scale banner */}
        {defaultScale && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-2">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-xs font-bold">
              Default scale: <span className="text-primary">{defaultScale.name}</span>
            </span>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="p-8 text-center text-xs opacity-60">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading scales…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
            {search ? 'No scales match your search.' : 'No scales yet. Seed one or create a custom scale.'}
          </div>
        ) : (
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filtered.map((scale) => (
              <ScaleCard
                key={scale.id}
                scale={scale}
                isDefault={scale.isDefault || defaultScale?.id === scale.id}
                primaryColor={primaryColor}
                onEdit={() => handleEdit(scale)}
                onSetDefault={() => handleSetDefault(scale.id, scale.name)}
                onManageBands={() => onSelectScale(scale.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScaleCard({
  scale, isDefault, primaryColor, onEdit, onSetDefault, onManageBands,
}: {
  scale: GradingScale;
  isDefault: boolean;
  primaryColor: string;
  onEdit: () => void;
  onSetDefault: () => void;
  onManageBands: () => void;
}) {
  return (
    <div className="p-5 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-sm text-primary truncate">{scale.name}</h3>
            {isDefault && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold uppercase rounded flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-primary" /> Default
              </span>
            )}
            {scale.bands && (
              <span className="px-2 py-0.5 bg-base-200 text-[10px] font-extrabold uppercase rounded">
                {scale.bands.length} bands
              </span>
            )}
          </div>
          {scale.description && (
            <p className="mt-1 text-[11px] opacity-70 line-clamp-2">{scale.description}</p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-base-300 flex flex-wrap justify-end gap-1.5">
        <button
          onClick={onManageBands}
          className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
        >
          <Layers className="w-3 h-3 inline mr-1" /> Bands
        </button>
        {!isDefault && (
          <button
            onClick={onSetDefault}
            className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-all cursor-pointer"
          >
            <Star className="w-3 h-3 inline mr-1" /> Set Default
          </button>
        )}
        <button
          onClick={onEdit}
          className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-base-200 hover:bg-primary/20 hover:text-primary transition-all cursor-pointer"
        >
          <Edit3 className="w-3 h-3 inline mr-1" /> Edit
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BANDS TAB
   ════════════════════════════════════════════════════════════════ */
function BandsTab({
  schoolId, selectedScaleId, onSelectScale, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps & { selectedScaleId: string; onSelectScale: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    minScore: '',
    maxScore: '',
    grade: '',
    points: '',
    descriptor: '',
    remark: '',
  });
  const [showBulk, setShowBulk] = useState(false);
  const [bulkRows, setBulkRows] = useState<Array<{
    minScore: string;
    maxScore: string;
    grade: string;
    points: string;
    descriptor: string;
    remark: string;
  }>>([{ minScore: '', maxScore: '', grade: '', points: '', descriptor: '', remark: '' }]);

  const { data: scalesData } = useGetScalesBySchoolQuery(schoolId, { skip: !schoolId });
  const scales = useMemo(() => extractScales(scalesData), [scalesData]);

  const { data: bandsData, isLoading } = useGetBandsByScaleQuery(selectedScaleId, { skip: !selectedScaleId });
  const bands = useMemo(() => {
    const raw = extractBands(bandsData);
    return [...raw].sort((a, b) => Number(b.minScore) - Number(a.minScore));
  }, [bandsData]);

  const { data: validationData } = useValidateScaleQuery(selectedScaleId, { skip: !selectedScaleId });

  const [createBand, { isLoading: creating }] = useCreateBandMutation();
  const [bulkCreate, { isLoading: bulkCreating }] = useBulkCreateBandsMutation();
  const [updateBand, { isLoading: updating }] = useUpdateBandMutation();
  const [deleteBand] = useDeleteBandMutation();
  const [deleteAllBands] = useDeleteAllBandsMutation();

  const resetForm = () => {
    setForm({ minScore: '', maxScore: '', grade: '', points: '', descriptor: '', remark: '' });
    setIsEditing(false); setEditingId(null);
  };

  const handleEdit = (b: GradingBand) => {
    setForm({
      minScore: b.minScore,
      maxScore: b.maxScore,
      grade: b.grade,
      points: b.points != null ? String(b.points) : '',
      descriptor: b.descriptor ?? '',
      remark: b.remark ?? '',
    });
    setIsEditing(true); setEditingId(b.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!selectedScaleId) return setErrorMessage('Select a scale first.');

    const min = Number(form.minScore);
    const max = Number(form.maxScore);
    if (isNaN(min) || isNaN(max)) return setErrorMessage('Scores must be numbers.');
    if (min < 0 || max > 100) return setErrorMessage('Scores must be between 0 and 100.');
    if (min >= max) return setErrorMessage('Min must be less than max.');
    if (!form.grade.trim()) return setErrorMessage('Grade label is required.');

    const payload = {
      scaleId: selectedScaleId,
      minScore: form.minScore,
      maxScore: form.maxScore,
      grade: form.grade.trim(),
      points: form.points ? Number(form.points) : undefined,
      descriptor: form.descriptor.trim() || undefined,
      remark: form.remark.trim() || undefined,
    };

    try {
      if (isEditing && editingId) {
        await updateBand({
          bandId: editingId,
          patch: {
            minScore: payload.minScore,
            maxScore: payload.maxScore,
            grade: payload.grade,
            points: payload.points,
            descriptor: payload.descriptor,
            remark: payload.remark,
          },
        }).unwrap();
        setSuccessMessage(`Band "${payload.grade}" updated.`);
      } else {
        await createBand(payload).unwrap();
        setSuccessMessage(`Band "${payload.grade}" created.`);
      }
      resetForm();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Operation failed.');
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!selectedScaleId) return setErrorMessage('Select a scale first.');

    const clean = bulkRows
      .filter((r) => r.grade.trim() && !isNaN(Number(r.minScore)) && !isNaN(Number(r.maxScore)))
      .map((r) => ({
        minScore: r.minScore,
        maxScore: r.maxScore,
        grade: r.grade.trim(),
        points: r.points ? Number(r.points) : undefined,
        descriptor: r.descriptor.trim() || undefined,
        remark: r.remark.trim() || undefined,
      }));

    if (clean.length === 0) return setErrorMessage('Add at least one valid band.');

    try {
      await bulkCreate({ scaleId: selectedScaleId, bands: clean }).unwrap();
      setSuccessMessage(`Created ${clean.length} bands.`);
      setBulkRows([{ minScore: '', maxScore: '', grade: '', points: '', descriptor: '', remark: '' }]);
      setShowBulk(false);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Bulk create failed.');
    }
  };

  const handleDelete = async (id: string, grade: string) => {
    if (!window.confirm(`Delete band "${grade}"?`)) return;
    try {
      await deleteBand(id).unwrap();
      setSuccessMessage(`Band "${grade}" deleted.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Delete failed.');
    }
  };

  const handleDeleteAll = async () => {
    if (!selectedScaleId) return;
    if (!window.confirm('Delete ALL bands for this scale? This cannot be undone.')) return;
    try {
      await deleteAllBands(selectedScaleId).unwrap();
      setSuccessMessage('All bands deleted.');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Bulk delete failed.');
    }
  };

  const isValid = (validationData as any)?.valid;
  const issues: string[] = (validationData as any)?.issues ?? [];

  return (
    <div className="space-y-6">
      {/* Scale selector */}
      <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-black uppercase tracking-wider opacity-70">Scale</span>
          </div>
          <select
            value={selectedScaleId}
            onChange={(e) => onSelectScale(e.target.value)}
            className="flex-1 max-w-md px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="">-- Choose scale --</option>
            {scales.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {selectedScaleId && (
            <>
              <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 ${
                isValid === true ? 'bg-success/10 text-success' :
                isValid === false ? 'bg-error/10 text-error' :
                'bg-base-200 text-base-content/70'
              }`}>
                {isValid === true ? <CheckCircle2 className="w-3 h-3" /> :
                 isValid === false ? <AlertTriangle className="w-3 h-3" /> :
                 <Info className="w-3 h-3" />}
                {isValid === true ? 'Valid' : isValid === false ? `${issues.length} issues` : 'Not validated'}
              </div>
              {bands.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg bg-error/10 text-error hover:bg-error hover:text-error-content transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" /> Clear All
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {!selectedScaleId ? (
        <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl bg-base-200/20">
          Select a scale to manage its bands.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT: Forms ── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Single band form */}
            <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-base-300">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight">
                    {isEditing ? 'Edit Band' : 'Add Band'}
                  </h2>
                </div>
                {isEditing && (
                  <button onClick={resetForm} className="text-xs text-error font-bold hover:underline cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Min Score</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.minScore}
                      onChange={(e) => setForm({ ...form, minScore: e.target.value })}
                      placeholder="80.00"
                      required
                      className="w-full px-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Max Score</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.maxScore}
                      onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                      placeholder="100.00"
                      required
                      className="w-full px-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Grade</label>
                    <input
                      type="text"
                      value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value.toUpperCase() })}
                      placeholder="A"
                      required
                      className="w-full px-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-black uppercase text-center focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Points</label>
                    <input
                      type="number"
                      value={form.points}
                      onChange={(e) => setForm({ ...form, points: e.target.value })}
                      placeholder="4"
                      className="w-full px-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Descriptor</label>
                  <input
                    type="text"
                    value={form.descriptor}
                    onChange={(e) => setForm({ ...form, descriptor: e.target.value })}
                    placeholder="e.g. Excellent"
                    className="w-full px-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Remark (optional)</label>
                  <input
                    type="text"
                    value={form.remark}
                    onChange={(e) => setForm({ ...form, remark: e.target.value })}
                    placeholder="Outstanding work."
                    className="w-full px-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating || updating}
                  className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                >
                  {creating || updating ? 'Saving…' : isEditing ? 'Update Band' : 'Add Band'}
                </button>
              </form>
            </div>

            {/* Bulk import collapsible */}
            <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
              <button
                type="button"
                onClick={() => setShowBulk(!showBulk)}
                className="w-full flex items-center justify-between gap-3 pb-2 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-black tracking-tight">Bulk Import</h2>
                    <p className="text-[11px] opacity-60">Add multiple bands at once</p>
                  </div>
                </div>
                {showBulk ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
              </button>

              {showBulk && (
                <form onSubmit={handleBulkSubmit} className="space-y-3">
                  {bulkRows.map((row, idx) => (
                    <div key={idx} className="p-3 bg-base-100 border border-base-300 rounded-xl space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.minScore}
                          onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, minScore: e.target.value } : r))}
                          placeholder="Min"
                          className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px] font-mono"
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.maxScore}
                          onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, maxScore: e.target.value } : r))}
                          placeholder="Max"
                          className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px] font-mono"
                        />
                        <input
                          type="text"
                          value={row.grade}
                          onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, grade: e.target.value.toUpperCase() } : r))}
                          placeholder="Grade"
                          className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px] font-black uppercase text-center"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          value={row.points}
                          onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, points: e.target.value } : r))}
                          placeholder="Points"
                          className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px] font-mono"
                        />
                        <input
                          type="text"
                          value={row.descriptor}
                          onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, descriptor: e.target.value } : r))}
                          placeholder="Descriptor"
                          className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px] col-span-2"
                        />
                      </div>
                      {bulkRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBulkRows(bulkRows.filter((_, i) => i !== idx))}
                          className="text-[10px] text-error font-bold hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setBulkRows([...bulkRows, { minScore: '', maxScore: '', grade: '', points: '', descriptor: '', remark: '' }])}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
                  >
                    <PlusCircle className="w-3 h-3" /> Add row
                  </button>
                  <button
                    type="submit"
                    disabled={bulkCreating}
                    className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                  >
                    {bulkCreating ? 'Creating…' : `Create ${bulkRows.filter((r) => r.grade.trim() && !isNaN(Number(r.minScore)) && !isNaN(Number(r.maxScore))).length} bands`}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ── RIGHT: Bands list + visual preview ── */}
          <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-base-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                  <Layers className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black tracking-tight">Bands</h2>
              </div>
              <span className="text-xs font-mono font-bold opacity-60">{bands.length} total</span>
            </div>

            {/* Visual band scale */}
            {bands.length > 0 && (
              <div className="p-4 bg-base-100 border border-base-300 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-2">Coverage Preview</p>
                <div className="relative h-12 rounded-lg overflow-hidden flex bg-base-200">
                  {bands.map((b, idx) => {
                    const min = Number(b.minScore);
                    const max = Number(b.maxScore);
                    const width = ((max - min) / 100) * 100;
                    const left = (min / 100) * 100;
                    const tone = bandTone(b.grade);
                    return (
                      <div
                        key={b.id ?? idx}
                        className={`absolute h-full ${tone.solid} flex items-center justify-center text-white text-[10px] font-black uppercase`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${b.grade}: ${b.minScore}–${b.maxScore}`}
                      >
                        {b.grade}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] font-mono opacity-60 mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            )}

            {/* Bands list */}
            {isLoading ? (
              <div className="p-8 text-center text-xs opacity-60">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading bands…
              </div>
            ) : bands.length === 0 ? (
              <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
                No bands yet. Add some on the left.
              </div>
            ) : (
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {bands.map((b) => {
                  const tone = bandTone(b.grade);
                  return (
                    <div key={b.id} className="p-3 bg-base-100 border border-base-300 rounded-xl hover:border-primary transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`shrink-0 w-12 h-12 rounded-lg grid place-items-center ${tone.bg} ${tone.text} font-black text-base`}>
                          {b.grade}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black font-mono">{b.minScore} – {b.maxScore}</span>
                            {b.points != null && (
                              <span className="px-1.5 py-0.5 bg-base-200 text-[10px] font-mono font-bold rounded">
                                {b.points} pts
                              </span>
                            )}
                          </div>
                          {b.descriptor && (
                            <p className="text-[10px] opacity-60 mt-0.5">{b.descriptor}</p>
                          )}
                          {b.remark && (
                            <p className="text-[10px] italic opacity-50 mt-0.5 truncate">{b.remark}</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(b)}
                            className="p-1.5 bg-base-200 rounded-lg hover:bg-primary/20 hover:text-primary transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id, b.grade)}
                            className="p-1.5 bg-error/10 text-error rounded-lg hover:bg-error hover:text-error-content transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   RESOLVE TAB
   ════════════════════════════════════════════════════════════════ */
function ResolveTab({
  schoolId, selectedScaleId, onSelectScale, primaryColor, secondaryColor,
}: {
  schoolId: string;
  selectedScaleId: string;
  onSelectScale: (id: string) => void;
  primaryColor: string;
  secondaryColor: string;
}) {
  const [mark, setMark] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const { data: scalesData } = useGetScalesBySchoolQuery(schoolId, { skip: !schoolId });
  const scales = useMemo(() => extractScales(scalesData), [scalesData]);

  const { data: bandsData } = useGetBandsByScaleQuery(selectedScaleId, { skip: !selectedScaleId });
  const bands = useMemo(() => extractBands(bandsData), [bandsData]);

  const [resolveMark, { isLoading }] = useResolveMarkMutation();

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!selectedScaleId) return setError('Select a scale first.');
    const n = Number(mark);
    if (isNaN(n) || n < 0 || n > 100) return setError('Mark must be between 0 and 100.');

    try {
      const res = await resolveMark({ scaleId: selectedScaleId, mark }).unwrap();
      setResult(res);
    } catch (err: any) {
      setError(err?.data?.message || 'Resolve failed.');
    }
  };

  const resolvedBand = result?.result?.band ?? result?.band ?? null;
  const resolvedGrade = result?.result?.grade ?? result?.grade ?? null;
  const tone = resolvedGrade ? bandTone(resolvedGrade) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── LEFT: Calculator ── */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-base-300 border-b">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Resolve Mark</h2>
              <p className="text-[11px] opacity-60">Mark → Grade lookup</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Scale</label>
            <select
              value={selectedScaleId}
              onChange={(e) => { onSelectScale(e.target.value); setResult(null); setError(''); }}
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="">-- Choose scale --</option>
              {scales.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleResolve} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Mark (0–100)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary">
                  <Hash className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={mark}
                  onChange={(e) => setMark(e.target.value)}
                  placeholder="85.00"
                  required
                  className="w-full pl-10 pr-3 py-3 bg-base-100 border border-base-300 rounded-2xl text-sm font-bold font-mono text-center focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-error/10 border border-error/20 text-error text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !selectedScaleId}
              className="w-full text-white font-black py-3.5 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
            >
              {isLoading ? 'Resolving…' : 'Resolve Mark'}
            </button>
          </form>

          {/* Quick picks */}
          {selectedScaleId && bands.length > 0 && (
            <div className="pt-3 border-t border-base-300">
              <p className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-2">Quick test</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[25, 50, 75, 95].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMark(String(m))}
                    className="text-[10px] font-bold font-mono px-2 py-1.5 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 transition-all cursor-pointer"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Result ── */}
      <div className="lg:col-span-7 space-y-4">
        {!selectedScaleId ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl bg-base-200/20">
            Pick a scale to resolve marks.
          </div>
        ) : !result ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl bg-base-200/20">
            Enter a mark on the left to see the resolved grade.
          </div>
        ) : (
          <>
            {/* Big result card */}
            <div className={`p-8 rounded-3xl border-2 shadow-xl ${tone?.bg} ${tone?.text.replace('text-', 'border-')}`}>
              <p className="text-[11px] font-black uppercase tracking-wider opacity-70 mb-3">Resolved Grade</p>
              <div className="flex items-end gap-4 flex-wrap">
                <span className={`text-7xl font-black ${tone?.text}`}>{resolvedGrade}</span>
                <div className="space-y-1">
                  <p className="text-sm font-mono font-black opacity-80">
                    {resolvedBand?.minScore} – {resolvedBand?.maxScore}
                  </p>
                  {result.result?.points != null && (
                    <p className="text-xs font-bold opacity-70">{result.result.points} points</p>
                  )}
                </div>
              </div>
              {result.result?.descriptor && (
                <p className="mt-4 text-sm font-bold">{result.result.descriptor}</p>
              )}
              {result.result?.remark && (
                <p className="mt-1 text-xs italic opacity-70">{result.result.remark}</p>
              )}
            </div>

            {/* Breakdown */}
            <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-2xl shadow-sm space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-1">Raw Response</p>
              <pre className="text-[10px] font-mono p-3 bg-base-100 border border-base-300 rounded-xl overflow-x-auto max-h-48 overflow-y-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>

            {/* Band map */}
            {bands.length > 0 && (
              <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-2xl shadow-sm space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-60">All Bands</p>
                <div className="space-y-1.5">
                  {bands.map((b) => {
                    const t = bandTone(b.grade);
                    const isMatch = b.grade === resolvedGrade;
                    return (
                      <div
                        key={b.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                          isMatch ? `${t.bg} ring-2 ${t.text.replace('text-', 'ring-')}` : 'bg-base-100'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg grid place-items-center text-xs font-black ${t.bg} ${t.text}`}>
                          {b.grade}
                        </span>
                        <span className="text-xs font-mono font-bold">{b.minScore} – {b.maxScore}</span>
                        <span className="text-[10px] opacity-60 ml-auto">{b.descriptor ?? ''}</span>
                        {isMatch && <ArrowRight className={`w-3 h-3 ${t.text}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   VALIDATION TAB
   ════════════════════════════════════════════════════════════════ */
function ValidationTab({
  schoolId, selectedScaleId, onSelectScale, primaryColor, secondaryColor,
}: {
  schoolId: string;
  selectedScaleId: string;
  onSelectScale: (id: string) => void;
  primaryColor: string;
  secondaryColor: string;
}) {
  const { data: scalesData } = useGetScalesBySchoolQuery(schoolId, { skip: !schoolId });
  const scales = useMemo(() => extractScales(scalesData), [scalesData]);

  const { data: bandsData } = useGetBandsByScaleQuery(selectedScaleId, { skip: !selectedScaleId });
  const bands = useMemo(() => {
    const raw = extractBands(bandsData);
    return [...raw].sort((a, b) => Number(b.minScore) - Number(a.minScore));
  }, [bandsData]);

  const { data: validationData, isLoading } = useValidateScaleQuery(selectedScaleId, { skip: !selectedScaleId });

  const valid = (validationData as any)?.valid;
  const issues: string[] = (validationData as any)?.issues ?? [];
  const warnings: string[] = (validationData as any)?.warnings ?? [];

  // Compute coverage gaps for visual hint
  const coverage = useMemo(() => {
    if (bands.length === 0) return { gaps: [], coveragePct: 0, totalBands: 0 };
    const sorted = [...bands].sort((a, b) => Number(a.minScore) - Number(b.minScore));
    const gaps: Array<{ from: number; to: number }> = [];
    let cursor = 0;
    let covered = 0;
    sorted.forEach((b) => {
      const min = Number(b.minScore);
      const max = Number(b.maxScore);
      if (min > cursor) gaps.push({ from: cursor, to: min });
      covered += max - min;
      cursor = Math.max(cursor, max);
    });
    if (cursor < 100) gaps.push({ from: cursor, to: 100 });
    return { gaps, coveragePct: Math.min(100, covered), totalBands: bands.length };
  }, [bands]);

  return (
    <div className="space-y-6">
      {/* Scale selector */}
      <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-black uppercase tracking-wider opacity-70">Scale</span>
          </div>
          <select
            value={selectedScaleId}
            onChange={(e) => onSelectScale(e.target.value)}
            className="flex-1 max-w-md px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="">-- Choose scale --</option>
            {scales.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedScaleId ? (
        <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl bg-base-200/20">
          Pick a scale to validate its coverage.
        </div>
      ) : isLoading ? (
        <div className="p-8 text-center text-xs opacity-60">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Validating…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT: Status + issues ── */}
          <div className="lg:col-span-5 space-y-4">
            {/* Status card */}
            <div className={`p-8 rounded-3xl border-2 shadow-xl ${
              valid === true
                ? 'bg-success/5 border-success/30'
                : valid === false
                ? 'bg-error/5 border-error/30'
                : 'bg-base-200/40 border-base-300'
            }`}>
              <div className="flex items-center gap-3">
                {valid === true ? (
                  <>
                    <div className="p-3 bg-success/10 text-success rounded-2xl">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-success">Valid Scale</p>
                      <p className="text-xs opacity-60 mt-0.5">Fully covered, no overlaps</p>
                    </div>
                  </>
                ) : valid === false ? (
                  <>
                    <div className="p-3 bg-error/10 text-error rounded-2xl">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-error">Issues Found</p>
                      <p className="text-xs opacity-60 mt-0.5">{issues.length} issue{issues.length === 1 ? '' : 's'} detected</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-base-300 rounded-2xl">
                      <Info className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xl font-black opacity-70">Not Validated</p>
                      <p className="text-xs opacity-60 mt-0.5">No validation data returned</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Issues list */}
            {issues.length > 0 && (
              <div className="bg-error/5 border border-error/20 rounded-2xl p-5 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-error">Issues</p>
                <ul className="space-y-1.5">
                  {issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-error">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-warning/5 border border-warning/20 rounded-2xl p-5 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-warning">Warnings</p>
                <ul className="space-y-1.5">
                  {warnings.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-warning">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatTile icon={Layers} label="Total Bands" value={coverage.totalBands} tone="primary" />
              <StatTile
                icon={Percent}
                label="Coverage"
                value={`${coverage.coveragePct.toFixed(0)}%`}
                tone={coverage.coveragePct === 100 ? 'success' : 'warning'}
              />
            </div>
          </div>

          {/* ── RIGHT: Coverage visualization ── */}
          <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-base-300">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Coverage Map</h2>
                <p className="text-[11px] opacity-60">Visual band coverage across 0–100</p>
              </div>
            </div>

            {bands.length === 0 ? (
              <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
                No bands yet for this scale.
              </div>
            ) : (
              <>
                {/* Horizontal coverage bar */}
                <div className="p-4 bg-base-100 border border-base-300 rounded-2xl">
                  <div className="relative h-16 rounded-lg overflow-hidden bg-base-200">
                    {coverage.gaps.map((gap, idx) => (
                      <div
                        key={`gap-${idx}`}
                        className="absolute h-full bg-error/20 border-x-2 border-error"
                        style={{ left: `${gap.from}%`, width: `${gap.to - gap.from}%` }}
                        title={`Gap: ${gap.from}–${gap.to}`}
                      />
                    ))}
                    {bands.map((b, idx) => {
                      const min = Number(b.minScore);
                      const max = Number(b.maxScore);
                      const width = ((max - min) / 100) * 100;
                      const left = (min / 100) * 100;
                      const tone = bandTone(b.grade);
                      return (
                        <div
                          key={b.id ?? idx}
                          className={`absolute h-full ${tone.solid} flex items-center justify-center text-white text-[10px] font-black uppercase border-r border-white/30`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${b.grade}: ${b.minScore}–${b.maxScore}`}
                        >
                          {width > 4 && b.grade}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono opacity-60 mt-1.5">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                </div>

                {/* Gaps list */}
                {coverage.gaps.length > 0 && (
                  <div className="p-4 bg-error/5 border border-error/20 rounded-2xl space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-error">Coverage Gaps</p>
                    <div className="flex flex-wrap gap-2">
                      {coverage.gaps.map((gap, idx) => (
                        <span key={idx} className="px-2 py-1 bg-error/10 text-error text-[10px] font-mono font-bold rounded-lg">
                          {gap.from} – {gap.to}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Band legend */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-2">Legend</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {bands.map((b) => {
                      const tone = bandTone(b.grade);
                      return (
                        <div key={b.id} className="flex items-center gap-2 px-2 py-1.5 bg-base-100 border border-base-300 rounded-lg">
                          <span className={`w-6 h-6 rounded grid place-items-center ${tone.bg} ${tone.text} text-[10px] font-black`}>
                            {b.grade}
                          </span>
                          <span className="text-[10px] font-mono opacity-70">{b.minScore}–{b.maxScore}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED
   ════════════════════════════════════════════════════════════════ */
type SectionProps = {
  schoolId: string;
  primaryColor: string;
  secondaryColor: string;
  setSuccessMessage: (v: string) => void;
  setErrorMessage: (v: string) => void;
};

function StatTile({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone: 'primary' | 'success' | 'warning';
}) {
  const toneMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  }[tone];

  return (
    <div className="p-4 bg-base-100 border border-base-300 rounded-2xl">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${toneMap}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</p>
      </div>
      <p className="text-xl font-black text-base-content truncate">{value}</p>
    </div>
  );
}