import React, { useMemo, useState } from "react";
import {
  CalendarDays, Clock, User, AlertCircle, Loader2, GraduationCap,
  CheckCircle2, XCircle, Clock3, ShieldCheck, CalendarRange, Filter,
  List, LayoutGrid, ChevronLeft, ChevronRight, School, Hash, BadgeCheck,
  Sparkles, Activity, TrendingUp, CalendarX2, RotateCcw, Info,
} from "lucide-react";
import { useGetMyProfileQuery } from "../../features/Apis/Auth.Api";
import {
  useGetStudentByUserIdQuery,
  useGetStudentWithRelationsQuery,
  useGetCurrentEnrollmentQuery,
} from "../../features/Apis/students.Api";
import {
  useGetStudentHistoryQuery,
  useGetStudentStatsQuery,
} from "../../features/Apis/Attendance.Apis";
import type {
  AttendanceRecord,
  AttendanceStatus,
} from "../../features/Apis/Attendance.Apis";
import { useGetGradeLevelByIdQuery } from "../../features/Apis/academicStructure.Api";
import { useGetCurrentTermBySchoolIdQuery } from "../../features/Apis/Term.Api";

/* ═══════════════════════════════════════════════════════════════
   STATUS STYLES
   ═══════════════════════════════════════════════════════════════ */
const STATUS_STYLE: Record<
  AttendanceStatus,
  { badge: string; dot: string; cell: string; icon: any; label: string }
> = {
  Present: {
    badge: "bg-success/10 text-success border-success/30",
    dot: "bg-success",
    cell: "bg-success/10 border-success/30 text-success",
    icon: CheckCircle2,
    label: "Present",
  },
  Absent: {
    badge: "bg-error/10 text-error border-error/30",
    dot: "bg-error",
    cell: "bg-error/10 border-error/30 text-error",
    icon: XCircle,
    label: "Absent",
  },
  Late: {
    badge: "bg-warning/10 text-warning border-warning/30",
    dot: "bg-warning",
    cell: "bg-warning/10 border-warning/30 text-warning",
    icon: Clock3,
    label: "Late",
  },
  Excused: {
    badge: "bg-info/10 text-info border-info/30",
    dot: "bg-info",
    cell: "bg-info/10 border-info/30 text-info",
    icon: ShieldCheck,
    label: "Excused",
  },
};

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const CARD =
  "bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 sm:p-8 rounded-3xl shadow-xl";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dateKey = (d?: string | null) => (d ? String(d).split("T")[0] : "");
const pad = (n: number) => String(n).padStart(2, "0");

const fmtLong = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const fmtMonthLabel = (y: number, m: number) =>
  new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

const monthFirst = (y: number, m: number) => `${y}-${pad(m)}-01`;
const monthLast = (y: number, m: number) =>
  `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`;

const todayKey = () => {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
};

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

const rateNum = (v: string | number | undefined) => {
  if (v == null) return 0;
  const n = typeof v === "string" ? parseFloat(v.replace("%", "")) : Number(v);
  return isFinite(n) ? n : 0;
};

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function AttendanceRing({ rate, size = 110 }: { rate: number; size?: number }) {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, rate));
  const offset = circ - (clamped / 100) * circ;
  const color =
    clamped >= 90 ? "text-success" : clamped >= 75 ? "text-warning" : "text-error";

  return (
    <div
      className={`relative inline-grid place-items-center ${color}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-base-300/70"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-current transition-all duration-700"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-xl font-black leading-none">
            {Math.round(clamped)}%
          </p>
          <p className="text-[9px] uppercase tracking-wider opacity-60 font-bold mt-0.5">
            attendance
          </p>
        </div>
      </div>
    </div>
  );
}

function DistributionBar({
  present,
  absent,
  late,
  excused,
}: {
  present: number;
  absent: number;
  late: number;
  excused: number;
}) {
  const total = present + absent + late + excused || 1;
  const p = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 rounded-full overflow-hidden bg-base-300/50">
        <div className="bg-success" style={{ width: p(present) }} />
        <div className="bg-warning" style={{ width: p(late) }} />
        <div className="bg-info" style={{ width: p(excused) }} />
        <div className="bg-error" style={{ width: p(absent) }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
        {(
          [
            ["Present", present, "bg-success"],
            ["Late", late, "bg-warning"],
            ["Excused", excused, "bg-info"],
            ["Absent", absent, "bg-error"],
          ] as const
        ).map(([label, count, dot]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            <span className="font-bold opacity-70">{label}</span>
            <span className="font-mono opacity-55">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "text-primary",
  bg = "bg-primary/10",
  sub,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  tone?: string;
  bg?: string;
  sub?: string;
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

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function StudentAttendance() {
  /* ── identity ── */
  const {
    data: profileData,
    isLoading: loadingProfile,
    isError: profileError,
    error: profileErr,
  } = useGetMyProfileQuery(undefined);
  const profile = useMemo(() => flattenProfile(profileData), [profileData]);
  const userId: string | undefined =
    profile.userId ?? profile.id ?? profile.user?.id ?? profile.authUserId;

  const { data: studentByUser, isLoading: loadingStudent, isError: studentLookupError } =
    useGetStudentByUserIdQuery(userId as string, { skip: !userId });
  const studentRecord = useMemo(() => unwrap<any>(studentByUser), [studentByUser]);
  const studentId: string | undefined =
    studentRecord?.id ?? profile.studentId ?? profile.student?.id;

  const { data: fullStudentData, isLoading: loadingFull } =
    useGetStudentWithRelationsQuery(studentId as string, { skip: !studentId });
  const fullStudent = useMemo(() => unwrap<any>(fullStudentData), [fullStudentData]);

  const directClassId: string | undefined =
    fullStudent?.classId ??
    fullStudent?.class?.id ??
    studentRecord?.classId ??
    studentRecord?.class?.id ??
    profile.classId ??
    profile.class?.id;

  const schoolId: string | undefined =
    fullStudent?.schoolId ??
    studentRecord?.schoolId ??
    profile.schoolId ??
    profile.school?.id;

  const { data: enrollmentData, isLoading: loadingEnrollment } =
    useGetCurrentEnrollmentQuery(studentId as string, {
      skip: !studentId || !!directClassId,
    });
  const enrollment = useMemo(() => unwrap<any>(enrollmentData), [enrollmentData]);
  const enrollmentClassId: string | undefined =
    enrollment?.classId ?? enrollment?.class?.id;
  const classId = directClassId ?? enrollmentClassId;

  /* ── grade + term ── */
  const gradeLevelId: string | undefined =
    fullStudent?.class?.gradeLevelId ??
    fullStudent?.class?.gradeLevel?.id ??
    studentRecord?.class?.gradeLevelId;
  const { data: gradeLevelData } = useGetGradeLevelByIdQuery(gradeLevelId as string, {
    skip: !gradeLevelId,
  });
  const gradeLevel: any =
    (gradeLevelData as any)?.data ?? (gradeLevelData as any)?.gradeLevel ?? null;

  const { data: termData } = useGetCurrentTermBySchoolIdQuery(schoolId as string, {
    skip: !schoolId,
  });
  const currentTerm: any =
    (termData as any)?.data ?? (termData as any)?.term ?? null;

  /* ── labels ── */
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

  /* ── view state ── */
  type View = "list" | "calendar";
  const [view, setView] = useState<View>("list");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "">("");

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1); // 1-12

  /* ── effective query range ── */
  // In calendar mode the current month drives the range.
  const effectiveFrom =
    view === "calendar" ? monthFirst(calYear, calMonth) : fromDate || undefined;
  const effectiveTo =
    view === "calendar" ? monthLast(calYear, calMonth) : toDate || undefined;

  /* ── history + stats ── */
  const {
    data: historyData,
    isLoading: loadingHistory,
    isFetching: fetchingHistory,
    isError: historyError,
    error: historyErr,
  } = useGetStudentHistoryQuery(
    {
      studentId: studentId!,
      fromDate: effectiveFrom,
      toDate: effectiveTo,
      status: (statusFilter || undefined) as AttendanceStatus | undefined,
    },
    { skip: !studentId }
  );

  const { data: statsData, isLoading: loadingStats } = useGetStudentStatsQuery(
    studentId as string,
    { skip: !studentId }
  );

  const records: AttendanceRecord[] = useMemo(
    () => historyData?.records ?? [],
    [historyData]
  );
  const stats = statsData?.stats;

  /* ── derived: map by date ── */
  const byDate = useMemo(() => {
    const m = new Map<string, AttendanceRecord>();
    records.forEach((r) => m.set(dateKey(r.date), r));
    return m;
  }, [records]);

  /* ── derived: grouped by month (list view) ── */
  const grouped = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    records.forEach((r) => {
      const k = dateKey(r.date).slice(0, 7); // YYYY-MM
      const arr = map.get(k) ?? [];
      arr.push(r);
      map.set(k, arr);
    });
    [...map.values()].forEach((arr) =>
      arr.sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)))
    );
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [records]);

  /* ── derived: calendar cells ── */
  const calendarCells = useMemo(() => {
    const first = new Date(calYear, calMonth - 1, 1);
    const startWeekday = first.getDay(); // 0=Sun
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const cells: Array<{ date: string | null; day: number | null }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: `${calYear}-${pad(calMonth)}-${pad(d)}`,
        day: d,
      });
    }
    return cells;
  }, [calYear, calMonth]);

  const monthRecords = useMemo(
    () =>
      records.filter((r) => {
        const d = dateKey(r.date);
        return d >= monthFirst(calYear, calMonth) && d <= monthLast(calYear, calMonth);
      }),
    [records, calYear, calMonth]
  );

  const monthStatusCounts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = {
      Present: 0,
      Absent: 0,
      Late: 0,
      Excused: 0,
    };
    monthRecords.forEach((r) => {
      if (c[r.status] != null) c[r.status]++;
    });
    return c;
  }, [monthRecords]);

  /* ── quick range helpers ── */
  const setRangeThisMonth = () => {
    const n = new Date();
    setFromDate(monthFirst(n.getFullYear(), n.getMonth() + 1));
    setToDate(todayKey());
    setView("list");
  };
  const setRangeLast30 = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setFromDate(dateKey(d.toISOString()));
    setToDate(todayKey());
    setView("list");
  };
  const setRangeThisTerm = () => {
    if (!currentTerm?.startDate) return;
    setFromDate(dateKey(currentTerm.startDate));
    setToDate(dateKey(currentTerm.endDate) || todayKey());
    setView("list");
  };
  const clearRange = () => {
    setFromDate("");
    setToDate("");
    setStatusFilter("");
  };

  const hasFilter = fromDate || toDate || statusFilter;

  /* ── loading / error gates ── */
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
        <div className="h-10 w-56 rounded-xl bg-base-200/60" />
        <div className="h-72 rounded-3xl bg-base-200/60" />
      </div>
    );
  }

  if (profileError || !studentId) {
    const message = studentLookupError || !studentId
      ? "We couldn't find your student record. Please contact the school office."
      : "Could not load your attendance.";
    return (
      <div className={`${CARD} max-w-xl mx-auto text-center space-y-3`}>
        <GraduationCap className="w-10 h-10 mx-auto text-primary" />
        <p className="text-base font-black">{message}</p>
      </div>
    );
  }

  if (historyError) {
    return (
      <div className="p-6 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">
          {errMsg(historyErr, "Could not load your attendance history.")}
        </span>
      </div>
    );
  }

  /* ── stat values ── */
  const rate = rateNum(stats?.attendanceRate);
  const totalDays = stats?.totalDays ?? 0;
  const present = stats?.present ?? 0;
  const absent = stats?.absent ?? 0;
  const late = stats?.late ?? 0;
  const excused = stats?.excused ?? 0;

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-base-200 to-secondary/20 p-6 sm:p-8 rounded-3xl border border-base-300 shadow-sm">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-56 h-56 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-3xl bg-primary text-primary-content grid place-items-center shadow-lg shrink-0">
            <CalendarDays className="w-9 h-9" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-55 mb-1">
              My Attendance
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
              {gradeName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary/10 text-secondary text-[10px] font-black uppercase rounded-full border border-secondary/20">
                  <GraduationCap className="w-3 h-3" /> {gradeName}
                </span>
              )}
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
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* rate card */}
        <div className={`${CARD} !p-5 sm:!p-6 flex items-center gap-5`}>
          <AttendanceRing rate={rate} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider font-black opacity-55">
              Overall
            </p>
            <p className="text-lg font-black leading-tight">
              {rate >= 90 ? "Excellent" : rate >= 75 ? "Good" : "Needs attention"}
            </p>
            <p className="text-[11px] opacity-60 font-mono mt-1">
              {totalDays} day{totalDays === 1 ? "" : "s"} recorded
            </p>
            <div className="mt-3">
              <DistributionBar
                present={present}
                absent={absent}
                late={late}
                excused={excused}
              />
            </div>
          </div>
        </div>

        {/* quick totals */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={CheckCircle2}
            label="Present"
            value={present}
            tone="text-success"
            bg="bg-success/10"
          />
          <StatCard
            icon={XCircle}
            label="Absent"
            value={absent}
            tone="text-error"
            bg="bg-error/10"
          />
          <StatCard
            icon={Clock3}
            label="Late"
            value={late}
            tone="text-warning"
            bg="bg-warning/10"
          />
          <StatCard
            icon={ShieldCheck}
            label="Excused"
            value={excused}
            tone="text-info"
            bg="bg-info/10"
          />
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className={`${CARD} !p-4 sm:!p-5 space-y-3`}>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 opacity-60" />
          <h2 className="text-xs font-black uppercase tracking-wider opacity-70">
            Filters
          </h2>
          {hasFilter && (
            <button
              onClick={clearRange}
              className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 text-[10px] font-black uppercase"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {view === "list" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider font-black opacity-55">
                  From
                </span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="input input-sm input-bordered bg-base-100 text-xs"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider font-black opacity-55">
                  To
                </span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="input input-sm input-bordered bg-base-100 text-xs"
                />
              </label>
            </>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider font-black opacity-55">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="select select-sm select-bordered bg-base-100 text-xs"
            >
              <option value="">All statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Excused">Excused</option>
            </select>
          </label>

          {view === "list" && (
            <div className="flex flex-wrap gap-1.5 ml-auto">
              <button
                onClick={setRangeThisMonth}
                className="px-2.5 py-1 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 text-[10px] font-black uppercase"
              >
                This Month
              </button>
              <button
                onClick={setRangeLast30}
                className="px-2.5 py-1 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 text-[10px] font-black uppercase"
              >
                Last 30d
              </button>
              {currentTerm?.startDate && (
                <button
                  onClick={setRangeThisTerm}
                  className="px-2.5 py-1 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 text-[10px] font-black uppercase"
                >
                  This Term
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── VIEW TABS ── */}
      <div className="flex gap-2 border-b border-base-300 pb-3">
        {(
          [
            ["list", "Timeline", List],
            ["calendar", "Calendar", LayoutGrid],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setView(id as View)}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              view === id
                ? "bg-primary text-primary-content shadow-md"
                : "bg-base-200/50 hover:bg-base-200 opacity-75"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
        {fetchingHistory && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-black uppercase opacity-60">
            <Loader2 className="w-3 h-3 animate-spin" /> syncing
          </span>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          LIST VIEW
         ═══════════════════════════════════════════════════════ */}
      {view === "list" && (
        <div className="space-y-6">
          {loadingHistory ? (
            <div className="p-16 text-center text-sm opacity-60">
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Loading attendance…
            </div>
          ) : records.length === 0 ? (
            <div className={`${CARD} text-center space-y-2`}>
              <CalendarX2 className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-bold">No records</p>
              <p className="text-xs opacity-60">
                {hasFilter
                  ? "No attendance matches the current filters."
                  : "Your attendance will appear here once marked."}
              </p>
            </div>
          ) : (
            grouped.map(([month, list]) => {
              const [y, m] = month.split("-").map(Number);
              const label = new Date(y, m - 1, 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              });
              const monthPresent = list.filter((r) => r.status === "Present").length;
              const monthLate = list.filter((r) => r.status === "Late").length;
              const monthAbsent = list.filter((r) => r.status === "Absent").length;
              const monthExcused = list.filter((r) => r.status === "Excused").length;
              const monthRate = list.length
                ? Math.round(((monthPresent + monthLate) / list.length) * 100)
                : 0;

              return (
                <div key={month} className={`${CARD} space-y-4`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarRange className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-black uppercase tracking-wider">
                        {label}
                      </h3>
                      <span className="text-[10px] font-mono opacity-55">
                        {list.length} record{list.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-success" />
                        <span className="font-bold">{monthRate}%</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        {monthPresent}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                        {monthLate}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-info" />
                        {monthExcused}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-error" />
                        {monthAbsent}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {list.map((r) => {
                      const style = STATUS_STYLE[r.status];
                      const Icon = style.icon;
                      const d = dateKey(r.date);
                      const dt = new Date(d);
                      const dayNum = dt.getDate();
                      const weekday = dt.toLocaleDateString("en-US", {
                        weekday: "short",
                      });

                      return (
                        <div
                          key={r.id}
                          className="flex items-center gap-3 p-3 bg-base-100 border border-base-300 rounded-2xl hover:bg-base-200/40 transition"
                        >
                          <div className="w-12 shrink-0 text-center">
                            <p className="text-lg font-black leading-none">
                              {dayNum}
                            </p>
                            <p className="text-[9px] uppercase font-black opacity-50 mt-0.5">
                              {weekday}
                            </p>
                          </div>

                          <div
                            className={`w-1 self-stretch rounded-full ${style.dot}`}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${style.badge}`}
                              >
                                <Icon className="w-3 h-3" /> {style.label}
                              </span>
                              <span className="text-[10px] font-mono opacity-45">
                                {d}
                              </span>
                            </div>
                            {r.remarks && (
                              <p className="text-xs opacity-70 truncate mt-1">
                                {r.remarks}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            {r.markedBy && (
                              <p className="text-[10px] opacity-55 inline-flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {typeof r.markedBy === "string"
                                  ? r.markedBy.slice(0, 8)
                                  : "marked"}
                              </p>
                            )}
                            {r.updatedAt && (
                              <p className="text-[10px] font-mono opacity-40">
                                {new Date(r.updatedAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          CALENDAR VIEW
         ═══════════════════════════════════════════════════════ */}
      {view === "calendar" && (
        <div className={`${CARD} space-y-5`}>
          {/* month nav */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                if (calMonth === 1) {
                  setCalYear((y) => y - 1);
                  setCalMonth(12);
                } else setCalMonth((m) => m - 1);
              }}
              className="p-2 rounded-xl bg-base-100 border border-base-300 hover:bg-base-200"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-wider">
                {fmtMonthLabel(calYear, calMonth)}
              </p>
              <p className="text-[10px] font-mono opacity-55">
                {monthRecords.length} record{monthRecords.length === 1 ? "" : "s"}
              </p>
            </div>

            <button
              onClick={() => {
                if (calMonth === 12) {
                  setCalYear((y) => y + 1);
                  setCalMonth(1);
                } else setCalMonth((m) => m + 1);
              }}
              className="p-2 rounded-xl bg-base-100 border border-base-300 hover:bg-base-200"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* weekday header */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[9px] font-black uppercase tracking-wider opacity-55 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* cells */}
          {loadingHistory ? (
            <div className="grid grid-cols-7 gap-1 animate-pulse">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-base-200/60"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((c, i) => {
                if (!c.date) return <div key={i} />;
                const rec = byDate.get(c.date);
                const style = rec ? STATUS_STYLE[rec.status] : null;
                const isFuture = c.date > todayKey();
                const isToday = c.date === todayKey();

                return (
                  <div
                    key={i}
                    title={
                      rec
                        ? `${fmtLong(c.date)} — ${rec.status}${
                            rec.remarks ? ` (${rec.remarks})` : ""
                          }`
                        : fmtLong(c.date)
                    }
                    className={`aspect-square rounded-xl border p-1 flex flex-col items-center justify-center relative transition ${
                      rec && style
                        ? style.cell
                        : isFuture
                        ? "bg-base-100/30 border-base-300/40 opacity-40"
                        : "bg-base-100 border-base-300"
                    } ${isToday ? "ring-2 ring-primary/40" : ""}`}
                  >
                    <span className="text-[10px] font-black leading-none">
                      {c.day}
                    </span>
                    {rec && style && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-1`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* legend + month breakdown */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-3 border-t border-base-300 text-[11px]">
            {(
              ["Present", "Late", "Excused", "Absent"] as AttendanceStatus[]
            ).map((s) => {
              const style = STATUS_STYLE[s];
              return (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span className="font-bold">{s}</span>
                  <span className="font-mono opacity-60">
                    {monthStatusCounts[s]}
                  </span>
                </span>
              );
            })}
            <span className="inline-flex items-center gap-1.5 ml-auto opacity-60">
              <Info className="w-3 h-3" /> Tap a day for details
            </span>
          </div>

          {/* empty state for month */}
          {!loadingHistory && monthRecords.length === 0 && (
            <div className="py-8 text-center border-2 border-dashed border-base-300 rounded-2xl">
              <CalendarX2 className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold opacity-70">
                No records for {fmtMonthLabel(calYear, calMonth)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── BOTTOM HINT ── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-base-200/40 border border-base-300 text-[11px] opacity-70">
        <Activity className="w-3.5 h-3.5" />
        <span>
          Attendance rate = (Present + Late) ÷ total marked. Only days your teacher
          has marked appear here.
        </span>
      </div>
    </div>
  );
}