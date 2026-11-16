import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  Calendar, Clock, Grid3x3, Users, ShieldCheck, Sparkles,
  PlusCircle, Edit3, Trash2, CheckCircle2, AlertCircle, X,
  Loader2, Wand2, ChevronDown, ChevronRight, Copy, Search,
  User, BookOpen, MapPin, AlertTriangle, Percent, Layers,
  ArrowRight, Printer, Coffee, GraduationCap, ListChecks,
  RotateCcw, Wrench, Plus, Utensils, Bell, Dumbbell, Timer, Hammer,
} from 'lucide-react';

import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import {
  useGetClassesBySchoolQuery,
  useGetSubjectsBySchoolQuery,
  useGetGradeLevelsBySchoolQuery,
  type ClassEntity,
  type Subject,
  type GradeLevel,
} from '../../features/Apis/academicStructure.Api';

// ✅ Teachers via usersApi — primary + fallback
import {
  useGetTeachersBySchoolQuery,
  useGetSchoolUsersByRoleQuery,
} from '../../features/Apis/Users.Api';

import {
  useBulkCreatePeriodsMutation,
  useResetSchoolSetupMutation,
  useListAllPeriodsQuery,
  useUpdatePeriodMutation,
  useDeletePeriodMutation,
  useValidatePeriodsQuery,
  useGetActivePeriodQuery,
  useGetClassTimetableQuery,
  useGetClassWorkloadQuery,
  useCreateSlotMutation,
  useUpdateSlotMutation,
  useDeleteSlotMutation,
  useCloneClassSlotsMutation,
  useClearClassTimetableMutation,
  useGetTeacherWeeklyTimetableQuery,
  useGetTeacherWorkloadQuery,
  useValidateTimetableQuery,
  useGetCoverageQuery,
  useGetEmptyClassesQuery,
  useGetUnassignedTeacherSlotsQuery,
  useGetSlotsWithoutRoomQuery,
  useGetMasterGridQuery,
  useGetSubjectAllocationQuery,
  useGetClassCurrentLessonQuery,
  useGetClassNextLessonQuery,
  useGetPerClassCoverageQuery,
  useGetDetailedConflictsQuery,
  useAutoAssignMissingTeachersMutation,
  type Period,
  type TimetableSlot,
  type DayOfWeek,
} from '../../features/Apis/Timetables.Api';
import TimetableGenerator from '../../components/TimetableGenerator';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const STANDARD_DAY_TEMPLATE = [
  { periodNumber: 1, name: 'Morning Assembly / Devotion', startTime: '07:40', endTime: '08:00', isBreak: true },
  { periodNumber: 2, name: 'Lesson 1', startTime: '08:00', endTime: '08:40', isBreak: false },
  { periodNumber: 3, name: 'Lesson 2', startTime: '08:40', endTime: '09:20', isBreak: false },
  { periodNumber: 4, name: 'Short Break', startTime: '09:20', endTime: '09:35', isBreak: true },
  { periodNumber: 5, name: 'Lesson 3', startTime: '09:35', endTime: '10:15', isBreak: false },
  { periodNumber: 6, name: 'Lesson 4', startTime: '10:15', endTime: '10:55', isBreak: false },
  { periodNumber: 7, name: 'Tea Break', startTime: '10:55', endTime: '11:10', isBreak: true },
  { periodNumber: 8, name: 'Lesson 5', startTime: '11:10', endTime: '11:50', isBreak: false },
  { periodNumber: 9, name: 'Lesson 6', startTime: '11:50', endTime: '12:30', isBreak: false },
  { periodNumber: 10, name: 'Lunch Break', startTime: '12:30', endTime: '14:00', isBreak: true },
  { periodNumber: 11, name: 'Lesson 7', startTime: '14:00', endTime: '14:40', isBreak: false },
  { periodNumber: 12, name: 'Lesson 8', startTime: '14:40', endTime: '15:20', isBreak: false },
  { periodNumber: 13, name: 'Games / Clubs', startTime: '15:20', endTime: '16:20', isBreak: true },
];

// Quick presets for the "Add a period" form
const PERIOD_PRESETS = [
  { key: 'lesson', label: 'Lesson', minutes: 40, isBreak: false, icon: BookOpen },
  { key: 'double', label: 'Double lesson', minutes: 80, isBreak: false, icon: Layers },
  { key: 'tea', label: 'Tea break', minutes: 20, isBreak: true, icon: Coffee },
  { key: 'lunch', label: 'Lunch', minutes: 60, isBreak: true, icon: Utensils },
  { key: 'assembly', label: 'Assembly', minutes: 20, isBreak: true, icon: Bell },
  { key: 'games', label: 'Games / Clubs', minutes: 60, isBreak: true, icon: Dumbbell },
] as const;

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
type TeacherUser = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  tscNumber?: string;
  [key: string]: any;
};

function extractClasses(data: any): ClassEntity[] {
  if (!data) return [];
  const raw = data.data?.classes ?? data.classes ?? data.data ?? data;
  return Array.isArray(raw) ? [...raw] : [];
}
function extractSubjects(data: any): Subject[] {
  if (!data) return [];
  const raw = data.data?.subjects ?? data.subjects ?? data.data ?? data;
  return Array.isArray(raw) ? [...raw] : [];
}
function extractGrades(data: any): GradeLevel[] {
  if (!data) return [];
  const raw = data.data?.gradeLevels ?? data.gradeLevels ?? data.data ?? data;
  return Array.isArray(raw) ? [...raw] : [];
}
function extractTeachers(data: any): TeacherUser[] {
  if (!data) return [];
  const raw =
    data.data?.teachers ?? data.data?.users ?? data.data ?? data.teachers ?? data.users ?? data;
  return Array.isArray(raw) ? [...raw] : [];
}
function extractPeriods(data: any): Period[] {
  if (!data) return [];
  const raw = data.data?.periods ?? data.periods ?? data.data ?? data;
  return Array.isArray(raw) ? [...raw] : [];
}
function extractSlots(data: any): TimetableSlot[] {
  if (!data) return [];
  const raw = data.data?.slots ?? data.slots ?? data.data ?? data;
  return Array.isArray(raw) ? [...raw] : [];
}

function subjectColor(subjectId?: string | null): { bg: string; text: string; border: string } {
  const palette = [
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  ];
  if (!subjectId) return { bg: 'bg-base-200', text: 'text-base-content/60', border: 'border-base-300' };
  const hash = subjectId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function teacherLabel(t: TeacherUser): string {
  return t.name || [t.firstName, t.lastName].filter(Boolean).join(' ') || 'Unnamed';
}

/** "07:40" / "07:40:00" → minutes since midnight */
function timeToMinutes(t: string): number {
  const [h, m] = (t || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
/** minutes since midnight → "HH:MM" (clamped to the same day) */
function minutesToTime(total: number): string {
  const c = Math.max(0, Math.min(total, 23 * 60 + 59));
  return `${String(Math.floor(c / 60)).padStart(2, '0')}:${String(c % 60).padStart(2, '0')}`;
}
const hhmm = (t: string) => (t || '').slice(0, 5);
const durationOf = (p: { startTime: string; endTime: string }) =>
  timeToMinutes(p.endTime) - timeToMinutes(p.startTime);

/** Map periodId → lesson number (1, 2, 3…) counting teaching periods only */
function buildLessonNumbers(periods: Period[]): Map<string, number> {
  const map = new Map<string, number>();
  let n = 0;
  [...periods]
    .sort((a, b) => a.periodNumber - b.periodNumber)
    .forEach((p) => { if (!p.isBreak) map.set(p.id, ++n); });
  return map;
}

/**
 * Shared teacher fetcher — uses usersApi with automatic fallback.
 */
function useSchoolTeachers(schoolId: string, enabled: boolean = true) {
  const primary = useGetTeachersBySchoolQuery(schoolId, { skip: !schoolId || !enabled });
  const shouldFallback = enabled && !!schoolId && primary.isError;
  const fallback = useGetSchoolUsersByRoleQuery(
    { schoolId, role: 'teacher' },
    { skip: !shouldFallback }
  );

  const teachers = useMemo<TeacherUser[]>(() => {
    const p = extractTeachers(primary.data);
    const f = extractTeachers(fallback.data);
    return p.length > 0 ? p : f;
  }, [primary.data, fallback.data]);

  return {
    teachers,
    loading: primary.isLoading || (primary.isError && fallback.isLoading),
    error: primary.isError && fallback.isError,
  };
}

type Tab = 'periods' | 'class' | 'teacher' | 'master' | 'validation';

type SectionProps = {
  schoolId: string;
  primaryColor: string;
  secondaryColor: string;
  setSuccessMessage: (v: string) => void;
  setErrorMessage: (v: string) => void;
};

const CARD = 'bg-base-100 border border-base-300/70 rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.12)]';
const INPUT = 'w-full px-4 py-2.5 bg-base-100 border border-base-300 rounded-xl text-sm font-medium outline-none transition focus:ring-2 focus:ring-primary/25 focus:border-primary';
const LABEL = 'block text-xs font-semibold opacity-70 mb-1.5';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function TimetableManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const [activeTab, setActiveTab] = useState<Tab>('periods');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'periods', label: 'School Day', icon: Clock },
    { id: 'class', label: 'Class Timetable', icon: Grid3x3 },
    { id: 'teacher', label: 'Teacher View', icon: Users },
    { id: 'master', label: 'Master Grid', icon: Layers },
    { id: 'validation', label: 'Validation', icon: ShieldCheck },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-base-100 text-base-content min-h-screen">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[2rem] border border-base-300/70 bg-base-200/50 p-8 sm:p-10">
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{ background: `radial-gradient(60% 90% at 100% 0%, ${primaryColor}, transparent 70%), radial-gradient(50% 80% at 0% 100%, ${secondaryColor}, transparent 70%)` }}
        />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-xl">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 text-white text-xs font-semibold rounded-full shadow-sm"
              style={{ backgroundColor: secondaryColor }}
            >
              <Grid3x3 className="w-3.5 h-3.5" /> Timetabling
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: primaryColor }}>
              Timetable Manager
            </h1>
            <p className="text-sm sm:text-base opacity-70">
              Design the school day, build class timetables and keep teachers clash-free for {schoolName}.
            </p>
          </div>
          <ActivePeriodChip schoolId={currentSchoolId} primaryColor={primaryColor} secondaryColor={secondaryColor} />
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1.5 p-1.5 bg-base-200/70 rounded-2xl overflow-x-auto w-full md:w-fit">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSuccessMessage(''); setErrorMessage(''); }}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                active ? 'bg-base-100 shadow-md' : 'opacity-60 hover:opacity-100'
              }`}
              style={active ? { color: primaryColor, boxShadow: `inset 0 -3px 0 ${secondaryColor}, 0 4px 12px rgba(0,0,0,0.08)` } : {}}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          );
        })}
      </div>

      {/* ALERTS */}
      {successMessage && (
        <div className="p-4 bg-success/10 border border-success/25 text-success rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold flex-1">{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-error/10 border border-error/25 text-error rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* CONTENT */}
      {activeTab === 'periods' && (
        <PeriodsTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'class' && (
        <ClassTimetableTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'teacher' && (
        <TeacherViewTab schoolId={currentSchoolId} primaryColor={primaryColor} secondaryColor={secondaryColor} />
      )}
      {activeTab === 'master' && (
        <MasterGridTab schoolId={currentSchoolId} primaryColor={primaryColor} secondaryColor={secondaryColor} />
      )}
      {activeTab === 'validation' && (
        <ValidationTab
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

function ActivePeriodChip({ schoolId, primaryColor, secondaryColor }: { schoolId: string; primaryColor: string; secondaryColor: string }) {
  const { data } = useGetActivePeriodQuery(schoolId, { skip: !schoolId });
  const period = (data as any)?.period as Period | null;

  return (
    <div className="flex items-center gap-4 bg-base-100/90 backdrop-blur-md px-5 py-4 rounded-2xl border border-base-300/70 shadow-sm">
      <div className="p-3 rounded-xl" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor, borderLeft: `4px solid ${secondaryColor}` }}>
        <Clock className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-semibold opacity-60 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${period ? 'bg-success animate-pulse' : 'bg-base-300'}`} /> Right now
        </p>
        <p className="text-lg font-extrabold truncate max-w-[220px]" style={{ color: primaryColor }}>
          {period ? period.name : 'Outside school hours'}
        </p>
        {period && <p className="text-xs font-mono opacity-60">{hhmm(period.startTime)} – {hhmm(period.endTime)}</p>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PERIODS TAB — create your own school day
   ════════════════════════════════════════════════════════════════ */
type PeriodForm = { name: string; startTime: string; duration: number; isBreak: boolean };

type DayBuilder = {
  startTime: string;
  assemblyMin: number;
  lessonMin: number;
  lessons: number;
  breakEvery: number;
  breakMin: number;
  lunchAfter: number;
  lunchMin: number;
  gamesMin: number;
};

function PeriodsTab({ schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage }: SectionProps) {
  const { data: periodsData, isLoading } = useListAllPeriodsQuery(schoolId, { skip: !schoolId });
  const { data: validationData } = useValidatePeriodsQuery(schoolId, { skip: !schoolId });

  const periods = useMemo(
    () => [...extractPeriods(periodsData)].sort((a, b) => a.periodNumber - b.periodNumber),
    [periodsData]
  );

  const [bulkCreate, { isLoading: bulkCreating }] = useBulkCreatePeriodsMutation();
  const [updatePeriod, { isLoading: updating }] = useUpdatePeriodMutation();
  const [deletePeriod] = useDeletePeriodMutation();
  const [resetSetup, { isLoading: resetting }] = useResetSchoolSetupMutation();

  const validation = (validationData as any)?.validation ?? validationData;
  const isValid = (validation as any)?.valid;
  const issues: string[] = (validation as any)?.issues ?? [];

  const teaching = periods.filter((p) => !p.isBreak);
  const breaks = periods.filter((p) => p.isBreak);
  const totalMinutes = teaching.reduce((s, p) => s + durationOf(p), 0);
  const lessonNumbers = useMemo(() => buildLessonNumbers(periods), [periods]);

  const nextNumber = periods.length ? Math.max(...periods.map((p) => p.periodNumber)) + 1 : 1;
  const nextStart = periods.length ? hhmm(periods[periods.length - 1].endTime) : '08:00';

  // ── single-period form (add + edit) ──────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PeriodForm>({ name: 'Lesson 1', startTime: '08:00', duration: 40, isBreak: false });
  const [showBuilder, setShowBuilder] = useState(false);

  // Keep "add" form pointing at the end of the day
  useEffect(() => {
    if (editingId) return;
    setForm((f) => ({
      ...f,
      startTime: nextStart,
      name: f.isBreak ? f.name : `Lesson ${teaching.length + 1}`,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods.length, editingId]);

  const endTime = minutesToTime(timeToMinutes(form.startTime) + (Number(form.duration) || 0));

  const overlap = useMemo(() => {
    const s = timeToMinutes(form.startTime);
    const e = timeToMinutes(endTime);
    return periods.find((p) => p.id !== editingId && s < timeToMinutes(p.endTime) && e > timeToMinutes(p.startTime));
  }, [periods, form.startTime, endTime, editingId]);

  const invalidRange = timeToMinutes(endTime) <= timeToMinutes(form.startTime);

  const applyPreset = (preset: typeof PERIOD_PRESETS[number]) => {
    setForm((f) => ({
      ...f,
      isBreak: preset.isBreak,
      duration: preset.minutes,
      name:
        preset.key === 'lesson' ? `Lesson ${teaching.length + 1}` :
        preset.key === 'double' ? `Lesson ${teaching.length + 1} & ${teaching.length + 2}` :
        preset.label,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: `Lesson ${teaching.length + 1}`, startTime: nextStart, duration: 40, isBreak: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalidRange) { setErrorMessage('End time must be after start time.'); return; }
    if (overlap) { setErrorMessage(`This overlaps with "${overlap.name}" (${hhmm(overlap.startTime)}–${hhmm(overlap.endTime)}).`); return; }
    setSuccessMessage(''); setErrorMessage('');
    try {
      if (editingId) {
        await updatePeriod({
          periodId: editingId,
          patch: { name: form.name.trim(), startTime: form.startTime, endTime, isBreak: form.isBreak },
        }).unwrap();
        setSuccessMessage(`"${form.name}" updated.`);
        setEditingId(null);
      } else {
        await bulkCreate({
          schoolId,
          periods: [{ periodNumber: nextNumber, name: form.name.trim(), startTime: form.startTime, endTime, isBreak: form.isBreak }],
        }).unwrap();
        setSuccessMessage(`"${form.name}" added to the school day.`);
      }
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Could not save the period.');
    }
  };

  const handleEdit = (p: Period) => {
    setEditingId(p.id);
    setForm({ name: p.name, startTime: hhmm(p.startTime), duration: durationOf(p), isBreak: p.isBreak });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (p: Period) => {
    if (!window.confirm(`Delete "${p.name}"? This only works if no timetable slot uses it.`)) return;
    try {
      await deletePeriod(p.id).unwrap();
      setSuccessMessage(`"${p.name}" deleted.`);
      if (editingId === p.id) resetForm();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Delete failed.');
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('Create the standard school day? (8 lessons, a break after every two lessons, lunch 12:30–2:00)')) return;
    setSuccessMessage(''); setErrorMessage('');
    try {
      await bulkCreate({ schoolId, periods: STANDARD_DAY_TEMPLATE }).unwrap();
      setSuccessMessage('Standard school day created: 8 lessons a day.');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Could not create the standard day.');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Delete ALL periods AND ALL timetable lessons for this school? This cannot be undone.')) return;
    if (!window.confirm('Are you absolutely sure? Every class and teacher timetable will be wiped.')) return;
    setSuccessMessage(''); setErrorMessage('');
    try {
      await resetSetup({ schoolId, confirm: true }).unwrap();
      setSuccessMessage('School day and timetables cleared. Build a new day below.');
      resetForm();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Reset failed.');
    }
  };

  // ── day builder ───────────────────────────────────────────────
  const [builder, setBuilder] = useState<DayBuilder>({
    startTime: '07:40', assemblyMin: 20, lessonMin: 40, lessons: 8,
    breakEvery: 2, breakMin: 15, lunchAfter: 6, lunchMin: 90, gamesMin: 60,
  });

  useEffect(() => {
    if (periods.length) setBuilder((b) => ({ ...b, startTime: nextStart, assemblyMin: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods.length]);

  const builderPreview = useMemo(() => {
    const out: { name: string; startTime: string; endTime: string; isBreak: boolean }[] = [];
    let t = timeToMinutes(builder.startTime);
    const push = (name: string, mins: number, isBreak: boolean) => {
      if (mins <= 0) return;
      out.push({ name, startTime: minutesToTime(t), endTime: minutesToTime(t + mins), isBreak });
      t += mins;
    };
    push('Morning Assembly / Devotion', builder.assemblyMin, true);
    for (let i = 1; i <= builder.lessons; i++) {
      push(`Lesson ${teaching.length + i}`, builder.lessonMin, false);
      if (i === builder.lunchAfter) push('Lunch Break', builder.lunchMin, true);
      else if (builder.breakEvery > 0 && i % builder.breakEvery === 0 && i < builder.lessons) push('Short Break', builder.breakMin, true);
    }
    push('Games / Clubs', builder.gamesMin, true);
    return out.map((p, i) => ({ ...p, periodNumber: nextNumber + i }));
  }, [builder, nextNumber, teaching.length]);

  const builderOverflow = builderPreview.some((p) => timeToMinutes(p.endTime) >= 23 * 60 + 59);
  const builderClash = builderPreview.some((bp) =>
    periods.some((p) => timeToMinutes(bp.startTime) < timeToMinutes(p.endTime) && timeToMinutes(bp.endTime) > timeToMinutes(p.startTime))
  );

  const handleBuild = async () => {
    if (builderPreview.length === 0) return;
    if (builderClash) { setErrorMessage('The generated day overlaps existing periods. Move the start time to after the last period.'); return; }
    setSuccessMessage(''); setErrorMessage('');
    try {
      await bulkCreate({ schoolId, periods: builderPreview }).unwrap();
      setSuccessMessage(`${builderPreview.length} periods added.`);
      setShowBuilder(false);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Could not build the day.');
    }
  };

  const setB = (k: keyof DayBuilder, v: string | number) =>
    setBuilder((b) => ({ ...b, [k]: k === 'startTime' ? String(v) : Math.max(0, Number(v) || 0) }));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile icon={ListChecks} label="Total periods" value={periods.length} tone="primary" />
        <StatTile icon={BookOpen} label="Teaching periods" value={teaching.length} tone="success" />
        <StatTile icon={Coffee} label="Breaks" value={breaks.length} tone="warning" />
        <StatTile icon={Clock} label="Teaching hours" value={`${(totalMinutes / 60).toFixed(1)}h`} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: builder column */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-4">
          {/* Add / edit a period */}
          <form onSubmit={handleSubmit} className={`${CARD} p-6 space-y-5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                  {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">{editingId ? 'Edit period' : 'Add a period'}</h2>
                  <p className="text-xs opacity-60">
                    {editingId ? 'Change the name or times, then save.' : `Next up is period ${nextNumber}. Pick a type or type your own.`}
                  </p>
                </div>
              </div>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-xs font-semibold text-error hover:underline cursor-pointer">
                  Cancel
                </button>
              )}
            </div>

            {!editingId && (
              <div className="flex flex-wrap gap-2">
                {PERIOD_PRESETS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="px-3 py-1.5 rounded-full border border-base-300 bg-base-200/50 hover:bg-base-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: p.isBreak ? secondaryColor : primaryColor }} />
                      {p.label}
                      <span className="opacity-50 font-mono">{p.minutes}m</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div>
              <label className={LABEL}>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Lesson 4, Tea Break, Remedial"
                className={INPUT}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Starts</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  required
                  className={`${INPUT} font-mono`}
                />
              </div>
              <div>
                <label className={LABEL}>Minutes</label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  step={5}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                  required
                  className={`${INPUT} font-mono`}
                />
              </div>
              <div>
                <label className={LABEL}>Ends</label>
                <div className={`${INPUT} font-mono bg-base-200/60 flex items-center`}>{endTime}</div>
              </div>
            </div>

            <label
              className={`flex items-center gap-3 px-4 py-3 border rounded-xl text-sm font-semibold cursor-pointer transition ${
                form.isBreak ? 'border-warning/50 bg-warning/10' : 'border-base-300'
              }`}
            >
              <input
                type="checkbox"
                checked={form.isBreak}
                onChange={(e) => setForm({ ...form, isBreak: e.target.checked })}
                className="checkbox checkbox-warning checkbox-sm"
              />
              <Coffee className="w-4 h-4 text-warning" />
              <span className="flex-1">This is a break — no lessons go here</span>
            </label>

            {(overlap || invalidRange) && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-error/10 text-error text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {invalidRange
                  ? 'The end time must be after the start time.'
                  : `Overlaps with "${overlap!.name}" (${hhmm(overlap!.startTime)}–${hhmm(overlap!.endTime)}).`}
              </div>
            )}

            <button
              type="submit"
              disabled={updating || bulkCreating || !!overlap || invalidRange}
              className="w-full text-white font-bold py-3 rounded-xl hover:opacity-95 transition shadow-lg text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px -8px ${primaryColor}` }}
            >
              {(updating || bulkCreating) ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              {editingId ? 'Save changes' : 'Add period'}
            </button>
          </form>

          {/* Day builder */}
          <div className={`${CARD} p-6 space-y-4`}>
            <button type="button" onClick={() => setShowBuilder(!showBuilder)} className="w-full flex items-center justify-between gap-3 cursor-pointer">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                  <Hammer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Build a whole day</h3>
                  <p className="text-xs opacity-60">Set lesson length, breaks and count — we create every period.</p>
                </div>
              </div>
              {showBuilder ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
            </button>

            {showBuilder && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Day starts" type="time" value={builder.startTime} onChange={(v) => setB('startTime', v)} />
                  <NumField label="Assembly (min, 0 = none)" value={builder.assemblyMin} onChange={(v) => setB('assemblyMin', v)} />
                  <NumField label="Lesson length (min)" value={builder.lessonMin} onChange={(v) => setB('lessonMin', v)} />
                  <NumField label="Number of lessons" value={builder.lessons} onChange={(v) => setB('lessons', v)} />
                  <NumField label="Break after every … lessons" value={builder.breakEvery} onChange={(v) => setB('breakEvery', v)} />
                  <NumField label="Break length (min)" value={builder.breakMin} onChange={(v) => setB('breakMin', v)} />
                  <NumField label="Lunch after lesson #" value={builder.lunchAfter} onChange={(v) => setB('lunchAfter', v)} />
                  <NumField label="Lunch length (min)" value={builder.lunchMin} onChange={(v) => setB('lunchMin', v)} />
                  <NumField label="Games / Clubs (min, 0 = none)" value={builder.gamesMin} onChange={(v) => setB('gamesMin', v)} />
                </div>

                <div className="max-h-56 overflow-y-auto bg-base-200/40 border border-base-300 rounded-xl divide-y divide-base-300">
                  {builderPreview.map((p) => (
                    <div key={p.periodNumber} className="flex items-center gap-3 px-3 py-1.5 text-xs">
                      <span className="font-mono opacity-50 w-5">{p.periodNumber}</span>
                      <span className="font-mono opacity-70 w-[88px] shrink-0">{p.startTime}–{p.endTime}</span>
                      <span className={`flex-1 truncate font-semibold ${p.isBreak ? 'text-warning' : ''}`}>{p.name}</span>
                    </div>
                  ))}
                </div>

                {(builderClash || builderOverflow) && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-error/10 text-error text-xs font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    {builderOverflow ? 'This day runs past midnight. Shorten it.' : 'This overlaps existing periods. Start after the last period.'}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBuild}
                  disabled={bulkCreating || builderPreview.length === 0 || builderClash || builderOverflow}
                  className="w-full text-white font-bold py-3 rounded-xl text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {bulkCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Create {builderPreview.length} periods
                </button>
              </div>
            )}
          </div>

          {/* Shortcuts */}
          <div className="flex flex-wrap gap-2">
            {periods.length === 0 && (
              <button
                type="button"
                onClick={handleSeed}
                disabled={bulkCreating}
                className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl bg-base-200/70 hover:bg-base-200 border border-base-300 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" /> {bulkCreating ? 'Creating…' : 'Use the standard school day (8 lessons)'}
              </button>
            )}
            {periods.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl bg-error/10 text-error hover:bg-error hover:text-error-content cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {resetting ? 'Clearing…' : 'Start over (clear everything)'}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: timeline */}
        <div className={`lg:col-span-7 ${CARD} p-6 sm:p-8`}>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">The school day</h2>
                <p className="text-xs opacity-60">
                  {periods.length ? `${hhmm(periods[0].startTime)} to ${hhmm(periods[periods.length - 1].endTime)}` : 'Nothing here yet'}
                </p>
              </div>
            </div>
            {isValid !== undefined && periods.length > 0 && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${isValid ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                {isValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {isValid ? 'No overlaps' : `${issues.length} issue${issues.length === 1 ? '' : 's'}`}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-sm opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…</div>
          ) : periods.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-base-300 rounded-3xl space-y-3">
              <Clock className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-sm font-semibold">No periods yet</p>
              <p className="text-xs opacity-60 max-w-xs mx-auto">
                Add your first period on the left, build a whole day in one go, or use the standard Kenyan day.
              </p>
            </div>
          ) : (
            <ol className="relative max-h-[720px] overflow-y-auto pr-1">
              {periods.map((p, i) => {
                const next = periods[i + 1];
                const gap = next ? timeToMinutes(next.startTime) - timeToMinutes(p.endTime) : 0;
                const lesson = lessonNumbers.get(p.id);
                const editing = editingId === p.id;
                return (
                  <li key={p.id}>
                    <div
                      className={`group flex items-stretch gap-4 p-3 rounded-2xl border transition ${
                        editing ? 'border-primary bg-primary/5' :
                        p.isBreak ? 'bg-warning/5 border-warning/25' : 'bg-base-100 border-base-300 hover:border-primary/60'
                      }`}
                    >
                      <div className="w-[68px] shrink-0 text-right font-mono leading-tight py-1">
                        <p className="text-sm font-bold">{hhmm(p.startTime)}</p>
                        <p className="text-[11px] opacity-50">{hhmm(p.endTime)}</p>
                      </div>
                      <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: p.isBreak ? secondaryColor : primaryColor, opacity: p.isBreak ? 0.7 : 1 }} />
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-bold truncate ${p.isBreak ? 'text-warning' : ''}`}>{p.name}</p>
                          {p.isBreak ? (
                            <span className="px-2 py-0.5 bg-warning/15 text-warning text-[11px] font-semibold rounded-full flex items-center gap-1">
                              <Coffee className="w-3 h-3" /> Break
                            </span>
                          ) : lesson ? (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-full">Lesson {lesson}</span>
                          ) : null}
                        </div>
                        <p className="text-xs opacity-60 mt-0.5">{durationOf(p)} minutes · period {p.periodNumber}</p>
                      </div>
                      <div className="flex gap-1 items-center shrink-0 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                        <button type="button" onClick={() => handleEdit(p)} className="p-2 bg-base-200 rounded-lg hover:bg-primary/20 hover:text-primary cursor-pointer" title="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(p)} className="p-2 bg-error/10 text-error rounded-lg hover:bg-error hover:text-error-content cursor-pointer" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {next && gap !== 0 && (
                      <div className={`ml-[84px] my-1 text-[11px] font-medium ${gap < 0 ? 'text-error' : 'opacity-50'}`}>
                        {gap < 0 ? `Overlaps next period by ${Math.abs(gap)} min` : `${gap} min gap`}
                      </div>
                    )}
                    {next && gap === 0 && <div className="h-2" />}
                  </li>
                );
              })}
            </ol>
          )}

          {issues.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-error">
              {issues.map((it, i) => <li key={i}>• {it}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function NumField({
  label, value, onChange, type = 'number',
}: { label: string; value: string | number; onChange: (v: string) => void; type?: 'number' | 'time' }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <input
        type={type}
        min={type === 'number' ? 0 : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} font-mono`}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CLASS TIMETABLE TAB
   ════════════════════════════════════════════════════════════════ */
function ClassTimetableTab({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const [classId, setClassId] = useState('');
  const [editingSlot, setEditingSlot] = useState<{ day: DayOfWeek; period: Period; slot?: TimetableSlot } | null>(null);
  const [showClone, setShowClone] = useState(false);
  const [cloneTargetId, setCloneTargetId] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);

  const { data: classesData } = useGetClassesBySchoolQuery(schoolId, { skip: !schoolId });
  const { data: gradesData } = useGetGradeLevelsBySchoolQuery(schoolId, { skip: !schoolId });
  const { data: subjectsData } = useGetSubjectsBySchoolQuery(schoolId, { skip: !schoolId });
  const { teachers } = useSchoolTeachers(schoolId);

  const classes = useMemo(() => extractClasses(classesData), [classesData]);
  const grades = useMemo(() => extractGrades(gradesData), [gradesData]);
  const subjects = useMemo(() => extractSubjects(subjectsData), [subjectsData]);

  const { data: periodsData } = useListAllPeriodsQuery(schoolId, { skip: !schoolId });
  const periods = useMemo(() => extractPeriods(periodsData), [periodsData]);
  const allPeriods = useMemo(() => [...periods].sort((a, b) => a.periodNumber - b.periodNumber), [periods]);
  const lessonNumbers = useMemo(() => buildLessonNumbers(periods), [periods]);
  const teachingCount = allPeriods.filter((p) => !p.isBreak).length;

  const { data: timetableData, isLoading } = useGetClassTimetableQuery(classId, { skip: !classId });
  const { data: workloadData } = useGetClassWorkloadQuery(classId, { skip: !classId });
  const { data: currentData } = useGetClassCurrentLessonQuery(classId, { skip: !classId });
  const { data: nextData } = useGetClassNextLessonQuery(classId, { skip: !classId });

  const slots = useMemo(() => extractSlots(timetableData), [timetableData]);
  const workload: any[] = (workloadData as any)?.workload ?? [];
  const currentLesson = (currentData as any)?.slot as TimetableSlot | null;
  const nextLesson = (nextData as any)?.slot as TimetableSlot | null;

  const [createSlot, { isLoading: creating }] = useCreateSlotMutation();
  const [updateSlot, { isLoading: updating }] = useUpdateSlotMutation();
  const [deleteSlot] = useDeleteSlotMutation();
  const [cloneSlots, { isLoading: cloning }] = useCloneClassSlotsMutation();
  const [clearTimetable] = useClearClassTimetableMutation();

  const slotMap = useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    slots.forEach((s) => map.set(`${s.dayOfWeek}::${s.periodId}`, s));
    return map;
  }, [slots]);

  const gradeName = (gid: string) => grades.find((g) => g.id === gid)?.name ?? '—';
  const className = (cid: string) => {
    const c = classes.find((x) => x.id === cid);
    return c ? `${gradeName(c.gradeLevelId)} ${c.stream}` : '—';
  };
  const subjectName = (sid?: string | null) => subjects.find((s) => s.id === sid)?.name ?? '—';
  const teacherName = (tid?: string | null) => {
    const t = teachers.find((x) => x.id === tid);
    return t ? teacherLabel(t) : '—';
  };

  const filledCount = slots.length;
  const totalSlots = teachingCount * DAYS.length;
  const coveragePct = totalSlots > 0 ? Math.min(100, (filledCount / totalSlots) * 100) : 0;

  const handleCellClick = (day: DayOfWeek, period: Period) => {
    if (period.isBreak) return;
    setEditingSlot({ day, period, slot: slotMap.get(`${day}::${period.id}`) });
  };

  const handleSlotSave = async (payload: { subjectId: string; teacherId: string; room: string }) => {
    if (!editingSlot || !classId) return;
    setSuccessMessage(''); setErrorMessage('');
    try {
      if (editingSlot.slot) {
        await updateSlot({
          slotId: editingSlot.slot.id,
          patch: {
            subjectId: payload.subjectId || undefined,
            teacherId: payload.teacherId || null,
            room: payload.room || null,
          },
        }).unwrap();
        setSuccessMessage('Lesson updated.');
      } else {
        await createSlot({
          schoolId,
          classId,
          dayOfWeek: editingSlot.day,
          periodId: editingSlot.period.id,
          subjectId: payload.subjectId || undefined,
          teacherId: payload.teacherId || undefined,
          room: payload.room || undefined,
        }).unwrap();
        setSuccessMessage('Lesson added.');
      }
      setEditingSlot(null);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Save failed.');
    }
  };

  const handleSlotDelete = async () => {
    if (!editingSlot?.slot) return;
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await deleteSlot(editingSlot.slot.id).unwrap();
      setSuccessMessage('Lesson deleted.');
      setEditingSlot(null);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Delete failed.');
    }
  };

  const handleClone = async () => {
    if (!classId || !cloneTargetId) return;
    if (!window.confirm(`Clone "${className(classId)}" into "${className(cloneTargetId)}"? This copies teachers too.`)) return;
    setSuccessMessage(''); setErrorMessage('');
    try {
      await cloneSlots({ schoolId, sourceClassId: classId, targetClassId: cloneTargetId }).unwrap();
      setSuccessMessage(`Cloned into ${className(cloneTargetId)}.`);
      setShowClone(false);
      setCloneTargetId('');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Clone failed.');
    }
  };

  const handleClear = async () => {
    if (!classId) return;
    if (!window.confirm(`Clear ALL lessons for "${className(classId)}"?`)) return;
    try {
      await clearTimetable(classId).unwrap();
      setSuccessMessage('Class timetable cleared.');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Clear failed.');
    }
  };

  const LessonChip = ({ slot }: { slot: TimetableSlot }) => {
    const tone = subjectColor(slot.subjectId);
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${tone.bg} ${tone.text}`}>{subjectName(slot.subjectId)}</span>
        <span className="text-sm font-semibold">{teacherName(slot.teacherId)}</span>
        {slot.room && <span className="text-xs opacity-60">· {slot.room}</span>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Class picker */}
      <div className={`${CARD} p-5`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-sm font-semibold opacity-70">Class</span>
          </div>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className={`${INPUT} flex-1 max-w-md cursor-pointer`}
          >
            <option value="">Choose a class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{gradeName(c.gradeLevelId)} {c.stream} ({c.academicYear})</option>
            ))}
          </select>

          {classId && (
            <>
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                coveragePct >= 90 ? 'bg-success/10 text-success' : coveragePct >= 50 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
              }`}>
                <Percent className="w-3 h-3" /> {coveragePct.toFixed(0)}% full
              </div>
              <button onClick={() => setShowGenerator(true)} className="text-xs font-semibold px-3.5 py-2 rounded-lg text-white cursor-pointer flex items-center gap-1.5" style={{ backgroundColor: primaryColor }}>
                <Wand2 className="w-3.5 h-3.5" /> Generate
              </button>
              <button onClick={() => window.print()} className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-base-200 hover:bg-base-300 cursor-pointer flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={() => setShowClone(!showClone)} className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" /> Clone
              </button>
              <button onClick={handleClear} className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-error/10 text-error hover:bg-error hover:text-error-content cursor-pointer flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
            </>
          )}
        </div>

        {showClone && classId && (
          <div className="mt-4 p-3 bg-base-200/50 border border-base-300 rounded-xl flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold opacity-70">Clone into</span>
            <select value={cloneTargetId} onChange={(e) => setCloneTargetId(e.target.value)} className="flex-1 px-3 py-2 bg-base-100 border border-base-300 rounded-lg text-xs cursor-pointer">
              <option value="">Target class…</option>
              {classes.filter((c) => c.id !== classId).map((c) => (
                <option key={c.id} value={c.id}>{gradeName(c.gradeLevelId)} {c.stream}</option>
              ))}
            </select>
            <button onClick={handleClone} disabled={!cloneTargetId || cloning} className="text-xs font-semibold px-4 py-2 rounded-lg text-white cursor-pointer disabled:opacity-60" style={{ backgroundColor: primaryColor }}>
              {cloning ? 'Cloning…' : 'Clone'}
            </button>
            <button onClick={() => setShowClone(false)} className="p-2 bg-base-200 rounded-lg"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {!classId ? (
        <div className="p-12 text-center text-sm opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
          Pick a class to view and edit its timetable.
        </div>
      ) : isLoading ? (
        <div className="p-8 text-center text-sm opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading timetable…</div>
      ) : allPeriods.length === 0 ? (
        <div className="p-12 text-center text-sm opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
          Set up your school day first (School Day tab).
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${CARD} p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <h3 className="text-sm font-bold">Happening now</h3>
              </div>
              {currentLesson ? <LessonChip slot={currentLesson} /> : <p className="text-sm opacity-60">No lesson right now (break or outside hours).</p>}
            </div>
            <div className={`${CARD} p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="w-4 h-4" style={{ color: primaryColor }} />
                <h3 className="text-sm font-bold">Up next</h3>
              </div>
              {nextLesson ? <LessonChip slot={nextLesson} /> : <p className="text-sm opacity-60">No upcoming lesson.</p>}
            </div>
          </div>

          {/* Grid: days as rows, periods as columns */}
          <div className={`${CARD} p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-base-300 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                  <Grid3x3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">{className(classId)}</h2>
                  <p className="text-xs opacity-60">{filledCount} of {totalSlots} lessons filled</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium opacity-80">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warning/30" /> Break</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-dashed border-base-300" /> Empty</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/20" /> Lesson</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 bg-base-100 min-w-[56px] px-2 py-1 text-xs font-semibold opacity-60 text-left">Day</th>
                    {allPeriods.map((period) => (
                      <th key={period.id} className={`min-w-[96px] px-1 py-1 text-center font-semibold ${period.isBreak ? 'text-warning/80' : 'opacity-70'}`}>
                        <div className="text-xs">{period.isBreak ? <Coffee className="w-3.5 h-3.5 inline" /> : `L${lessonNumbers.get(period.id)}`}</div>
                        <div className="text-[10px] font-mono font-normal opacity-70">{hhmm(period.startTime)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day}>
                      <td className="sticky left-0 z-10 bg-base-100 rounded-lg px-2 py-2 text-xs font-bold">{day.slice(0, 3)}</td>
                      {allPeriods.map((period) => {
                        const slot = slotMap.get(`${day}::${period.id}`);
                        const tone = subjectColor(slot?.subjectId);
                        if (period.isBreak) {
                          return (
                            <td key={period.id} className="p-0.5">
                              <div className="h-16 min-w-[96px] rounded-lg bg-warning/10 border border-warning/20 grid place-items-center">
                                <span className="text-[10px] font-semibold text-warning/70 text-center px-1 leading-tight truncate max-w-[88px]">{period.name}</span>
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td key={period.id} className="p-0.5">
                            <button
                              onClick={() => handleCellClick(day, period)}
                              className={`w-full h-16 min-w-[96px] rounded-lg border text-left px-2 py-1 transition hover:shadow-md hover:-translate-y-px cursor-pointer ${
                                slot ? `${tone.bg} ${tone.border} border-2` : 'bg-base-100 border-dashed border-base-300 hover:border-primary'
                              }`}
                            >
                              {slot ? (
                                <>
                                  <p className={`text-[11px] font-bold truncate ${tone.text}`}>{subjectName(slot.subjectId)}</p>
                                  <p className="text-[10px] opacity-70 truncate">{teacherName(slot.teacherId)}</p>
                                  {slot.room && (
                                    <p className="text-[9px] font-mono opacity-50 truncate flex items-center gap-0.5 mt-0.5">
                                      <MapPin className="w-2 h-2" /> {slot.room}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <span className="opacity-40 flex items-center justify-center h-full"><PlusCircle className="w-4 h-4" /></span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {workload.length > 0 && (
            <div className={`${CARD} p-6`}>
              <div className="flex items-center gap-3 pb-3 border-b border-base-300 mb-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg"><BookOpen className="w-4 h-4" /></div>
                <h3 className="text-sm font-bold">Workload by subject</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {workload.map((w, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border ${subjectColor(w.subjectId).bg} ${subjectColor(w.subjectId).border}`}>
                    <p className={`text-xs font-bold truncate ${subjectColor(w.subjectId).text}`}>{w.subjectName ?? subjectName(w.subjectId)}</p>
                    <p className="text-lg font-extrabold">{w.lessonCount} <span className="text-xs font-normal opacity-60">lessons</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {editingSlot && (
        <SlotEditorModal
          open={true}
          day={editingSlot.day}
          period={editingSlot.period}
          slot={editingSlot.slot}
          subjects={subjects}
          teachers={teachers}
          primaryColor={primaryColor}
          saving={creating || updating}
          onSave={handleSlotSave}
          onDelete={handleSlotDelete}
          onClose={() => setEditingSlot(null)}
        />
      )}

      {showGenerator && (
        <TimetableGenerator
          schoolId={schoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          open={showGenerator}
          onClose={() => setShowGenerator(false)}
          onSuccess={(msg: string) => {
            setSuccessMessage(msg);
            setShowGenerator(false);
          }}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SLOT EDITOR MODAL
   ════════════════════════════════════════════════════════════════ */
function SlotEditorModal({
  open, day, period, slot, subjects, teachers, primaryColor, saving, onSave, onDelete, onClose,
}: {
  open: boolean;
  day: DayOfWeek;
  period: Period;
  slot?: TimetableSlot;
  subjects: Subject[];
  teachers: TeacherUser[];
  primaryColor: string;
  saving: boolean;
  onSave: (payload: { subjectId: string; teacherId: string; room: string }) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [subjectId, setSubjectId] = useState(slot?.subjectId ?? '');
  const [teacherId, setTeacherId] = useState(slot?.teacherId ?? '');
  const [room, setRoom] = useState(slot?.room ?? '');
  const [teacherSearch, setTeacherSearch] = useState('');

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => teacherLabel(t).toLowerCase().includes(q));
  }, [teachers, teacherSearch]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-base-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-base-300 px-6 py-4">
          <div>
            <h3 className="text-base font-extrabold">{slot ? 'Edit lesson' : 'Add lesson'}</h3>
            <p className="text-xs font-mono opacity-60">{day} · {period.name} ({hhmm(period.startTime)}–{hhmm(period.endTime)})</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-base-200"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={LABEL}>Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={`${INPUT} cursor-pointer`}>
              <option value="">Choose subject…</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className={LABEL}>Teacher</label>
            <div className="relative mb-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none opacity-50"><Search className="w-3.5 h-3.5" /></span>
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Search teacher…"
                className={`${INPUT} pl-9`}
              />
            </div>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={`${INPUT} cursor-pointer`}>
              <option value="">No teacher</option>
              {filteredTeachers.length === 0 ? (
                <option disabled>No teachers available</option>
              ) : (
                filteredTeachers.map((t) => <option key={t.id} value={t.id}>{teacherLabel(t)}</option>)
              )}
            </select>
          </div>

          <div>
            <label className={LABEL}>Room (optional)</label>
            <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Science Lab" className={INPUT} />
          </div>
        </div>

        <div className="border-t border-base-300 px-6 py-4 flex justify-between gap-2">
          {slot ? (
            <button onClick={onDelete} className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-error/10 text-error hover:bg-error hover:text-error-content cursor-pointer flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm font-semibold px-4 py-2 rounded-lg bg-base-200 cursor-pointer">Cancel</button>
            <button
              onClick={() => onSave({ subjectId, teacherId, room })}
              disabled={saving || !subjectId}
              className="text-sm font-bold px-5 py-2 rounded-lg text-white shadow-md disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? 'Saving…' : slot ? 'Update' : 'Add lesson'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ════════════════════════════════════════════════════════════════
   TEACHER VIEW TAB
   ════════════════════════════════════════════════════════════════ */
function TeacherViewTab({
  schoolId, primaryColor, secondaryColor,
}: { schoolId: string; primaryColor: string; secondaryColor: string }) {
  const [teacherId, setTeacherId] = useState('');
  const { teachers } = useSchoolTeachers(schoolId);

  const { data: subjectsData } = useGetSubjectsBySchoolQuery(schoolId, { skip: !schoolId });
  const { data: classesData } = useGetClassesBySchoolQuery(schoolId, { skip: !schoolId });
  const { data: gradesData } = useGetGradeLevelsBySchoolQuery(schoolId, { skip: !schoolId });

  const subjects = useMemo(() => extractSubjects(subjectsData), [subjectsData]);
  const classes = useMemo(() => extractClasses(classesData), [classesData]);
  const grades = useMemo(() => extractGrades(gradesData), [gradesData]);

  const { data: timetableData, isLoading } = useGetTeacherWeeklyTimetableQuery(teacherId, { skip: !teacherId });
  const { data: workloadData } = useGetTeacherWorkloadQuery(teacherId, { skip: !teacherId });

  const slots = useMemo(() => extractSlots(timetableData), [timetableData]);
  const workload: any[] = (workloadData as any)?.workload ?? [];

  const byDay = useMemo(() => {
    const map: Record<string, TimetableSlot[]> = {};
    DAYS.forEach((d) => (map[d] = []));
    slots.forEach((s) => { if (map[s.dayOfWeek]) map[s.dayOfWeek].push(s); });
    Object.values(map).forEach((arr) => arr.sort((a, b) => ((a.period as Period)?.periodNumber ?? 0) - ((b.period as Period)?.periodNumber ?? 0)));
    return map;
  }, [slots]);

  const gradeName = (gid: string) => grades.find((g) => g.id === gid)?.name ?? '—';
  const className = (cid: string) => {
    const c = classes.find((x) => x.id === cid);
    return c ? `${gradeName(c.gradeLevelId)} ${c.stream}` : '—';
  };
  const subjectName = (sid?: string | null) => subjects.find((s) => s.id === sid)?.name ?? '—';

  return (
    <div className="space-y-6">
      <div className={`${CARD} p-5`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-sm font-semibold opacity-70">Teacher</span>
          </div>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={`${INPUT} flex-1 max-w-md cursor-pointer`}>
            <option value="">Choose teacher…</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{teacherLabel(t)}</option>)}
          </select>
          {teacherId && (
            <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">{slots.length} lessons a week</div>
          )}
        </div>
      </div>

      {!teacherId ? (
        <div className="p-12 text-center text-sm opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
          Pick a teacher to see their weekly timetable.
        </div>
      ) : isLoading ? (
        <div className="p-8 text-center text-sm opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…</div>
      ) : (
        <>
          <div className={`${CARD} p-6 space-y-4`}>
            <div className="flex items-center gap-3 pb-3 border-b border-base-300">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-extrabold tracking-tight">Weekly schedule</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {DAYS.map((day) => (
                <div key={day} className="space-y-2">
                  <h3 className="text-xs font-bold text-center py-1.5 bg-base-200/70 rounded-lg">{day.slice(0, 3)}</h3>
                  {byDay[day]?.length === 0 ? (
                    <div className="p-4 text-center text-xs opacity-40 italic rounded-lg border border-dashed border-base-300">Free</div>
                  ) : (
                    byDay[day].map((s) => {
                      const tone = subjectColor(s.subjectId);
                      const per = s.period as Period | undefined;
                      return (
                        <div key={s.id} className={`p-2.5 rounded-xl border ${tone.bg} ${tone.border}`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-bold truncate ${tone.text}`}>{subjectName(s.subjectId)}</span>
                            <span className="text-[10px] font-mono opacity-60 shrink-0">{per?.startTime ? hhmm(per.startTime) : ''}</span>
                          </div>
                          <p className="text-[11px] font-semibold opacity-70 truncate mt-0.5">{className(s.classId)}</p>
                          {s.room && <p className="text-[10px] font-mono opacity-50 truncate">{s.room}</p>}
                        </div>
                      );
                    })
                  )}
                </div>
              ))}
            </div>
          </div>

          {workload.length > 0 && (
            <div className={`${CARD} p-6`}>
              <div className="flex items-center gap-3 pb-3 border-b border-base-300 mb-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg"><BarChartIcon className="w-4 h-4" /></div>
                <h3 className="text-sm font-bold">Workload</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {workload.map((w, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-base-300 bg-base-100">
                    <p className="text-xs font-bold truncate opacity-70">{w.subjectName ?? subjectName(w.subjectId)}</p>
                    <p className="text-lg font-extrabold">{w.lessonCount} <span className="text-xs font-normal opacity-60">lessons</span></p>
                    {w.className && <p className="text-[11px] opacity-60 truncate">{w.className}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════
   MASTER GRID TAB
   ════════════════════════════════════════════════════════════════ */
function MasterGridTab({
  schoolId, primaryColor, secondaryColor,
}: { schoolId: string; primaryColor: string; secondaryColor: string }) {
  const [dayFilter, setDayFilter] = useState<DayOfWeek>('Monday');

  const { data: classesData } = useGetClassesBySchoolQuery(schoolId, { skip: !schoolId });
  const { data: gradesData } = useGetGradeLevelsBySchoolQuery(schoolId, { skip: !schoolId });
  const { data: subjectsData } = useGetSubjectsBySchoolQuery(schoolId, { skip: !schoolId });
  const { teachers } = useSchoolTeachers(schoolId);

  const { data: periodsData } = useListAllPeriodsQuery(schoolId, { skip: !schoolId });
  const { data: gridData, isLoading } = useGetMasterGridQuery(schoolId, { skip: !schoolId });

  const classes = useMemo(() => extractClasses(classesData), [classesData]);
  const grades = useMemo(() => extractGrades(gradesData), [gradesData]);
  const subjects = useMemo(() => extractSubjects(subjectsData), [subjectsData]);

  const periods = useMemo(() => [...extractPeriods(periodsData)].sort((a, b) => a.periodNumber - b.periodNumber), [periodsData]);
  const lessonNumbers = useMemo(() => buildLessonNumbers(periods), [periods]);
  const teachingPeriods = periods.filter((p) => !p.isBreak);

  const grid: Record<string, Record<string, Record<string, TimetableSlot | null>>> = (gridData as any)?.grid ?? {};

  const gradeName = (gid: string) => grades.find((g) => g.id === gid)?.name ?? '—';
  const subjectName = (sid?: string | null) => subjects.find((s) => s.id === sid)?.name ?? '—';
  const teacherName = (tid?: string | null) => {
    const t = teachers.find((x) => x.id === tid);
    return t ? teacherLabel(t) : '—';
  };

  return (
    <div className="space-y-6">
      <div className={`${CARD} p-5`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Layers className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-sm font-semibold opacity-70">Day</span>
          </div>
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setDayFilter(d)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-lg transition cursor-pointer ${
                dayFilter === d ? 'text-white shadow-md' : 'bg-base-200/70 hover:bg-base-200'
              }`}
              style={dayFilter === d ? { backgroundColor: primaryColor } : {}}
            >
              {d.slice(0, 3)}
            </button>
          ))}
          <button onClick={() => window.print()} className="ml-auto text-xs font-semibold px-3.5 py-2 rounded-lg bg-base-200 hover:bg-base-300 cursor-pointer flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading master grid…</div>
      ) : classes.length === 0 ? (
        <div className="p-12 text-center text-sm opacity-60 border-2 border-dashed border-base-300 rounded-3xl">No classes yet.</div>
      ) : (
        <div className={`${CARD} p-6 overflow-x-auto`}>
          <div className="flex items-center gap-3 pb-4 border-b border-base-300 mb-4">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Master grid · {dayFilter}</h2>
              <p className="text-xs opacity-60">{classes.length} classes × {teachingPeriods.length} teaching periods</p>
            </div>
          </div>

          <table className="w-full text-xs border-separate border-spacing-0.5">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold opacity-60 px-1 py-1 min-w-[110px]">Class</th>
                {teachingPeriods.map((p) => (
                  <th key={p.id} className="text-xs font-semibold opacity-60 px-1 py-1 min-w-[78px]">
                    <div>L{lessonNumbers.get(p.id)}</div>
                    <div className="text-[10px] font-mono font-normal opacity-70">{hhmm(p.startTime)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td className="px-2 py-1 text-xs font-bold bg-base-200/60 rounded-l-lg truncate">{gradeName(c.gradeLevelId)} {c.stream}</td>
                  {teachingPeriods.map((p) => {
                    const slot = grid[c.id]?.[dayFilter]?.[p.id];
                    const tone = subjectColor(slot?.subjectId);
                    return (
                      <td key={p.id} className="p-0.5">
                        <div className={`h-12 rounded-md px-1.5 py-1 border ${slot ? `${tone.bg} ${tone.border}` : 'bg-base-100 border-dashed border-base-300'}`}>
                          {slot ? (
                            <>
                              <p className={`text-[10px] font-bold truncate ${tone.text}`}>{subjectName(slot.subjectId)}</p>
                              <p className="text-[9px] opacity-60 truncate">{teacherName(slot.teacherId)}</p>
                            </>
                          ) : (
                            <div className="h-full flex items-center justify-center"><span className="text-[10px] opacity-30">—</span></div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   VALIDATION TAB
   ════════════════════════════════════════════════════════════════ */
function ValidationTab({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const { data: validationData, isLoading: loadingValidation } = useValidateTimetableQuery(schoolId, { skip: !schoolId });
  const { data: coverageData } = useGetCoverageQuery(schoolId, { skip: !schoolId });
  const { data: emptyData } = useGetEmptyClassesQuery(schoolId, { skip: !schoolId });
  const { data: unassignedData, refetch: refetchUnassigned } = useGetUnassignedTeacherSlotsQuery(schoolId, { skip: !schoolId });
  useGetSlotsWithoutRoomQuery(schoolId, { skip: !schoolId });
  const { data: allocationData } = useGetSubjectAllocationQuery(schoolId, { skip: !schoolId });
  const { data: perClassData } = useGetPerClassCoverageQuery(schoolId, { skip: !schoolId });
  const { data: detailedConflictsData } = useGetDetailedConflictsQuery(schoolId, { skip: !schoolId });
  const [autoAssign, { isLoading: autoAssigning }] = useAutoAssignMissingTeachersMutation();

  const validation = (validationData as any) ?? {};
  const conflicts: any[] = validation?.conflicts ?? [];
  const issues: string[] = validation?.issues ?? [];
  const valid = validation?.valid;

  const coverage = (coverageData as any)?.coverage ?? {};
  const emptyClasses: any[] = (emptyData as any)?.classes ?? [];
  const unassignedSlots: any[] = (unassignedData as any)?.slots ?? [];
  const allocation: any[] = (allocationData as any)?.allocation ?? [];
  const perClass: any[] = (perClassData as any)?.stats?.perClass ?? [];
  const detailedConflicts: any[] = (detailedConflictsData as any)?.conflicts ?? [];

  const handleAutoAssign = async () => {
    if (unassignedSlots.length === 0) { setSuccessMessage('No unassigned lessons to fill.'); return; }
    if (!window.confirm(`Auto-assign ${unassignedSlots.length} unassigned lesson(s) to the least-loaded available teachers?`)) return;
    setSuccessMessage(''); setErrorMessage('');
    try {
      const res = await autoAssign({ schoolId, maxPerTeacherPerDay: 6, maxPerTeacherPerWeek: 28, preferSubjectQualified: true }).unwrap();
      const assigned = (res as any)?.stats?.assigned ?? 0;
      const skipped = (res as any)?.stats?.skipped ?? 0;
      setSuccessMessage(`Auto-assigned ${assigned} teacher${assigned === 1 ? '' : 's'}${skipped > 0 ? ` · ${skipped} skipped` : ''}.`);
      refetchUnassigned();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Auto-assign failed.');
    }
  };

  const th = 'px-3 py-2 font-semibold text-xs opacity-60';

  return (
    <div className="space-y-6">
      <div className={`p-8 rounded-3xl border-2 ${
        valid === true ? 'bg-success/5 border-success/30' : valid === false ? 'bg-error/5 border-error/30' : 'bg-base-200/40 border-base-300'
      }`}>
        <div className="flex items-center gap-4">
          {loadingValidation ? (
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
          ) : valid === true ? (
            <div className="p-3 bg-success/10 text-success rounded-2xl"><CheckCircle2 className="w-7 h-7" /></div>
          ) : (
            <div className="p-3 bg-error/10 text-error rounded-2xl"><AlertTriangle className="w-7 h-7" /></div>
          )}
          <div>
            <p className={`text-2xl font-extrabold ${valid === true ? 'text-success' : valid === false ? 'text-error' : 'opacity-70'}`}>
              {valid === true ? 'Timetable is valid' : valid === false ? 'Issues found' : 'Not validated'}
            </p>
            <p className="text-sm opacity-60 mt-1">
              {valid === true ? 'No teacher or room conflicts detected.' :
               valid === false ? `${conflicts.length} conflict${conflicts.length === 1 ? '' : 's'} · ${issues.length} issue${issues.length === 1 ? '' : 's'}` :
               'Validation could not complete.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile icon={Percent} label="Coverage" value={`${(coverage.percentage ?? 0).toFixed(1)}%`} tone="primary" />
        <StatTile icon={AlertTriangle} label="Conflicts" value={conflicts.length} tone={conflicts.length > 0 ? 'warning' : 'success'} />
        <StatTile icon={GraduationCap} label="Empty classes" value={emptyClasses.length} tone={emptyClasses.length > 0 ? 'warning' : 'success'} />
        <StatTile icon={User} label="Unassigned lessons" value={unassignedSlots.length} tone={unassignedSlots.length > 0 ? 'warning' : 'success'} />
      </div>

      <div className={`${CARD} p-5`}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-sm font-semibold opacity-70">Quick actions</span>
          </div>
          <button
            onClick={handleAutoAssign}
            disabled={autoAssigning || unassignedSlots.length === 0}
            className="text-xs font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            style={{ backgroundColor: primaryColor }}
          >
            {autoAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
            {autoAssigning ? 'Assigning…' : `Auto-fill ${unassignedSlots.length} unassigned`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${CARD} p-6 space-y-3`}>
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div className="p-2 bg-error/10 text-error rounded-lg"><AlertTriangle className="w-4 h-4" /></div>
            <h3 className="text-sm font-bold">Conflicts</h3>
            <span className="ml-auto text-xs font-mono font-bold opacity-60">{conflicts.length}</span>
          </div>
          {conflicts.length === 0 ? (
            <div className="p-6 text-center text-sm opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-success" /> No conflicts found
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {conflicts.map((c, idx) => (
                  <div key={idx} className="p-3 bg-error/5 border border-error/20 rounded-xl text-xs">
                    <p className="font-bold text-error">{c.reason ?? 'Conflict'}</p>
                    <p className="text-[11px] font-mono opacity-60 mt-0.5">
                      {c.dayOfWeek} · period {c.periodId?.slice(0, 6)} · {c.teacherId?.slice(0, 6) || c.room || c.classId?.slice(0, 6)}
                    </p>
                  </div>
                ))}
              </div>
              {detailedConflicts.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold opacity-60 hover:opacity-100 select-none">
                    Show with names ({detailedConflicts.length})
                  </summary>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {detailedConflicts.map((c, idx) => (
                      <div key={idx} className="p-3 bg-error/5 border border-error/20 rounded-xl">
                        <p className="text-xs font-bold text-error">{c.reason}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-mono opacity-70">
                          {c.teacher?.name && <span>👤 {c.teacher.name}</span>}
                          {c.room && <span>📍 {c.room}</span>}
                          {c.period?.name && <span>⏰ {c.period.name}</span>}
                          <span>📅 {c.dayOfWeek}</span>
                        </div>
                        {c.conflicts && c.conflicts.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {c.conflicts.map((conflict: any, i: number) => (
                              <p key={i} className="text-[11px] opacity-60">→ {conflict.class?.stream ?? '—'} · {conflict.subject?.name ?? '—'}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
        </div>

        <div className={`${CARD} p-6 space-y-3`}>
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div className="p-2 bg-warning/10 text-warning rounded-lg"><GraduationCap className="w-4 h-4" /></div>
            <h3 className="text-sm font-bold">Empty classes</h3>
            <span className="ml-auto text-xs font-mono font-bold opacity-60">{emptyClasses.length}</span>
          </div>
          {emptyClasses.length === 0 ? (
            <div className="p-6 text-center text-sm opacity-60 border-2 border-dashed border-base-300 rounded-2xl">All classes have timetables ✓</div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {emptyClasses.map((c) => (
                <div key={c.id} className="p-2.5 bg-base-200/50 border border-base-300 rounded-lg text-xs font-semibold truncate">
                  {c.name ?? `${c.id?.slice(0, 8)}…`} {c.stream && `· ${c.stream}`}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {perClass.length > 0 && (
        <div className={`${CARD} p-6 space-y-3`}>
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div className="p-2 bg-primary/10 text-primary rounded-lg"><BarChartIcon className="w-4 h-4" /></div>
            <h3 className="text-sm font-bold">Per-class coverage</h3>
            <span className="ml-auto text-xs font-mono font-bold opacity-60">{perClass.length} classes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-base-300">
                <tr>
                  <th className={`text-left ${th}`}>Class</th>
                  <th className={`text-right ${th}`}>Filled</th>
                  <th className={`text-right ${th}`}>Capacity</th>
                  <th className={`text-right ${th}`}>Missing</th>
                  <th className={`text-right ${th}`}>Fill %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {perClass.map((c) => (
                  <tr key={c.classId}>
                    <td className="px-3 py-2 font-semibold">{c.stream ?? `${c.classId.slice(0, 8)}…`}</td>
                    <td className="px-3 py-2 text-right font-mono">{c.filled}</td>
                    <td className="px-3 py-2 text-right font-mono">{c.capacity}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      <span className={c.missing > 0 ? 'text-warning font-bold' : 'opacity-60'}>{c.missing}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        c.percentage >= 90 ? 'bg-success/10 text-success' : c.percentage >= 50 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
                      }`}>
                        {c.percentage.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={`${CARD} p-6 space-y-3`}>
        <div className="flex items-center gap-3 pb-3 border-b border-base-300">
          <div className="p-2 bg-warning/10 text-warning rounded-lg"><User className="w-4 h-4" /></div>
          <h3 className="text-sm font-bold">Lessons without a teacher</h3>
          <span className="ml-auto text-xs font-mono font-bold opacity-60">{unassignedSlots.length}</span>
        </div>
        {unassignedSlots.length === 0 ? (
          <div className="p-6 text-center text-sm opacity-60 border-2 border-dashed border-base-300 rounded-2xl">All lessons have teachers assigned ✓</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {unassignedSlots.slice(0, 30).map((s, idx) => (
              <div key={idx} className="p-2.5 bg-base-200/50 border border-base-300 rounded-lg text-xs">
                <p className="font-bold truncate">{s.subject?.name ?? s.subjectId?.slice(0, 8) ?? 'Subject'}</p>
                <p className="font-mono opacity-60">{s.dayOfWeek} · {s.class?.name ?? s.classId?.slice(0, 6)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {allocation.length > 0 && (
        <div className={`${CARD} p-6 space-y-3`}>
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div className="p-2 bg-primary/10 text-primary rounded-lg"><BarChartIcon className="w-4 h-4" /></div>
            <h3 className="text-sm font-bold">Subject allocation</h3>
            <span className="ml-auto text-xs font-mono font-bold opacity-60">{allocation.length} subjects</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-base-300">
                <tr>
                  <th className={`text-left ${th}`}>Subject</th>
                  <th className={`text-right ${th}`}>Lessons</th>
                  <th className={`text-right ${th}`}>Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {allocation.map((a, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 font-semibold">{a.subjectName ?? a.subjectId?.slice(0, 8)}</td>
                    <td className="px-3 py-2 text-right font-mono">{a.lessonCount ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-mono">{a.hours != null ? Number(a.hours).toFixed(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
    <div className="p-4 bg-base-100 border border-base-300/70 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${toneMap}`}><Icon className="w-3.5 h-3.5" /></div>
        <p className="text-xs font-semibold opacity-60">{label}</p>
      </div>
      <p className="text-2xl font-extrabold truncate">{value}</p>
    </div>
  );
}