import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  FileSpreadsheet, Calendar, ClipboardEdit, ListChecks, BarChart3,
  PlusCircle, Edit3, Trash2, CheckCircle2, AlertCircle, X,
  Building, Loader2, Save, Lock, Unlock, Send, BookOpen,
  GraduationCap, Clock, MapPin, Award, TrendingUp, Percent,
  Calculator, Users, ChevronDown, ChevronRight,
  UserX, FileText, Trophy, Printer, Wand2,
} from 'lucide-react';

import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import {
  useGetTermsBySchoolIdQuery,
  useGetCurrentTermBySchoolIdQuery,
} from '../../features/Apis/Term.Api';
import {
  useGetGradeLevelsBySchoolQuery,
  useGetSubjectsBySchoolQuery,
  useGetClassesBySchoolQuery,
  type GradeLevel,
  type Subject,
  type ClassEntity,
} from '../../features/Apis/academicStructure.Api';
import {
  useGetStudentsByClassQuery,
  type Student,
} from '../../features/Apis/students.Api';
import {
  useCreateExamMutation,
  useGetExamsByTermQuery,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useGetExamStatisticsQuery,
  useBulkCreateSchedulesMutation,
  useGetSchedulesByExamQuery,
  useDeleteScheduleMutation,
  useBulkEnterMarksMutation,
  useGetMarksheetQuery,
  useComputeGradesMutation,
  useComputeSubjectPositionsMutation,
  useComputeClassRankingMutation,
  useGetSubjectStatisticsQuery,
  useGetClassPerformanceQuery,
  usePublishExamMutation,
  useUnlockExamMutation,
  useLockExamMutation,
  type Exam,
  type ExamCategory,
  type ExamSchedule,
} from '../../features/Apis/Exams.Api';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const EXAM_CATEGORIES: ExamCategory[] = [
  'Mid-Term', 'End-Term', 'Continuous Assessment', 'Project', 'Practical',
  'Opening', 'Formative', 'Summative', 'Mock', 'End of Year',
];

/** Same "fail" grades the backend uses for pass rate. */
const FAIL_GRADES = ['E', 'BE', '1', '2', '3'];

/** Default total marks when a paper has no value set in the schedule. */
const DEFAULT_OUT_OF = '100';

const CARD = 'bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl';
const WIDGET = 'bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-2xl shadow-sm';
const INPUT = 'w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary';
const SELECT_SM = 'w-full px-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer';
const LABEL = 'block text-xs font-bold uppercase tracking-wider opacity-70';
const EMPTY = 'p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl';

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
function pick<T = any>(data: any, ...keys: string[]): T[] {
  if (!data) return [];
  for (const k of keys) if (Array.isArray(data[k])) return data[k];
  return Array.isArray(data) ? data : [];
}

const extractExams = (d: any) => pick<Exam>(d, 'exams', 'data');
const extractSchedules = (d: any) => pick<ExamSchedule>(d, 'schedules', 'data');
const extractSubjects = (d: any) => pick<Subject>(d, 'subjects', 'data');
const extractClasses = (d: any) => pick<ClassEntity>(d, 'classes', 'data');
const extractGrades = (d: any) => pick<GradeLevel>(d, 'gradeLevels', 'levels', 'data');
const extractStudents = (d: any) => pick<Student>(d, 'students', 'data');

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  try {
    const safe = d.length === 10 ? `${d}T00:00:00` : d;
    return new Date(safe).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

const fmtTime = (t?: string | null) => (t ? t.slice(0, 5) : '—');
const num = (v: any, digits = 2) => (v == null || v === '' || isNaN(Number(v)) ? '—' : Number(v).toFixed(digits));

/** "50.00" -> "50", null/invalid -> null */
function cleanOutOf(v: any): string | null {
  if (v == null || v === '' || isNaN(Number(v)) || Number(v) <= 0) return null;
  return String(Number(v));
}

/** Turns an RTK Query error into a readable message. */
function errMsg(err: any, fallback: string): string {
  if (err?.status === 401) return 'Your session has expired. Please sign in again.';
  if (err?.status === 403) return err?.data?.message || 'You do not have permission to do that.';
  return err?.data?.message || err?.message || fallback;
}

function examIsLocked(exam: Exam | null | undefined): boolean {
  return exam?.isLocked === true;
}

/**
 * The marksheet endpoint returns firstName/lastName and raw marks only.
 * Add the display fields the table needs: name, %, subject position and summary stats.
 */
function normalizeMarksheet(data: any) {
  const raw: any[] = data?.marksheet?.rows ?? [];
  const pctOf = (r: any) => (Number(r.outOf) > 0 ? (Number(r.marks) / Number(r.outOf)) * 100 : 0);
  const scored = raw.filter((r) => !r.isAbsent && r.marks != null && r.marks !== '');

  const ranked = [...scored].sort((a, b) => pctOf(b) - pctOf(a));
  const position = new Map<string, number>();
  ranked.forEach((r, i) => {
    const prev = ranked[i - 1];
    position.set(r.studentId, prev && pctOf(prev) === pctOf(r) ? position.get(prev.studentId)! : i + 1);
  });

  const rows = raw.map((r) => ({
    ...r,
    studentName: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || 'Unnamed',
    percentage: r.isAbsent || r.marks == null || r.marks === '' ? null : pctOf(r),
    position: position.get(r.studentId) ?? null,
  }));

  const pcts = scored.map(pctOf);
  const graded = scored.filter((r) => r.grade);
  const stats = scored.length === 0 ? null : {
    mean: pcts.reduce((s, v) => s + v, 0) / pcts.length,
    highest: Math.max(...pcts),
    lowest: Math.min(...pcts),
    passRate: graded.length === 0
      ? null
      : (graded.filter((r) => !FAIL_GRADES.includes(r.grade)).length / graded.length) * 100,
  };

  return { rows, stats };
}

type Tab = 'exams' | 'schedules' | 'marks' | 'marksheet' | 'insights';

type SectionProps = {
  schoolId: string;
  primaryColor: string;
  secondaryColor: string;
  setSuccessMessage: (v: string) => void;
  setErrorMessage: (v: string) => void;
};

// ═══════════════════════════════════════════════════════════════
// SHARED HOOKS
// ═══════════════════════════════════════════════════════════════

/** Term + exam selection used by every tab. Defaults to the current term. */
function useTermExams(schoolId: string) {
  const [termId, setTermIdState] = useState('');
  const [examId, setExamId] = useState('');

  const { data: termsData } = useGetTermsBySchoolIdQuery(schoolId, { skip: !schoolId });
  const { data: currentTermData } = useGetCurrentTermBySchoolIdQuery(schoolId, { skip: !schoolId });
  const terms: any[] = termsData?.terms ?? [];
  const currentTerm: any = currentTermData?.term ?? null;

  useEffect(() => {
    if (!termId && currentTerm) setTermIdState(currentTerm.id);
  }, [currentTerm, termId]);

  const { data: examsData, isLoading: loadingExams } = useGetExamsByTermQuery(
    { schoolId, termId }, { skip: !schoolId || !termId }
  );
  const exams = useMemo(() => extractExams(examsData), [examsData]);
  const term = terms.find((t) => t.id === termId) ?? null;
  const selectedExam = useMemo(() => exams.find((e) => e.id === examId) ?? null, [exams, examId]);

  const setTermId = (id: string) => { setTermIdState(id); setExamId(''); };

  return { terms, term, termId, setTermId, examId, setExamId, exams, selectedExam, loadingExams };
}

type TermExamsCtrl = ReturnType<typeof useTermExams>;

/** Subjects, grade levels and classes (limited to the term's academic year when possible). */
function useAcademicLists(schoolId: string, academicYear?: string) {
  const { data: subjectsData } = useGetSubjectsBySchoolQuery(schoolId, { skip: !schoolId });
  const { data: classesData } = useGetClassesBySchoolQuery(schoolId, { skip: !schoolId });
  const { data: gradesData } = useGetGradeLevelsBySchoolQuery(schoolId, { skip: !schoolId });

  const subjects = useMemo(() => extractSubjects(subjectsData), [subjectsData]);
  const allClasses = useMemo(() => extractClasses(classesData), [classesData]);
  const grades = useMemo(() => extractGrades(gradesData), [gradesData]);

  const gradeName = (gid: string) => grades.find((g) => g.id === gid)?.name ?? '—';
  const subjectName = (sid: string) => subjects.find((s) => s.id === sid)?.name ?? '—';
  const classLabel = (c: ClassEntity) => `${gradeName(c.gradeLevelId)} ${c.stream ?? ''}`.trim();
  const className = (cid: string) => {
    const c = allClasses.find((x) => x.id === cid);
    return c ? classLabel(c) : '—';
  };

  const classOptions: Array<[string, string]> = useMemo(() => {
    const sameYear = academicYear ? allClasses.filter((c) => c.academicYear === academicYear) : [];
    const list = sameYear.length > 0 ? sameYear : allClasses;
    return list
      .map((c): [string, string] => [c.id, classLabel(c)])
      .sort((a, b) => a[1].localeCompare(b[1]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allClasses, grades, academicYear]);

  return { subjects, allClasses, grades, gradeName, subjectName, className, classLabel, classOptions };
}

/** "Grade 7 (East, West) · Grade 8 (North)" for a set of class ids. */
function describeClasses(classIds: string[], lists: ReturnType<typeof useAcademicLists>): string {
  const byGrade = new Map<string, string[]>();
  classIds.forEach((id) => {
    const c = lists.allClasses.find((x) => x.id === id);
    if (!c) return;
    const g = lists.gradeName(c.gradeLevelId);
    if (!byGrade.has(g)) byGrade.set(g, []);
    byGrade.get(g)!.push(c.stream ?? '');
  });
  return [...byGrade.entries()]
    .map(([g, streams]) => {
      const named = streams.filter(Boolean).sort();
      return named.length ? `${g} (${named.join(', ')})` : g;
    })
    .join(' · ') || '—';
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ExamsManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const [activeTab, setActiveTab] = useState<Tab>('exams');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const sectionProps: SectionProps = {
    schoolId: currentSchoolId,
    primaryColor,
    secondaryColor,
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
              <FileSpreadsheet className="w-3.5 h-3.5" /> Examinations
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">Exams Manager</h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Create one exam per term, schedule it for whole grades, enter marks and publish results for {schoolName}.
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
          { id: 'exams' as Tab, label: 'Exams', icon: FileSpreadsheet },
          { id: 'schedules' as Tab, label: 'Schedules', icon: Calendar },
          { id: 'marks' as Tab, label: 'Marks Entry', icon: ClipboardEdit },
          { id: 'marksheet' as Tab, label: 'Marksheet', icon: ListChecks },
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
      {activeTab === 'exams' && <ExamsTab {...sectionProps} />}
      {activeTab === 'schedules' && <SchedulesTab {...sectionProps} />}
      {activeTab === 'marks' && <MarksEntryTab {...sectionProps} />}
      {activeTab === 'marksheet' && <MarksheetTab {...sectionProps} />}
      {activeTab === 'insights' && <InsightsTab {...sectionProps} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   EXAMS TAB — one exam per term, shared by every class
   ════════════════════════════════════════════════════════════════ */
function ExamsTab({ schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage }: SectionProps) {
  const ctrl = useTermExams(schoolId);
  const { terms, termId, setTermId, exams, loadingExams } = ctrl;

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    examTitle: '',
    examCategory: 'Mid-Term' as ExamCategory,
    weighting: '30.00',
    startDate: '',
    endDate: '',
  });

  const [createExam, { isLoading: creating }] = useCreateExamMutation();
  const [updateExam, { isLoading: updating }] = useUpdateExamMutation();
  const [deleteExam] = useDeleteExamMutation();
  const [publishExam] = usePublishExamMutation();
  const [unlockExam] = useUnlockExamMutation();
  const [lockExam] = useLockExamMutation();

  const resetForm = () => {
    setForm({ examTitle: '', examCategory: 'Mid-Term', weighting: '30.00', startDate: '', endDate: '' });
    setIsEditing(false); setEditingId(null);
  };

  const handleEdit = (e: Exam) => {
    setForm({
      examTitle: e.examTitle,
      examCategory: e.examCategory,
      weighting: e.weighting ?? '30.00',
      startDate: e.startDate ? e.startDate.split('T')[0] : '',
      endDate: e.endDate ? e.endDate.split('T')[0] : '',
    });
    setIsEditing(true); setEditingId(e.id);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!termId) return setErrorMessage('Pick a term first.');
    if (!form.examTitle.trim()) return setErrorMessage('Exam title is required.');
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      return setErrorMessage('End date must be after start date.');

    const common = {
      examTitle: form.examTitle.trim(),
      examCategory: form.examCategory,
      weighting: form.weighting.trim() || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };

    try {
      if (isEditing && editingId) {
        await updateExam({ examId: editingId, patch: common }).unwrap();
        setSuccessMessage(`Exam "${common.examTitle}" updated.`);
      } else {
        await createExam({ schoolId, termId, ...common }).unwrap();
        setSuccessMessage(`Exam "${common.examTitle}" created. Schedule it for any grade on the Schedules tab.`);
      }
      resetForm();
    } catch (err: any) {
      setErrorMessage(errMsg(err, 'Operation failed.'));
    }
  };

  const run = async (fn: () => Promise<any>, ok: string, fail: string) => {
    setSuccessMessage(''); setErrorMessage('');
    try { await fn(); setSuccessMessage(ok); } catch (err: any) { setErrorMessage(errMsg(err, fail)); }
  };

  const handleDelete = (e: Exam) => {
    if (!window.confirm(`Delete exam "${e.examTitle}"? All schedules and marks will be removed.`)) return;
    run(() => deleteExam(e.id).unwrap(), `"${e.examTitle}" deleted.`, 'Delete failed.');
  };
  const handlePublish = (e: Exam) => {
    if (!window.confirm(`Publish "${e.examTitle}"? Rankings are computed and marks are locked.`)) return;
    run(() => publishExam(e.id).unwrap(), `"${e.examTitle}" published and locked.`, 'Publish failed.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── LEFT: Form ── */}
      <div className="lg:col-span-5 space-y-6">
        <div className={`${CARD} space-y-6`}>
          <div className="flex items-center justify-between pb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><PlusCircle className="w-5 h-5" /></div>
              <h2 className="text-lg font-black tracking-tight">{isEditing ? 'Edit Exam' : 'Create Exam'}</h2>
            </div>
            {isEditing && (
              <button onClick={resetForm} className="text-xs text-error font-bold hover:underline cursor-pointer">Cancel</button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className={LABEL}>Academic Term</label>
            <select value={termId} onChange={(e) => setTermId(e.target.value)} className={`${INPUT} cursor-pointer`}>
              <option value="">-- Choose term --</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.termName} ({t.academicYear}){t.isCurrentTerm ? ' · current' : ''}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className={LABEL}>Exam Title</label>
              <input
                type="text" required value={form.examTitle}
                onChange={(e) => setForm({ ...form, examTitle: e.target.value })}
                placeholder="e.g. Mid-Term Exam 2026" className={INPUT}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={LABEL}>Category</label>
                <select
                  value={form.examCategory}
                  onChange={(e) => setForm({ ...form, examCategory: e.target.value as ExamCategory })}
                  className={`${INPUT} cursor-pointer`}
                >
                  {EXAM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={LABEL}>Weighting %</label>
                <input
                  type="text" value={form.weighting}
                  onChange={(e) => setForm({ ...form, weighting: e.target.value })}
                  placeholder="30.00" className={`${INPUT} font-mono`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={LABEL}>Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={`${INPUT} font-mono`} />
              </div>
              <div className="space-y-1.5">
                <label className={LABEL}>End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={`${INPUT} font-mono`} />
              </div>
            </div>

            <p className="text-[11px] opacity-60">
              An exam belongs to the term, not to a class. Every class in a grade sits the same exam.
            </p>

            <button
              type="submit"
              disabled={creating || updating || !termId}
              className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-2 disabled:opacity-60"
              style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
            >
              {creating || updating ? 'Saving…' : isEditing ? 'Update Exam' : 'Create Exam'}
            </button>
          </form>
        </div>
      </div>

      {/* ── RIGHT: List ── */}
      <div className={`lg:col-span-7 ${CARD} space-y-5`}>
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Exams in Term</h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{exams.length}</span>
        </div>

        {!termId ? (
          <div className={EMPTY}>Pick a term to see its exams.</div>
        ) : loadingExams ? (
          <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading exams…</div>
        ) : exams.length === 0 ? (
          <div className={EMPTY}>No exams yet for this term.</div>
        ) : (
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onEdit={() => handleEdit(exam)}
                onDelete={() => handleDelete(exam)}
                onPublish={() => handlePublish(exam)}
                onUnlock={() => run(() => unlockExam(exam.id).unwrap(), `"${exam.examTitle}" unlocked.`, 'Unlock failed.')}
                onLock={() => run(() => lockExam(exam.id).unwrap(), `"${exam.examTitle}" locked.`, 'Lock failed.')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExamCard({
  exam, onEdit, onDelete, onPublish, onUnlock, onLock,
}: {
  exam: Exam;
  onEdit: () => void; onDelete: () => void; onPublish: () => void; onUnlock: () => void; onLock: () => void;
}) {
  const locked = examIsLocked(exam);

  return (
    <div className="p-5 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-black text-sm text-primary truncate">{exam.examTitle}</h3>
        <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${locked ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
          {locked ? 'Locked' : 'Open'}
        </span>
        <span className="px-2 py-0.5 bg-base-200 text-[10px] font-extrabold uppercase rounded">{exam.examCategory}</span>
        {exam.weighting && (
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold rounded">{exam.weighting}%</span>
        )}
      </div>
      <p className="mt-1 text-[11px] font-mono opacity-60">{fmtDate(exam.startDate)} → {fmtDate(exam.endDate)}</p>

      <div className="mt-3 pt-3 border-t border-base-300 flex flex-wrap justify-end gap-1.5">
        {!locked ? (
          <>
            <button onClick={onPublish} className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-all cursor-pointer" title="Compute rankings & lock">
              <Send className="w-3 h-3 inline mr-1" /> Publish
            </button>
            <button onClick={onLock} className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-all cursor-pointer">
              <Lock className="w-3 h-3 inline mr-1" /> Lock
            </button>
          </>
        ) : (
          <button onClick={onUnlock} className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-all cursor-pointer">
            <Unlock className="w-3 h-3 inline mr-1" /> Unlock
          </button>
        )}
        <button onClick={onEdit} disabled={locked} className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-base-200 hover:bg-primary/20 hover:text-primary transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          <Edit3 className="w-3 h-3 inline mr-1" /> Edit
        </button>
        <button onClick={onDelete} disabled={locked} className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-error/10 text-error hover:bg-error hover:text-error-content transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          <Trash2 className="w-3 h-3 inline mr-1" /> Delete
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SCHEDULES TAB — pick a grade, not every class
   ════════════════════════════════════════════════════════════════ */
type ScheduleScope = 'grade' | 'all' | 'class';

type BulkRow = {
  scope: ScheduleScope;
  gradeLevelId: string;
  classId: string;
  subjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  outOf: string;
  venue: string;
};

const newRow = (): BulkRow => ({
  scope: 'grade', gradeLevelId: '', classId: '', subjectId: '',
  examDate: '', startTime: '09:00', endTime: '11:00',
  outOf: DEFAULT_OUT_OF, venue: '',
});

const rowReady = (r: BulkRow) =>
  !!(r.subjectId && r.examDate && r.startTime && r.endTime && Number(r.outOf) > 0 &&
    (r.scope === 'all' || (r.scope === 'grade' && r.gradeLevelId) || (r.scope === 'class' && r.classId)));

type ScheduleGroup = {
  key: string;
  ids: string[];
  classIds: string[];
  subjectId: string;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  outOf: string | null;
};

function SchedulesTab({ schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage }: SectionProps) {
  const ctrl = useTermExams(schoolId);
  const { terms, term, termId, setTermId, examId, setExamId, exams } = ctrl;
  const lists = useAcademicLists(schoolId, term?.academicYear);

  const [showBulk, setShowBulk] = useState(true);
  const [rows, setRows] = useState<BulkRow[]>([newRow()]);

  const { data: schedulesData, isLoading } = useGetSchedulesByExamQuery(examId, { skip: !examId });
  const schedules = useMemo(() => extractSchedules(schedulesData), [schedulesData]);

  const [bulkCreate, { isLoading: bulkCreating }] = useBulkCreateSchedulesMutation();
  const [deleteSchedule] = useDeleteScheduleMutation();

  // Group rows that are the same paper (same subject/time/venue/total marks) across classes.
  const groupedByDate = useMemo(() => {
    const dates: Record<string, Record<string, ScheduleGroup>> = {};
    schedules.forEach((s) => {
      const date = s.examDate?.split('T')[0] ?? 'unknown';
      const outOf = cleanOutOf(s.outOf);
      const key = [s.subjectId, s.startTime ?? '', s.endTime ?? '', s.venue ?? '', outOf ?? ''].join('|');
      if (!dates[date]) dates[date] = {};
      if (!dates[date][key]) {
        dates[date][key] = {
          key, ids: [], classIds: [], subjectId: s.subjectId,
          startTime: s.startTime, endTime: s.endTime, venue: s.venue, outOf,
        };
      }
      dates[date][key].ids.push(s.id);
      dates[date][key].classIds.push(s.classId);
    });
    const out: Record<string, ScheduleGroup[]> = {};
    Object.entries(dates).forEach(([d, m]) => {
      out[d] = Object.values(m).sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
    });
    return out;
  }, [schedules]);

  const sortedDates = Object.keys(groupedByDate).sort();
  const paperCount = sortedDates.reduce((n, d) => n + groupedByDate[d].length, 0);

  const patchRow = (idx: number, patch: Partial<BulkRow>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!examId) return setErrorMessage('Pick an exam first.');

    const ready = rows.filter(rowReady);
    if (ready.length === 0) return setErrorMessage('Complete at least one row (who sits it, subject, date, times and total marks).');
    if (ready.some((r) => r.endTime <= r.startTime)) return setErrorMessage('End time must be after start time.');

    const schedulesPayload = ready.map((r) => ({
      ...(r.scope === 'grade' ? { gradeLevelId: r.gradeLevelId } : r.scope === 'class' ? { classId: r.classId } : { allClasses: true }),
      subjectId: r.subjectId,
      examDate: r.examDate,
      startTime: r.startTime,
      endTime: r.endTime,
      outOf: r.outOf.trim(),
      venue: r.venue.trim() || undefined,
    }));

    try {
      const res = await bulkCreate({ schoolId, examId, schedules: schedulesPayload }).unwrap();
      setSuccessMessage(res.message || `Saved ${res.count ?? ready.length} schedule row(s).`);
      setRows([newRow()]);
    } catch (err: any) {
      setErrorMessage(errMsg(err, 'Could not create the schedule.'));
    }
  };

  const handleDeleteGroup = async (g: ScheduleGroup) => {
    const n = g.ids.length;
    if (!window.confirm(`Remove ${lists.subjectName(g.subjectId)} for ${n} class${n === 1 ? '' : 'es'}?`)) return;
    setSuccessMessage(''); setErrorMessage('');
    try {
      await Promise.all(g.ids.map((id) => deleteSchedule(id).unwrap()));
      setSuccessMessage('Schedule removed.');
    } catch (err: any) {
      setErrorMessage(errMsg(err, 'Delete failed.'));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── LEFT ── */}
      <div className="lg:col-span-5 space-y-4">
        <div className={`${WIDGET} space-y-3`}>
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Calendar className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Scope</h2>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Term</label>
            <select value={termId} onChange={(e) => setTermId(e.target.value)} className={SELECT_SM}>
              <option value="">-- Choose term --</option>
              {terms.map((t) => <option key={t.id} value={t.id}>{t.termName} ({t.academicYear})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Exam</label>
            <select value={examId} onChange={(e) => setExamId(e.target.value)} disabled={!termId} className={`${SELECT_SM} disabled:opacity-60`}>
              <option value="">-- Choose exam --</option>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.examTitle}</option>)}
            </select>
          </div>
        </div>

        {examId && (
          <div className={`${CARD} space-y-4`}>
            <button type="button" onClick={() => setShowBulk(!showBulk)} className="w-full flex items-center justify-between gap-3 pb-2 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Wand2 className="w-5 h-5" /></div>
                <div className="text-left">
                  <h2 className="text-lg font-black tracking-tight">Add Papers</h2>
                  <p className="text-[11px] opacity-60">One row = one paper for a whole grade</p>
                </div>
              </div>
              {showBulk ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
            </button>

            {showBulk && (
              <form onSubmit={handleBulkSubmit} className="space-y-3">
                {rows.map((row, idx) => (
                  <div key={idx} className="p-3 bg-base-100 border border-base-300 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={row.scope}
                        onChange={(e) => patchRow(idx, { scope: e.target.value as ScheduleScope, gradeLevelId: '', classId: '' })}
                        className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px] font-bold"
                      >
                        <option value="grade">Whole grade</option>
                        <option value="all">All classes</option>
                        <option value="class">Single class</option>
                      </select>

                      {row.scope === 'grade' && (
                        <select value={row.gradeLevelId} onChange={(e) => patchRow(idx, { gradeLevelId: e.target.value })} className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px]">
                          <option value="">-- Grade --</option>
                          {lists.grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      )}
                      {row.scope === 'class' && (
                        <select value={row.classId} onChange={(e) => patchRow(idx, { classId: e.target.value })} className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px]">
                          <option value="">-- Class --</option>
                          {lists.classOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                        </select>
                      )}
                      {row.scope === 'all' && (
                        <div className="px-2 py-1.5 text-[11px] opacity-60 flex items-center">Every class in the school</div>
                      )}
                    </div>

                    <select value={row.subjectId} onChange={(e) => patchRow(idx, { subjectId: e.target.value })} className="w-full px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px]">
                      <option value="">-- Subject --</option>
                      {lists.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <div className="grid grid-cols-3 gap-1.5">
                      <input type="date" value={row.examDate} onChange={(e) => patchRow(idx, { examDate: e.target.value })} className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[10px] font-mono" />
                      <input type="time" value={row.startTime} onChange={(e) => patchRow(idx, { startTime: e.target.value })} className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[10px] font-mono" />
                      <input type="time" value={row.endTime} onChange={(e) => patchRow(idx, { endTime: e.target.value })} className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[10px] font-mono" />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number" min="1" step="0.01" value={row.outOf}
                        onChange={(e) => patchRow(idx, { outOf: e.target.value })}
                        placeholder="Total marks"
                        title="Total marks this paper is set out of"
                        className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px] font-mono"
                      />
                      <input
                        type="text" value={row.venue}
                        onChange={(e) => patchRow(idx, { venue: e.target.value })}
                        placeholder="Venue (optional)"
                        className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px]"
                      />
                    </div>

                    {rows.length > 1 && (
                      <button type="button" onClick={() => setRows(rows.filter((_, i) => i !== idx))} className="text-[10px] text-error font-bold hover:underline">Remove</button>
                    )}
                  </div>
                ))}

                <button type="button" onClick={() => setRows([...rows, newRow()])} className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline">
                  <PlusCircle className="w-3 h-3" /> Add row
                </button>
                <button
                  type="submit"
                  disabled={bulkCreating}
                  className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                >
                  {bulkCreating ? 'Saving…' : `Save ${rows.filter(rowReady).length} paper${rows.filter(rowReady).length === 1 ? '' : 's'}`}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: Timetable ── */}
      <div className={`lg:col-span-7 ${CARD} space-y-5`}>
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Timetable</h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{paperCount} papers · {schedules.length} class slots</span>
        </div>

        {!examId ? (
          <div className={EMPTY}>Pick a term and exam to see the timetable.</div>
        ) : isLoading ? (
          <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…</div>
        ) : schedules.length === 0 ? (
          <div className={EMPTY}>No papers scheduled yet. Add some on the left.</div>
        ) : (
          <div className="space-y-5 max-h-[640px] overflow-y-auto pr-1">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="text-xs font-black uppercase tracking-wider opacity-60 mb-2 sticky top-0 bg-base-100 py-1">
                  {fmtDate(date)} <span className="opacity-60">({groupedByDate[date].length})</span>
                </h3>
                <div className="space-y-2">
                  {groupedByDate[date].map((g) => (
                    <div key={g.key} className="p-3 bg-base-100 border border-base-300 rounded-xl flex items-center gap-3 hover:border-primary transition-all">
                      <div className="shrink-0 px-2 py-1 bg-primary/10 text-primary rounded-lg text-center">
                        <p className="text-[10px] font-black uppercase">{fmtTime(g.startTime)}</p>
                        <p className="text-[9px] opacity-60">to {fmtTime(g.endTime)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate">
                          {lists.subjectName(g.subjectId)}
                          {g.outOf && (
                            <span className="ml-2 px-1.5 py-0.5 bg-base-200 rounded text-[10px] font-mono font-bold opacity-80">
                              / {g.outOf}
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] opacity-60">{describeClasses(g.classIds, lists)}</p>
                        {g.venue && (
                          <p className="text-[10px] font-mono opacity-60 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {g.venue}
                          </p>
                        )}
                      </div>
                      <button onClick={() => handleDeleteGroup(g)} className="p-1.5 bg-error/10 text-error rounded-lg hover:bg-error hover:text-error-content transition-all" title="Remove for all these classes">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED SCOPE PICKER (term / exam / class / subject)
   ════════════════════════════════════════════════════════════════ */
function ExamScopePicker({
  ctrl, lists, classId, setClassId, subjectId, setSubjectId,
}: {
  ctrl: TermExamsCtrl;
  lists: ReturnType<typeof useAcademicLists>;
  classId: string; setClassId: (v: string) => void;
  subjectId: string; setSubjectId: (v: string) => void;
}) {
  return (
    <div className={WIDGET}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className={LABEL}>Term</label>
          <select value={ctrl.termId} onChange={(e) => ctrl.setTermId(e.target.value)} className={SELECT_SM}>
            <option value="">-- Term --</option>
            {ctrl.terms.map((t) => <option key={t.id} value={t.id}>{t.termName} ({t.academicYear})</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={LABEL}>Exam</label>
          <select value={ctrl.examId} onChange={(e) => ctrl.setExamId(e.target.value)} disabled={!ctrl.termId} className={`${SELECT_SM} disabled:opacity-60`}>
            <option value="">-- Exam --</option>
            {ctrl.exams.map((e) => <option key={e.id} value={e.id}>{e.examTitle}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={LABEL}>Class</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className={SELECT_SM}>
            <option value="">-- Class --</option>
            {lists.classOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={LABEL}>Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={SELECT_SM}>
            <option value="">-- Subject --</option>
            {lists.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MARKS ENTRY TAB
   ════════════════════════════════════════════════════════════════ */
type Draft = { marks: string; outOf: string; isAbsent: boolean; remarks: string; dirty: boolean };

function MarksEntryTab({ schoolId, primaryColor, setSuccessMessage, setErrorMessage }: SectionProps) {
  const ctrl = useTermExams(schoolId);
  const { examId, selectedExam } = ctrl;
  const lists = useAcademicLists(schoolId, ctrl.term?.academicYear);

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const { data: studentsData, isLoading: loadingStudents } = useGetStudentsByClassQuery(classId, { skip: !classId });
  const students = useMemo(() => extractStudents(studentsData), [studentsData]);

  const { data: marksheetData, isLoading: loadingSheet } = useGetMarksheetQuery(
    { examId, classId, subjectId },
    { skip: !examId || !classId || !subjectId }
  );

  // The schedule holds the total marks that were set when the exam was scheduled.
  const { data: schedulesData, isLoading: loadingSchedules } = useGetSchedulesByExamQuery(examId, { skip: !examId });

  /** Total marks set for this class + subject in the exam schedule (null if not set). */
  const paperOutOf: string | null = useMemo(() => {
    const s = extractSchedules(schedulesData).find(
      (x) => x.classId === classId && x.subjectId === subjectId
    );
    return cleanOutOf(s?.outOf);
  }, [schedulesData, classId, subjectId]);

  const existingRows: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    ((marksheetData as any)?.marksheet?.rows ?? []).forEach((r: any) => { if (r.studentId) map[r.studentId] = r; });
    return map;
  }, [marksheetData]);

  // Fill the grid from saved marks whenever the roster, saved sheet or scheduled total changes.
  // The scheduled total wins; otherwise fall back to what was saved, then to the default.
  useEffect(() => {
    const next: Record<string, Draft> = {};
    students.forEach((s) => {
      const ex = existingRows[s.id];
      next[s.id] = {
        marks: ex?.marks != null ? String(ex.marks) : '',
        outOf: paperOutOf ?? cleanOutOf(ex?.outOf) ?? DEFAULT_OUT_OF,
        isAbsent: !!ex?.isAbsent,
        remarks: ex?.remarks ?? '',
        dirty: false,
      };
    });
    setDrafts(next);
  }, [students, existingRows, paperOutOf]);

  const [bulkEnter, { isLoading: saving }] = useBulkEnterMarksMutation();
  const [computeGrades] = useComputeGradesMutation();
  const [computePositions] = useComputeSubjectPositionsMutation();
  const [computeRanking] = useComputeClassRankingMutation();

  const locked = examIsLocked(selectedExam);
  const dirtyCount = Object.values(drafts).filter((d) => d.dirty).length;
  const outOfFixed = paperOutOf != null;

  const updateDraft = (studentId: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [studentId]: { ...d[studentId], ...patch, dirty: true } }));

  const handleSave = async () => {
    setSuccessMessage(''); setErrorMessage('');
    if (!examId || !classId || !subjectId) return setErrorMessage('Select exam, class and subject first.');
    if (locked) return setErrorMessage('Exam is locked. Unlock it before entering marks.');

    try {
      const entries: any[] = [];
      for (const s of students) {
        const d = drafts[s.id];
        if (!d?.dirty) continue;
        const name = `${s.firstName} ${s.lastName}`.trim();
        const entry: any = { studentId: s.id, classId };

        if (d.isAbsent) {
          entry.isAbsent = true;
        } else {
          if (d.marks.trim() === '') throw new Error(`Enter marks for ${name}, or tick Absent.`);
          const m = Number(d.marks);
          const o = Number(d.outOf);
          if (isNaN(m) || isNaN(o) || o <= 0 || m < 0 || m > o) {
            throw new Error(`Invalid marks for ${name} (marks ${d.marks}, out of ${d.outOf}).`);
          }
          entry.marks = d.marks.trim();
          entry.outOf = d.outOf.trim();
        }
        if (d.remarks.trim()) entry.remarks = d.remarks.trim();
        entries.push(entry);
      }

      if (entries.length === 0) return setErrorMessage('No changes to save.');

      await bulkEnter({ schoolId, examId, subjectId, entries }).unwrap();
      setSuccessMessage(`Saved ${entries.length} mark${entries.length === 1 ? '' : 's'}.`);
    } catch (err: any) {
      setErrorMessage(errMsg(err, 'Save failed.'));
    }
  };

  const handleComputeAll = async () => {
    if (!examId) return;
    if (!window.confirm('Compute grades → subject positions → class ranking?')) return;
    setSuccessMessage(''); setErrorMessage('');
    try {
      await computeGrades(examId).unwrap();
      await computePositions(examId).unwrap();
      await computeRanking(examId).unwrap();
      setSuccessMessage('Grades, subject positions and class rankings computed.');
    } catch (err: any) {
      setErrorMessage(errMsg(err, 'Computation failed.'));
    }
  };

  return (
    <div className="space-y-6">
      <ExamScopePicker ctrl={ctrl} lists={lists} classId={classId} setClassId={setClassId} subjectId={subjectId} setSubjectId={setSubjectId} />

      {selectedExam && locked && (
        <div className="p-2.5 bg-error/10 border border-error/20 text-error rounded-xl flex items-center gap-2 text-xs">
          <Lock className="w-3.5 h-3.5" /> <span className="font-bold">This exam is locked — marks are read-only.</span>
        </div>
      )}

      {!examId || !classId || !subjectId ? (
        <div className={`${EMPTY} bg-base-200/20`}>Select exam, class, and subject to enter marks.</div>
      ) : loadingStudents || loadingSheet || loadingSchedules ? (
        <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading roster…</div>
      ) : students.length === 0 ? (
        <div className={`${EMPTY} bg-base-200/20`}>No students enrolled in this class.</div>
      ) : (
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl"><ClipboardEdit className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Enter Marks</h2>
                <p className="text-[11px] opacity-60">{lists.subjectName(subjectId)} · {students.length} students · {dirtyCount} unsaved</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={handleComputeAll} disabled={locked} className="text-xs font-bold px-3 py-2 rounded-xl bg-base-100 border border-base-300 hover:bg-base-200 transition-all cursor-pointer disabled:opacity-40">
                <Calculator className="w-3.5 h-3.5 inline mr-1" /> Compute All
              </button>
              <button
                onClick={handleSave}
                disabled={saving || locked || dirtyCount === 0}
                className="text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl text-white shadow-md transition-all cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}
              >
                <Save className="w-3.5 h-3.5 inline mr-1" />
                {saving ? 'Saving…' : `Save ${dirtyCount > 0 ? `(${dirtyCount})` : ''}`}
              </button>
            </div>
          </div>

          {/* Total marks info — comes from the exam schedule */}
          {outOfFixed ? (
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center gap-2 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              This paper is marked out of {paperOutOf} (set in the exam schedule).
            </div>
          ) : (
            <div className="p-2.5 bg-warning/10 border border-warning/20 text-warning rounded-xl flex items-center gap-2 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              No total marks were set for this paper in the schedule. Defaulting to {DEFAULT_OUT_OF}; you can edit it per student.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-base-100 border-b border-base-300">
                <tr className="text-left">
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70">#</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70">Student</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70 text-center w-24">Marks</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70 text-center w-24">Out Of</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70 text-center w-20">Absent</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {students.map((s, idx) => {
                  const d = drafts[s.id];
                  if (!d) return null;
                  return (
                    <tr key={s.id} className={`hover:bg-base-100/50 transition-all ${d.dirty ? 'bg-primary/5' : ''}`}>
                      <td className="px-3 py-2 font-mono opacity-60">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <p className="font-bold">{s.firstName} {s.lastName}</p>
                        <p className="text-[10px] font-mono opacity-60">ADM {s.admissionNumber}</p>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number" step="0.01" min="0" max={d.outOf || undefined}
                          value={d.marks}
                          onChange={(e) => updateDraft(s.id, { marks: e.target.value })}
                          disabled={locked || d.isAbsent} placeholder="—"
                          className="w-full px-2 py-1 bg-base-100 border border-base-300 rounded-lg text-center font-mono text-xs focus:ring-2 focus:ring-primary/30 disabled:opacity-40"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number" step="0.01" min="1" value={d.outOf}
                          onChange={(e) => updateDraft(s.id, { outOf: e.target.value })}
                          disabled={locked || d.isAbsent || outOfFixed}
                          title={outOfFixed ? 'Set when the exam was scheduled' : undefined}
                          className="w-full px-2 py-1 bg-base-100 border border-base-300 rounded-lg text-center font-mono text-xs focus:ring-2 focus:ring-primary/30 disabled:opacity-40"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={d.isAbsent} onChange={(e) => updateDraft(s.id, { isAbsent: e.target.checked })} disabled={locked} className="checkbox checkbox-error checkbox-xs" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={d.remarks} onChange={(e) => updateDraft(s.id, { remarks: e.target.value })} disabled={locked} placeholder="Optional" className="w-full px-2 py-1 bg-base-100 border border-base-300 rounded-lg text-xs focus:ring-2 focus:ring-primary/30 disabled:opacity-40" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MARKSHEET TAB
   ════════════════════════════════════════════════════════════════ */
function MarksheetTab({ schoolId }: SectionProps) {
  const ctrl = useTermExams(schoolId);
  const { examId, selectedExam } = ctrl;
  const lists = useAcademicLists(schoolId, ctrl.term?.academicYear);

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const { data: marksheetData, isLoading } = useGetMarksheetQuery(
    { examId, classId, subjectId },
    { skip: !examId || !classId || !subjectId }
  );
  const { rows, stats } = useMemo(() => normalizeMarksheet(marksheetData), [marksheetData]);
  const hasMarks = rows.some((r) => r.isAbsent || (r.marks != null && r.marks !== ''));

  return (
    <div className="space-y-6">
      <ExamScopePicker ctrl={ctrl} lists={lists} classId={classId} setClassId={setClassId} subjectId={subjectId} setSubjectId={setSubjectId} />

      {!examId || !classId || !subjectId ? (
        <div className={`${EMPTY} bg-base-200/20`}>Select exam, class, and subject to view the marksheet.</div>
      ) : isLoading ? (
        <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading marksheet…</div>
      ) : rows.length === 0 || !hasMarks ? (
        <div className={`${EMPTY} bg-base-200/20`}>No marks entered yet for this exam, class and subject.</div>
      ) : (
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl"><ListChecks className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-black tracking-tight">{lists.subjectName(subjectId)}</h2>
                <p className="text-[11px] font-mono opacity-60">{selectedExam?.examTitle} · {lists.className(classId)} · {rows.length} students</p>
              </div>
            </div>
            <button onClick={() => window.print()} className="text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl bg-base-100 border border-base-300 hover:bg-base-200 transition-all cursor-pointer">
              <Printer className="w-3.5 h-3.5 inline mr-1" /> Print
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-base-100 border-b border-base-300">
                <tr className="text-left">
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70">#</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70">Student</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70 text-right">Marks</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70 text-right">Out Of</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70 text-right">%</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70 text-center">Grade</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70 text-center">Pos</th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {rows.map((r, idx) => (
                  <tr key={r.studentId ?? idx} className={r.isAbsent ? 'bg-error/5' : ''}>
                    <td className="px-3 py-2 font-mono opacity-60">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <p className="font-bold">{r.studentName}</p>
                      {r.admissionNumber && <p className="text-[10px] font-mono opacity-60">ADM {r.admissionNumber}</p>}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold">
                      {r.isAbsent ? <span className="text-error">ABS</span> : num(r.marks)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono opacity-70">{num(r.outOf, 0)}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.percentage != null ? `${r.percentage.toFixed(1)}%` : '—'}</td>
                    <td className="px-3 py-2 text-center">
                      {r.grade ? <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold uppercase rounded">{r.grade}</span> : '—'}
                    </td>
                    <td className="px-3 py-2 text-center font-mono font-bold">{r.position ?? '—'}</td>
                    <td className="px-3 py-2 text-[10px] opacity-70 truncate max-w-[150px]">{r.remarks ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-base-300">
              <StatTile icon={TrendingUp} label="Mean %" value={`${stats.mean.toFixed(1)}%`} tone="primary" />
              <StatTile icon={Trophy} label="Highest %" value={`${stats.highest.toFixed(1)}%`} tone="success" />
              <StatTile icon={UserX} label="Lowest %" value={`${stats.lowest.toFixed(1)}%`} tone="warning" />
              <StatTile icon={Percent} label="Pass Rate" value={stats.passRate != null ? `${stats.passRate.toFixed(1)}%` : '—'} tone="success" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INSIGHTS TAB
   ════════════════════════════════════════════════════════════════ */
function InsightsTab({ schoolId, primaryColor, secondaryColor }: SectionProps) {
  const ctrl = useTermExams(schoolId);
  const { examId } = ctrl;
  const lists = useAcademicLists(schoolId, ctrl.term?.academicYear);

  const { data: statsData, isLoading: loadingStats } = useGetExamStatisticsQuery(examId, { skip: !examId });
  const { data: subjectStatsData, isLoading: loadingSubjectStats } = useGetSubjectStatisticsQuery(examId, { skip: !examId });
  const { data: classPerfData, isLoading: loadingClassPerf } = useGetClassPerformanceQuery(examId, { skip: !examId });

  const stats: any = (statsData as any)?.statistics ?? {};

  const distribution = useMemo(
    () => Object.entries(stats.gradeDistribution ?? {})
      .map(([grade, count]) => ({ grade, count: Number(count) }))
      .sort((a, b) => a.grade.localeCompare(b.grade)),
    [stats.gradeDistribution]
  );

  const subjectStats = useMemo(
    () => Object.entries((subjectStatsData as any)?.statistics ?? {}).map(([subjectId, s]: [string, any]) => ({ subjectId, ...s })),
    [subjectStatsData]
  );

  const classPerf = useMemo(
    () => Object.entries((classPerfData as any)?.statistics ?? {}).map(([classId, c]: [string, any]) => ({ classId, ...c })),
    [classPerfData]
  );

  const tile = (v: any) => (loadingStats ? '…' : v ?? '—');

  return (
    <div className="space-y-6">
      <div className={WIDGET}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={LABEL}>Term</label>
            <select value={ctrl.termId} onChange={(e) => ctrl.setTermId(e.target.value)} className={SELECT_SM}>
              <option value="">-- Term --</option>
              {ctrl.terms.map((t) => <option key={t.id} value={t.id}>{t.termName} ({t.academicYear})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Exam</label>
            <select value={examId} onChange={(e) => ctrl.setExamId(e.target.value)} disabled={!ctrl.termId} className={`${SELECT_SM} disabled:opacity-60`}>
              <option value="">-- Exam --</option>
              {ctrl.exams.map((e) => <option key={e.id} value={e.id}>{e.examTitle}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!examId ? (
        <div className={`${EMPTY} bg-base-200/20`}>Pick an exam to see insights.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile icon={FileText} label="Results entered" value={tile(stats.totalResults)} tone="primary" />
            <StatTile icon={TrendingUp} label="Mean %" value={tile(stats.meanPercentage != null ? `${num(stats.meanPercentage, 1)}%` : null)} tone="success" />
            <StatTile icon={Users} label="Students" value={tile(stats.uniqueStudents)} tone="warning" />
            <StatTile icon={UserX} label="Absent" value={tile(stats.absentCount)} tone="warning" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution */}
            <div className={`${CARD} space-y-5`}>
              <div className="flex items-center gap-3 pb-4 border-b border-base-300">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Award className="w-5 h-5" /></div>
                <h2 className="text-lg font-black tracking-tight">Grade Distribution</h2>
              </div>
              {distribution.length === 0 ? (
                <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">No grades yet. Enter marks and compute grades.</div>
              ) : (
                <div className="space-y-3">
                  {distribution.map((d) => {
                    const max = Math.max(1, ...distribution.map((x) => x.count));
                    return (
                      <div key={d.grade}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-black uppercase">{d.grade}</span>
                          <span className="font-mono font-bold">{d.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-base-200 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(d.count / max) * 100}%`, backgroundColor: primaryColor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Subject stats */}
            <div className={`${CARD} space-y-4`}>
              <div className="flex items-center gap-3 pb-4 border-b border-base-300">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}><BookOpen className="w-5 h-5" /></div>
                <h2 className="text-lg font-black tracking-tight">Subject Performance</h2>
              </div>
              {loadingSubjectStats ? (
                <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…</div>
              ) : subjectStats.length === 0 ? (
                <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">No subject statistics yet.</div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {subjectStats.map((s: any) => (
                    <div key={s.subjectId} className="p-2.5 bg-base-100 border border-base-300 rounded-xl flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{s.subjectName ?? lists.subjectName(s.subjectId)}</p>
                        <p className="text-[10px] font-mono opacity-60">
                          Mean {num(s.mean, 1)} ({num(s.meanPercentage, 1)}%) · {s.present} sat · {s.absent} absent
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-black opacity-70">Pass {num(s.passRate, 0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Class performance */}
          <div className={`${CARD} space-y-4`}>
            <div className="flex items-center gap-3 pb-4 border-b border-base-300">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><GraduationCap className="w-5 h-5" /></div>
              <h2 className="text-lg font-black tracking-tight">Class Performance</h2>
            </div>
            {loadingClassPerf ? (
              <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…</div>
            ) : classPerf.length === 0 ? (
              <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">No class performance data yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-base-100 border-b border-base-300">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70">Class</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70 text-right">Mean</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70 text-right">Students</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70 text-right">Subjects</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wider opacity-70 text-right">Absent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-300">
                    {[...classPerf]
                      .sort((a: any, b: any) => lists.className(a.classId).localeCompare(lists.className(b.classId)))
                      .map((c: any) => (
                        <tr key={c.classId}>
                          <td className="px-3 py-2 font-bold">{lists.className(c.classId)}</td>
                          <td className="px-3 py-2 text-right font-mono">{num(c.mean)}</td>
                          <td className="px-3 py-2 text-right font-mono">{c.totalStudents ?? '—'}</td>
                          <td className="px-3 py-2 text-right font-mono">{c.totalSubjects ?? '—'}</td>
                          <td className="px-3 py-2 text-right font-mono">{c.absent ?? '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED
   ════════════════════════════════════════════════════════════════ */
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
        <div className={`p-1.5 rounded-lg ${toneMap}`}><Icon className="w-3.5 h-3.5" /></div>
        <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</p>
      </div>
      <p className="text-xl font-black text-base-content truncate">{value}</p>
    </div>
  );
}