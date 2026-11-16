import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Wand2, X, AlertCircle, Loader2, RotateCcw, Save, AlertTriangle, CheckCircle2,
  BookOpen, GraduationCap, Settings, ChevronLeft, ChevronRight, Users, Minus, Plus,
  Copy, Eraser, ChevronDown, Sun, Info, Circle, Check, Unlink, Layers,
  CalendarDays, Gauge, Ban, Rows3,
} from 'lucide-react';

import {
  useGetClassesBySchoolQuery,
  useGetSubjectsBySchoolQuery,
  useGetGradeLevelsBySchoolQuery,
  type ClassEntity,
  type Subject,
  type GradeLevel,
} from '../features/Apis/academicStructure.Api';

import {
  useGetTeachersBySchoolQuery,
  useGetSchoolUsersByRoleQuery,
} from '../features/Apis/Users.Api';

import {
  useListAllPeriodsQuery,
  usePreviewSchoolTimetableMutation,
  useGenerateSchoolTimetableMutation,
  type Period,
  type DayOfWeek,
  type TimetableSlot,
  type GeneratorAllocation,
  type GeneratorConfig,
  type GeneratorStats,
} from '../features/Apis/Timetables.Api';

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════
type TeacherUser = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: any;
};

interface TimetableGeneratorProps {
  schoolId: string;
  primaryColor: string;
  secondaryColor: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type Step = 'classes' | 'lessons' | 'preview' | 'saving';
type Alloc = { lessons: number; isDouble: boolean; doubles?: number; teacherIds: string[] };
type AllocMap = Record<string, Record<string, Alloc>>;

type RuleConfig = GeneratorConfig & {
  avoidAdjacentPairs?: [string, string][];
  spreadSubjects?: boolean;
  maxDoublesPerDay?: number;
  dailySubjectIds?: string[];
  maxPerSubjectPerDay?: Record<string, number>;
  /** 🆕 Client-side only — prevents 3+ of the same subject in a row */
  avoidTriples?: boolean;
};

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const STEPS: { key: Exclude<Step, 'saving'>; label: string; hint: string }[] = [
  { key: 'classes', label: 'Classes', hint: 'Who is this for?' },
  { key: 'lessons', label: 'Lessons', hint: 'How many per week?' },
  { key: 'preview', label: 'Review', hint: 'Check and save' },
];

const INPUT = 'px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-sm font-medium outline-none transition focus:ring-2 focus:ring-primary/25 focus:border-primary';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
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
  const raw = data.data?.teachers ?? data.data?.users ?? data.teachers ?? data.users ?? data.data ?? data;
  return Array.isArray(raw) ? [...raw] : [];
}
function extractPeriods(data: any): Period[] {
  if (!data) return [];
  const raw = data.data?.periods ?? data.periods ?? data.data ?? data;
  return Array.isArray(raw) ? [...raw] : [];
}
function teacherLabel(t: TeacherUser): string {
  return t.name || [t.firstName, t.lastName].filter(Boolean).join(' ') || 'Unnamed';
}
const hhmm = (t: string) => (t || '').slice(0, 5);

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

const sumLessons = (m?: Record<string, Alloc>) =>
  Object.values(m ?? {}).reduce((s, a) => s + (a.lessons || 0), 0);

const countSubjects = (m?: Record<string, Alloc>) =>
  Object.values(m ?? {}).filter((a) => (a.lessons || 0) > 0).length;

function effectiveDoubles(a?: Alloc): number {
  if (!a || !a.isDouble || a.lessons < 2) return 0;
  return Math.min(Math.max(a.doubles ?? 1, 1), Math.floor(a.lessons / 2));
}

function minLessonsForDaily(a?: Alloc): number {
  return DAYS.length + effectiveDoubles(a);
}

/** True if this subject is explicitly blocked (cap of 0) */
function isBlocked(config: RuleConfig, sid: string): boolean {
  return config.maxPerSubjectPerDay?.[sid] === 0;
}

/**
 * Detects impossible rule combinations so we can warn the user early.
 * NOTE: a `0` cap is treated as "blocked / not taught", NOT as "no limit".
 */
function findRuleConflicts(
  allocations: AllocMap,
  config: RuleConfig,
  classIds: string[],
  className: (cid: string) => string,
  subjectName: (sid: string) => string
): string[] {
  const daily = config.dailySubjectIds ?? [];
  const limits = config.maxPerSubjectPerDay ?? {};
  const problems: string[] = [];
  for (const cid of classIds) {
    for (const sid of daily) {
      const a = allocations[cid]?.[sid];
      if (!a || a.lessons === 0) continue;
      const minNeeded = minLessonsForDaily(a);
      if (a.lessons < minNeeded) {
        problems.push(
          `${className(cid)} · ${subjectName(sid)}: "every day" needs at least ${minNeeded} lessons/week but only ${a.lessons} set.`
        );
        continue;
      }
      const cap = limits[sid];
      if (cap !== undefined) {
        if (cap === 0) {
          problems.push(
            `${className(cid)} · ${subjectName(sid)}: marked "every day" but its daily limit is 0 (blocked).`
          );
          continue;
        }
        const needPerDay = Math.ceil(a.lessons / DAYS.length);
        if (needPerDay > cap) {
          problems.push(
            `${className(cid)} · ${subjectName(sid)}: needs ${needPerDay}/day to fit ${a.lessons} lessons across 5 days, but your limit is ${cap}/day.`
          );
        }
      }
    }
  }
  return problems;
}

/** Checks a generated timetable against the user's rules. */
function checkRules(
  slots: TimetableSlot[],
  periods: Period[],
  allocations: AllocMap,
  config: RuleConfig,
  classIds: string[],
  subjectName: (sid: string) => string,
  className: (cid: string) => string
) {
  const ordered = [...periods].sort((a, b) => a.periodNumber - b.periodNumber);
  const idx = new Map(ordered.map((p, i) => [p.id, i]));
  const byId = new Map(ordered.map((p) => [p.id, p]));
  const pairs = config.avoidAdjacentPairs ?? [];
  const spread = config.spreadSubjects !== false;
  const maxDay = config.maxDoublesPerDay ?? 1;
  const daily = config.dailySubjectIds ?? [];
  const limits = config.maxPerSubjectPerDay ?? {};

  const issues: string[] = [];
  let pairViolations = 0;
  let doublesPlaced = 0;
  let doublesRequested = 0;
  let dailyViolations = 0;
  let limitViolations = 0;
  let tripleViolations = 0; // 🆕 count of runs of 3+ same subject in a row

  for (const cid of classIds) {
    const mine = slots.filter((s) => s.classId === cid && s.subjectId);
    const placedPairs: Record<string, number> = {};
    Object.values(allocations[cid] ?? {}).forEach((a) => { doublesRequested += effectiveDoubles(a); });

    for (const day of DAYS) {
      const daySlots = mine.filter((s) => s.dayOfWeek === day);
      const counts: Record<string, number> = {};
      daySlots.forEach((s) => { counts[s.subjectId!] = (counts[s.subjectId!] || 0) + 1; });

      Object.entries(counts).forEach(([sid, n]) => {
        const cap = limits[sid];
        if (cap === undefined) return;
        if (cap === 0) {
          limitViolations++;
          issues.push(`${className(cid)} · ${day}: ${subjectName(sid)} is blocked (0/day) but ${n} lesson${n === 1 ? '' : 's'} placed`);
        } else if (n > cap) {
          limitViolations++;
          issues.push(`${className(cid)} · ${day}: ${subjectName(sid)} appears ${n}× (limit ${cap}/day)`);
        }
      });

      daily.forEach((sid) => {
        const alloc = allocations[cid]?.[sid];
        if (!alloc || alloc.lessons === 0) return;
        if (alloc.lessons < minLessonsForDaily(alloc)) return;
        if (!counts[sid]) {
          dailyViolations++;
          issues.push(`${className(cid)} · ${day}: ${subjectName(sid)} missing (taught daily)`);
        }
      });

      const rows = daySlots
        .map((s) => ({ s, i: idx.get(s.periodId) ?? -1 }))
        .filter((x) => x.i >= 0)
        .sort((a, b) => a.i - b.i);
      let doublesToday = 0;

      for (let k = 0; k < rows.length - 1; k++) {
        const a = rows[k];
        const b = rows[k + 1];
        if (b.i - a.i !== 1) continue;
        const sa = a.s.subjectId as string;
        const sb = b.s.subjectId as string;
        if (sa === sb) {
          placedPairs[sa] = (placedPairs[sa] ?? 0) + 1;
          doublesToday++;
        } else if (pairs.some(([x, y]) => (x === sa && y === sb) || (x === sb && y === sa))) {
          pairViolations++;
          const when = byId.get(a.s.periodId)?.startTime;
          issues.push(`${className(cid)} · ${day.slice(0, 3)} ${when ? hhmm(when) : ''}: ${subjectName(sa)} is followed by ${subjectName(sb)}`);
        }
      }
      doublesPlaced += doublesToday;
      if (doublesToday > maxDay) issues.push(`${className(cid)} · ${day}: ${doublesToday} double lessons in one day (limit ${maxDay})`);

      // 🆕 Detect any run of 3+ of the same subject (triples and longer)
      if (rows.length > 0) {
        let runLen = 1;
        let runSubject = rows[0].s.subjectId as string;
        const reportRun = (len: number, sid: string) => {
          if (len >= 3) {
            tripleViolations++;
            issues.push(
              `${className(cid)} · ${day}: ${subjectName(sid)} appears ${len}× in a row`
            );
          }
        };
        for (let k = 1; k < rows.length; k++) {
          const adj = rows[k].i - rows[k - 1].i === 1;
          const curr = rows[k].s.subjectId as string;
          if (adj && curr === runSubject) {
            runLen++;
          } else {
            reportRun(runLen, runSubject);
            runLen = 1;
            runSubject = curr;
          }
        }
        reportRun(runLen, runSubject);
      }
    }

    if (spread) {
      Object.entries(placedPairs).forEach(([sid, n]) => {
        const allowed = effectiveDoubles(allocations[cid]?.[sid]);
        if (n > allowed) issues.push(`${className(cid)}: ${subjectName(sid)} is back-to-back ${n} time${n === 1 ? '' : 's'} (allowed ${allowed})`);
      });
    }
  }
  return { issues, pairViolations, doublesPlaced, doublesRequested, dailyViolations, limitViolations, tripleViolations };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function TimetableGenerator({
  schoolId, primaryColor, secondaryColor, open, onClose, onSuccess,
}: TimetableGeneratorProps) {
  const [step, setStep] = useState<Step>('classes');
  const [seed, setSeed] = useState(() => Date.now());

  const { data: classesData } = useGetClassesBySchoolQuery(schoolId, { skip: !schoolId || !open });
  const { data: subjectsData } = useGetSubjectsBySchoolQuery(schoolId, { skip: !schoolId || !open });
  const { data: gradesData } = useGetGradeLevelsBySchoolQuery(schoolId, { skip: !schoolId || !open });
  const { data: periodsData } = useListAllPeriodsQuery(schoolId, { skip: !schoolId || !open });

  const { data: teachersPrimary, isLoading: loadingPrimary, isError: errorPrimary } =
    useGetTeachersBySchoolQuery(schoolId, { skip: !schoolId || !open });
  const { data: teachersFallback, isLoading: loadingFallback } = useGetSchoolUsersByRoleQuery(
    { schoolId, role: 'teacher' },
    { skip: !schoolId || !open || !errorPrimary }
  );

  const classes = useMemo(() => extractClasses(classesData), [classesData]);
  const subjects = useMemo(() => extractSubjects(subjectsData), [subjectsData]);
  const grades = useMemo(() => extractGrades(gradesData), [gradesData]);
  const periods = useMemo(
    () => [...extractPeriods(periodsData)].sort((a, b) => a.periodNumber - b.periodNumber),
    [periodsData]
  );
  const teachingPeriods = useMemo(() => periods.filter((p) => !p.isBreak), [periods]);

  const teachers = useMemo<TeacherUser[]>(() => {
    const p = extractTeachers(teachersPrimary);
    return p.length > 0 ? p : extractTeachers(teachersFallback);
  }, [teachersPrimary, teachersFallback]);

  const loadingTeachers = loadingPrimary || (errorPrimary && loadingFallback);
  const teachersError = errorPrimary && !loadingFallback && teachers.length === 0;

  const [previewMutation, { isLoading: previewing }] = usePreviewSchoolTimetableMutation();
  const [generateMutation, { isLoading: saving }] = useGenerateSchoolTimetableMutation();

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<AllocMap>({});
  const [config, setConfig] = useState<RuleConfig>({
    maxPerTeacherPerDay: 6,
    maxPerTeacherPerWeek: 28,
    morningHeavySubjectIds: [],
    spreadSubjects: true,
    maxDoublesPerDay: 1,
    avoidAdjacentPairs: [],
    dailySubjectIds: [],
    maxPerSubjectPerDay: {},
    avoidTriples: false, // 🆕
  });
  const [generated, setGenerated] = useState<TimetableSlot[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [stats, setStats] = useState<GeneratorStats | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [layoutsTried, setLayoutsTried] = useState(0);

  useEffect(() => {
    if (open) {
      setStep('classes');
      setSeed(Date.now());
      setGenerated([]);
      setWarnings([]);
      setStats(null);
      setErrorMsg('');
    }
  }, [open]);

  const classesByGrade = useMemo(() => {
    const map: Record<string, ClassEntity[]> = {};
    classes.forEach((c) => { (map[c.gradeLevelId] ||= []).push(c); });
    return map;
  }, [classes]);

  const classWeekCapacity = teachingPeriods.length * DAYS.length;

  const totalSlotsNeeded = useMemo(
    () => selectedClassIds.reduce((s, cid) => s + sumLessons(allocations[cid]), 0),
    [allocations, selectedClassIds]
  );

  const teacherCapacity = teachers.length * (config.maxPerTeacherPerWeek ?? 28);

  const gradeName = (gid: string) => grades.find((g) => g.id === gid)?.name ?? '—';
  const className = (cid: string) => {
    const c = classes.find((x) => x.id === cid);
    return c ? `${gradeName(c.gradeLevelId)} ${c.stream}` : '—';
  };
  const subjectName = (sid: string) => subjects.find((s) => s.id === sid)?.name ?? '—';

  const toggleClass = (id: string) =>
    setSelectedClassIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const setManyClasses = (ids: string[], on: boolean) =>
    setSelectedClassIds((prev) => {
      const rest = prev.filter((x) => !ids.includes(x));
      return on ? [...rest, ...ids] : rest;
    });

  const updateAllocation = (classId: string, subjectId: string, patch: Partial<Alloc>) => {
    setAllocations((prev) => {
      const current = prev[classId]?.[subjectId] ?? { lessons: 0, isDouble: false, teacherIds: [] };
      const merged = { ...current, ...patch };
      if (merged.lessons < 2) merged.isDouble = false;
      if (merged.isDouble) merged.doubles = Math.min(Math.max(merged.doubles ?? 1, 1), Math.floor(merged.lessons / 2));
      return { ...prev, [classId]: { ...(prev[classId] ?? {}), [subjectId]: merged } };
    });
  };

  const copyToOthers = (fromId: string) => {
    setAllocations((prev) => {
      const src = prev[fromId] ?? {};
      const next = { ...prev };
      selectedClassIds.forEach((cid) => {
        if (cid === fromId) return;
        const copy: Record<string, Alloc> = {};
        Object.entries(src).forEach(([sid, a]) => { copy[sid] = { ...a, teacherIds: [...a.teacherIds] }; });
        next[cid] = copy;
      });
      return next;
    });
  };

  const clearClass = (cid: string) => setAllocations((prev) => ({ ...prev, [cid]: {} }));

  const buildAllocations = (): (GeneratorAllocation & { doublesPerWeek: number })[] => {
    const list: (GeneratorAllocation & { doublesPerWeek: number })[] = [];
    selectedClassIds.forEach((classId) => {
      Object.entries(allocations[classId] ?? {}).forEach(([subjectId, a]) => {
        if (a.lessons > 0) {
          list.push({
            classId, subjectId,
            lessonsPerWeek: a.lessons,
            requiresDouble: a.isDouble,
            doublesPerWeek: effectiveDoubles(a),
            preferredTeacherIds: a.teacherIds,
          });
        }
      });
    });
    return list;
  };

  /** Strip client-only fields before sending to the backend. */
  const configForBackend = (c: RuleConfig, withSeed?: number): GeneratorConfig => {
    const { avoidTriples, ...rest } = c;
    void avoidTriples;
    return withSeed !== undefined ? { ...rest, seed: withSeed } : rest;
  };

  const validateBeforePreview = (): string => {
    if (teachingPeriods.length === 0) return 'Set up the school day first (School Day tab), then come back.';
    if (selectedClassIds.length === 0) return 'Pick at least one class.';
    if (totalSlotsNeeded === 0) return 'Add lessons per week for at least one subject.';
    if (teachers.length === 0) return 'No teachers found. Add teachers first.';
    const over = selectedClassIds.find((cid) => sumLessons(allocations[cid]) > classWeekCapacity);
    if (over) return `${className(over)} has more lessons than fit in a week (${classWeekCapacity}).`;

    const conflicts = findRuleConflicts(allocations, config, selectedClassIds, className, subjectName);
    if (conflicts.length > 0) return `Your rules conflict: ${conflicts[0]}`;
    return '';
  };

  const runPreview = async (seedValue: number) => {
    setErrorMsg('');
    const problem = validateBeforePreview();
    if (problem) { setErrorMsg(problem); return; }

    type Attempt = { result: any; seed: number; score: number };
    const strict = (config.dailySubjectIds?.length ?? 0) > 0 || config.avoidTriples;
    const MAX_TRIES = strict ? 8 : 5;
    let best: Attempt | null = null;
    let tried = 0;
    let lastError: any = null;

    for (let i = 0; i < MAX_TRIES; i++) {
      const trySeed = seedValue + i * 7919;
      try {
        const result = await previewMutation({
          schoolId,
          classIds: selectedClassIds,
          allocations: buildAllocations(),
          config: configForBackend(config, trySeed),
          options: { dryRun: true },
        }).unwrap();
        tried++;
        const check = checkRules(result.slots ?? [], periods, allocations, config, selectedClassIds, subjectName, className);
        const missing = result.stats?.perClass?.reduce((a: number, c: any) => a + (c.missing || 0), 0) ?? 0;
        const score =
          check.issues.length * 2 +
          check.dailyViolations * 6 +
          check.limitViolations * 2 +
          (config.avoidTriples ? check.tripleViolations * 4 : 0) + // 🆕
          missing;
        if (!best || score < best.score) best = { result, seed: trySeed, score };
        if (score === 0) break;
      } catch (err: any) {
        lastError = err;
        break;
      }
    }

    const chosen = best as Attempt | null;
    if (!chosen) {
      setErrorMsg(lastError?.data?.message || 'Could not build a preview. Check your lessons and try again.');
      return;
    }
    setSeed(chosen.seed);
    setGenerated(chosen.result.slots ?? []);
    setWarnings(chosen.result.warnings ?? []);
    setStats(chosen.result.stats ?? null);
    setLayoutsTried(tried);
    setStep('preview');
  };

  const handleSave = async () => {
    setErrorMsg('');
    setStep('saving');
    try {
      const result = await generateMutation({
        schoolId,
        classIds: selectedClassIds,
        allocations: buildAllocations(),
        config: configForBackend(config, seed),
        options: { clearExisting: true, dryRun: false },
      }).unwrap();
      const inserted = result.count ?? (result.slots?.length ?? 0);
      onSuccess(
        `Saved ${inserted} lesson${inserted === 1 ? '' : 's'} for ${selectedClassIds.length} class${selectedClassIds.length === 1 ? '' : 'es'}` +
          (warnings.length > 0 ? ` · ${warnings.length} warning${warnings.length === 1 ? '' : 's'}` : '')
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Could not save. Please try again.');
      setStep('preview');
    }
  };

  const handleShuffle = () => {
    const next = Date.now();
    setSeed(next);
    runPreview(next);
  };

  const goNext = () => {
    setErrorMsg('');
    if (step === 'classes') {
      if (selectedClassIds.length === 0) { setErrorMsg('Pick at least one class to continue.'); return; }
      setStep('lessons');
    } else if (step === 'lessons') {
      runPreview(seed);
    }
  };

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const stepIndex = step === 'classes' ? 0 : step === 'lessons' ? 1 : 2;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl bg-base-100 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 pt-5 pb-4 border-b border-base-300 shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">Auto-build timetable</h2>
                <p className="text-xs opacity-60">Tell us what each class learns. We place the lessons and avoid clashes.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-base-200" aria-label="Close"><X className="w-4 h-4" /></button>
          </div>

          <ol className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const done = i < stepIndex || step === 'saving';
              const active = i === stepIndex && step !== 'saving';
              return (
                <React.Fragment key={s.key}>
                  <li className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold shrink-0 transition ${
                        done || active ? 'text-white' : 'bg-base-200 opacity-60'
                      }`}
                      style={done || active ? { backgroundColor: done ? '#16a34a' : primaryColor } : {}}
                    >
                      {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </span>
                    <div className="leading-tight min-w-0">
                      <p className={`text-sm font-bold ${active ? '' : 'opacity-60'}`} style={active ? { color: primaryColor } : {}}>{s.label}</p>
                      <p className="text-[11px] opacity-50 hidden sm:block truncate">{s.hint}</p>
                    </div>
                  </li>
                  {i < STEPS.length - 1 && (
                    <span className="flex-1 h-0.5 rounded-full mx-1" style={{ backgroundColor: i < stepIndex ? '#16a34a' : 'rgba(128,128,128,0.2)' }} />
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 'classes' && (
            <ClassesStep
              classesByGrade={classesByGrade}
              classCount={classes.length}
              selectedClassIds={selectedClassIds}
              gradeName={gradeName}
              onToggle={toggleClass}
              onSetMany={setManyClasses}
              teachingCount={teachingPeriods.length}
              classWeekCapacity={classWeekCapacity}
              teacherCount={teachers.length}
              loadingTeachers={loadingTeachers}
              teachersError={teachersError}
              primaryColor={primaryColor}
            />
          )}
          {step === 'lessons' && (
            <LessonsStep
              subjects={subjects}
              teachers={teachers}
              loadingTeachers={loadingTeachers}
              classWeekCapacity={classWeekCapacity}
              selectedClassIds={selectedClassIds}
              allocations={allocations}
              config={config}
              className={className}
              subjectName={subjectName}
              onUpdateAllocation={updateAllocation}
              onCopyToOthers={copyToOthers}
              onClearClass={clearClass}
              onUpdateConfig={setConfig}
              totalSlotsNeeded={totalSlotsNeeded}
              teacherCapacity={teacherCapacity}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          )}
          {step === 'preview' && (
            <PreviewStep
              selectedClassIds={selectedClassIds}
              generated={generated}
              warnings={warnings}
              stats={stats}
              periods={periods}
              className={className}
              subjectName={subjectName}
              allocations={allocations}
              config={config}
              layoutsTried={layoutsTried}
              teachers={teachers}
              primaryColor={primaryColor}
            />
          )}
          {step === 'saving' && (
            <div className="flex items-center justify-center py-28">
              <div className="text-center space-y-3">
                <Loader2 className="w-10 h-10 animate-spin mx-auto" style={{ color: primaryColor }} />
                <p className="text-base font-bold">Saving your timetable…</p>
                <p className="text-sm opacity-60">{selectedClassIds.length} classes · {generated.length} lessons</p>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mx-6 mb-3 p-3 bg-error/10 border border-error/25 text-error text-sm rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {step !== 'saving' && (
          <div className="border-t border-base-300 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
            <p className="text-xs opacity-60 hidden sm:block">
              {step === 'classes' && `${selectedClassIds.length} class${selectedClassIds.length === 1 ? '' : 'es'} selected`}
              {step === 'lessons' && `${totalSlotsNeeded} lessons to place across ${selectedClassIds.length} class${selectedClassIds.length === 1 ? '' : 'es'}`}
              {step === 'preview' && `${generated.length} lessons ready · ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`}
            </p>

            <div className="flex gap-2 ml-auto">
              {step === 'classes' && (
                <button onClick={onClose} className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-base-200 hover:bg-base-300 cursor-pointer">Cancel</button>
              )}
              {step === 'lessons' && (
                <button onClick={() => setStep('classes')} className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-base-200 hover:bg-base-300 flex items-center gap-1.5 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step === 'preview' && (
                <>
                  <button onClick={() => setStep('lessons')} className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-base-200 hover:bg-base-300 flex items-center gap-1.5 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" /> Edit lessons
                  </button>
                  <button onClick={handleShuffle} disabled={previewing} className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-base-200 hover:bg-base-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                    {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Try another layout
                  </button>
                </>
              )}

              {(step === 'classes' || step === 'lessons') && (
                <button
                  onClick={goNext}
                  disabled={previewing || (step === 'classes' && selectedClassIds.length === 0) || (step === 'lessons' && (totalSlotsNeeded === 0 || loadingTeachers))}
                  className="text-sm font-bold px-5 py-2.5 rounded-xl text-white shadow-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px -8px ${primaryColor}` }}
                >
                  {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {step === 'classes' ? 'Next: set lessons' : previewing ? 'Building…' : 'Build preview'}
                  {!previewing && <ChevronRight className="w-4 h-4" />}
                </button>
              )}

              {step === 'preview' && (
                <button
                  onClick={handleSave}
                  disabled={saving || generated.length === 0}
                  className="text-sm font-bold px-5 py-2.5 rounded-xl text-white shadow-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px -8px ${primaryColor}` }}
                >
                  <Save className="w-4 h-4" /> Save timetable
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 1 — CHOOSE CLASSES
   ════════════════════════════════════════════════════════════════ */
function ClassesStep({
  classesByGrade, classCount, selectedClassIds, gradeName, onToggle, onSetMany,
  teachingCount, classWeekCapacity, teacherCount, loadingTeachers, teachersError, primaryColor,
}: {
  classesByGrade: Record<string, ClassEntity[]>;
  classCount: number;
  selectedClassIds: string[];
  gradeName: (gid: string) => string;
  onToggle: (id: string) => void;
  onSetMany: (ids: string[], on: boolean) => void;
  teachingCount: number;
  classWeekCapacity: number;
  teacherCount: number;
  loadingTeachers: boolean;
  teachersError: boolean;
  primaryColor: string;
}) {
  const allIds = Object.values(classesByGrade).flat().map((c) => c.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedClassIds.includes(id));

  const checks = [
    { ok: teachingCount > 0, label: teachingCount > 0 ? `School day set · ${teachingCount} lessons a day` : 'School day not set up yet', fix: 'Open the School Day tab and add your periods.' },
    { ok: teacherCount > 0, label: loadingTeachers ? 'Loading teachers…' : teacherCount > 0 ? `${teacherCount} teachers found` : 'No teachers found', fix: teachersError ? 'We could not load teachers. Try again shortly.' : 'Add teachers to your school first.', pending: loadingTeachers },
    { ok: classCount > 0, label: classCount > 0 ? `${classCount} classes available` : 'No classes found', fix: 'Create classes in Academic Structure first.' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
      <div className="lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold">Which classes do you want to build for?</h3>
            <p className="text-sm opacity-60">Tap a class to select it. You can pick several at once.</p>
          </div>
          {classCount > 0 && (
            <button onClick={() => onSetMany(allIds, !allSelected)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-base-200 hover:bg-base-300 cursor-pointer">
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
          )}
        </div>

        {classCount === 0 ? (
          <div className="p-10 text-center text-sm opacity-60 border-2 border-dashed border-base-300 rounded-2xl">No classes found.</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(classesByGrade).map(([gradeId, list]) => {
              const ids = list.map((c) => c.id);
              const gradeAll = ids.every((id) => selectedClassIds.includes(id));
              return (
                <div key={gradeId} className="p-4 rounded-2xl border border-base-300 bg-base-200/30">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold">{gradeName(gradeId)}</p>
                    <button onClick={() => onSetMany(ids, !gradeAll)} className="text-xs font-semibold opacity-60 hover:opacity-100 cursor-pointer">
                      {gradeAll ? 'Clear grade' : 'Select grade'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {list.map((c) => {
                      const on = selectedClassIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => onToggle(c.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition flex items-center gap-2 cursor-pointer ${
                            on ? 'text-white border-transparent shadow-md' : 'bg-base-100 border-base-300 hover:border-primary/50'
                          }`}
                          style={on ? { backgroundColor: primaryColor } : {}}
                        >
                          {on && <Check className="w-3.5 h-3.5" />}
                          {gradeName(gradeId)} {c.stream}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <aside className="lg:col-span-4 space-y-4">
        <div className="p-5 rounded-2xl border border-base-300 bg-base-100 space-y-3">
          <h4 className="text-sm font-bold">Before you start</h4>
          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-2.5">
              {c.pending ? (
                <Loader2 className="w-4 h-4 mt-0.5 animate-spin opacity-60" />
              ) : c.ok ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-success shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 text-warning shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium">{c.label}</p>
                {!c.ok && !c.pending && <p className="text-xs opacity-60">{c.fix}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
          <div className="flex items-center gap-2"><Info className="w-4 h-4" style={{ color: primaryColor }} /><h4 className="text-sm font-bold">How it works</h4></div>
          <ol className="text-xs opacity-70 space-y-1.5 list-decimal list-inside">
            <li>Pick your classes.</li>
            <li>Say how many lessons each subject gets per week.</li>
            <li>Preview the result, then save.</li>
          </ol>
          {classWeekCapacity > 0 && (
            <p className="text-xs opacity-60 pt-1">Each class has room for <b>{classWeekCapacity}</b> lessons a week.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 2 — LESSONS PER WEEK
   ════════════════════════════════════════════════════════════════ */
function LessonsStep({
  subjects, teachers, loadingTeachers, classWeekCapacity, selectedClassIds, allocations, config,
  className, subjectName, onUpdateAllocation, onCopyToOthers, onClearClass, onUpdateConfig,
  totalSlotsNeeded, teacherCapacity, primaryColor, secondaryColor,
}: {
  subjects: Subject[];
  teachers: TeacherUser[];
  loadingTeachers: boolean;
  classWeekCapacity: number;
  selectedClassIds: string[];
  allocations: AllocMap;
  config: RuleConfig;
  className: (cid: string) => string;
  subjectName: (sid: string) => string;
  onUpdateAllocation: (classId: string, subjectId: string, patch: Partial<Alloc>) => void;
  onCopyToOthers: (fromId: string) => void;
  onClearClass: (cid: string) => void;
  onUpdateConfig: (c: RuleConfig) => void;
  totalSlotsNeeded: number;
  teacherCapacity: number;
  primaryColor: string;
  secondaryColor: string;
}) {
  const [activeClassId, setActiveClassId] = useState(selectedClassIds[0] ?? '');
  const [showRules, setShowRules] = useState(false);
  const [pairA, setPairA] = useState('');
  const [pairB, setPairB] = useState('');
  const pairs = config.avoidAdjacentPairs ?? [];
  const subjName = (id: string) => subjects.find((x) => x.id === id)?.name ?? '—';

  useEffect(() => {
    if (selectedClassIds.length > 0 && !selectedClassIds.includes(activeClassId)) setActiveClassId(selectedClassIds[0]);
  }, [selectedClassIds, activeClassId]);

  const morning = config.morningHeavySubjectIds ?? [];
  const daily = config.dailySubjectIds ?? [];
  const limits = config.maxPerSubjectPerDay ?? {};
  const activeTotal = sumLessons(allocations[activeClassId]);
  const totalSubjectsSet = subjects.filter((s) => (allocations[activeClassId]?.[s.id]?.lessons ?? 0) > 0).length;
  const pct = classWeekCapacity > 0 ? Math.min(100, (activeTotal / classWeekCapacity) * 100) : 0;
  const over = activeTotal > classWeekCapacity;
  const teachersTight = teacherCapacity > 0 && totalSlotsNeeded > teacherCapacity;

  const conflicts = findRuleConflicts(allocations, config, selectedClassIds, className, subjectName);

  const blockedCount = Object.values(limits).filter((v) => v === 0).length;
  const cappedCount = Object.values(limits).filter((v) => v > 0).length;
  const noDoubles = (config.maxDoublesPerDay ?? 1) === 0;

  const toggleDaily = (sid: string) =>
    onUpdateConfig({ ...config, dailySubjectIds: daily.includes(sid) ? daily.filter((x) => x !== sid) : [...daily, sid] });

  // null = "no limit" (blank input), 0 = "blocked", >0 = numeric cap
  const setLimit = (sid: string, v: number | null) => {
    const next = { ...limits };
    if (v === null) delete next[sid];
    else next[sid] = v;
    onUpdateConfig({ ...config, maxPerSubjectPerDay: next });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
      <aside className="lg:col-span-3 space-y-2">
        <p className="text-xs font-semibold opacity-60 px-1">Classes</p>
        {selectedClassIds.map((cid) => {
          const total = sumLessons(allocations[cid]);
          const nSubjects = countSubjects(allocations[cid]);
          const isOver = total > classWeekCapacity;
          const active = cid === activeClassId;
          return (
            <button
              key={cid}
              onClick={() => setActiveClassId(cid)}
              className={`w-full text-left p-3 rounded-xl border-2 transition cursor-pointer ${
                active ? 'bg-base-100 shadow-md' : 'border-transparent bg-base-200/50 hover:bg-base-200'
              }`}
              style={active ? { borderColor: primaryColor } : {}}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold truncate">{className(cid)}</span>
                {total > 0 && !isOver && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                {total === 0 && <Circle className="w-4 h-4 opacity-30 shrink-0" />}
                {isOver && <AlertTriangle className="w-4 h-4 text-error shrink-0" />}
              </div>
              <p className={`text-xs mt-0.5 ${isOver ? 'text-error' : 'opacity-60'}`}>
                {nSubjects} subject{nSubjects === 1 ? '' : 's'} · {total}/{classWeekCapacity} lessons
              </p>
            </button>
          );
        })}
      </aside>

      <section className="lg:col-span-9 space-y-4 min-w-0">
        <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold">{className(activeClassId)}</h3>
              <p className="text-xs opacity-60">Set how many lessons each subject gets in a week. Leave at 0 to skip.</p>
            </div>
            <div className="flex gap-2">
              {selectedClassIds.length > 1 && (
                <button
                  onClick={() => onCopyToOthers(activeClassId)}
                  disabled={activeTotal === 0}
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title="Use these lessons for every other selected class"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy to other classes
                </button>
              )}
              <button onClick={() => onClearClass(activeClassId)} className="text-xs font-semibold px-3 py-2 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 flex items-center gap-1.5 cursor-pointer">
                <Eraser className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>
          <div>
            <div className="h-2 rounded-full bg-base-300/60 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: over ? '#dc2626' : pct >= 100 ? '#16a34a' : primaryColor }} />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs">
              <span className={over ? 'text-error font-semibold' : 'opacity-60'}>
                {over
                  ? `${activeTotal - classWeekCapacity} lessons too many for one week.`
                  : `${classWeekCapacity - activeTotal} free slots left in the week.`}
              </span>
              <span className="opacity-60 font-mono">
                {totalSubjectsSet} of {subjects.length} subjects · {activeTotal}/{classWeekCapacity}
              </span>
            </div>
          </div>
        </div>

        <div className="border border-base-300 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 bg-base-200/60 text-xs font-semibold opacity-70">
            <div className="col-span-4">Subject</div>
            <div className="col-span-3 text-center">Lessons per week</div>
            <div className="col-span-2 text-center">Back-to-back</div>
            <div className="col-span-3">Teacher</div>
          </div>
          <div className="divide-y divide-base-300">
            {subjects.map((s) => {
              const a = allocations[activeClassId]?.[s.id] ?? { lessons: 0, isDouble: false, teacherIds: [] };
              const tone = subjectColor(s.id);
              const active = a.lessons > 0;
              const isDaily = daily.includes(s.id);
              const dailyMin = minLessonsForDaily(a);
              const dailyShort = isDaily && active && a.lessons < dailyMin;
              const blocked = limits[s.id] === 0;
              return (
                <div key={s.id} className={`grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-3 items-center transition ${active ? 'bg-primary/5' : ''}`}>
                  <div className="md:col-span-4 flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${tone.bg} border ${tone.border}`} />
                    <span className="text-sm font-semibold truncate">{s.name}</span>
                    {isDaily && !blocked && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0"
                        title="Taught every day"
                      >
                        DAILY
                      </span>
                    )}
                    {blocked && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-error/10 text-error shrink-0 inline-flex items-center gap-0.5"
                        title="Not taught on any day (daily limit is 0)"
                      >
                        <Ban className="w-2.5 h-2.5" /> BLOCKED
                      </span>
                    )}
                    {dailyShort && (
                      <span className="text-[10px] text-warning font-semibold shrink-0" title={`Needs ${dailyMin} lessons to be daily`}>
                        needs {dailyMin}+
                      </span>
                    )}
                  </div>

                  <div className="md:col-span-3 flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onUpdateAllocation(activeClassId, s.id, { lessons: Math.max(0, a.lessons - 1) })}
                      disabled={a.lessons === 0}
                      className="w-8 h-8 rounded-lg bg-base-200 hover:bg-base-300 grid place-items-center disabled:opacity-40 cursor-pointer"
                      aria-label={`Fewer ${s.name} lessons`}
                    ><Minus className="w-3.5 h-3.5" /></button>
                    <input
                      type="number"
                      min={0}
                      max={classWeekCapacity}
                      value={a.lessons}
                      onChange={(e) => onUpdateAllocation(activeClassId, s.id, { lessons: Math.max(0, Number(e.target.value) || 0) })}
                      className={`${INPUT} w-14 text-center font-mono !px-1`}
                    />
                    <button
                      onClick={() => onUpdateAllocation(activeClassId, s.id, { lessons: a.lessons + 1 })}
                      className="w-8 h-8 rounded-lg grid place-items-center text-white cursor-pointer"
                      style={{ backgroundColor: primaryColor }}
                      aria-label={`More ${s.name} lessons`}
                    ><Plus className="w-3.5 h-3.5" /></button>
                  </div>

                  <div className="md:col-span-2 flex items-center md:justify-center gap-2">
                    <input
                      type="checkbox"
                      checked={a.isDouble}
                      disabled={a.lessons < 2}
                      onChange={(e) => onUpdateAllocation(activeClassId, s.id, { isDouble: e.target.checked })}
                      className="checkbox checkbox-primary checkbox-sm"
                      id={`dbl-${s.id}`}
                    />
                    <label htmlFor={`dbl-${s.id}`} className={`text-xs md:hidden ${a.lessons < 2 ? 'opacity-40' : ''}`}>Back-to-back lessons</label>
                    {a.isDouble && a.lessons >= 2 && (
                      <div className="flex items-center gap-0.5" title="How many back-to-back pairs per week">
                        <button
                          type="button"
                          onClick={() => onUpdateAllocation(activeClassId, s.id, { doubles: Math.max(1, (a.doubles ?? 1) - 1) })}
                          className="w-5 h-5 rounded bg-base-200 hover:bg-base-300 grid place-items-center cursor-pointer"
                          aria-label="Fewer back-to-back pairs"
                        ><Minus className="w-3 h-3" /></button>
                        <span className="text-xs font-mono w-6 text-center">×{effectiveDoubles(a)}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateAllocation(activeClassId, s.id, { doubles: (a.doubles ?? 1) + 1 })}
                          disabled={effectiveDoubles(a) >= Math.floor(a.lessons / 2)}
                          className="w-5 h-5 rounded bg-base-200 hover:bg-base-300 grid place-items-center disabled:opacity-40 cursor-pointer"
                          aria-label="More back-to-back pairs"
                        ><Plus className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <TeacherPicker
                      teachers={teachers}
                      loading={loadingTeachers}
                      disabled={!active}
                      value={a.teacherIds}
                      onChange={(ids) => onUpdateAllocation(activeClassId, s.id, { teacherIds: ids })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs opacity-60 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          “Back-to-back” puts two lessons of the same subject together, handy for practicals. Use ×1, ×2… to choose how many pairs a week; the rest of that subject's lessons are kept apart. Needs at least 2 lessons a week.
        </p>

        {teachersTight && (
          <div className="p-3 rounded-xl bg-warning/10 border border-warning/25 text-warning text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            You are asking for {totalSlotsNeeded} lessons, but your {teachers.length} teachers can cover about {teacherCapacity} a week. Some lessons may be left without a teacher.
          </div>
        )}

        <div className="p-3 rounded-xl bg-base-200/40 border border-base-300 text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold opacity-70">Active rules:</span>
          <span className="opacity-70">{pairs.length} “never next to”</span>
          <span className="opacity-70">{daily.length} daily subject{daily.length === 1 ? '' : 's'}</span>
          <span className="opacity-70">{cappedCount} per-day limit{cappedCount === 1 ? '' : 's'}</span>
          <span className="opacity-70">{blockedCount} blocked</span>
          <span className="opacity-70">{morning.length} morning-only</span>
          <span className={`opacity-70 ${noDoubles ? 'font-semibold text-primary' : ''}`}>
            {noDoubles ? 'No doubles' : `Max ${config.maxDoublesPerDay ?? 1} double${(config.maxDoublesPerDay ?? 1) === 1 ? '' : 's'}/day`}
          </span>
          {config.avoidTriples && <span className="opacity-70 font-semibold text-primary">No 3-in-a-row</span>}
        </div>

        {conflicts.length > 0 && (
          <div className="p-3 rounded-xl bg-error/10 border border-error/25 text-error text-sm space-y-1">
            <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Your rules conflict</p>
            <ul className="text-xs space-y-0.5 max-h-32 overflow-y-auto">
              {conflicts.slice(0, 6).map((c, i) => <li key={i}>• {c}</li>)}
              {conflicts.length > 6 && <li className="opacity-70 italic">…and {conflicts.length - 6} more</li>}
            </ul>
          </div>
        )}

        <div className="border border-base-300 rounded-2xl">
          <button onClick={() => setShowRules(!showRules)} className="w-full flex items-center justify-between px-4 py-3 cursor-pointer">
            <span className="flex items-center gap-2 text-sm font-bold"><Settings className="w-4 h-4" style={{ color: secondaryColor }} /> Teacher limits, morning lessons & subject rules <span className="text-xs font-normal opacity-60">(optional)</span></span>
            <ChevronDown className={`w-4 h-4 opacity-60 transition ${showRules ? 'rotate-180' : ''}`} />
          </button>
          {showRules && (
            <div className="px-4 pb-4 space-y-4 border-t border-base-300 pt-4">
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold opacity-70 mb-1.5">Most lessons a teacher can have in a day</label>
                  <input type="number" min={1} max={12} value={config.maxPerTeacherPerDay ?? 6}
                    onChange={(e) => onUpdateConfig({ ...config, maxPerTeacherPerDay: Number(e.target.value) || 1 })}
                    className={`${INPUT} w-full font-mono`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold opacity-70 mb-1.5">Most lessons a teacher can have in a week</label>
                  <input type="number" min={1} max={60} value={config.maxPerTeacherPerWeek ?? 28}
                    onChange={(e) => onUpdateConfig({ ...config, maxPerTeacherPerWeek: Number(e.target.value) || 1 })}
                    className={`${INPUT} w-full font-mono`} />
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-base-200/40 border border-base-300">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.spreadSubjects !== false}
                    onChange={(e) => onUpdateConfig({ ...config, spreadSubjects: e.target.checked })}
                    className="checkbox checkbox-primary checkbox-sm mt-0.5"
                  />
                  <span>
                    <span className="text-sm font-semibold block">Spread subjects out</span>
                    <span className="text-xs opacity-60">The same subject never sits back-to-back unless you chose a double for it.</span>
                  </span>
                </label>

                {/* 🆕 Avoid triples */}
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!config.avoidTriples}
                    onChange={(e) => onUpdateConfig({ ...config, avoidTriples: e.target.checked })}
                    className="checkbox checkbox-primary checkbox-sm mt-0.5"
                  />
                  <span>
                    <span className="text-sm font-semibold block inline-flex items-center gap-1.5">
                      <Rows3 className="w-3.5 h-3.5" /> Never 3 of the same subject in a row
                    </span>
                    <span className="text-xs opacity-60">Prevents triple lessons (e.g. Maths, Maths, Maths) — even when doubles are allowed.</span>
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold opacity-70 flex-1">
                    Most double lessons one class can have in a day
                    <span className="block font-normal opacity-60">Set to 0 to forbid all doubles.</span>
                  </label>
                  <input
                    type="number" min={0} max={4}
                    value={config.maxDoublesPerDay ?? 1}
                    onChange={(e) => onUpdateConfig({ ...config, maxDoublesPerDay: Math.max(0, Number(e.target.value) || 0) })}
                    className={`${INPUT} w-20 font-mono ${noDoubles ? '!border-primary !text-primary font-bold' : ''}`}
                  />
                </div>
                {noDoubles && (
                  <p className="text-[11px] text-primary flex items-center gap-1">
                    <Ban className="w-3 h-3" /> Doubles are disabled. Any “back-to-back” ticks will be ignored.
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold opacity-70 mb-1.5"><Unlink className="w-3.5 h-3.5" /> Subjects that should not follow each other</label>
                <div className="flex flex-wrap items-center gap-2">
                  <select value={pairA} onChange={(e) => setPairA(e.target.value)} className={`${INPUT} text-xs cursor-pointer`}>
                    <option value="">Subject…</option>
                    {subjects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <span className="text-xs opacity-60">never next to</span>
                  <select value={pairB} onChange={(e) => setPairB(e.target.value)} className={`${INPUT} text-xs cursor-pointer`}>
                    <option value="">Subject…</option>
                    {subjects.filter((x) => x.id !== pairA).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <button
                    type="button"
                    disabled={!pairA || !pairB || pairA === pairB}
                    onClick={() => {
                      const exists = pairs.some(([x, y]) => (x === pairA && y === pairB) || (x === pairB && y === pairA));
                      if (!exists) onUpdateConfig({ ...config, avoidAdjacentPairs: [...pairs, [pairA, pairB]] });
                      setPairA(''); setPairB('');
                    }}
                    className="text-xs font-semibold px-3 py-2 rounded-lg text-white disabled:opacity-50 cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Add rule
                  </button>
                </div>
                {pairs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {pairs.map(([x, y], i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-base-200 border border-base-300 text-xs font-semibold">
                        {subjName(x)} ≠ {subjName(y)}
                        <button
                          type="button"
                          onClick={() => onUpdateConfig({ ...config, avoidAdjacentPairs: pairs.filter((_, j) => j !== i) })}
                          className="w-5 h-5 rounded-full hover:bg-base-300 grid place-items-center cursor-pointer"
                          aria-label="Remove rule"
                        ><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold opacity-70 mb-1.5"><Sun className="w-3.5 h-3.5" /> Keep these subjects in the morning</label>
                <p className="text-[11px] opacity-60 mb-2">Their lessons will be placed in the first half of the school day.</p>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => {
                    const on = morning.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onUpdateConfig({ ...config, morningHeavySubjectIds: on ? morning.filter((x) => x !== s.id) : [...morning, s.id] })}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition cursor-pointer ${on ? 'text-white border-transparent' : 'bg-base-100 border-base-300 hover:bg-base-200'}`}
                        style={on ? { backgroundColor: primaryColor } : {}}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold opacity-70 mb-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Taught every school day
                </label>
                <p className="text-[11px] opacity-60 mb-2">
                  Each of these subjects will appear on Mon–Fri for every selected class. <b>Needs at least 5 lessons per week</b> per class (6+ if it also has a back-to-back pair).
                </p>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => {
                    const on = daily.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleDaily(s.id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition cursor-pointer ${on ? 'text-white border-transparent' : 'bg-base-100 border-base-300 hover:bg-base-200'}`}
                        style={on ? { backgroundColor: primaryColor } : {}}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Per-subject daily limits — 0 = blocked, blank = unlimited */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold opacity-70 mb-1.5">
                  <Gauge className="w-3.5 h-3.5" /> Maximum lessons per subject per day
                </label>
                <p className="text-[11px] opacity-60 mb-2">
                  <b>Blank = no limit.</b> <b>0 = not taught (blocked)</b> on any day. For daily subjects, the cap must be high enough to fit (e.g. 6 lessons needs a cap of at least 2).
                </p>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => {
                    const cap = limits[s.id];
                    const isZero = cap === 0;
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-base-100 border ${isZero ? 'border-error/60' : 'border-base-300'}`}
                        title={isZero ? 'Blocked — this subject will not be taught' : cap === undefined ? 'No limit' : `Max ${cap} lesson${cap === 1 ? '' : 's'} per day`}
                      >
                        <span className="text-xs font-semibold">{s.name}</span>
                        <input
                          type="number"
                          min={0}
                          max={6}
                          value={cap === undefined ? '' : cap}
                          placeholder="∞"
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') setLimit(s.id, null);
                            else setLimit(s.id, Math.max(0, Number(raw) || 0));
                          }}
                          className={`w-9 text-xs text-center font-mono bg-transparent outline-none ${isZero ? 'text-error font-bold' : ''}`}
                        />
                        {isZero && <Ban className="w-3 h-3 text-error shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function TeacherPicker({
  teachers, loading, disabled, value, onChange,
}: { teachers: TeacherUser[]; loading: boolean; disabled: boolean; value: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? teachers.filter((t) => teacherLabel(t).toLowerCase().includes(s)) : teachers;
  }, [teachers, q]);

  const summary =
    value.length === 0 ? 'Any teacher' :
    value.length === 1 ? teacherLabel(teachers.find((t) => t.id === value[0]) ?? { id: '' }) :
    `${value.length} teachers`;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`${INPUT} w-full flex items-center justify-between gap-2 text-left text-xs disabled:opacity-40 cursor-pointer`}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-64 right-0 bg-base-100 border border-base-300 rounded-xl shadow-2xl p-2 space-y-1">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search teachers…"
              className={`${INPUT} w-full text-xs`}
            />
            <div className="max-h-48 overflow-y-auto">
              <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-base-200 cursor-pointer text-xs font-semibold">
                <input type="checkbox" checked={value.length === 0} onChange={() => onChange([])} className="checkbox checkbox-primary checkbox-xs" />
                Any teacher (let us choose)
              </label>
              {loading ? (
                <p className="text-xs opacity-60 px-2 py-2">Loading teachers…</p>
              ) : list.length === 0 ? (
                <p className="text-xs text-error px-2 py-2">No teachers found</p>
              ) : (
                list.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-base-200 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={value.includes(t.id)}
                      onChange={(e) => onChange(e.target.checked ? [...value, t.id] : value.filter((x) => x !== t.id))}
                      className="checkbox checkbox-primary checkbox-xs"
                    />
                    <span className="truncate">{teacherLabel(t)}</span>
                  </label>
                ))
              )}
            </div>
            <button type="button" onClick={() => setOpen(false)} className="w-full text-xs font-semibold py-1.5 rounded-lg bg-base-200 hover:bg-base-300 cursor-pointer">Done</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 3 — REVIEW
   ════════════════════════════════════════════════════════════════ */
function PreviewStep({
  selectedClassIds, generated, warnings, stats, periods, className, subjectName, teachers, primaryColor,
  allocations, config, layoutsTried,
}: {
  selectedClassIds: string[];
  generated: TimetableSlot[];
  warnings: string[];
  stats: GeneratorStats | null;
  periods: Period[];
  className: (cid: string) => string;
  subjectName: (sid: string) => string;
  teachers: TeacherUser[];
  primaryColor: string;
  allocations: AllocMap;
  config: RuleConfig;
  layoutsTried: number;
}) {
  const [activeClassId, setActiveClassId] = useState(selectedClassIds[0] ?? '');

  const teacherName = (tid?: string | null) => {
    if (!tid) return 'No teacher';
    const t = teachers.find((x) => x.id === tid);
    return t ? teacherLabel(t) : '?';
  };

  const slotsByClass = useMemo(() => {
    const map = new Map<string, Map<string, TimetableSlot>>();
    selectedClassIds.forEach((cid) => map.set(cid, new Map()));
    generated.forEach((s) => map.get(s.classId)?.set(`${s.dayOfWeek}::${s.periodId}`, s));
    return map;
  }, [generated, selectedClassIds]);

  const classCount = (cid: string) => slotsByClass.get(cid)?.size ?? 0;
  const teachingCount = periods.filter((p) => !p.isBreak).length;
  const coveragePct =
    stats?.coverage?.percentage ??
    Math.round((generated.length / Math.max(1, selectedClassIds.length * teachingCount * DAYS.length)) * 1000) / 10;
  const missingTotal = stats?.perClass?.reduce((s, c) => s + (c.missing || 0), 0) ?? 0;
  const noTeacher = generated.filter((s) => !s.teacherId).length;
  const rules = checkRules(generated, periods, allocations, config, selectedClassIds, subjectName, className);
  const allGood = missingTotal === 0 && warnings.length === 0 && rules.issues.length === 0;
  const rulePairs = config.avoidAdjacentPairs ?? [];
  const dailySubjects = config.dailySubjectIds ?? [];
  const subjectLimits = config.maxPerSubjectPerDay ?? {};
  const limitEntries = Object.entries(subjectLimits);
  const hasLimits = limitEntries.length > 0;
  const blockedEntries = limitEntries.filter(([, v]) => v === 0);
  const cappedEntries = limitEntries.filter(([, v]) => v > 0);
  const noDoubles = (config.maxDoublesPerDay ?? 1) === 0;

  return (
    <div className="p-6 space-y-5">
      <div className={`p-5 rounded-2xl border-2 flex items-start gap-4 ${
        allGood ? 'bg-success/5 border-success/30' : 'bg-warning/5 border-warning/30'
      }`}>
        {allGood ? (
          <CheckCircle2 className="w-7 h-7 text-success shrink-0" />
        ) : (
          <AlertTriangle className="w-7 h-7 text-warning shrink-0" />
        )}
        <div>
          <p className="text-base font-extrabold">
            {allGood
              ? 'Everything fit. This timetable is ready to save.'
              : missingTotal > 0
                ? `Almost there: ${missingTotal} lesson${missingTotal === 1 ? '' : 's'} could not be placed.`
                : `Almost there: ${rules.issues.length} rule${rules.issues.length === 1 ? '' : 's'} not fully met.`}
          </p>
          <p className="text-sm opacity-70 mt-0.5">
            {generated.length} lessons across {selectedClassIds.length} class{selectedClassIds.length === 1 ? '' : 'es'}
            {noTeacher > 0 ? ` · ${noTeacher} without a teacher` : ''}. Saving replaces the current timetable for these classes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Lessons placed" value={generated.length} />
        <Tile label="Classes" value={selectedClassIds.length} />
        <Tile label="Could not place" value={missingTotal} bad={missingTotal > 0} />
        <Tile label="Week filled" value={`${coveragePct}%`} />
      </div>

      <div className={`p-4 rounded-2xl border ${rules.issues.length === 0 ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4" style={{ color: primaryColor }} />
          <span className="text-sm font-bold">Your rules</span>
          {layoutsTried > 1 && <span className="ml-auto text-xs opacity-60">Best of {layoutsTried} layouts</span>}
        </div>
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-start gap-2">
            {rules.pairViolations === 0 ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-success shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 text-warning shrink-0" />}
            <span>
              {rulePairs.length === 0
                ? 'No “never next to” rules set.'
                : rules.pairViolations === 0
                  ? `All ${rulePairs.length} “never next to” rule${rulePairs.length === 1 ? '' : 's'} respected.`
                  : `${rules.pairViolations} place${rules.pairViolations === 1 ? '' : 's'} where subjects follow each other.`}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-success shrink-0" />
            <span>
              {noDoubles
                ? `No doubles allowed — ${rules.doublesPlaced} accidental double${rules.doublesPlaced === 1 ? '' : 's'} placed.`
                : `${rules.doublesPlaced} double lesson${rules.doublesPlaced === 1 ? '' : 's'} placed` +
                  (rules.doublesRequested > 0 ? ` (you asked for ${rules.doublesRequested})` : '') +
                  `, at most ${config.maxDoublesPerDay ?? 1} per class per day.`}
            </span>
          </li>
          {config.avoidTriples && (
            <li className="flex items-start gap-2">
              {rules.tripleViolations === 0 ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-success shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 text-warning shrink-0" />}
              <span>
                {rules.tripleViolations === 0
                  ? 'No subject appears 3+ times in a row.'
                  : `${rules.tripleViolations} sequence${rules.tripleViolations === 1 ? '' : 's'} where the same subject appears 3+ times in a row.`}
              </span>
            </li>
          )}
          {!config.avoidTriples && rules.tripleViolations > 0 && (
            <li className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-warning shrink-0" />
              <span>
                {rules.tripleViolations} sequence{rules.tripleViolations === 1 ? '' : 's'} of 3+ in a row (allowed — enable “No 3-in-a-row” to forbid).
              </span>
            </li>
          )}
          {dailySubjects.length > 0 && (
            <li className="flex items-start gap-2">
              {rules.dailyViolations === 0 ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-success shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 text-warning shrink-0" />}
              <span>
                {rules.dailyViolations === 0
                  ? `All ${dailySubjects.length} daily subject${dailySubjects.length === 1 ? '' : 's'} appear on every school day.`
                  : `${rules.dailyViolations} day${rules.dailyViolations === 1 ? '' : 's'} missing a daily subject.`}
              </span>
            </li>
          )}
          {hasLimits && (
            <li className="flex items-start gap-2">
              {rules.limitViolations === 0 ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-success shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 text-warning shrink-0" />}
              <span>
                {rules.limitViolations === 0
                  ? `All ${limitEntries.length} subject daily limit${limitEntries.length === 1 ? '' : 's'} respected${blockedEntries.length > 0 ? ` (${blockedEntries.length} blocked)` : ''}.`
                  : `${rules.limitViolations} slot${rules.limitViolations === 1 ? '' : 's'} exceed${rules.limitViolations === 1 ? 's' : ''} a subject's daily limit${blockedEntries.length > 0 ? ` (${blockedEntries.length} blocked subject${blockedEntries.length === 1 ? '' : 's'})` : ''}.`}
              </span>
            </li>
          )}
          {cappedEntries.length > 0 && (
            <li className="text-xs opacity-60 pl-6">
              Capped: {cappedEntries.map(([sid, v]) => `${subjectName(sid)} ≤ ${v}/day`).join(' · ')}
            </li>
          )}
          {blockedEntries.length > 0 && (
            <li className="text-xs text-error pl-6 flex items-center gap-1">
              <Ban className="w-3 h-3" /> Blocked: {blockedEntries.map(([sid]) => subjectName(sid)).join(', ')}
            </li>
          )}
        </ul>

        {rules.issues.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-base-100 border border-warning/40">
            <p className="text-xs font-bold text-warning mb-2">
              What needs a look ({rules.issues.length})
            </p>
            <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {rules.issues.slice(0, 30).map((it, i) => (
                <li key={i} className="text-xs text-warning flex gap-1.5">
                  <span className="shrink-0">•</span>
                  <span className="break-words">{it}</span>
                </li>
              ))}
              {rules.issues.length > 30 && (
                <li className="text-xs text-warning opacity-70 italic">…and {rules.issues.length - 30} more</li>
              )}
            </ul>
            <p className="text-xs opacity-60 mt-2">Tap “Try another layout” to shuffle, or go back and adjust your lessons / rules.</p>
          </div>
        )}
      </div>

      {warnings.length > 0 && (
        <details className="p-4 bg-warning/10 border border-warning/25 rounded-xl">
          <summary className="cursor-pointer text-sm font-bold text-warning select-none">
            {warnings.length} thing{warnings.length === 1 ? '' : 's'} to look at
          </summary>
          <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {warnings.slice(0, 20).map((w, i) => <li key={i} className="text-xs text-warning">• {w}</li>)}
            {warnings.length > 20 && <li className="text-xs text-warning opacity-70 italic">…and {warnings.length - 20} more</li>}
          </ul>
        </details>
      )}

      {stats && ((stats.perClass?.length ?? 0) > 0 || (stats.perTeacher?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.perClass && stats.perClass.length > 0 && (
            <div className="p-4 border border-base-300 rounded-2xl">
              <div className="flex items-center gap-2 mb-3"><GraduationCap className="w-4 h-4" style={{ color: primaryColor }} /><span className="text-sm font-bold">Lessons placed per class</span></div>
              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {stats.perClass.map((c) => {
                  const p = c.requested > 0 ? (c.placed / c.requested) * 100 : 100;
                  return (
                    <div key={c.classId}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold truncate">{c.className}</span>
                        <span className={`font-mono ${c.missing > 0 ? 'text-warning font-bold' : 'opacity-60'}`}>{c.placed}/{c.requested}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-base-300/60 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: c.missing > 0 ? '#f59e0b' : '#16a34a' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {stats.perTeacher && stats.perTeacher.length > 0 && (
            <div className="p-4 border border-base-300 rounded-2xl">
              <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4" style={{ color: primaryColor }} /><span className="text-sm font-bold">Teacher workload</span></div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {stats.perTeacher.map((t) => (
                  <div key={t.teacherId} className="flex items-center justify-between text-xs">
                    <span className="font-semibold truncate">{t.teacherName}</span>
                    <span className="font-mono opacity-60">{t.totalLessons} lessons</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {selectedClassIds.map((cid) => (
          <button
            key={cid}
            onClick={() => setActiveClassId(cid)}
            className={`text-sm font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer ${
              activeClassId === cid ? 'text-white shadow-md' : 'bg-base-200/70 hover:bg-base-200'
            }`}
            style={activeClassId === cid ? { backgroundColor: primaryColor } : {}}
          >
            {className(cid)} <span className="opacity-70 font-mono text-xs">· {classCount(cid)}</span>
          </button>
        ))}
      </div>

      {activeClassId && (
        <div className="border border-base-300 rounded-2xl p-3 overflow-x-auto">
          <table className="w-full text-xs border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-20 text-left px-1 py-1 text-xs font-semibold opacity-60">Time</th>
                {DAYS.map((d) => <th key={d} className="text-xs font-semibold opacity-70 px-1 py-1">{d.slice(0, 3)}</th>)}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.id}>
                  <td className={`px-2 py-1 rounded-lg text-[11px] font-mono ${period.isBreak ? 'bg-warning/10 text-warning' : 'bg-base-200/60'}`}>
                    <div className="font-bold">{hhmm(period.startTime)}</div>
                    <div className="opacity-60">{hhmm(period.endTime)}</div>
                  </td>
                  {DAYS.map((day) => {
                    if (period.isBreak) {
                      return (
                        <td key={day} className="p-0.5">
                          <div className="h-11 rounded-lg bg-warning/10 border border-warning/20 grid place-items-center">
                            <span className="text-[10px] text-warning/70 font-semibold truncate px-1 max-w-[100px]">{period.name}</span>
                          </div>
                        </td>
                      );
                    }
                    const slot = slotsByClass.get(activeClassId)?.get(`${day}::${period.id}`);
                    const tone = subjectColor(slot?.subjectId);
                    return (
                      <td key={day} className="p-0.5">
                        <div className={`h-11 min-w-[90px] rounded-lg px-1.5 py-1 border ${slot ? `${tone.bg} ${tone.border}` : 'bg-base-100 border-dashed border-base-300'}`}>
                          {slot ? (
                            <>
                              <p className={`text-[11px] font-bold truncate ${tone.text}`}>{slot.subject?.name ?? subjectName(slot.subjectId ?? '')}</p>
                              <p className="text-[10px] opacity-60 truncate">{slot.teacher?.name ?? teacherName(slot.teacherId)}</p>
                            </>
                          ) : (
                            <div className="h-full grid place-items-center"><span className="text-[10px] opacity-30">free</span></div>
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

function Tile({ label, value, bad }: { label: string; value: string | number; bad?: boolean }) {
  return (
    <div className="p-4 bg-base-100 border border-base-300 rounded-2xl">
      <p className="text-xs font-semibold opacity-60">{label}</p>
      <p className={`text-2xl font-extrabold mt-0.5 ${bad ? 'text-warning' : ''}`}>{value}</p>
    </div>
  );
}