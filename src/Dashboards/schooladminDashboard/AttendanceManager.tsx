import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  ClipboardCheck, CalendarDays, Users, BarChart3, FileText, UserCheck, Building,
  CheckCircle2, AlertCircle, X, Loader2, Save, Search, Trash2, Copy, Wand2,
  ChevronDown, ChevronRight, Clock, History, TrendingUp, Upload, GraduationCap,
  AlertTriangle, ListChecks, PlusCircle,
} from 'lucide-react';

import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import { useGetStudentsBySchoolQuery, type Student } from '../../features/Apis/students.Api';
import {
  useGetTermsBySchoolIdQuery,
  useGetCurrentTermBySchoolIdQuery,
  useGetClassesBySchoolQuery,
  useGetGradeLevelsBySchoolQuery,
  useGetClassStudentsQuery,
  type AcademicTerm,
  type ClassEntity,
  type GradeLevel,
} from '../../features/Apis/academicStructure.Api';
import {
  useMarkAttendanceMutation,
  useUpsertAttendanceMutation,
  useUpdateAttendanceMutation,
  useAutoMarkAbsentMutation,
  useCopyAttendanceMutation,
  useImportAttendanceMutation,
  useDeleteAttendanceMutation,
  useGetStudentHistoryQuery,
  useGetStudentStatsQuery,
  useGetClassAttendanceByDateQuery,
  useGetClassAttendanceSummaryQuery,
  useGetMonthlyRegisterQuery,
  useGetAbsenteesQuery,
  useGetLateArrivalsQuery,
  useGetChronicAbsenteesQuery,
  useGetNotMarkedStudentsQuery,
  useGetAuditTrailQuery,
  useGetClassAttendanceRateQuery,
  useGetCountByStatusQuery,
  useGetClassTrendQuery,
  useGetAttendanceByGenderQuery,
  useGetSchoolAttendanceStatsQuery,
  useGetAttendanceComparisonQuery,
  useLazyValidateAttendanceDateQuery,
  useCanUserMarkClassQuery,
  useGetAttendanceSettingsQuery,
  type AttendanceStatus,
  type AttendanceRecord,
  type AttendanceImportRow,
} from '../../features/Apis/Attendance.Apis';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];

const STATUS_TONES: Record<AttendanceStatus, { bg: string; text: string; border: string; solid: string }> = {
  Present: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30', solid: 'bg-success text-success-content' },
  Absent:  { bg: 'bg-error/10',   text: 'text-error',   border: 'border-error/30',   solid: 'bg-error text-error-content' },
  Late:    { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', solid: 'bg-warning text-warning-content' },
  Excused: { bg: 'bg-info/10',    text: 'text-info',    border: 'border-info/30',    solid: 'bg-info text-info-content' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CARD = 'bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl';
const WIDGET = 'bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-5 rounded-2xl shadow-sm';
const INPUT = 'w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary';
const LABEL = 'block text-xs font-bold uppercase tracking-wider opacity-70';
const EMPTY = 'p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl';

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
function extractStudents(data: any): Student[] {
  if (!data) return [];
  const raw = data.students ?? data.data ?? data;
  return Array.isArray(raw) ? raw : [];
}

function extractList<T = any>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const k of ['terms', 'classes', 'gradeLevels', 'levels', 'data']) {
    if (Array.isArray(data[k])) return data[k];
  }
  return [];
}

function studentName(s?: any): string {
  if (!s) return 'Unknown student';
  const n = `${s.firstName ?? ''} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName ?? ''}`.trim();
  return n || 'Unnamed';
}

function studentLabel(s: Student): string {
  const n = studentName(s);
  return (s as any).admissionNumber ? `${n} · ${(s as any).admissionNumber}` : n;
}

function initialsOf(s?: any): string {
  return `${s?.firstName?.[0] ?? '?'}${s?.lastName?.[0] ?? ''}`.toUpperCase();
}

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  try {
    const safe = d.length === 10 ? `${d}T00:00:00` : d;
    return new Date(safe).toLocaleDateString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return d; }
}

function fmtDateTime(d?: string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString(undefined, {
      day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
    });
  } catch { return d; }
}

function todayStr(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
}

function pct(v: string | number | undefined | null): string {
  if (v === undefined || v === null || v === '') return '—';
  const n = Number(v);
  return isNaN(n) ? String(v) : `${n.toFixed(1).replace(/\.0$/, '')}%`;
}

/** Turns an RTK Query error into a readable message (401, 400 validation, fallback). */
function errMsg(err: any, fallback: string): string {
  if (err?.status === 401) return 'Your session has expired. Please sign in again.';
  const d = err?.data;
  if (d?.message) return d.message;
  if (Array.isArray(d?.errors) && d.errors.length) {
    return d.errors.map((e: any) => (typeof e === 'string' ? e : e?.message ?? '')).filter(Boolean).join(' ');
  }
  return fallback;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseCsv(text: string): AttendanceImportRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((c) => c.trim()))
    .filter((cols, i) => !(i === 0 && cols[0].toLowerCase() === 'admissionnumber'))
    .map(([admissionNumber, date, status, ...rest]) => {
      const remarks = rest.join(',').trim();
      return {
        admissionNumber,
        date,
        status: status as AttendanceStatus,
        ...(remarks ? { remarks } : {}),
      };
    });
}

type Tab = 'mark' | 'records' | 'students' | 'reports' | 'insights';

type SectionProps = {
  schoolId: string;
  userId: string;
  primaryColor: string;
  secondaryColor: string;
  /** [classId, "Grade 7 East"] pairs for the selected term's academic year. */
  classOptions: Array<[string, string]>;
  setSuccessMessage: (v: string) => void;
  setErrorMessage: (v: string) => void;
};

/**
 * Class picker options, built like the report cards screen:
 * label = grade level name + stream, limited to the selected term's academic year
 * (falls back to every class when none match), sorted A–Z.
 */
function useClassOptions(schoolId: string, termYear?: string): Array<[string, string]> {
  const { data: classesData } = useGetClassesBySchoolQuery(schoolId, { skip: !schoolId });
  const { data: gradeData } = useGetGradeLevelsBySchoolQuery(schoolId, { skip: !schoolId });

  return useMemo(() => {
    const all = extractList<ClassEntity>(classesData);
    const gradeMap = new Map(extractList<GradeLevel>(gradeData).map((g) => [g.id, g]));
    const yearMatches = all.filter((c) => termYear && c.academicYear === termYear);
    const list = yearMatches.length > 0 ? yearMatches : all;
    return list
      .map((c): [string, string] => {
        const g = gradeMap.get(c.gradeLevelId);
        const label = `${g?.name ?? 'Class'} ${c.stream ?? ''}`.trim();
        return [c.id, `${label}${yearMatches.length === 0 && c.academicYear ? ` · ${c.academicYear}` : ''}`];
      })
      .sort((a, b) => a[1].localeCompare(b[1]));
  }, [classesData, gradeData, termYear]);
}

function useSchoolStudents(schoolId: string) {
  const { data } = useGetStudentsBySchoolQuery(schoolId, { skip: !schoolId });
  return useMemo(() => extractStudents(data), [data]);
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function AttendanceManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';
  const currentUserId = user?.id || user?.user?.id || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const { data: termsData } = useGetTermsBySchoolIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const { data: currentTermData } = useGetCurrentTermBySchoolIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const terms = useMemo(() => extractList<AcademicTerm>(termsData), [termsData]);
  const [termId, setTermId] = useState('');

  useEffect(() => {
    if (termId || terms.length === 0) return;
    const cur = (currentTermData as any)?.data ?? (currentTermData as any)?.term;
    setTermId((cur?.id ?? terms.find((t) => t.isCurrentTerm)?.id ?? terms[0].id) as string);
  }, [terms, currentTermData, termId]);

  const currentTerm = terms.find((t) => t.id === termId);
  const classOptions = useClassOptions(currentSchoolId, currentTerm?.academicYear);

  const [activeTab, setActiveTab] = useState<Tab>('mark');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const sectionProps: SectionProps = {
    schoolId: currentSchoolId,
    userId: currentUserId,
    primaryColor,
    secondaryColor,
    classOptions,
    setSuccessMessage,
    setErrorMessage,
  };

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
              <ClipboardCheck className="w-3.5 h-3.5" /> Daily Attendance
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">
              Attendance Manager
            </h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Mark class registers, review records, follow student history and spot attendance trends for {schoolName}.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <CalendarDays className="w-3.5 h-3.5 opacity-70" />
              <select
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
                className="px-3 py-1.5 bg-base-100 border border-base-300 rounded-xl text-xs font-bold cursor-pointer"
                aria-label="Active term"
              >
                <option value="">-- Choose term --</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.termName} ({t.academicYear}){t.isCurrentTerm ? ' · current' : ''}
                  </option>
                ))}
              </select>
            </div>
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
          { id: 'mark' as Tab, label: 'Mark Register', icon: ClipboardCheck },
          { id: 'records' as Tab, label: 'Records', icon: ListChecks },
          { id: 'students' as Tab, label: 'Student History', icon: GraduationCap },
          { id: 'reports' as Tab, label: 'Reports', icon: FileText },
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
      {activeTab === 'mark' && <MarkTab {...sectionProps} />}
      {activeTab === 'records' && <RecordsTab {...sectionProps} />}
      {activeTab === 'students' && <StudentsTab {...sectionProps} />}
      {activeTab === 'reports' && <ReportsTab {...sectionProps} />}
      {activeTab === 'insights' && <InsightsTab {...sectionProps} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MARK TAB
   ════════════════════════════════════════════════════════════════ */
type EntryState = Record<string, { status: AttendanceStatus; remarks: string }>;

function MarkTab({
  schoolId, userId, primaryColor, secondaryColor, classOptions, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState<EntryState>({});

  const [showCopy, setShowCopy] = useState(false);
  const [copyFrom, setCopyFrom] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');

  const { data: classStudentsData } = useGetClassStudentsQuery(classId, { skip: !classId });

  const roster = useMemo(
    () => [...extractStudents(classStudentsData)].sort((a, b) => studentName(a).localeCompare(studentName(b))),
    [classStudentsData]
  );

  const { data: existingData, isFetching } = useGetClassAttendanceByDateQuery(
    { classId, date }, { skip: !classId || !date }
  );
  const existing: AttendanceRecord[] = useMemo(() => existingData?.records ?? [], [existingData]);
  const savedIds = useMemo(() => new Set(existing.map((r) => r.studentId)), [existing]);

  const { data: notMarkedData } = useGetNotMarkedStudentsQuery(
    { classId, date }, { skip: !classId || !date }
  );
  const { data: canMarkData } = useCanUserMarkClassQuery({ userId, classId }, { skip: !userId || !classId });

  const [validateDate] = useLazyValidateAttendanceDateQuery();
  const [upsert, { isLoading: saving }] = useUpsertAttendanceMutation();
  const [autoAbsent, { isLoading: autoMarking }] = useAutoMarkAbsentMutation();
  const [copyAttendance, { isLoading: copying }] = useCopyAttendanceMutation();
  const [importAttendance, { isLoading: importing }] = useImportAttendanceMutation();

  // Check the date against the term rules as soon as it changes (endpoint 4.1 / 4.2).
  const [dateIssue, setDateIssue] = useState('');
  useEffect(() => {
    if (!schoolId || !date) { setDateIssue(''); return; }
    let cancelled = false;
    validateDate({ schoolId, date })
      .unwrap()
      .then((v) => { if (!cancelled) setDateIssue(v.valid === false ? (v.message || 'Attendance cannot be marked for this date.') : ''); })
      .catch((err) => { if (!cancelled) setDateIssue(errMsg(err, 'This date cannot be used for attendance.')); });
    return () => { cancelled = true; };
  }, [schoolId, date, validateDate]);

  // Prefill from saved records; default everyone else to Present.
  useEffect(() => {
    const byStudent = new Map(existing.map((r) => [r.studentId, r]));
    const next: EntryState = {};
    roster.forEach((s) => {
      const r = byStudent.get(s.id);
      next[s.id] = { status: r?.status ?? 'Present', remarks: r?.remarks ?? '' };
    });
    setEntries(next);
  }, [existing, roster, classId, date]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((s) =>
      studentName(s).toLowerCase().includes(q) || ((s as any).admissionNumber ?? '').toLowerCase().includes(q)
    );
  }, [roster, search]);

  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    roster.forEach((s) => { const st = entries[s.id]?.status; if (st) c[st] += 1; });
    return c;
  }, [roster, entries]);

  const setStatus = (id: string, status: AttendanceStatus) =>
    setEntries((e) => ({ ...e, [id]: { ...(e[id] ?? { remarks: '' }), status } }));
  const setRemarks = (id: string, remarks: string) =>
    setEntries((e) => ({ ...e, [id]: { ...(e[id] ?? { status: 'Present' as AttendanceStatus }), remarks } }));
  const markAll = (status: AttendanceStatus) =>
    setEntries((e) => {
      const next = { ...e };
      roster.forEach((s) => { next[s.id] = { status, remarks: next[s.id]?.remarks ?? '' }; });
      return next;
    });

  const handleSave = async () => {
    setSuccessMessage(''); setErrorMessage('');
    if (!classId) return setErrorMessage('Pick a class first.');
    if (!date) return setErrorMessage('Pick a date.');
    if (date > todayStr()) return setErrorMessage('Attendance cannot be marked for a future date.');
    if (roster.length === 0) return setErrorMessage('This class has no students to mark.');

    try {
      const v = await validateDate({ schoolId, date }).unwrap();
      if (v.valid === false) return setErrorMessage(v.message || 'Attendance cannot be marked for this date.');
    } catch (err: any) {
      return setErrorMessage(errMsg(err, 'Date validation failed.'));
    }

    try {
      await upsert({
        schoolId,
        classId,
        date,
        entries: roster.map((s) => ({
          studentId: s.id,
          status: entries[s.id]?.status ?? 'Present',
          remarks: entries[s.id]?.remarks.trim() || null,
        })),
      }).unwrap();
      setSuccessMessage(`Register saved for ${roster.length} students.`);
    } catch (err: any) {
      setErrorMessage(errMsg(err, 'Failed to save register.'));
    }
  };

  const handleAutoAbsent = async () => {
    if (!classId) return setErrorMessage('Pick a class first.');
    if (!window.confirm('Mark every student who has no record for this date as Absent?')) return;
    setSuccessMessage(''); setErrorMessage('');
    try {
      await autoAbsent({ classId, date }).unwrap();
      setSuccessMessage('Unmarked students were marked Absent.');
    } catch (err: any) {
      setErrorMessage(errMsg(err, 'Auto-mark failed.'));
    }
  };

  const handleCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!classId) return setErrorMessage('Pick a class first.');
    if (!copyFrom) return setErrorMessage('Pick the date to copy from.');
    if (copyFrom === date) return setErrorMessage('Source and target dates must differ.');
    if (date > todayStr()) return setErrorMessage('Attendance cannot be copied into a future date.');
    try {
      await copyAttendance({ schoolId, classId, fromDate: copyFrom, toDate: date }).unwrap();
      setSuccessMessage(`Copied ${fmtDate(copyFrom)} into ${fmtDate(date)}.`);
      setCopyFrom('');
      setShowCopy(false);
    } catch (err: any) {
      setErrorMessage(errMsg(err, 'Copy failed.'));
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!classId) return setErrorMessage('Pick a class first.');
    const rows = parseCsv(csvText);
    if (rows.length === 0) return setErrorMessage('Paste at least one CSV row.');
    const bad = rows.findIndex(
      (r) => !r.admissionNumber || !ISO_DATE.test(r.date) || r.date > todayStr() || !STATUSES.includes(r.status)
    );
    if (bad >= 0) return setErrorMessage(`Row ${bad + 1} is invalid. Use: admissionNumber,date (YYYY-MM-DD, not in the future),status,remarks (status: ${STATUSES.join(', ')}).`);
    try {
      await importAttendance({ schoolId, classId, rows }).unwrap();
      setSuccessMessage(`Imported ${rows.length} attendance rows.`);
      setCsvText('');
      setShowImport(false);
    } catch (err: any) {
      setErrorMessage(errMsg(err, 'Import failed.'));
    }
  };

  const notMarkedCount = (notMarkedData as any)?.count ?? 0;
  const canMark = (canMarkData as any)?.canMark;

  return (
    <div className="space-y-6">
      {/* Scope */}
      <div className={WIDGET}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={LABEL}>Class</label>
            <ClassSelect options={classOptions} value={classId} onChange={setClassId} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Date</label>
            <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} className={`${INPUT} font-mono`} />
          </div>
        </div>
        {dateIssue && (
          <p className="mt-3 text-xs font-bold text-warning flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {dateIssue}
          </p>
        )}
        {classId && canMark === false && (
          <p className="mt-3 text-xs font-bold text-warning flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {(canMarkData as any)?.reason || 'You are not permitted to mark this class.'}
          </p>
        )}
      </div>

      {!classId ? (
        <div className={`${EMPTY} bg-base-200/20`}>Pick a class to open its register.</div>
      ) : (
        <>
          {/* Live tiles */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {STATUSES.map((s) => (
              <StatTile key={s} icon={UserCheck} label={s} value={counts[s]} toneClass={`${STATUS_TONES[s].bg} ${STATUS_TONES[s].text}`} />
            ))}
            <StatTile icon={Clock} label="Not yet saved" value={notMarkedCount} toneClass="bg-primary/10 text-primary" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── LEFT: Tools ── */}
            <div className="lg:col-span-4 space-y-6">
              <div className={`${CARD} space-y-4`}>
                <div className="flex items-center gap-3 pb-3 border-b border-base-300">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Wand2 className="w-5 h-5" /></div>
                  <h2 className="text-lg font-black tracking-tight">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => markAll(s)}
                      className={`px-3 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl border cursor-pointer transition-all ${STATUS_TONES[s].bg} ${STATUS_TONES[s].text} ${STATUS_TONES[s].border} hover:opacity-80`}
                    >
                      All {s}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAutoAbsent}
                  disabled={autoMarking}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl bg-base-100 border border-base-300 hover:bg-base-200 cursor-pointer disabled:opacity-60"
                >
                  {autoMarking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  Mark unmarked as absent
                </button>
              </div>

              {/* Copy */}
              <div className={`${CARD} space-y-4`}>
                <button type="button" onClick={() => setShowCopy(!showCopy)} className="w-full flex items-center justify-between gap-3 pb-2 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Copy className="w-5 h-5" /></div>
                    <div className="text-left">
                      <h2 className="text-lg font-black tracking-tight">Copy a Day</h2>
                      <p className="text-[11px] opacity-60">Reuse another date's register</p>
                    </div>
                  </div>
                  {showCopy ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
                </button>
                {showCopy && (
                  <form onSubmit={handleCopy} className="space-y-3">
                    <div className="space-y-1.5">
                      <label className={LABEL}>Copy from</label>
                      <input type="date" value={copyFrom} max={todayStr()} onChange={(e) => setCopyFrom(e.target.value)} className={`${INPUT} font-mono`} />
                    </div>
                    <button
                      type="submit"
                      disabled={copying}
                      className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                      style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                    >
                      {copying ? 'Copying…' : `Copy into ${date}`}
                    </button>
                  </form>
                )}
              </div>

              {/* Import */}
              <div className={`${CARD} space-y-4`}>
                <button type="button" onClick={() => setShowImport(!showImport)} className="w-full flex items-center justify-between gap-3 pb-2 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Upload className="w-5 h-5" /></div>
                    <div className="text-left">
                      <h2 className="text-lg font-black tracking-tight">CSV Import</h2>
                      <p className="text-[11px] opacity-60">Paste rows for this class</p>
                    </div>
                  </div>
                  {showImport ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
                </button>
                {showImport && (
                  <form onSubmit={handleImport} className="space-y-3">
                    <textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      rows={6}
                      placeholder={'admissionNumber,date,status,remarks\nADM001,2026-11-10,Late,Bus delay'}
                      className={`${INPUT} font-mono resize-none`}
                    />
                    <button
                      type="submit"
                      disabled={importing}
                      className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                      style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                    >
                      {importing ? 'Importing…' : `Import ${parseCsv(csvText).length} rows`}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* ── RIGHT: Roster ── */}
            <div className={`lg:col-span-8 ${CARD} space-y-5`}>
              <div className="flex items-center justify-between pb-4 border-b border-base-300 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Register</h2>
                    <p className="text-[11px] opacity-60">{fmtDate(date)}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold opacity-60">{roster.length} students</span>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or admission number…"
                  className="w-full pl-10 pr-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {isFetching && roster.length === 0 ? (
                <div className="p-8 text-center text-xs opacity-60">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading register…
                </div>
              ) : roster.length === 0 ? (
                <div className={EMPTY}>No students are enrolled in this class.</div>
              ) : (
                <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                  {visible.map((s) => {
                    const e = entries[s.id] ?? { status: 'Present' as AttendanceStatus, remarks: '' };
                    return (
                      <div key={s.id} className="p-3 bg-base-100 border border-base-300 rounded-xl flex flex-col md:flex-row md:items-center gap-3 hover:border-primary transition-all">
                        <div className="flex items-center gap-3 md:w-64 shrink-0 min-w-0">
                          <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 text-primary grid place-items-center font-black text-[11px]">
                            {initialsOf(s)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black truncate">{studentName(s)}</p>
                            <p className="text-[10px] font-mono opacity-60 truncate">
                              ADM {(s as any).admissionNumber ?? '—'}
                              {savedIds.has(s.id) && <span className="ml-2 text-success">saved</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {STATUSES.map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setStatus(s.id, st)}
                              className={`px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-all ${
                                e.status === st ? STATUS_TONES[st].solid : 'bg-base-200 hover:bg-base-300 opacity-70'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={e.remarks}
                          onChange={(ev) => setRemarks(s.id, ev.target.value)}
                          placeholder="Remarks"
                          className="flex-1 min-w-0 px-3 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px]"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {roster.length > 0 && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : savedIds.size > 0 ? 'Update Register' : 'Save Register'}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   RECORDS TAB
   ════════════════════════════════════════════════════════════════ */
function RecordsTab({
  schoolId, primaryColor, secondaryColor, classOptions, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | ''>('');
  const [showAudit, setShowAudit] = useState(false);

  const students = useSchoolStudents(schoolId);
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const { data, isLoading } = useGetClassAttendanceByDateQuery({ classId, date }, { skip: !classId || !date });
  const { data: summaryData } = useGetClassAttendanceSummaryQuery({ classId, date }, { skip: !classId || !date });
  const { data: notMarkedData } = useGetNotMarkedStudentsQuery({ classId, date }, { skip: !classId || !date });
  const { data: auditData, isLoading: loadingAudit } = useGetAuditTrailQuery(
    { classId, date }, { skip: !classId || !date || !showAudit }
  );

  const [updateAttendance, { isLoading: updating }] = useUpdateAttendanceMutation();
  const [deleteAttendance] = useDeleteAttendanceMutation();

  const records: AttendanceRecord[] = useMemo(() => {
    const all = data?.records ?? [];
    return statusFilter ? all.filter((r) => r.status === statusFilter) : all;
  }, [data, statusFilter]);

  const summary = summaryData?.summary;
  const notMarked: any[] = (notMarkedData as any)?.students ?? [];
  const audit: any[] = (auditData as any)?.audit ?? [];

  const nameOf = (r: AttendanceRecord) =>
    studentName(r.student ?? studentMap.get(r.studentId));

  const handleStatus = async (r: AttendanceRecord, status: AttendanceStatus) => {
    if (status === r.status) return;
    setSuccessMessage(''); setErrorMessage('');
    try {
      await updateAttendance({ attendanceId: r.id, patch: { status } }).unwrap();
      setSuccessMessage(`${nameOf(r)} is now ${status}.`);
    } catch (err: any) {
      setErrorMessage(errMsg(err, 'Update failed.'));
    }
  };

  const handleDelete = async (r: AttendanceRecord) => {
    if (!window.confirm(`Delete the attendance record for ${nameOf(r)}?`)) return;
    setSuccessMessage(''); setErrorMessage('');
    try {
      await deleteAttendance(r.id).unwrap();
      setSuccessMessage('Record deleted.');
    } catch (err: any) {
      setErrorMessage(errMsg(err, 'Delete failed.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className={WIDGET}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className={LABEL}>Class</label>
            <ClassSelect options={classOptions} value={classId} onChange={setClassId} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${INPUT} font-mono`} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AttendanceStatus | '')} className={`${INPUT} cursor-pointer`}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!classId ? (
        <div className={`${EMPTY} bg-base-200/20`}>Pick a class and date to see its records.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatTile icon={Users} label="Total" value={summary?.total ?? 0} toneClass="bg-primary/10 text-primary" />
            {STATUSES.map((s) => (
              <StatTile key={s} icon={UserCheck} label={s} value={summary?.counts?.[s] ?? 0} toneClass={`${STATUS_TONES[s].bg} ${STATUS_TONES[s].text}`} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className={`lg:col-span-8 ${CARD} space-y-5`}>
              <div className="flex items-center justify-between pb-4 border-b border-base-300 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                    <ListChecks className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight">Records</h2>
                </div>
                <span className="text-xs font-mono font-bold opacity-60">
                  {records.length} record{records.length !== 1 ? 's' : ''} · rate {pct(summary?.rate)}
                </span>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-xs opacity-60">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading records…
                </div>
              ) : records.length === 0 ? (
                <div className={EMPTY}>
                  {statusFilter ? `No ${statusFilter} records for this day.` : 'No attendance has been recorded for this day.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                  {records.map((r) => (
                    <div key={r.id} className="p-3 bg-base-100 border border-base-300 rounded-xl flex items-center gap-3 hover:border-primary transition-all">
                      <div className={`shrink-0 w-9 h-9 rounded-full grid place-items-center font-black text-[11px] ${STATUS_TONES[r.status].bg} ${STATUS_TONES[r.status].text}`}>
                        {initialsOf(r.student ?? studentMap.get(r.studentId))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate">{nameOf(r)}</p>
                        <p className="text-[10px] font-mono opacity-60 truncate">
                          {r.remarks || 'No remarks'}
                        </p>
                      </div>
                      <select
                        value={r.status}
                        disabled={updating}
                        onChange={(e) => handleStatus(r, e.target.value as AttendanceStatus)}
                        className={`px-2 py-1.5 text-[10px] font-black uppercase rounded-lg border cursor-pointer ${STATUS_TONES[r.status].bg} ${STATUS_TONES[r.status].text} ${STATUS_TONES[r.status].border}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button
                        onClick={() => handleDelete(r)}
                        className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              {/* Not marked */}
              <div className={`${CARD} space-y-4`}>
                <div className="flex items-center gap-3 pb-3 border-b border-base-300">
                  <div className="p-2.5 bg-warning/10 text-warning rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
                  <h2 className="text-lg font-black tracking-tight">Not Marked</h2>
                  <span className="ml-auto text-xs font-mono font-bold opacity-60">{notMarked.length}</span>
                </div>
                {notMarked.length === 0 ? (
                  <p className="text-xs opacity-60">Everyone has a record for this day.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                    {notMarked.map((s: any) => (
                      <li key={s.id ?? s.studentId} className="text-xs font-bold truncate">{studentName(s)}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Audit */}
              <div className={`${CARD} space-y-4`}>
                <button type="button" onClick={() => setShowAudit(!showAudit)} className="w-full flex items-center justify-between gap-3 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><History className="w-5 h-5" /></div>
                    <div className="text-left">
                      <h2 className="text-lg font-black tracking-tight">Audit Trail</h2>
                      <p className="text-[11px] opacity-60">Who changed what</p>
                    </div>
                  </div>
                  {showAudit ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
                </button>
                {showAudit && (
                  loadingAudit ? (
                    <div className="text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…</div>
                  ) : audit.length === 0 ? (
                    <p className="text-xs opacity-60">No changes logged for this day.</p>
                  ) : (
                    <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {audit.map((a) => (
                        <li key={a.id} className="p-2.5 bg-base-100 border border-base-300 rounded-xl text-[11px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black uppercase text-[10px] text-primary">{a.action}</span>
                            <span className="font-mono opacity-60">{fmtDateTime(a.createdAt)}</span>
                          </div>
                          {(a.oldValue?.status || a.newValue?.status) && (
                            <p className="mt-1 opacity-70">
                              {a.oldValue?.status ?? '—'} → {a.newValue?.status ?? '—'}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STUDENTS TAB
   ════════════════════════════════════════════════════════════════ */
function StudentsTab({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const [studentId, setStudentId] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | ''>('');

  // Quick mark
  const [qmDate, setQmDate] = useState(todayStr());
  const [qmStatus, setQmStatus] = useState<AttendanceStatus>('Present');
  const [qmRemarks, setQmRemarks] = useState('');

  const students = useSchoolStudents(schoolId);
  const selected = useMemo(() => students.find((s) => s.id === studentId), [students, studentId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      studentName(s).toLowerCase().includes(q) || ((s as any).admissionNumber ?? '').toLowerCase().includes(q)
    );
  }, [students, search]);

  const { data: statsData } = useGetStudentStatsQuery(studentId, { skip: !studentId });
  const { data: historyData, isLoading } = useGetStudentHistoryQuery(
    { studentId, fromDate: fromDate || undefined, toDate: toDate || undefined, status: statusFilter || undefined },
    { skip: !studentId }
  );
  const [markAttendance, { isLoading: marking }] = useMarkAttendanceMutation();

  const stats = statsData?.stats;
  const history: AttendanceRecord[] = historyData?.records ?? [];

  const handleQuickMark = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!selected) return setErrorMessage('Pick a student first.');
    const classId = (selected as any).classId;
    if (!classId) return setErrorMessage('This student is not assigned to a class.');
    try {
      await markAttendance({
        schoolId, studentId, classId, date: qmDate, status: qmStatus, remarks: qmRemarks.trim() || null,
      }).unwrap();
      setSuccessMessage(`${studentName(selected)} marked ${qmStatus} for ${fmtDate(qmDate)}.`);
      setQmRemarks('');
    } catch (err: any) {
      setErrorMessage(errMsg(err, 'Failed to mark attendance.'));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── LEFT ── */}
      <div className="lg:col-span-5 space-y-6">
        <div className={`${CARD} space-y-4`}>
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Search className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Find a Student</h2>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-10 pr-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={`${INPUT} cursor-pointer`}>
            <option value="">
              {filtered.length === 0 ? 'No matching students' : `-- Choose from ${filtered.length} student${filtered.length === 1 ? '' : 's'} --`}
            </option>
            {filtered.slice(0, 200).map((s) => <option key={s.id} value={s.id}>{studentLabel(s)}</option>)}
          </select>
        </div>

        {selected && (
          <form onSubmit={handleQuickMark} className={`${CARD} space-y-4`}>
            <div className="flex items-center gap-3 pb-3 border-b border-base-300">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><PlusCircle className="w-5 h-5" /></div>
              <h2 className="text-lg font-black tracking-tight">Mark One Day</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={LABEL}>Date</label>
                <input type="date" value={qmDate} max={todayStr()} onChange={(e) => setQmDate(e.target.value)} className={`${INPUT} font-mono`} />
              </div>
              <div className="space-y-1.5">
                <label className={LABEL}>Status</label>
                <select value={qmStatus} onChange={(e) => setQmStatus(e.target.value as AttendanceStatus)} className={`${INPUT} cursor-pointer`}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>Remarks (optional)</label>
              <input type="text" value={qmRemarks} onChange={(e) => setQmRemarks(e.target.value)} placeholder="e.g. Doctor's appointment" className={INPUT} />
            </div>
            <button
              type="submit"
              disabled={marking}
              className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
            >
              {marking ? 'Saving…' : 'Save Attendance'}
            </button>
          </form>
        )}
      </div>

      {/* ── RIGHT ── */}
      <div className={`lg:col-span-7 ${CARD} space-y-5`}>
        <div className="flex items-center justify-between pb-4 border-b border-base-300 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">{selected ? studentName(selected) : 'History'}</h2>
          </div>
          {selected && <span className="text-xs font-mono font-bold opacity-60">{history.length} records</span>}
        </div>

        {!studentId ? (
          <div className={EMPTY}>Pick a student to see their attendance history.</div>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatTile icon={TrendingUp} label="Rate" value={pct(stats.attendanceRate)} toneClass="bg-primary/10 text-primary" />
                <StatTile icon={UserCheck} label="Present" value={stats.present ?? 0} toneClass={`${STATUS_TONES.Present.bg} ${STATUS_TONES.Present.text}`} />
                <StatTile icon={UserCheck} label="Absent" value={stats.absent ?? 0} toneClass={`${STATUS_TONES.Absent.bg} ${STATUS_TONES.Absent.text}`} />
                <StatTile icon={Clock} label="Late" value={stats.late ?? 0} toneClass={`${STATUS_TONES.Late.bg} ${STATUS_TONES.Late.text}`} />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 text-xs font-mono bg-base-100 border border-base-300 rounded-xl" />
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 text-xs font-mono bg-base-100 border border-base-300 rounded-xl" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AttendanceStatus | '')} className="px-3 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl cursor-pointer">
                <option value="">All statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {(fromDate || toDate || statusFilter) && (
                <button onClick={() => { setFromDate(''); setToDate(''); setStatusFilter(''); }} className="text-xs font-bold text-primary hover:underline px-2 cursor-pointer">
                  Clear
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading history…</div>
            ) : history.length === 0 ? (
              <div className={EMPTY}>No records match the current filters.</div>
            ) : (
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {[...history].sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
                  <div key={r.id} className="p-3 bg-base-100 border border-base-300 rounded-xl flex items-center gap-3 hover:border-primary transition-all">
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${STATUS_TONES[r.status].bg} ${STATUS_TONES[r.status].text}`}>
                      {r.status}
                    </span>
                    <span className="text-xs font-bold">{fmtDate(r.date)}</span>
                    <span className="text-[10px] opacity-60 truncate ml-auto">{r.remarks || ''}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   REPORTS TAB
   ════════════════════════════════════════════════════════════════ */
function ReportsTab({ schoolId, secondaryColor, classOptions }: SectionProps) {
  const now = new Date();
  const [date, setDate] = useState(todayStr());
  const [threshold, setThreshold] = useState(75);
  const [classId, setClassId] = useState('');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const students = useSchoolStudents(schoolId);
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const { data: absData } = useGetAbsenteesQuery({ schoolId, date }, { skip: !schoolId || !date });
  const { data: lateData } = useGetLateArrivalsQuery({ schoolId, date }, { skip: !schoolId || !date });
  const { data: chronicData } = useGetChronicAbsenteesQuery({ schoolId, threshold }, { skip: !schoolId });
  const { data: registerData, isLoading: loadingRegister } = useGetMonthlyRegisterQuery(
    { classId, year, month }, { skip: !classId }
  );

  const absentees: AttendanceRecord[] = absData?.records ?? [];
  const lateArrivals: AttendanceRecord[] = lateData?.records ?? [];
  const chronic = chronicData?.students ?? [];
  const register: any[] = registerData?.register ?? [];

  const nameOf = (r: AttendanceRecord) => studentName(r.student ?? studentMap.get(r.studentId));

  return (
    <div className="space-y-6">
      <div className={WIDGET}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={LABEL}>School-wide date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${INPUT} font-mono`} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Chronic absence threshold ({threshold}%)</label>
            <input
              type="range" min={0} max={100} step={5} value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="range range-primary range-xs w-full mt-3"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ReportList title="Absent" tone="Absent" count={absentees.length} empty="No absentees on this date.">
          {absentees.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-xs">
              <span className="font-bold truncate">{nameOf(r)}</span>
              <span className="text-[10px] opacity-60 ml-auto truncate">{r.remarks || ''}</span>
            </li>
          ))}
        </ReportList>

        <ReportList title="Late arrivals" tone="Late" count={lateArrivals.length} empty="No late arrivals on this date.">
          {lateArrivals.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-xs">
              <span className="font-bold truncate">{nameOf(r)}</span>
              <span className="text-[10px] opacity-60 ml-auto truncate">{r.remarks || ''}</span>
            </li>
          ))}
        </ReportList>

        <ReportList title={`Below ${threshold}%`} tone="Excused" count={chronic.length} empty="No students below this threshold.">
          {chronic.map((c) => (
            <li key={c.studentId} className="flex items-center gap-2 text-xs">
              <span className="font-bold truncate">{studentName(c.firstName ? c : studentMap.get(c.studentId))}</span>
              <span className="text-[10px] font-mono font-black text-error ml-auto shrink-0">{pct(c.attendanceRate)}</span>
            </li>
          ))}
        </ReportList>
      </div>

      {/* Monthly register */}
      <div className={`${CARD} space-y-5`}>
        <div className="flex items-center justify-between pb-4 border-b border-base-300 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <CalendarDays className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Monthly Register</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="w-48"><ClassSelect options={classOptions} value={classId} onChange={setClassId} compact /></div>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl cursor-pointer">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <input
              type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 px-3 py-2 text-xs font-mono bg-base-100 border border-base-300 rounded-xl"
            />
          </div>
        </div>

        {!classId ? (
          <div className={EMPTY}>Pick a class to load its monthly register.</div>
        ) : loadingRegister ? (
          <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading register…</div>
        ) : register.length === 0 ? (
          <div className={EMPTY}>No attendance recorded for {MONTHS[month - 1]} {year}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-wider opacity-60">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Days</th>
                  <th className="py-2 text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {register.map((row, i) => {
                  const student = row.student ?? studentMap.get(row.studentId) ?? row;
                  const days: Record<string, AttendanceStatus> = row.days ?? row.attendance ?? {};
                  return (
                    <tr key={row.studentId ?? i} className="border-t border-base-300">
                      <td className="py-2 pr-4 font-bold whitespace-nowrap">{studentName(student)}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-0.5 flex-wrap">
                          {Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).map(([d, st]) => (
                            <span
                              key={d}
                              title={`${d}: ${st}`}
                              className={`w-5 h-5 grid place-items-center rounded text-[9px] font-black ${STATUS_TONES[st]?.bg ?? 'bg-base-200'} ${STATUS_TONES[st]?.text ?? ''}`}
                            >
                              {String(st)?.[0] ?? '·'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 text-right font-mono font-black">{pct(row.attendanceRate ?? row.rate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportList({
  title, tone, count, empty, children,
}: {
  title: string; tone: AttendanceStatus; count: number; empty: string; children: React.ReactNode;
}) {
  const t = STATUS_TONES[tone];
  return (
    <div className={WIDGET}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${t.bg} ${t.text}`}>{title}</span>
        <span className="ml-auto text-[10px] font-mono opacity-60">{count}</span>
      </div>
      {count === 0 ? (
        <p className="text-xs opacity-60">{empty}</p>
      ) : (
        <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">{children}</ul>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INSIGHTS TAB
   ════════════════════════════════════════════════════════════════ */
function InsightsTab({ schoolId, primaryColor, secondaryColor, classOptions }: SectionProps) {
  const [classId, setClassId] = useState('');
  const [days, setDays] = useState(30);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');


  const { data: byStatusData } = useGetCountByStatusQuery({ schoolId, date: todayStr() }, { skip: !schoolId });
  const { data: schoolStatsData } = useGetSchoolAttendanceStatsQuery(schoolId, { skip: !schoolId });
  const { data: comparisonData } = useGetAttendanceComparisonQuery(schoolId, { skip: !schoolId });
  const { data: genderData } = useGetAttendanceByGenderQuery(schoolId, { skip: !schoolId });
  const { data: settingsData } = useGetAttendanceSettingsQuery(schoolId, { skip: !schoolId });
  const { data: rateData } = useGetClassAttendanceRateQuery(
    { classId, fromDate: fromDate || undefined, toDate: toDate || undefined }, { skip: !classId }
  );
  const { data: trendData } = useGetClassTrendQuery({ classId, days }, { skip: !classId });

  const counts = byStatusData?.counts;
  const totalToday = counts ? STATUSES.reduce((n, s) => n + (counts[s] ?? 0), 0) : 0;
  const trend = trendData?.trend ?? [];

  return (
    <div className="space-y-6">
      {/* Today tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatTile icon={Users} label="Marked today" value={totalToday} toneClass="bg-primary/10 text-primary" />
        {STATUSES.map((s) => (
          <StatTile key={s} icon={UserCheck} label={s} value={counts?.[s] ?? 0} toneClass={`${STATUS_TONES[s].bg} ${STATUS_TONES[s].text}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status split */}
        <div className={`${CARD} space-y-5`}>
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><BarChart3 className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Today by Status</h2>
          </div>
          {totalToday === 0 ? (
            <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">No attendance marked today.</div>
          ) : (
            <div className="space-y-3">
              {STATUSES.map((s) => {
                const n = counts?.[s] ?? 0;
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-black uppercase ${STATUS_TONES[s].text}`}>{s}</span>
                      <span className="text-xs font-mono font-black">{n}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-base-200 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(n / totalToday) * 100}%`, backgroundColor: primaryColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comparison */}
        <div className={`${CARD} space-y-5`}>
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">This Month vs Last</h2>
          </div>
          <KeyValues data={comparisonData?.statistics} empty="No comparison data yet." />
        </div>

        <div className={`${CARD} space-y-5`}>
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Users className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">By Gender</h2>
          </div>
          <KeyValues data={genderData?.statistics} empty="No gender breakdown yet." />
        </div>

        <div className={`${CARD} space-y-5`}>
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <Building className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">School Overview</h2>
          </div>
          <KeyValues data={schoolStatsData?.statistics ?? schoolStatsData?.stats} empty="No school statistics yet." />
        </div>
      </div>

      {/* Class trend */}
      <div className={`${CARD} space-y-5`}>
        <div className="flex items-center justify-between pb-4 border-b border-base-300 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Class Trend</h2>
              <p className="text-[11px] opacity-60">Attendance rate over time</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="w-48"><ClassSelect options={classOptions} value={classId} onChange={setClassId} compact /></div>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-3 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl cursor-pointer">
              {[7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
            </select>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 text-xs font-mono bg-base-100 border border-base-300 rounded-xl" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 text-xs font-mono bg-base-100 border border-base-300 rounded-xl" />
          </div>
        </div>

        {!classId ? (
          <div className={EMPTY}>Pick a class to see its rate and trend.</div>
        ) : (
          <>
            <p className="text-sm font-black">
              Overall rate <span className="text-primary">{pct(rateData?.rate)}</span>
              {(fromDate || toDate) && <span className="text-[11px] font-mono opacity-60 ml-2">{fromDate || '…'} → {toDate || '…'}</span>}
            </p>
            {trend.length === 0 ? (
              <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">No trend data for this period.</div>
            ) : (
              <>
                <div className="flex items-end gap-1.5 h-40 px-2">
                  {trend.map((t) => {
                    const v = Math.max(0, Math.min(100, Number(t.rate) || 0));
                    return (
                      <div key={t.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        <span className="absolute -top-4 text-[9px] font-mono font-black opacity-0 group-hover:opacity-100">{pct(t.rate)}</span>
                        <div
                          className="w-full rounded-t transition-all"
                          style={{ height: `${v}%`, backgroundColor: primaryColor, minHeight: v > 0 ? 4 : 0 }}
                          title={`${fmtDate(t.date)}: ${pct(t.rate)}`}
                        />
                        <span className="mt-1 text-[9px] font-mono opacity-60 truncate w-full text-center">{t.date.slice(8)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-mono opacity-50 px-2">
                  <span>{fmtDate(trend[0].date)}</span>
                  <span>{fmtDate(trend[trend.length - 1].date)}</span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Settings */}
      {settingsData?.settings && Object.keys(settingsData.settings).length > 0 && (
        <div className={`${CARD} space-y-5`}>
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><ClipboardCheck className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Attendance Rules</h2>
          </div>
          <KeyValues data={settingsData.settings} empty="" />
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED
   ════════════════════════════════════════════════════════════════ */
function ClassSelect({
  options, value, onChange, compact,
}: {
  options: Array<[string, string]>; value: string; onChange: (v: string) => void; compact?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={compact
        ? 'w-full px-3 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl cursor-pointer'
        : `${INPUT} cursor-pointer`}
    >
      <option value="">{options.length === 0 ? 'No classes found' : '-- Choose class --'}</option>
      {options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select>
  );
}

function humanize(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (c) => c.toUpperCase()).trim();
}

function KeyValues({ data, empty }: { data?: Record<string, any> | null; empty: string }) {
  const rows: Array<[string, string]> = [];
  Object.entries(data ?? {}).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    if (typeof v === 'object' && !Array.isArray(v)) {
      Object.entries(v).forEach(([k2, v2]) => {
        if (typeof v2 !== 'object') rows.push([`${humanize(k)} · ${humanize(k2)}`, String(v2)]);
      });
    } else if (typeof v !== 'object') {
      rows.push([humanize(k), /rate|percent/i.test(k) ? pct(v as any) : String(v)]);
    }
  });

  if (rows.length === 0) {
    return empty ? (
      <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">{empty}</div>
    ) : null;
  }
  return (
    <ul className="space-y-2">
      {rows.map(([k, v]) => (
        <li key={k} className="flex items-center justify-between gap-3 p-2.5 bg-base-100 border border-base-300 rounded-xl">
          <span className="text-[11px] font-black uppercase tracking-wider opacity-60 truncate">{k}</span>
          <span className="text-xs font-mono font-black">{v}</span>
        </li>
      ))}
    </ul>
  );
}

function StatTile({
  icon: Icon, label, value, toneClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  toneClass: string;
}) {
  return (
    <div className="p-4 bg-base-100 border border-base-300 rounded-2xl">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${toneClass}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</p>
      </div>
      <p className="text-xl font-black text-base-content truncate">{value}</p>
    </div>
  );
}