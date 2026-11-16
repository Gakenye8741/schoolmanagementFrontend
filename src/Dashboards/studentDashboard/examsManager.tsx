import React, { useMemo, useState } from "react";
import {
  GraduationCap, Award, TrendingUp, CalendarRange, School, User, Hash,
  AlertCircle, Loader2, ChevronDown, Trophy, Target, BarChart3,
  ClipboardList, CheckCircle2, XCircle, ListFilter, Sparkles, LineChart,
  CalendarDays, Medal, Star, Info, BookOpen, Percent, TrendingDown,
} from "lucide-react";
import { useGetMyProfileQuery } from "../../features/Apis/Auth.Api";
import {
  useGetStudentByUserIdQuery,
  useGetStudentWithRelationsQuery,
  useGetCurrentEnrollmentQuery,
} from "../../features/Apis/students.Api";
import {
  useGetStudentTranscriptQuery,
  useGetExamsBySchoolQuery,
} from "../../features/Apis/Exams.Api";
import type {
  ExamMark,
  Exam,
  TranscriptEntry,
} from "../../features/Apis/Exams.Api";
import { useGetGradeLevelByIdQuery } from "../../features/Apis/academicStructure.Api";
import { useGetCurrentTermBySchoolIdQuery } from "../../features/Apis/Term.Api";

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const CARD =
  "bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 sm:p-8 rounded-3xl shadow-xl";

const errMsg = (err: any, fallback: string) =>
  err?.status === 401
    ? "Your session has expired. Please sign in again."
    : err?.data?.message || err?.message || fallback;

function flattenProfile(data: any): Record<string, any> {
  const root = data?.user ?? data?.profile ?? data?.data ?? data ?? {};
  const nested = root?.student ?? root?.studentProfile ?? {};
  return { ...nested, ...root };
}

const unwrap = <T,>(v: any): T | null =>
  (v?.student ?? v?.enrollment ?? v?.data ?? v ?? null) as T | null;

const pct = (marks?: string | number | null, outOf?: string | number | null) => {
  const m = Number(marks ?? 0);
  const o = Number(outOf ?? 100);
  if (!o) return 0;
  return Math.round((m / o) * 1000) / 10;
};

const fmtDate = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const ordinal = (n?: number | null) => {
  if (n == null) return "";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/** Maps grade points → colour tokens. Higher points = better. */
function gradeStyle(points?: number | null, grade?: string | null) {
  const p = points ?? 0;
  if (p >= 10 || /^A/.test(grade ?? ""))
    return {
      chip: "bg-success/15 text-success border-success/30",
      bar: "bg-success",
      ring: "ring-success/20",
    };
  if (p >= 7 || /^B/.test(grade ?? ""))
    return {
      chip: "bg-info/15 text-info border-info/30",
      bar: "bg-info",
      ring: "ring-info/20",
    };
  if (p >= 4 || /^C/.test(grade ?? ""))
    return {
      chip: "bg-warning/15 text-warning border-warning/30",
      bar: "bg-warning",
      ring: "ring-warning/20",
    };
  return {
    chip: "bg-error/15 text-error border-error/30",
    bar: "bg-error",
    ring: "ring-error/20",
  };
}

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function GradeChip({
  grade,
  points,
  size = "sm",
}: {
  grade?: string | null;
  points?: number | null;
  size?: "sm" | "lg";
}) {
  if (!grade && points == null) return null;
  const s = gradeStyle(points, grade);
  const cls =
    size === "lg"
      ? "px-3 py-1 text-sm"
      : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 font-black uppercase rounded-full border ${s.chip} ${cls}`}
    >
      {size === "lg" && <Award className="w-3.5 h-3.5" />}
      {grade ?? `P${points ?? 0}`}
    </span>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "text-primary",
  bg = "bg-primary/10",
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: string;
  bg?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-base-100/70 border border-base-300">
      <div className={`p-2.5 rounded-xl ${bg} ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-black opacity-55">
          {label}
        </p>
        <p className="text-base font-black leading-tight truncate">{value}</p>
        {sub && <p className="text-[10px] opacity-50 font-mono">{sub}</p>}
      </div>
    </div>
  );
}

function SubjectMarkRow({
  mark,
  maxScore,
}: {
  mark: ExamMark;
  maxScore: number;
}) {
  const percent = mark.isAbsent ? null : pct(mark.marks, mark.outOf);
  const style = gradeStyle(mark.points, mark.grade);
  return (
    <div
      className={`p-3 rounded-xl border flex items-center gap-3 ${
        mark.isAbsent
          ? "border-error/30 bg-error/5"
          : "border-base-300 bg-base-100"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold truncate">
            {mark.subject?.name ?? "Subject"}
          </p>
          {mark.subject?.code && (
            <span className="text-[10px] font-mono opacity-55 px-1.5 py-0.5 bg-base-300/40 rounded">
              {mark.subject.code}
            </span>
          )}
        </div>
        {!mark.isAbsent && percent != null && (
          <div className="mt-1.5 h-1 rounded-full bg-base-300/50 overflow-hidden max-w-xs">
            <div
              className={`h-full ${style.bar} transition-all duration-500`}
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
        )}
        {mark.remarks && (
          <p className="text-[11px] opacity-60 truncate mt-1">{mark.remarks}</p>
        )}
      </div>

      <div className="text-right shrink-0 min-w-[70px]">
        {mark.isAbsent ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-error">
            <XCircle className="w-3 h-3" /> Absent
          </span>
        ) : (
          <>
            <p className="text-sm font-black">
              {Number(mark.marks ?? 0).toFixed(1)}{" "}
              <span className="text-[10px] opacity-50 font-normal">
                / {Number(mark.outOf ?? 100).toFixed(0)}
              </span>
            </p>
            {percent != null && (
              <p className="text-[10px] font-mono opacity-55">
                {percent.toFixed(1)}%
              </p>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 w-12 text-right">
        {!mark.isAbsent && mark.grade && (
          <GradeChip grade={mark.grade} points={mark.points} />
        )}
      </div>

      <div className="shrink-0 w-10 text-right">
        {!mark.isAbsent && mark.subjectPosition != null && (
          <span
            className="text-[10px] font-mono opacity-60"
            title={`Position ${mark.subjectPosition} in class (max ${maxScore})`}
          >
            #{mark.subjectPosition}
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AGGREGATION
   ═══════════════════════════════════════════════════════════════ */
interface ExamSummary {
  entry: TranscriptEntry;
  meta?: Exam;
  present: number;
  absent: number;
  totalSubjects: number;
  meanPercent: number;
  meanPoints: number;
  best?: ExamMark;
  worst?: ExamMark;
  grades: Record<string, number>;
  date?: string | null;
}

function computeExamSummary(
  entry: TranscriptEntry,
  meta?: Exam
): ExamSummary {
  const results = entry.results ?? [];
  const present = results.filter((r) => !r.isAbsent && r.marks != null);
  const absent = results.length - present.length;

  const totalMarks = present.reduce(
    (s, r) => s + Number(r.marks ?? 0),
    0
  );
  const totalOutOf = present.reduce(
    (s, r) => s + Number(r.outOf ?? 100),
    0
  );
  const meanPercent =
    totalOutOf > 0 ? Math.round((totalMarks / totalOutOf) * 1000) / 10 : 0;

  const pointsArr = present
    .map((r) => r.points ?? 0)
    .filter((p) => p > 0);
  const meanPoints =
    pointsArr.length > 0
      ? Math.round(
          (pointsArr.reduce((a, b) => a + b, 0) / pointsArr.length) * 10
        ) / 10
      : 0;

  const grades: Record<string, number> = {};
  present.forEach((r) => {
    if (r.grade) grades[r.grade] = (grades[r.grade] ?? 0) + 1;
  });

  const sorted = [...present].sort(
    (a, b) => pct(b.marks, b.outOf) - pct(a.marks, a.outOf)
  );

  return {
    entry,
    meta,
    present: present.length,
    absent,
    totalSubjects: results.length,
    meanPercent,
    meanPoints,
    best: sorted[0],
    worst: sorted[sorted.length - 1],
    grades,
    date: meta?.startDate ?? meta?.endDate ?? null,
  };
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function StudentExamResults() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [termFilter, setTermFilter] = useState<string>("");

  /* ── 1. Identity chain ─────────────────────────────────── */
  const {
    data: profileData,
    isLoading: loadingProfile,
    isError: profileError,
    error: profileErr,
  } = useGetMyProfileQuery(undefined);
  const profile = useMemo(() => flattenProfile(profileData), [profileData]);
  const userId: string | undefined =
    profile.userId ?? profile.id ?? profile.user?.id ?? profile.authUserId;

  const {
    data: studentByUser,
    isLoading: loadingStudent,
    isError: studentLookupError,
  } = useGetStudentByUserIdQuery(userId as string, { skip: !userId });
  const studentRecord = useMemo(
    () => unwrap<any>(studentByUser),
    [studentByUser]
  );
  const studentId: string | undefined =
    studentRecord?.id ?? profile.studentId ?? profile.student?.id;

  const { data: fullStudentData, isLoading: loadingFull } =
    useGetStudentWithRelationsQuery(studentId as string, { skip: !studentId });
  const fullStudent = useMemo(
    () => unwrap<any>(fullStudentData),
    [fullStudentData]
  );

  const directClassId: string | undefined =
    fullStudent?.classId ??
    fullStudent?.class?.id ??
    studentRecord?.classId ??
    profile.classId;

  const schoolId: string | undefined =
    fullStudent?.schoolId ??
    studentRecord?.schoolId ??
    profile.schoolId ??
    profile.school?.id;

  const { data: enrollmentData, isLoading: loadingEnrollment } =
    useGetCurrentEnrollmentQuery(studentId as string, {
      skip: !studentId || !!directClassId,
    });
  const enrollment = useMemo(
    () => unwrap<any>(enrollmentData),
    [enrollmentData]
  );
  const enrollmentClassId: string | undefined =
    enrollment?.classId ?? enrollment?.class?.id;
  const classId = directClassId ?? enrollmentClassId;

  /* ── 2. Grade + term ───────────────────────────────────── */
  const gradeLevelId: string | undefined =
    fullStudent?.class?.gradeLevelId ??
    fullStudent?.class?.gradeLevel?.id ??
    studentRecord?.class?.gradeLevelId;
  const { data: gradeLevelData } = useGetGradeLevelByIdQuery(
    gradeLevelId as string,
    { skip: !gradeLevelId }
  );
  const gradeLevel: any =
    (gradeLevelData as any)?.data ?? (gradeLevelData as any)?.gradeLevel ?? null;

  const { data: termData } = useGetCurrentTermBySchoolIdQuery(
    schoolId as string,
    { skip: !schoolId }
  );
  const currentTerm: any =
    (termData as any)?.data ?? (termData as any)?.term ?? null;

  /* ── 3. Labels ────────────────────────────────────────── */
  const className: string =
    fullStudent?.class?.name ??
    fullStudent?.className ??
    profile.className ??
    profile.class?.name ??
    "My Class";
  const stream: string | undefined =
    fullStudent?.class?.stream ?? studentRecord?.class?.stream;
  const gradeName: string | undefined =
    fullStudent?.class?.gradeLevel?.name ?? gradeLevel?.name;
  const academicYear: string | undefined =
    fullStudent?.class?.academicYear ?? fullStudent?.academicYear;
  const admissionNumber: string | undefined =
    fullStudent?.admissionNumber ?? studentRecord?.admissionNumber;
  const studentName =
    [
      fullStudent?.firstName ?? studentRecord?.firstName,
      fullStudent?.lastName ?? studentRecord?.lastName,
    ]
      .filter(Boolean)
      .join(" ") || null;

  const gradeTitle = (() => {
    const g = gradeName ?? className;
    if (g && stream) return `${g} · ${stream}`;
    return g ?? "My Class";
  })();

  /* ── 4. Transcript + exam metadata ────────────────────── */
  const {
    data: transcriptData,
    isLoading: loadingTranscript,
    isError: transcriptError,
    error: transcriptErr,
  } = useGetStudentTranscriptQuery(studentId as string, {
    skip: !studentId,
  });

  const { data: examsData } = useGetExamsBySchoolQuery(schoolId as string, {
    skip: !schoolId,
  });

  const examsById = useMemo(() => {
    const m = new Map<string, Exam>();
    (examsData?.exams ?? []).forEach((e) => m.set(e.id, e));
    return m;
  }, [examsData]);

  const transcript: TranscriptEntry[] = useMemo(
    () =>
      (transcriptData as any)?.transcript ??
      (transcriptData as any)?.data?.transcript ??
      [],
    [transcriptData]
  );

  /* ── 5. Summaries ─────────────────────────────────────── */
  const summaries: ExamSummary[] = useMemo(() => {
    return transcript
      .map((t) => computeExamSummary(t, examsById.get(t.examId)))
      .sort((a, b) => {
        const da = a.date ?? "";
        const db = b.date ?? "";
        return db.localeCompare(da);
      });
  }, [transcript, examsById]);

  /* ── 6. Term filter options ───────────────────────────── */
  const termOptions = useMemo(() => {
    const set = new Set<string>();
    transcript.forEach((t) =>
      set.add(`${t.termName} · ${t.academicYear}`)
    );
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [transcript]);

  const visible = useMemo(() => {
    if (!termFilter) return summaries;
    return summaries.filter(
      (s) =>
        `${s.entry.termName} · ${s.entry.academicYear}` === termFilter
    );
  }, [summaries, termFilter]);

  /* ── 7. Overall stats across all exams ────────────────── */
  const overall = useMemo(() => {
    if (summaries.length === 0)
      return {
        exams: 0,
        totalSubjects: 0,
        latestMean: 0,
        bestExam: null as ExamSummary | null,
        worstExam: null as ExamSummary | null,
        trend: [] as ExamSummary[],
      };
    const exams = summaries.length;
    const totalSubjects = summaries.reduce(
      (s, x) => s + x.totalSubjects,
      0
    );
    const latestMean = summaries[0]?.meanPercent ?? 0;
    const sortedByMean = [...summaries].sort(
      (a, b) => b.meanPercent - a.meanPercent
    );
    return {
      exams,
      totalSubjects,
      latestMean,
      bestExam: sortedByMean[0],
      worstExam: sortedByMean[sortedByMean.length - 1],
      trend: [...summaries].reverse(),
    };
  }, [summaries]);

  /* ── 8. Gates ─────────────────────────────────────────── */
  const resolvingIdentity =
    loadingProfile ||
    (!studentId && (loadingStudent || loadingFull || loadingEnrollment));

  if (resolvingIdentity) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-40 rounded-3xl bg-base-200/60" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-base-200/60" />
          ))}
        </div>
        <div className="h-56 rounded-3xl bg-base-200/60" />
        <div className="h-72 rounded-3xl bg-base-200/60" />
      </div>
    );
  }

  if (profileError || !studentId) {
    return (
      <div className={`${CARD} max-w-xl mx-auto text-center space-y-3`}>
        <GraduationCap className="w-10 h-10 mx-auto text-primary" />
        <p className="text-base font-black">
          {studentLookupError
            ? "We couldn't find your student record."
            : "Could not load your profile."}
        </p>
        <p className="text-xs opacity-60">
          Please contact the school office if this persists.
        </p>
      </div>
    );
  }

  if (transcriptError) {
    return (
      <div className="p-6 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">
          {errMsg(transcriptErr, "Could not load your exam results.")}
        </span>
      </div>
    );
  }

  /* ── 9. Render ────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── HEADER ──────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-base-200 to-secondary/20 p-6 sm:p-8 rounded-3xl border border-base-300 shadow-sm">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-56 h-56 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-3xl bg-primary text-primary-content grid place-items-center shadow-lg shrink-0">
            <GraduationCap className="w-9 h-9" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-55 mb-1">
              My Exam Results
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary truncate">
              {gradeTitle}
            </h1>
            {studentName && (
              <p className="text-sm font-bold opacity-80 mt-1 truncate">
                {studentName}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full border border-primary/20">
                <School className="w-3 h-3" /> {className}
                {stream && <> · {stream}</>}
              </span>
              {academicYear && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-base-100 border border-base-300 text-[10px] font-black uppercase rounded-full">
                  <CalendarRange className="w-3 h-3" /> {academicYear}
                </span>
              )}
              {admissionNumber && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-base-100 border border-base-300 text-[10px] font-black uppercase rounded-full font-mono">
                  <Hash className="w-3 h-3" /> {admissionNumber}
                </span>
              )}
              {currentTerm?.termName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success text-[10px] font-black uppercase rounded-full border border-success/20">
                  <Sparkles className="w-3 h-3" /> {currentTerm.termName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* stats strip */}
        {overall.exams > 0 && (
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <StatTile
              icon={ClipboardList}
              label="Exams taken"
              value={overall.exams}
            />
            <StatTile
              icon={BookOpen}
              label="Total subjects"
              value={overall.totalSubjects}
            />
            <StatTile
              icon={TrendingUp}
              label="Latest mean"
              value={`${overall.latestMean.toFixed(1)}%`}
              tone={
                overall.latestMean >= 75
                  ? "text-success"
                  : overall.latestMean >= 50
                  ? "text-warning"
                  : "text-error"
              }
              bg={
                overall.latestMean >= 75
                  ? "bg-success/10"
                  : overall.latestMean >= 50
                  ? "bg-warning/10"
                  : "bg-error/10"
              }
            />
            <StatTile
              icon={Award}
              label="Best exam"
              value={overall.bestExam?.entry.examTitle ?? "—"}
              sub={
                overall.bestExam
                  ? `${overall.bestExam.meanPercent.toFixed(1)}%`
                  : undefined
              }
              tone="text-secondary"
              bg="bg-secondary/10"
            />
          </div>
        )}
      </div>

      {/* ── LOADING ─────────────────────────────────────── */}
      {loadingTranscript && (
        <div className="p-16 text-center text-sm opacity-60">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
          Loading your results…
        </div>
      )}

      {/* ── EMPTY ───────────────────────────────────────── */}
      {!loadingTranscript && summaries.length === 0 && (
        <div className={`${CARD} text-center space-y-3 py-12`}>
          <ClipboardList className="w-10 h-10 mx-auto opacity-40" />
          <p className="text-sm font-black">No results yet</p>
          <p className="text-xs opacity-60 max-w-sm mx-auto">
            Once your teachers enter and publish your marks, your exam results
            will appear here.
          </p>
        </div>
      )}

      {/* ── TREND CHART ─────────────────────────────────── */}
      {overall.trend.length > 1 && (
        <div className={`${CARD} space-y-4`}>
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-wider opacity-70">
              Performance trend
            </h2>
            <span className="ml-auto text-[10px] font-mono opacity-55">
              mean % per exam
            </span>
          </div>
          <div className="space-y-2">
            {overall.trend.map((s) => {
              const style = gradeStyle(null, null); // simple color by mean
              const color =
                s.meanPercent >= 75
                  ? "bg-success"
                  : s.meanPercent >= 50
                  ? "bg-warning"
                  : "bg-error";
              return (
                <div key={s.entry.examId} className="flex items-center gap-3">
                  <div
                    className="w-32 text-right text-[11px] font-bold truncate opacity-70"
                    title={s.entry.examTitle}
                  >
                    {s.entry.examTitle}
                  </div>
                  <div className="flex-1 h-4 rounded-full bg-base-300/40 overflow-hidden">
                    <div
                      className={`h-full ${color} transition-all duration-700`}
                      style={{ width: `${Math.min(100, s.meanPercent)}%` }}
                    />
                  </div>
                  <div className="w-14 text-right text-[11px] font-black">
                    {s.meanPercent.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TERM FILTER ────────────────────────────────── */}
      {termOptions.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <ListFilter className="w-4 h-4 opacity-60" />
          <span className="text-[10px] uppercase tracking-wider font-black opacity-55">
            Filter
          </span>
          <button
            onClick={() => setTermFilter("")}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition ${
              !termFilter
                ? "bg-primary text-primary-content shadow-sm"
                : "bg-base-100 border border-base-300 hover:bg-base-200"
            }`}
          >
            All terms
          </button>
          {termOptions.map((t) => (
            <button
              key={t}
              onClick={() => setTermFilter(t)}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition ${
                termFilter === t
                  ? "bg-primary text-primary-content shadow-sm"
                  : "bg-base-100 border border-base-300 hover:bg-base-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* ── EXAM CARDS ─────────────────────────────────── */}
      {visible.map((s) => {
        const isOpen = expandedId === s.entry.examId;
        const percentTone =
          s.meanPercent >= 75
            ? "text-success"
            : s.meanPercent >= 50
            ? "text-warning"
            : "text-error";

        return (
          <div key={s.entry.examId} className={`${CARD} space-y-4`}>
            {/* Header */}
            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black truncate">
                    {s.entry.examTitle}
                  </h3>
                  {s.meta?.examCategory && (
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-black uppercase rounded-full border border-secondary/20">
                      {s.meta.examCategory}
                    </span>
                  )}
                  {s.meta?.isLocked && (
                    <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-black uppercase rounded-full border border-success/20">
                      Published
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] opacity-65">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {s.entry.termName} · {s.entry.academicYear}
                  </span>
                  {s.date && (
                    <span className="inline-flex items-center gap-1 font-mono">
                      {fmtDate(s.date)}
                    </span>
                  )}
                  {s.present > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success" />
                      {s.present} marked
                    </span>
                  )}
                  {s.absent > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-error" />
                      {s.absent} absent
                    </span>
                  )}
                </div>
              </div>

              {/* Summary block */}
              <div className="text-right shrink-0">
                <p className={`text-2xl font-black leading-none ${percentTone}`}>
                  {s.meanPercent.toFixed(1)}%
                </p>
                <p className="text-[10px] uppercase font-black opacity-55 tracking-wider mt-0.5">
                  mean
                </p>
                {s.meanPoints > 0 && (
                  <p className="text-[10px] font-mono opacity-60 mt-1">
                    {s.meanPoints.toFixed(1)} pts avg
                  </p>
                )}
              </div>
            </div>

            {/* Quick highlights */}
            <div className="grid grid-cols-2 gap-2">
              {s.best && s.best !== s.worst && (
                <div className="p-2.5 rounded-xl bg-success/10 border border-success/20">
                  <p className="text-[9px] uppercase font-black text-success tracking-wider">
                    <Star className="w-3 h-3 inline mr-1" />
                    Best subject
                  </p>
                  <p className="text-xs font-bold truncate mt-0.5">
                    {s.best.subject?.name ?? "—"}
                  </p>
                  <p className="text-[10px] font-mono opacity-60">
                    {pct(s.best.marks, s.best.outOf).toFixed(1)}% ·{" "}
                    {s.best.grade ?? "—"}
                  </p>
                </div>
              )}
              {s.worst && s.best !== s.worst && (
                <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/20">
                  <p className="text-[9px] uppercase font-black text-warning tracking-wider">
                    <TrendingDown className="w-3 h-3 inline mr-1" />
                    Needs attention
                  </p>
                  <p className="text-xs font-bold truncate mt-0.5">
                    {s.worst.subject?.name ?? "—"}
                  </p>
                  <p className="text-[10px] font-mono opacity-60">
                    {pct(s.worst.marks, s.worst.outOf).toFixed(1)}% ·{" "}
                    {s.worst.grade ?? "—"}
                  </p>
                </div>
              )}
            </div>

            {/* Grade distribution */}
            {Object.keys(s.grades).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(s.grades)
                  .sort((a, b) => b[1] - a[1])
                  .map(([g, c]) => {
                    const style = gradeStyle(null, g);
                    return (
                      <span
                        key={g}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${style.chip}`}
                      >
                        {g}
                        <span className="opacity-60">×{c}</span>
                      </span>
                    );
                  })}
              </div>
            )}

            {/* Expand toggle */}
            <button
              onClick={() =>
                setExpandedId(isOpen ? null : s.entry.examId)
              }
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-base-100 border border-base-300 hover:bg-base-200 transition text-[11px] font-black uppercase tracking-wider"
            >
              <span className="inline-flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                {isOpen ? "Hide" : "Show"} subject breakdown
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Subject detail */}
            {isOpen && (
              <div className="space-y-1.5">
                {(s.entry.results ?? [])
                  .slice()
                  .sort((a, b) => {
                    if (a.isAbsent !== b.isAbsent) return a.isAbsent ? 1 : -1;
                    return (
                      pct(b.marks, b.outOf) - pct(a.marks, a.outOf)
                    );
                  })
                  .map((m) => (
                    <SubjectMarkRow
                      key={m.id}
                      mark={m}
                      maxScore={s.totalSubjects}
                    />
                  ))}
              </div>
            )}
          </div>
        );
      })}

      {/* ── HOW GRADING WORKS ───────────────────────────── */}
      {summaries.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-base-200/40 border border-base-300 text-[11px] opacity-70">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Mean % = (sum of marks ÷ sum of out-of) across subjects. Position
            <span className="font-mono mx-1">#n</span>
            is your rank in class for that subject. Absent subjects are
            excluded from the mean.
          </span>
        </div>
      )}
    </div>
  );
}