import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  FileText, History, BarChart3, Sparkles, Building, Users, School,
  Award, AlertCircle, Clock, Timer, Ban, Bell, BellOff, Plus, X,
  Check, Trash2, Edit3, Save, Search, Loader2, ChevronDown, ChevronRight,
  Calendar, Filter, TrendingUp, Medal, CheckCircle2, ShieldAlert,
} from 'lucide-react';

import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import {
  useGetClassesBySchoolQuery,
  useGetGradeLevelsBySchoolQuery,
  type GradeLevel,
  type ClassEntity,
} from '../../features/Apis/academicStructure.Api';
import { useGetStudentsBySchoolQuery, type Student } from '../../features/Apis/students.Api';
import {
  useCreateIncidentMutation,
  useBulkCreateIncidentsMutation,
  useGetStudentIncidentsQuery,
  useGetClassIncidentsQuery,
  useGetSchoolIncidentsQuery,
  useUpdateIncidentMutation,
  useMarkIncidentNotifiedMutation,
  useGetStudentDisciplineSummaryQuery,
  useGetClassDisciplineSummaryQuery,
  useGetSchoolDisciplineStatsQuery,
  useGetDisciplineTrendQuery,
  useGetMeritStudentsQuery,
  type DisciplineIncident,
  type IncidentType,
} from '../../features/Apis/Discipline.Api';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const INCIDENT_TYPES: Array<{
  value: IncidentType;
  label: string;
  tone: string;
  bg: string;
  icon: React.ComponentType<{ className?: string }>;
  serious: boolean;
}> = [
  {
    value: 'Merit',
    label: 'Merit',
    tone: 'text-success',
    bg: 'bg-success/10 border-success/30',
    icon: Award,
    serious: true,
  },
  {
    value: 'Warning',
    label: 'Warning',
    tone: 'text-warning',
    bg: 'bg-warning/10 border-warning/30',
    icon: AlertCircle,
    serious: false,
  },
  {
    value: 'Detention',
    label: 'Detention',
    tone: 'text-orange-600',
    bg: 'bg-orange-100 border-orange-300',
    icon: Clock,
    serious: false,
  },
  {
    value: 'Late-coming',
    label: 'Late',
    tone: 'text-info',
    bg: 'bg-info/10 border-info/30',
    icon: Timer,
    serious: false,
  },
  {
    value: 'Suspension',
    label: 'Suspension',
    tone: 'text-error',
    bg: 'bg-error/10 border-error/30',
    icon: Ban,
    serious: true,
  },
];

const typeInfo = (type: string) =>
  INCIDENT_TYPES.find((t) => t.value === type) ??
  ({ value: type, label: type, tone: 'text-base-content/70', bg: 'bg-base-300 border-base-300', icon: FileText, serious: false } as any);

type Tab = 'record' | 'browse' | 'insights';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DisciplineManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const [activeTab, setActiveTab] = useState<Tab>('record');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-base-100 text-base-content min-h-screen">
      {/* HEADER */}
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
              <ShieldAlert className="w-3.5 h-3.5" /> Student Discipline
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">
              Discipline Manager
            </h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Record incidents, track behaviour, and monitor discipline trends for {schoolName}.
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

      {/* TABS */}
      <div className="flex flex-wrap gap-3 border-b border-base-300 pb-4">
        {[
          { id: 'record' as Tab, label: 'Record Incident', icon: FileText },
          { id: 'browse' as Tab, label: 'Browse Incidents', icon: History },
          { id: 'insights' as Tab, label: 'Insights', icon: BarChart3 },
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

      {/* ALERTS */}
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

      {/* CONTENT */}
      {activeTab === 'record' && (
        <RecordTab
          schoolId={currentSchoolId}
          schoolName={schoolName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'browse' && (
        <BrowseTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'insights' && (
        <InsightsTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════════════ */
function extractStudents(data: any): Student[] {
  if (!data) return [];
  const raw = data.students ?? data.data ?? data;
  return Array.isArray(raw) ? raw : [];
}

function extractClasses(data: any): ClassEntity[] {
  if (!data) return [];
  const raw = data.classes ?? data.data ?? data;
  return Array.isArray(raw) ? raw : [];
}

function extractGrades(data: any): GradeLevel[] {
  if (!data) return [];
  const raw = data.gradeLevels ?? data.data ?? data;
  return Array.isArray(raw) ? raw : [];
}

function extractIncidents(data: any): DisciplineIncident[] {
  if (!data) return [];
  const raw = data.records ?? data.incidents ?? data.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

function studentLabel(s: Student): string {
  const name = `${s.firstName ?? ''} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName ?? ''}`.trim() || 'Unnamed';
  return `${name}${s.admissionNumber ? ` · ${s.admissionNumber}` : ''}`;
}

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

function fmtTime(d?: string | null): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

/* ════════════════════════════════════════════════════════════════
   RECORD TAB
   ════════════════════════════════════════════════════════════════ */
function RecordTab({
  schoolId, schoolName, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps & { schoolName: string }) {
  // Single form state
  const [form, setForm] = useState({
    studentId: '',
    incidentType: 'Merit' as IncidentType,
    description: '',
    actionTaken: '',
    notify: true,
  });
  const [studentSearch, setStudentSearch] = useState('');

  // Bulk form state
  const [showBulk, setShowBulk] = useState(false);
  const [bulkNotify, setBulkNotify] = useState(true);
  const [bulkRows, setBulkRows] = useState<Array<{
    studentId: string;
    incidentType: IncidentType;
    description: string;
    actionTaken: string;
  }>>([{ studentId: '', incidentType: 'Late-coming', description: '', actionTaken: '' }]);

  // Data
  const { data: studentsData, isLoading: loadingStudents } = useGetStudentsBySchoolQuery(schoolId);
  const students: Student[] = useMemo(() => extractStudents(studentsData), [studentsData]);

  // Today's incidents (auto-refresh after create)
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);
  const todayEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, []);
  const { data: todayData, refetch: refetchToday } = useGetSchoolIncidentsQuery(
    { schoolId, fromDate: todayStart, toDate: todayEnd },
    { skip: !schoolId }
  );
  const todayIncidents = useMemo(() => extractIncidents(todayData), [todayData]);

  const studentMap = useMemo(() => {
    const m = new Map<string, Student>();
    students.forEach((s) => m.set(s.id, s));
    return m;
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = `${s.firstName ?? ''} ${s.middleName ?? ''} ${s.lastName ?? ''}`.toLowerCase();
      return name.includes(q) || (s.admissionNumber ?? '').toLowerCase().includes(q);
    });
  }, [students, studentSearch]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === form.studentId) ?? null,
    [students, form.studentId]
  );

  const [createIncident, { isLoading: creating }] = useCreateIncidentMutation();
  const [bulkCreate, { isLoading: bulkCreating }] = useBulkCreateIncidentsMutation();

  // Auto-set notify for serious incidents
  const setType = (type: IncidentType) => {
    const info = typeInfo(type);
    setForm((f) => ({ ...f, incidentType: type, notify: info.serious || f.notify }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');

    if (!form.studentId) return setErrorMessage('Please pick a student.');
    if (!form.description.trim()) return setErrorMessage('Description is required (min 10 characters).');
    if (form.description.trim().length < 10) return setErrorMessage('Description must be at least 10 characters.');

    try {
      await createIncident({
        schoolId,
        studentId: form.studentId,
        incidentType: form.incidentType,
        description: form.description.trim(),
        actionTaken: form.actionTaken.trim() || undefined,
        notify: form.notify,
      }).unwrap();
      setSuccessMessage(`${form.incidentType} recorded for ${selectedStudent ? studentLabel(selectedStudent) : 'student'}.`);
      setForm({ studentId: '', incidentType: 'Merit', description: '', actionTaken: '', notify: true });
      setStudentSearch('');
      refetchToday();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to record incident.');
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');

    const clean = bulkRows
      .map((r) => ({
        studentId: r.studentId,
        incidentType: r.incidentType,
        description: r.description.trim(),
        actionTaken: r.actionTaken.trim() || undefined,
      }))
      .filter((r) => r.studentId && r.description.length >= 10);

    if (clean.length === 0) {
      return setErrorMessage('Add at least one valid row (student + 10-char description).');
    }

    try {
      await bulkCreate({
        schoolId,
        notify: bulkNotify,
        incidents: clean,
      }).unwrap();
      setSuccessMessage(`Bulk recorded ${clean.length} incident${clean.length === 1 ? '' : 's'}.`);
      setBulkRows([{ studentId: '', incidentType: 'Late-coming', description: '', actionTaken: '' }]);
      setShowBulk(false);
      refetchToday();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Bulk record failed.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── LEFT: Forms ── */}
      <div className="lg:col-span-7 space-y-6">
        {/* Single incident form */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">Record an Incident</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student picker */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-70">
                <Users className="w-3.5 h-3.5" /> Student
                <span className="ml-auto font-mono normal-case opacity-60">{students.length} enrolled</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary">
                  {loadingStudents ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </span>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by name or admission number…"
                  className="w-full pl-10 pr-3 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <select
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                disabled={loadingStudents}
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-60"
              >
                <option value="">
                  {loadingStudents
                    ? 'Loading students…'
                    : filteredStudents.length === 0
                    ? 'No matching students'
                    : `-- Choose from ${filteredStudents.length} student${filteredStudents.length === 1 ? '' : 's'} --`}
                </option>
                {filteredStudents.slice(0, 200).map((s) => (
                  <option key={s.id} value={s.id}>{studentLabel(s)}</option>
                ))}
              </select>

              {selectedStudent && (
                <div className="mt-2 flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-2xl">
                  <div className="w-9 h-9 rounded-full bg-primary/15 text-primary grid place-items-center font-black text-xs">
                    {(selectedStudent.firstName?.[0] ?? '?').toUpperCase()}
                    {(selectedStudent.lastName?.[0] ?? '').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black truncate">
                      {selectedStudent.firstName} {selectedStudent.middleName ?? ''} {selectedStudent.lastName}
                    </p>
                    <p className="text-[10px] font-mono opacity-60 truncate">
                      ADM {selectedStudent.admissionNumber} · {selectedStudent.gender}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Incident type chips */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Incident Type</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {INCIDENT_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = form.incidentType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                        active
                          ? `${t.bg} ${t.tone}`
                          : 'bg-base-100 border-base-300 hover:border-primary/40 opacity-80'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wide">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">
                Description <span className="opacity-50 normal-case font-normal">(min 10 chars)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What happened? Be specific — this may be shown to guardians."
                rows={3}
                required
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
              <p className="text-[10px] opacity-60 text-right">{form.description.length} chars</p>
            </div>

            {/* Action taken */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Action Taken (optional)</label>
              <input
                type="text"
                value={form.actionTaken}
                onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
                placeholder="e.g. Verbal warning issued, parents informed"
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Notify toggle */}
            <label className={`flex items-center gap-2 px-4 py-3 bg-base-100 border rounded-2xl text-xs font-bold cursor-pointer transition-all ${
              form.notify ? 'border-primary/40 bg-primary/5' : 'border-base-300'
            }`}>
              <input
                type="checkbox"
                checked={form.notify}
                onChange={(e) => setForm({ ...form, notify: e.target.checked })}
                className="checkbox checkbox-primary checkbox-xs"
              />
              <Bell className="w-3.5 h-3.5 text-primary" />
              Notify guardians immediately
            </label>

            <button
              type="submit"
              disabled={creating}
              className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-2 disabled:opacity-60"
              style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
            >
              {creating ? 'Recording…' : `Record ${form.incidentType}`}
            </button>
          </form>
        </div>

        {/* Bulk record collapsible */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
          <button
            type="button"
            onClick={() => setShowBulk(!showBulk)}
            className="w-full flex items-center justify-between gap-3 pb-2 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-black tracking-tight">Bulk Record</h2>
                <p className="text-[11px] opacity-60">Record multiple students at once (e.g. late-comers)</p>
              </div>
            </div>
            {showBulk ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
          </button>

          {showBulk && (
            <form onSubmit={handleBulkSubmit} className="space-y-3">
              {bulkRows.map((row, idx) => (
                <div key={idx} className="p-3 bg-base-100 border border-base-300 rounded-xl space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={row.studentId}
                      onChange={(e) =>
                        setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, studentId: e.target.value } : r))
                      }
                      className="flex-1 text-[11px] px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg"
                    >
                      <option value="">-- Student --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{studentLabel(s)}</option>
                      ))}
                    </select>
                    <select
                      value={row.incidentType}
                      onChange={(e) =>
                        setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, incidentType: e.target.value as IncidentType } : r))
                      }
                      className="text-[11px] px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg"
                    >
                      {INCIDENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    {bulkRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setBulkRows(bulkRows.filter((_, i) => i !== idx))}
                        className="p-1.5 bg-error/10 text-error rounded-lg hover:bg-error hover:text-error-content transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={row.description}
                    onChange={(e) =>
                      setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, description: e.target.value } : r))
                    }
                    placeholder="Description (min 10 chars)"
                    rows={2}
                    className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-[11px] font-medium resize-none"
                  />
                  <input
                    type="text"
                    value={row.actionTaken}
                    onChange={(e) =>
                      setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, actionTaken: e.target.value } : r))
                    }
                    placeholder="Action taken (optional)"
                    className="w-full px-3 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px]"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() => setBulkRows([...bulkRows, { studentId: '', incidentType: 'Late-coming', description: '', actionTaken: '' }])}
                className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
              >
                <Plus className="w-3 h-3" /> Add row
              </button>

              <label className={`flex items-center gap-2 px-3 py-2 bg-base-100 border rounded-xl text-[11px] font-bold cursor-pointer ${
                bulkNotify ? 'border-primary/40 bg-primary/5' : 'border-base-300'
              }`}>
                <input
                  type="checkbox"
                  checked={bulkNotify}
                  onChange={(e) => setBulkNotify(e.target.checked)}
                  className="checkbox checkbox-primary checkbox-xs"
                />
                <Bell className="w-3 h-3 text-primary" /> Notify all guardians
              </label>

              <button
                type="submit"
                disabled={bulkCreating}
                className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
              >
                {bulkCreating ? 'Recording…' : `Record ${bulkRows.filter(r => r.studentId && r.description.trim().length >= 10).length} incidents`}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── RIGHT: Today's log ── */}
      <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Today's Log</h2>
              <p className="text-[11px] font-mono opacity-60">{fmtDate(new Date().toISOString())}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{todayIncidents.length}</span>
        </div>

        {todayIncidents.length === 0 ? (
          <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
            No incidents recorded today yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {todayIncidents.map((incident) => (
              <IncidentMiniCard
                key={incident.id}
                incident={incident}
                studentMap={studentMap}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IncidentMiniCard({ incident, studentMap }: { incident: DisciplineIncident; studentMap: Map<string, Student> }) {
  const info = typeInfo(incident.incidentType);
  const Icon = info.icon;
  const student = studentMap.get(incident.studentId);
  const name = student
    ? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim()
    : (incident.student?.name ?? 'Unknown student');

  return (
    <div className="p-3 bg-base-100 border border-base-300 rounded-xl">
      <div className="flex items-start gap-2">
        <div className={`shrink-0 w-8 h-8 rounded-lg grid place-items-center ${info.bg} ${info.tone}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs font-black truncate">{name}</p>
            <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded ${info.bg} ${info.tone}`}>
              {info.label}
            </span>
            {incident.parentNotified ? (
              <Bell className="w-3 h-3 text-success" title="Guardians notified" />
            ) : (
              <BellOff className="w-3 h-3 text-base-content/40" title="Not notified" />
            )}
          </div>
          <p className="mt-1 text-[11px] opacity-70 line-clamp-2">{incident.description}</p>
          <p className="mt-1 text-[10px] font-mono opacity-50">{fmtTime(incident.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BROWSE TAB
   ════════════════════════════════════════════════════════════════ */
function BrowseTab({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const [scope, setScope] = useState<'school' | 'student' | 'class'>('school');
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [type, setType] = useState<IncidentType | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: studentsData } = useGetStudentsBySchoolQuery(schoolId);
  const { data: classesData } = useGetClassesBySchoolQuery(schoolId);
  const { data: gradesData } = useGetGradeLevelsBySchoolQuery(schoolId);

  const students: Student[] = useMemo(() => extractStudents(studentsData), [studentsData]);
  const classes: ClassEntity[] = useMemo(() => extractClasses(classesData), [classesData]);
  const grades: GradeLevel[] = useMemo(() => extractGrades(gradesData), [gradesData]);

  const studentMap = useMemo(() => {
    const m = new Map<string, Student>();
    students.forEach((s) => m.set(s.id, s));
    return m;
  }, [students]);

  const isoFrom = fromDate ? new Date(fromDate).toISOString() : undefined;
  const isoTo = toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : undefined;

  const schoolQ = useGetSchoolIncidentsQuery(
    { schoolId, type: type || undefined, fromDate: isoFrom, toDate: isoTo },
    { skip: scope !== 'school' || !schoolId }
  );
  const studentQ = useGetStudentIncidentsQuery(
    { studentId, type: type || undefined, fromDate: isoFrom, toDate: isoTo },
    { skip: scope !== 'student' || !studentId }
  );
  const classQ = useGetClassIncidentsQuery(
    { classId, fromDate: isoFrom, toDate: isoTo },
    { skip: scope !== 'class' || !classId }
  );

  const active = scope === 'school' ? schoolQ : scope === 'student' ? studentQ : classQ;
  const incidents = useMemo(() => extractIncidents(active.data), [active.data]);

  // Sort newest first
  const sorted = useMemo(
    () => [...incidents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [incidents]
  );

  const handleClear = () => {
    setType('');
    setFromDate('');
    setToDate('');
    setStudentId('');
    setClassId('');
  };

  const gradeNameFor = (gid: string) => grades.find((g) => g.id === gid)?.name ?? '—';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── Filter panel ── */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Filter className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Filters</h2>
          </div>

          {/* Scope selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Scope</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['school', 'student', 'class'] as const).map((s) => {
                const active = scope === s;
                const Icon = s === 'school' ? School : s === 'student' ? Users : School;
                return (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      active ? 'bg-primary text-primary-content shadow' : 'bg-base-100 hover:bg-base-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {scope === 'student' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Student</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2.5 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="">-- Choose student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{studentLabel(s)}</option>
                ))}
              </select>
            </div>
          )}

          {scope === 'class' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Class</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2.5 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="">-- Choose class --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{gradeNameFor(c.gradeLevelId)} — {c.stream} ({c.academicYear})</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as IncidentType | '')}
              className="w-full px-3 py-2.5 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="">All types</option>
              {INCIDENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Date range</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <button
            onClick={handleClear}
            className="w-full text-xs font-bold py-2.5 rounded-xl bg-base-100 border border-base-300 hover:bg-base-200 transition-all cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="lg:col-span-8 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">
              {scope === 'school' ? 'All incidents' : scope === 'student' ? 'Student incidents' : 'Class incidents'}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{sorted.length} found</span>
        </div>

        {(scope === 'student' && !studentId) || (scope === 'class' && !classId) ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
            {scope === 'student' ? 'Pick a student to see their incidents.' : 'Pick a class to see its incidents.'}
          </div>
        ) : active.isLoading ? (
          <div className="p-8 text-center text-xs opacity-60">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
            No incidents match the current filters.
          </div>
        ) : (
          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {sorted.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                studentMap={studentMap}
                schoolId={schoolId}
                primaryColor={primaryColor}
                setSuccessMessage={setSuccessMessage}
                setErrorMessage={setErrorMessage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IncidentCard({
  incident, studentMap, schoolId, primaryColor, setSuccessMessage, setErrorMessage,
}: {
  incident: DisciplineIncident;
  studentMap: Map<string, Student>;
  schoolId: string;
  primaryColor: string;
  setSuccessMessage: (v: string) => void;
  setErrorMessage: (v: string) => void;
}) {
  const info = typeInfo(incident.incidentType);
  const Icon = info.icon;
  const student = studentMap.get(incident.studentId);
  const name = student
    ? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim()
    : (incident.student?.name ?? 'Unknown student');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    incidentType: incident.incidentType,
    description: incident.description,
    actionTaken: incident.actionTaken ?? '',
  });

  const [updateIncident, { isLoading: updating }] = useUpdateIncidentMutation();
  const [markNotified, { isLoading: markingNotified }] = useMarkIncidentNotifiedMutation();

  const handleSave = async () => {
    setSuccessMessage(''); setErrorMessage('');
    if (form.description.trim().length < 10) {
      return setErrorMessage('Description must be at least 10 characters.');
    }
    try {
      await updateIncident({
        incidentId: incident.id,
        patch: {
          incidentType: form.incidentType,
          description: form.description.trim(),
          actionTaken: form.actionTaken.trim() || undefined,
        },
      }).unwrap();
      setSuccessMessage('Incident updated.');
      setEditing(false);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Update failed.');
    }
  };

  const handleMarkNotified = async () => {
    setSuccessMessage(''); setErrorMessage('');
    try {
      await markNotified(incident.id).unwrap();
      setSuccessMessage('Marked as parent-notified.');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to mark as notified.');
    }
  };

  return (
    <div className="p-5 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all">
      {editing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider opacity-60">Editing incident</span>
          </div>
          <select
            value={form.incidentType}
            onChange={(e) => setForm({ ...form, incidentType: e.target.value as IncidentType })}
            className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-xs font-bold"
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-xs font-medium resize-none"
          />
          <input
            type="text"
            value={form.actionTaken}
            onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
            placeholder="Action taken"
            className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-xs"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-base-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updating}
              className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Save className="w-3 h-3 inline mr-1" /> {updating ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <div className={`shrink-0 w-10 h-10 rounded-xl grid place-items-center ${info.bg} ${info.tone}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-primary truncate">{name}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${info.bg} ${info.tone}`}>
                  {info.label}
                </span>
                {incident.parentNotified ? (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-success/10 text-success">
                    <Bell className="w-2.5 h-2.5" /> Notified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-base-300 text-base-content/60">
                    <BellOff className="w-2.5 h-2.5" /> Not notified
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed opacity-80">{incident.description}</p>
              {incident.actionTaken && (
                <p className="mt-1 text-[11px] italic opacity-60">
                  <span className="font-bold not-italic">Action:</span> {incident.actionTaken}
                </p>
              )}
              <p className="mt-2 text-[10px] font-mono opacity-50">
                {fmtDate(incident.createdAt)} · {fmtTime(incident.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-base-300 flex justify-end gap-1.5">
            {!incident.parentNotified && (
              <button
                onClick={handleMarkNotified}
                disabled={markingNotified}
                className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-all"
                title="Mark as parent-notified"
              >
                <Bell className="w-3 h-3 inline mr-1" /> Mark notified
              </button>
            )}
            <button
              onClick={() => setEditing(true)}
              className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-base-200 hover:bg-primary/20 hover:text-primary transition-all"
            >
              <Edit3 className="w-3 h-3 inline mr-1" /> Edit
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INSIGHTS TAB
   ════════════════════════════════════════════════════════════════ */
function InsightsTab({ schoolId, primaryColor, secondaryColor }: {
  schoolId: string;
  primaryColor: string;
  secondaryColor: string;
}) {
  const [scope, setScope] = useState<'student' | 'class' | 'school'>('school');
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');

  const { data: studentsData } = useGetStudentsBySchoolQuery(schoolId);
  const { data: classesData } = useGetClassesBySchoolQuery(schoolId);
  const { data: gradesData } = useGetGradeLevelsBySchoolQuery(schoolId);

  const students: Student[] = useMemo(() => extractStudents(studentsData), [studentsData]);
  const classes: ClassEntity[] = useMemo(() => extractClasses(classesData), [classesData]);
  const grades: GradeLevel[] = useMemo(() => extractGrades(gradesData), [gradesData]);

  const gradeNameFor = (gid: string) => grades.find((g) => g.id === gid)?.name ?? '—';

  // Stats & trend (always fetched for school scope + used in summary tiles)
  const { data: statsData, isLoading: loadingStats } = useGetSchoolDisciplineStatsQuery(
    { schoolId },
    { skip: !schoolId }
  );
  const { data: trendData } = useGetDisciplineTrendQuery({ schoolId, days: 30 }, { skip: !schoolId });
  const { data: meritsData } = useGetMeritStudentsQuery(schoolId, { skip: !schoolId });

  const stats = (statsData as any)?.stats ?? {};
  const trend: Array<{ date: string; count: number }> = (trendData as any)?.trend ?? [];
  const meritStudents: Array<{ studentId: string; studentName?: string; meritCount: number }> =
    (meritsData as any)?.students ?? [];

  // Student summary
  const { data: studentSummaryData, isLoading: loadingStudentSummary } = useGetStudentDisciplineSummaryQuery(
    studentId,
    { skip: !studentId }
  );
  const studentSummary = (studentSummaryData as any)?.summary ?? {};

  // Class summary
  const { data: classSummaryData, isLoading: loadingClassSummary } = useGetClassDisciplineSummaryQuery(
    classId,
    { skip: !classId }
  );
  const classSummary = (classSummaryData as any)?.summary ?? {};

  // Trend chart
  const maxTrend = Math.max(1, ...trend.map((p) => p.count));

  return (
    <div className="space-y-6">
      {/* Scope selector */}
      <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-4 rounded-2xl shadow-sm flex flex-wrap gap-2">
        {[
          { id: 'school' as const, label: 'School', icon: School },
          { id: 'class' as const, label: 'Class', icon: Users },
          { id: 'student' as const, label: 'Student', icon: Users },
        ].map(({ id, label, icon: Icon }) => {
          const active = scope === id;
          return (
            <button
              key={id}
              onClick={() => setScope(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                active ? 'text-white shadow' : 'bg-base-100 hover:bg-base-200 opacity-80'
              }`}
              style={active ? { backgroundColor: primaryColor } : {}}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          );
        })}
      </div>

      {/* SCHOOL scope */}
      {scope === 'school' && (
        <div className="space-y-6">
          {/* Stats tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile icon={FileText} label="Total incidents" value={loadingStats ? '…' : (stats.total ?? '—')} tone="primary" />
            <StatTile
              icon={Award}
              label="Merits"
              value={loadingStats ? '…' : (stats.byType?.Merit ?? stats.merits ?? '—')}
              tone="success"
            />
            <StatTile
              icon={AlertCircle}
              label="Warnings"
              value={loadingStats ? '…' : (stats.byType?.Warning ?? stats.warnings ?? '—')}
              tone="warning"
            />
            <StatTile
              icon={Bell}
              label="Notified"
              value={loadingStats ? '…' : (stats.notified ?? '—')}
              tone="primary"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Trend chart */}
            <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-base-300">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Trend</h2>
                  <p className="text-[11px] opacity-60">Last 30 days</p>
                </div>
              </div>

              {trend.length === 0 ? (
                <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
                  No incidents in the last 30 days.
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-1 h-40 px-1">
                    {trend.map((p, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        <div
                          className="w-full rounded-t transition-all hover:opacity-100 group-hover:shadow-lg"
                          style={{
                            height: `${(p.count / maxTrend) * 100}%`,
                            backgroundColor: primaryColor,
                            minHeight: p.count > 0 ? 4 : 0,
                          }}
                          title={`${p.date}: ${p.count}`}
                        />
                        {p.count > 0 && (
                          <span className="absolute -top-4 text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            {p.count}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono opacity-50 pt-1">
                    <span>{trend[0]?.date?.slice(5)}</span>
                    <span>{trend[trend.length - 1]?.date?.slice(5)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Merit leaderboard */}
            <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-base-300">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                  <Medal className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black tracking-tight">Top Merit Students</h2>
              </div>

              {meritStudents.length === 0 ? (
                <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
                  No merit records yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {meritStudents.slice(0, 10).map((m, i) => (
                    <div key={m.studentId ?? i} className="flex items-center gap-2 px-3 py-2 bg-base-100 border border-base-300 rounded-xl">
                      <span className={`w-6 h-6 rounded-full grid place-items-center text-[10px] font-black ${
                        i === 0 ? 'bg-warning/20 text-warning' :
                        i === 1 ? 'bg-base-300 text-base-content/70' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-base-200 text-base-content/60'
                      }`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </span>
                      <span className="flex-1 text-xs font-bold truncate">{m.studentName ?? m.studentId.slice(0, 8)}</span>
                      <span className="text-xs font-black text-success">{m.meritCount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CLASS scope */}
      {scope === 'class' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-base-300">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">Pick a Class</h2>
            </div>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="">-- Choose class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{gradeNameFor(c.gradeLevelId)} — {c.stream} ({c.academicYear})</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-8 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-base-300">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">Class Discipline Summary</h2>
            </div>

            {!classId ? (
              <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
                Pick a class to see its summary.
              </div>
            ) : loadingClassSummary ? (
              <div className="p-8 text-center text-xs opacity-60">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <StatTile icon={FileText} label="Total" value={classSummary.totalIncidents ?? 0} tone="primary" />
                  <StatTile
                    icon={AlertCircle}
                    label="Students Flagged"
                    value={classSummary.topOffenders?.length ?? 0}
                    tone="warning"
                  />
                </div>

                {/* By type */}
                {classSummary.byType && Object.keys(classSummary.byType).length > 0 && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider opacity-60 mb-2">By type</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(classSummary.byType).map(([t, count]) => {
                        const info = typeInfo(t);
                        const Icon = info.icon;
                        return (
                          <div key={t} className={`p-2.5 rounded-xl border ${info.bg} ${info.tone}`}>
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase">{info.label}</span>
                            </div>
                            <p className="mt-1 text-lg font-black">{count as number}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Top offenders */}
                {classSummary.topOffenders && classSummary.topOffenders.length > 0 && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider opacity-60 mb-2">Top offenders</p>
                    <div className="space-y-2">
                      {classSummary.topOffenders.slice(0, 5).map((o, i) => (
                        <div key={o.studentId ?? i} className="flex items-center gap-2 px-3 py-2 bg-base-100 border border-base-300 rounded-xl">
                          <span className="w-6 h-6 rounded-full bg-error/10 text-error text-[10px] font-black grid place-items-center">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-xs font-bold truncate">{o.studentName ?? o.studentId.slice(0, 8)}</span>
                          <span className="text-xs font-black text-error">{o.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* STUDENT scope */}
      {scope === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-base-300">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">Pick a Student</h2>
            </div>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="">-- Choose student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{studentLabel(s)}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-8 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-base-300">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">Student Discipline Summary</h2>
            </div>

            {!studentId ? (
              <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
                Pick a student to see their summary.
              </div>
            ) : loadingStudentSummary ? (
              <div className="p-8 text-center text-xs opacity-60">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <StatTile icon={FileText} label="Total" value={studentSummary.totalIncidents ?? 0} tone="primary" />
                  <StatTile icon={Award} label="Merits" value={studentSummary.merits ?? 0} tone="success" />
                  <StatTile icon={AlertCircle} label="Warnings" value={studentSummary.warnings ?? 0} tone="warning" />
                </div>

                {studentSummary.byType && Object.keys(studentSummary.byType).length > 0 && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider opacity-60 mb-2">Breakdown</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(studentSummary.byType).map(([t, count]) => {
                        const info = typeInfo(t);
                        const Icon = info.icon;
                        return (
                          <div key={t} className={`p-2.5 rounded-xl border ${info.bg} ${info.tone}`}>
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase">{info.label}</span>
                            </div>
                            <p className="mt-1 text-lg font-black">{count as number}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {studentSummary.mostRecent && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider opacity-60 mb-2">Most recent</p>
                    <div className="p-3 bg-base-100 border border-base-300 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${typeInfo(studentSummary.mostRecent.incidentType).bg} ${typeInfo(studentSummary.mostRecent.incidentType).tone}`}>
                          {typeInfo(studentSummary.mostRecent.incidentType).label}
                        </span>
                        <span className="text-[10px] font-mono opacity-60">
                          {fmtDate(studentSummary.mostRecent.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs opacity-80">{studentSummary.mostRecent.description}</p>
                    </div>
                  </div>
                )}
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