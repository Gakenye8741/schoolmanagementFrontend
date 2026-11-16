import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  Calendar, Clock, PlusCircle, CheckCircle2, AlertCircle, Trash2, Edit3,
  Layers, Sparkles, Building, Crown, Archive, ShieldCheck, Copy,
  Layers3, Filter, ChevronDown, ChevronUp, Loader2, X, Save, Wand2,
  CalendarDays, AlertTriangle, Zap, History,
} from 'lucide-react';

import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';

import {
  // 1–6 CRUD
  useCreateTermMutation,
  useGetTermsBySchoolIdQuery,
  useGetCurrentTermBySchoolIdQuery,
  useUpdateTermMutation,
  useDeleteTermMutation,
  // 7–13 Advanced reads
  useGetTermYearsQuery,
  useGetTermsByStatusQuery,
  useCountTermsBySchoolQuery,
  // 14–18 State
  useSetCurrentTermMutation,
  useClearCurrentTermMutation,
  useChangeTermStatusMutation,
  useArchiveTermMutation,
  useGetTermReadinessQuery,
  // 19–26 Windows CRUD
  useCreateTermWindowMutation,
  useGetWindowsByTermIdQuery,
  useGetWindowsByTermAndTypeQuery,
  useCountWindowsByTermQuery,
  useUpdateTermWindowMutation,
  useDeleteTermWindowMutation,
  useDeleteAllWindowsForTermMutation,
  // 27–30 Windows advanced
  useGetActiveWindowsForSchoolQuery,
  useGetUpcomingWindowsForSchoolQuery,
  useCopyTermWindowsMutation,
  useBulkCreateTermWindowsMutation,
  type AcademicTerm,
  type TermWindow,
  type WindowType,
} from '../../features/Apis/Term.Api';

const WINDOW_TYPES: { value: WindowType; label: string; tone: string }[] = [
  { value: 'mid_term_break', label: 'Mid-Term Break', tone: 'bg-amber-100 text-amber-700' },
  { value: 'cat_week', label: 'CAT Week', tone: 'bg-sky-100 text-sky-700' },
  { value: 'exam_week', label: 'Exam Week', tone: 'bg-rose-100 text-rose-700' },
  { value: 'registration_deadline', label: 'Registration Deadline', tone: 'bg-violet-100 text-violet-700' },
];

type Tab = 'terms' | 'windows';

export default function TermManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const [activeTab, setActiveTab] = useState<Tab>('terms');
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
              <Sparkles className="w-3.5 h-3.5" /> School Calendar
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">Manage Terms & Schedules</h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Set up school terms, exam weeks, breaks, and registration deadlines for {schoolName}.
            </p>
          </div>
          <CurrentTermCard schoolId={currentSchoolId} primaryColor={primaryColor} secondaryColor={secondaryColor} />
        </div>
      </div>

      {/* ─────────── TABS ─────────── */}
      <div className="flex flex-wrap gap-3 border-b border-base-300 pb-4">
        {[
          { id: 'terms' as Tab, label: 'Academic Terms', icon: Calendar },
          { id: 'windows' as Tab, label: 'Breaks & Exam Schedules', icon: Layers },
        ].map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSuccessMessage(''); setErrorMessage(''); }}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                active ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'bg-base-200/50 hover:bg-base-200 opacity-75'
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
          <button onClick={() => setSuccessMessage('')} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ─────────── CONTENT ─────────── */}
      {activeTab === 'terms' && (
        <TermsTab
          schoolId={currentSchoolId}
          schoolName={schoolName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'windows' && (
        <WindowsTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CURRENT TERM CARD (in header)
   ════════════════════════════════════════════════════════════════ */
function CurrentTermCard({ schoolId, primaryColor, secondaryColor }: { schoolId: string; primaryColor: string; secondaryColor: string }) {
  const { data } = useGetCurrentTermBySchoolIdQuery(schoolId, { skip: !schoolId });
  const term = data?.term;

  return (
    <div className="flex items-center gap-4 bg-base-100/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-base-300 shadow-sm">
      <div className="p-3 bg-primary/10 text-primary rounded-xl" style={{ borderLeft: `4px solid ${secondaryColor}` }}>
        <Crown className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Current Active Term</p>
        <p className="text-lg font-black text-primary">
          {term ? `${term.termName} (${term.academicYear})` : 'No Active Term'}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TERMS TAB
   ════════════════════════════════════════════════════════════════ */
function TermsTab({
  schoolId, schoolName, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: {
  schoolId: string; schoolName: string; primaryColor: string; secondaryColor: string;
  setSuccessMessage: (v: string) => void; setErrorMessage: (v: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    academicYear: '2026',
    termName: 'Term 1',
    startDate: '', endDate: '',
    status: 'active', isCurrentTerm: true,
  });
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showReadinessFor, setShowReadinessFor] = useState<string | null>(null);

  // Queries
  const { data: allData, isLoading, error } = useGetTermsBySchoolIdQuery(schoolId);
  const { data: yearsData } = useGetTermYearsQuery(schoolId, { skip: !schoolId });
  const { data: countData } = useCountTermsBySchoolQuery(schoolId, { skip: !schoolId });
  const { data: filteredByYear } = useGetTermsBySchoolIdQuery(schoolId, { skip: !schoolId }); // fallback
  const { data: byYearData } = (yearFilter
    ? { data: { terms: (allData?.terms ?? []).filter((t) => t.academicYear === yearFilter) } as any }
    : { data: { terms: allData?.terms ?? [] } });
  const { data: byStatusData } = useGetTermsByStatusQuery(
    { schoolId, status: statusFilter },
    { skip: !schoolId || !statusFilter }
  );

  // Mutations
  const [createTerm, { isLoading: creating }] = useCreateTermMutation();
  const [updateTerm, { isLoading: updating }] = useUpdateTermMutation();
  const [deleteTerm] = useDeleteTermMutation();
  const [setCurrentTerm] = useSetCurrentTermMutation();
  const [clearCurrentTerm] = useClearCurrentTermMutation();
  const [changeStatus] = useChangeTermStatusMutation();
  const [archiveTerm] = useArchiveTermMutation();

  const terms: AcademicTerm[] = useMemo(() => {
    let list = allData?.terms ?? [];
    if (yearFilter) list = list.filter((t) => t.academicYear === yearFilter);
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    return [...list].sort((a, b) => {
      if (a.academicYear !== b.academicYear) return b.academicYear.localeCompare(a.academicYear);
      return a.termName.localeCompare(b.termName);
    });
  }, [allData, yearFilter, statusFilter]);

  const years: string[] = yearsData?.years ?? Array.from(new Set((allData?.terms ?? []).map((t) => t.academicYear)));

  const resetForm = () => {
    setForm({ academicYear: '2026', termName: 'Term 1', startDate: '', endDate: '', status: 'active', isCurrentTerm: true });
    setIsEditing(false); setEditingId(null);
  };

  const handleEdit = (t: AcademicTerm) => {
    setForm({
      academicYear: t.academicYear,
      termName: t.termName,
      startDate: t.startDate ? t.startDate.split('T')[0] : '',
      endDate: t.endDate ? t.endDate.split('T')[0] : '',
      status: t.status,
      isCurrentTerm: t.isCurrentTerm,
    });
    setIsEditing(true); setEditingId(t.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    try {
      if (isEditing && editingId) {
        await updateTerm({
          termId: editingId,
          patch: {
            termName: form.termName,
            status: form.status,
            startDate: form.startDate,
            endDate: form.endDate,
            academicYear: form.academicYear,
            isCurrentTerm: form.isCurrentTerm,
          },
        }).unwrap();
        setSuccessMessage(`Successfully updated term: ${form.termName}`);
        resetForm();
      } else {
        await createTerm({ schoolId, ...form }).unwrap();
        setSuccessMessage(`Successfully created term: ${form.termName}`);
        resetForm();
      }
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Operation failed. Please check your details.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete term "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTerm(id).unwrap();
      setSuccessMessage(`Term "${name}" deleted.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Delete failed.');
    }
  };

  const handleSetCurrent = async (id: string, name: string) => {
    try {
      await setCurrentTerm({ schoolId, termId: id }).unwrap();
      setSuccessMessage(`"${name}" is now the current term.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to set current term.');
    }
  };

  const handleClearCurrent = async () => {
    try {
      await clearCurrentTerm(schoolId).unwrap();
      setSuccessMessage('Current term cleared.');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to clear current term.');
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!window.confirm(`Archive term "${name}"?`)) return;
    try {
      await archiveTerm(id).unwrap();
      setSuccessMessage(`"${name}" archived.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Archive failed.');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await changeStatus({ termId: id, status }).unwrap();
      setSuccessMessage(`Status updated to "${status}".`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Status change failed.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── FORM ── */}
      <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><PlusCircle className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">{isEditing ? 'Edit Term' : 'Add New Term'}</h2>
          </div>
          {isEditing && (
            <button onClick={resetForm} className="text-xs text-error font-bold hover:underline cursor-pointer">Cancel Edit</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">School</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary"><Building className="w-4 h-4" /></span>
              <input type="text" value={schoolName} disabled className="w-full pl-10 pr-3 py-3 bg-base-300/50 border border-base-300 rounded-2xl text-xs font-bold opacity-80 cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Academic Year</label>
              <input type="text" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="2026" required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Term Name</label>
              <input type="text" value={form.termName} onChange={(e) => setForm({ ...form, termName: e.target.value })} placeholder="Term 1" required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-bold cursor-pointer">
                <input type="checkbox" checked={form.isCurrentTerm} onChange={(e) => setForm({ ...form, isCurrentTerm: e.target.checked })} className="checkbox checkbox-primary checkbox-xs" />
                Make Current Term
              </label>
            </div>
          </div>

          <button type="submit" disabled={creating || updating} className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-4" style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}>
            {creating || updating ? 'Saving...' : isEditing ? 'Update Term' : 'Create Term'}
          </button>
        </form>

        {/* Current term controls */}
        <div className="pt-4 border-t border-base-300 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider opacity-60">School-wide</p>
          <button
            onClick={handleClearCurrent}
            className="w-full text-xs font-bold py-2.5 px-4 rounded-2xl border border-error/30 text-error bg-error/5 hover:bg-error/10 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <X className="w-3.5 h-3.5" /> Clear current active term
          </button>
        </div>
      </div>

      {/* ── LIST ── */}
      <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}><Calendar className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">All Academic Terms</h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{countData?.count ?? terms.length} terms</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="pl-8 pr-8 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl cursor-pointer focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl cursor-pointer focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          {(yearFilter || statusFilter) && (
            <button
              onClick={() => { setYearFilter(''); setStatusFilter(''); }}
              className="text-xs font-bold text-primary hover:underline px-2 cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading terms…</div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-error">Failed to load terms.</div>
          ) : terms.length === 0 ? (
            <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
              {yearFilter || statusFilter ? 'No terms match the current filters.' : 'No academic terms found for this school yet.'}
            </div>
          ) : (
            terms.map((t) => (
              <TermCard
                key={t.id}
                term={t}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                showReadiness={showReadinessFor === t.id}
                onToggleReadiness={() => setShowReadinessFor(showReadinessFor === t.id ? null : t.id)}
                onEdit={() => handleEdit(t)}
                onDelete={() => handleDelete(t.id, t.termName)}
                onSetCurrent={() => handleSetCurrent(t.id, t.termName)}
                onArchive={() => handleArchive(t.id, t.termName)}
                onStatusChange={(s) => handleStatusChange(t.id, s)}
                onViewWindows={() => { /* handled in parent by switching tab; see below */ }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TERM CARD
   ════════════════════════════════════════════════════════════════ */
function TermCard({
  term, primaryColor, secondaryColor, showReadiness, onToggleReadiness,
  onEdit, onDelete, onSetCurrent, onArchive, onStatusChange, onViewWindows,
}: {
  term: AcademicTerm; primaryColor: string; secondaryColor: string;
  showReadiness: boolean; onToggleReadiness: () => void;
  onEdit: () => void; onDelete: () => void; onSetCurrent: () => void;
  onArchive: () => void; onStatusChange: (s: string) => void; onViewWindows: () => void;
}) {
  const { data: readiness, isFetching } = useGetTermReadinessQuery(term.id, { skip: !showReadiness });
  const { data: windowCount } = useCountWindowsByTermQuery(term.id);

  const statusColor: Record<string, string> = {
    active: 'bg-success/10 text-success',
    upcoming: 'bg-info/10 text-info',
    completed: 'bg-base-300 text-base-content/70',
    archived: 'bg-base-300 text-base-content/50',
  };

  return (
    <div className="p-5 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-sm text-primary">{term.termName} ({term.academicYear})</h3>
            {term.isCurrentTerm && (
              <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-extrabold uppercase rounded-lg inline-flex items-center gap-1">
                <Crown className="w-3 h-3" /> Current
              </span>
            )}
            <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-lg ${statusColor[term.status] ?? 'bg-base-300'}`}>
              {term.status}
            </span>
            {windowCount && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold uppercase rounded-lg">
                {windowCount.count} windows
              </span>
            )}
          </div>
          <p className="text-xs font-mono opacity-70">
            {new Date(term.startDate).toLocaleDateString()} — {new Date(term.endDate).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto justify-end flex-wrap">
          {!term.isCurrentTerm && (
            <button
              onClick={onSetCurrent}
              className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer bg-success/10 text-success hover:bg-success hover:text-success-content"
              title="Set as current term"
            >
              <Crown className="w-3 h-3 inline mr-1" /> Set current
            </button>
          )}
          <button
            onClick={onToggleReadiness}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${showReadiness ? 'bg-primary text-primary-content' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
            title="Check readiness"
          >
            <ShieldCheck className="w-3 h-3 inline mr-1" /> {showReadiness ? 'Hide' : 'Readiness'}
          </button>
          <button onClick={onEdit} className="p-2 bg-base-200 rounded-xl hover:bg-primary/20 hover:text-primary transition-all" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
          <button onClick={onArchive} className="p-2 bg-warning/10 text-warning rounded-xl hover:bg-warning hover:text-warning-content transition-all" title="Archive"><Archive className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Status changer */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] font-black uppercase opacity-60">Status:</span>
        <select
          value={term.status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="text-[10px] font-bold bg-base-200 border border-base-300 rounded-lg px-2 py-1 cursor-pointer"
        >
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Readiness panel */}
      {showReadiness && (
        <div className="mt-3 p-3 bg-base-200/60 rounded-xl border border-base-300">
          {isFetching ? (
            <p className="text-xs opacity-60"><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Checking readiness…</p>
          ) : readiness ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {readiness.ready ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-xs font-bold text-success">Ready to activate</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-xs font-bold text-warning">Not ready — issues found</span>
                  </>
                )}
              </div>
              {readiness.issues && readiness.issues.length > 0 && (
                <ul className="list-disc list-inside text-[11px] text-warning space-y-0.5">
                  {readiness.issues.map((issue, idx) => <li key={idx}>{issue}</li>)}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-xs opacity-60">No readiness data.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   WINDOWS TAB
   ════════════════════════════════════════════════════════════════ */
function WindowsTab({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: {
  schoolId: string; primaryColor: string; secondaryColor: string;
  setSuccessMessage: (v: string) => void; setErrorMessage: (v: string) => void;
}) {
  const [selectedTermId, setSelectedTermId] = useState('');
  const [typeFilter, setTypeFilter] = useState<WindowType | ''>('');
  const [form, setForm] = useState({
    windowType: 'mid_term_break' as WindowType,
    title: '', startDate: '', endDate: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', startDate: '', endDate: '' });

  // Bulk state
  const [showBulk, setShowBulk] = useState(false);
  const [bulkRows, setBulkRows] = useState<Array<{ windowType: WindowType; title: string; startDate: string; endDate: string }>>([
    { windowType: 'cat_week', title: 'CAT Week', startDate: '', endDate: '' },
  ]);

  // Copy state
  const [showCopy, setShowCopy] = useState(false);
  const [sourceTermId, setSourceTermId] = useState('');

  // Active/upcoming state
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);

  // Queries
  const { data: termsData } = useGetTermsBySchoolIdQuery(schoolId);
  const terms = termsData?.terms ?? [];
  const effectiveTermId = selectedTermId || terms.find((t) => t.isCurrentTerm)?.id || terms[0]?.id || '';

  const { data: windowsData, isLoading } = useGetWindowsByTermIdQuery(effectiveTermId, { skip: !effectiveTermId });
  const { data: byTypeData } = useGetWindowsByTermAndTypeQuery(
    { termId: effectiveTermId, windowType: typeFilter },
    { skip: !effectiveTermId || !typeFilter }
  );
  const { data: windowCount } = useCountWindowsByTermQuery(effectiveTermId, { skip: !effectiveTermId });
  const { data: activeWindows } = useGetActiveWindowsForSchoolQuery(
    { schoolId, onDate: activeDate },
    { skip: !schoolId || !activeDate }
  );
  const { data: upcomingWindows } = useGetUpcomingWindowsForSchoolQuery(
    { schoolId, daysAhead: 30 },
    { skip: !schoolId }
  );

  // Mutations
  const [createWindow, { isLoading: creating }] = useCreateTermWindowMutation();
  const [updateWindow, { isLoading: updating }] = useUpdateTermWindowMutation();
  const [deleteWindow] = useDeleteTermWindowMutation();
  const [deleteAllWindows] = useDeleteAllWindowsForTermMutation();
  const [bulkCreate, { isLoading: bulkCreating }] = useBulkCreateTermWindowsMutation();
  const [copyWindows, { isLoading: copying }] = useCopyTermWindowsMutation();

  const windows: TermWindow[] = useMemo(() => {
    const base = typeFilter ? (byTypeData?.windows ?? []) : (windowsData?.windows ?? []);
    return [...base].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [windowsData, byTypeData, typeFilter]);

  const resetForm = () => setForm({ windowType: 'mid_term_break', title: '', startDate: '', endDate: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!effectiveTermId) return setErrorMessage('Select a term first.');
    try {
      await createWindow({ termId: effectiveTermId, ...form }).unwrap();
      setSuccessMessage(`Schedule "${form.title}" created.`);
      resetForm();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to create schedule.');
    }
  };

  const handleEdit = (w: TermWindow) => {
    setEditingId(w.id);
    setEditForm({ title: w.title, startDate: w.startDate.split('T')[0], endDate: w.endDate.split('T')[0] });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await updateWindow({ windowId: editingId, patch: editForm }).unwrap();
      setSuccessMessage('Schedule updated.');
      setEditingId(null);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Update failed.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete schedule "${title}"?`)) return;
    try {
      await deleteWindow(id).unwrap();
      setSuccessMessage(`"${title}" deleted.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Delete failed.');
    }
  };

  const handleDeleteAll = async () => {
    if (!effectiveTermId) return;
    if (!window.confirm(`Delete ALL schedules for this term? This cannot be undone.`)) return;
    try {
      await deleteAllWindows(effectiveTermId).unwrap();
      setSuccessMessage('All schedules for this term deleted.');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Bulk delete failed.');
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveTermId) return;
    try {
      await bulkCreate({ termId: effectiveTermId, windows: bulkRows }).unwrap();
      setSuccessMessage(`Created ${bulkRows.length} schedules.`);
      setBulkRows([{ windowType: 'cat_week', title: 'CAT Week', startDate: '', endDate: '' }]);
      setShowBulk(false);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Bulk create failed.');
    }
  };

  const handleCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTermId || !effectiveTermId) return setErrorMessage('Choose source and target terms.');
    if (sourceTermId === effectiveTermId) return setErrorMessage('Source and target must differ.');
    try {
      await copyWindows({ sourceTermId, targetTermId: effectiveTermId }).unwrap();
      setSuccessMessage('Schedules copied successfully.');
      setShowCopy(false);
      setSourceTermId('');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Copy failed.');
    }
  };

  const typeInfo = (type: string) => WINDOW_TYPES.find((w) => w.value === type) ?? { label: type, tone: 'bg-base-300 text-base-content/70' };

  return (
    <div className="space-y-6">
      {/* ── Top strip: Active today + Upcoming ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-warning" />
            <h3 className="text-xs font-black uppercase tracking-wider">Active on date</h3>
            <input
              type="date"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="ml-auto text-[10px] font-mono bg-base-100 border border-base-300 rounded-lg px-2 py-1"
            />
          </div>
          {activeWindows && activeWindows.windows.length > 0 ? (
            <ul className="space-y-1.5">
              {activeWindows.windows.map((w) => (
                <li key={w.id} className="flex items-center gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${typeInfo(w.windowType).tone}`}>
                    {typeInfo(w.windowType).label}
                  </span>
                  <span className="font-bold truncate">{w.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs opacity-60">No schedules active on this date.</p>
          )}
        </div>

        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-wider">Upcoming (30 days)</h3>
          </div>
          {upcomingWindows && upcomingWindows.windows.length > 0 ? (
            <ul className="space-y-1.5">
              {upcomingWindows.windows.slice(0, 4).map((w) => (
                <li key={w.id} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] opacity-60">{new Date(w.startDate).toLocaleDateString()}</span>
                  <span className="font-bold truncate">{w.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs opacity-60">No upcoming schedules in the next 30 days.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── FORM ── */}
        <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Clock className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Add Schedule / Break</h2>
          </div>

          {/* Term selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Select Term</label>
            <select
              value={effectiveTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              required
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/25 focus:border-primary cursor-pointer"
            >
              <option value="">-- Choose Academic Term --</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.termName} ({t.academicYear}){t.isCurrentTerm ? ' · current' : ''}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Type</label>
                <select value={form.windowType} onChange={(e) => setForm({ ...form, windowType: e.target.value })} className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium cursor-pointer">
                  {WINDOW_TYPES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Term 1 Mid-Term" required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/25 focus:border-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Start</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium font-mono focus:ring-2 focus:ring-primary/25 focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">End</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium font-mono focus:ring-2 focus:ring-primary/25 focus:border-primary" />
              </div>
            </div>
            <button type="submit" disabled={creating} className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-2" style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}>
              {creating ? 'Adding…' : 'Add Schedule'}
            </button>
          </form>

          {/* Bulk create */}
          <div className="pt-4 border-t border-base-300">
            <button
              onClick={() => setShowBulk(!showBulk)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-bold hover:bg-base-200 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2"><Layers3 className="w-4 h-4 text-primary" /> Bulk create schedules</span>
              {showBulk ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showBulk && (
              <form onSubmit={handleBulkCreate} className="mt-3 space-y-2">
                {bulkRows.map((row, idx) => (
                  <div key={idx} className="p-3 bg-base-100 border border-base-300 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select value={row.windowType} onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, windowType: e.target.value as WindowType } : r))} className="text-[11px] px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg">
                        {WINDOW_TYPES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                      </select>
                      <input type="text" value={row.title} onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, title: e.target.value } : r))} placeholder="Title" className="text-[11px] px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={row.startDate} onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, startDate: e.target.value } : r))} className="text-[11px] px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg font-mono" />
                      <input type="date" value={row.endDate} onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, endDate: e.target.value } : r))} className="text-[11px] px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg font-mono" />
                    </div>
                    <button type="button" onClick={() => setBulkRows(bulkRows.filter((_, i) => i !== idx))} className="text-[10px] text-error font-bold hover:underline">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setBulkRows([...bulkRows, { windowType: 'exam_week', title: '', startDate: '', endDate: '' }])} className="text-[11px] font-bold text-primary hover:underline">+ Add row</button>
                <button type="submit" disabled={bulkCreating} className="w-full text-white font-black py-2.5 rounded-xl bg-primary text-xs uppercase tracking-wider cursor-pointer">
                  {bulkCreating ? 'Creating…' : `Create ${bulkRows.length} schedules`}
                </button>
              </form>
            )}
          </div>

          {/* Copy from term */}
          <div className="pt-4 border-t border-base-300">
            <button
              onClick={() => setShowCopy(!showCopy)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-bold hover:bg-base-200 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2"><Copy className="w-4 h-4 text-primary" /> Copy from another term</span>
              {showCopy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showCopy && (
              <form onSubmit={handleCopy} className="mt-3 space-y-2">
                <select value={sourceTermId} onChange={(e) => setSourceTermId(e.target.value)} className="w-full text-xs px-3 py-2 bg-base-100 border border-base-300 rounded-xl">
                  <option value="">-- Source term --</option>
                  {terms.filter((t) => t.id !== effectiveTermId).map((t) => (
                    <option key={t.id} value={t.id}>{t.termName} ({t.academicYear})</option>
                  ))}
                </select>
                <p className="text-[10px] opacity-60 text-center">Copy → current selected term</p>
                <button type="submit" disabled={copying || !sourceTermId} className="w-full text-white font-black py-2.5 rounded-xl bg-primary text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60">
                  {copying ? 'Copying…' : 'Copy schedules'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── LIST ── */}
        <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}><Layers className="w-5 h-5" /></div>
              <h2 className="text-lg font-black tracking-tight">Schedules for this Term</h2>
            </div>
            <span className="text-xs font-mono font-bold opacity-60">{windowCount?.count ?? windows.length} schedules</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as WindowType | '')}
              className="px-3 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl cursor-pointer"
            >
              <option value="">All types</option>
              {WINDOW_TYPES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
            {effectiveTermId && (
              <button onClick={handleDeleteAll} className="ml-auto px-3 py-2 text-xs font-bold bg-error/10 text-error border border-error/30 rounded-xl hover:bg-error/20 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Delete all
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading schedules…</div>
            ) : windows.length === 0 ? (
              <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
                {effectiveTermId ? 'No schedules for this term yet.' : 'Please choose an academic term to see its schedules.'}
              </div>
            ) : (
              windows.map((w) => {
                const info = typeInfo(w.windowType);
                if (editingId === w.id) {
                  return (
                    <form key={w.id} onSubmit={handleUpdate} className="p-4 bg-primary/5 border border-primary/30 rounded-2xl space-y-2">
                      <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-bold" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} className="px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-mono" />
                        <input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} className="px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-mono" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingId(null)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-base-200">Cancel</button>
                        <button type="submit" disabled={updating} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-content">
                          <Save className="w-3 h-3 inline mr-1" /> Save
                        </button>
                      </div>
                    </form>
                  );
                }
                return (
                  <div key={w.id} className="p-4 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all flex justify-between items-start gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-sm text-primary truncate">{w.title}</h3>
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-lg ${info.tone}`}>{info.label}</span>
                      </div>
                      <p className="text-xs font-mono opacity-70">
                        {new Date(w.startDate).toLocaleDateString()} — {new Date(w.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleEdit(w)} className="p-2 bg-base-200 rounded-xl hover:bg-primary/20 hover:text-primary transition-all" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(w.id, w.title)} className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}