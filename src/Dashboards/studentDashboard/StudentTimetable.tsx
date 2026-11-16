import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Clock, MapPin, User, BookOpen, Coffee, AlertCircle,
  Loader2, Radio, ArrowRight, LayoutGrid, CalendarClock, GraduationCap,
  BadgeCheck, School, CalendarRange, Timer, Sparkles, Hash, Users,
} from "lucide-react";
import { useGetMyProfileQuery } from "../../features/Apis/Auth.Api";
import {
  useGetClassTimetableQuery,
  useGetClassCurrentLessonQuery,
  useGetClassNextLessonQuery,
  useListAllPeriodsQuery,
} from "../../features/Apis/Timetables.Api";
import type { Period, TimetableSlot } from "../../features/Apis/Timetables.Api";
import {
  useGetStudentByUserIdQuery,
  useGetStudentWithRelationsQuery,
  useGetCurrentEnrollmentQuery,
} from "../../features/Apis/students.Api";
import { useGetGradeLevelByIdQuery } from "../../features/Apis/academicStructure.Api";
import { useGetCurrentTermBySchoolIdQuery } from "../../features/Apis/Term.Api";

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const CARD =
  "bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 sm:p-8 rounded-3xl shadow-xl";

const BASE_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const EXTRA_DAYS = ["Saturday", "Sunday"];

const normDay = (d?: string | null) => String(d ?? "").trim().toLowerCase();
const capDay = (d: string) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();

const hhmm = (t?: string | null) => {
  if (!t) return "";
  const s = String(t);
  const part = s.includes("T") ? s.split("T")[1] : s;
  return part.slice(0, 5);
};

const to12h = (t?: string | null) => {
  const s = hhmm(t);
  if (!s) return "";
  const [h, m] = s.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const toMin = (t?: string | null) => {
  const s = hhmm(t);
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
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

const subjectName = (s?: TimetableSlot | null) =>
  s?.subject?.name ?? (s as any)?.subjectName ?? "Lesson";
const teacherName = (s?: TimetableSlot | null) =>
  s?.teacher?.name ?? (s as any)?.teacherName ?? null;

/* ═══════════════════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════════════════ */
function TimetableSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-40 rounded-3xl bg-base-200/60" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-32 rounded-3xl bg-base-200/60" />
        <div className="h-32 rounded-3xl bg-base-200/60" />
      </div>
      <div className="h-10 w-56 rounded-xl bg-base-200/60" />
      <div className="h-72 rounded-3xl bg-base-200/60" />
    </div>
  );
}

type Tab = "today" | "week";

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function StudentTimetable() {
  const [tab, setTab] = useState<Tab>("today");

  // refresh countdown every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  /* ── 1. Auth profile ──────────────────────────────────────── */
  const {
    data: profileData,
    isLoading: loadingProfile,
    isError: profileError,
    error: profileErr,
  } = useGetMyProfileQuery(undefined);

  const profile = useMemo(() => flattenProfile(profileData), [profileData]);
  const userId: string | undefined =
    profile.userId ?? profile.id ?? profile.user?.id ?? profile.authUserId;

  /* ── 2. Student record by userId ──────────────────────────── */
  const {
    data: studentByUser,
    isLoading: loadingStudent,
    isError: studentLookupError,
  } = useGetStudentByUserIdQuery(userId as string, { skip: !userId });

  const studentRecord = useMemo(() => unwrap<any>(studentByUser), [studentByUser]);

  /* ── 3. Full student record ──────────────────────────────── */
  const studentId: string | undefined =
    studentRecord?.id ?? profile.studentId ?? profile.student?.id;

  const { data: fullStudentData, isLoading: loadingFull } =
    useGetStudentWithRelationsQuery(studentId as string, { skip: !studentId });

  const fullStudent = useMemo(
    () => unwrap<any>(fullStudentData),
    [fullStudentData]
  );

  /* ── 4. Resolve classId + schoolId ───────────────────────── */
  const directClassId: string | undefined =
    fullStudent?.classId ??
    fullStudent?.class?.id ??
    studentRecord?.classId ??
    studentRecord?.class?.id ??
    profile.classId ??
    profile.class?.id ??
    profile.currentClassId;

  const schoolId: string | undefined =
    fullStudent?.schoolId ??
    studentRecord?.schoolId ??
    profile.schoolId ??
    profile.school?.id;

  /* ── 5. Fallback: current enrollment ─────────────────────── */
  const { data: enrollmentData, isLoading: loadingEnrollment } =
    useGetCurrentEnrollmentQuery(studentId as string, {
      skip: !studentId || !!directClassId,
    });

  const enrollment = useMemo(() => unwrap<any>(enrollmentData), [enrollmentData]);
  const enrollmentClassId: string | undefined =
    enrollment?.classId ?? enrollment?.class?.id;

  const classId: string | undefined = directClassId ?? enrollmentClassId;

  /* ── 6. Grade level + term lookups ───────────────────────── */
  const gradeLevelId: string | undefined =
    fullStudent?.class?.gradeLevelId ??
    fullStudent?.class?.gradeLevel?.id ??
    studentRecord?.class?.gradeLevelId ??
    studentRecord?.gradeLevelId;

  const { data: gradeLevelData } = useGetGradeLevelByIdQuery(
    gradeLevelId as string,
    { skip: !gradeLevelId }
  );

  // ✅ defensive unwrap — handles both { data } and { gradeLevel } shapes
  const gradeLevel: any =
    (gradeLevelData as any)?.data ??
    (gradeLevelData as any)?.gradeLevel ??
    null;

  const { data: termData } = useGetCurrentTermBySchoolIdQuery(
    schoolId as string,
    { skip: !schoolId }
  );

  // ✅ FIX for the TS2339 error — read BOTH possible shapes
  const currentTerm: any =
    (termData as any)?.data ??
    (termData as any)?.term ??
    null;

  /* ── 7. Identity labels ──────────────────────────────────── */
  const className: string =
    fullStudent?.class?.name ??
    fullStudent?.className ??
    profile.className ??
    profile.class?.name ??
    "My Class";

  const stream: string | undefined =
    fullStudent?.class?.stream ??
    studentRecord?.class?.stream ??
    profile.class?.stream;

  const gradeName: string | undefined =
    fullStudent?.class?.gradeLevel?.name ??
    gradeLevel?.name ??
    fullStudent?.gradeLevel?.name;

  const educationStage: string | undefined =
    fullStudent?.class?.gradeLevel?.educationStage ??
    gradeLevel?.educationStage;

  const academicYear: string | undefined =
    fullStudent?.class?.academicYear ?? fullStudent?.academicYear;

  const classTeacherName: string | undefined =
    fullStudent?.class?.classTeacher?.name ??
    fullStudent?.class?.classTeacherName ??
    fullStudent?.classTeacherName;

  const admissionNumber: string | undefined =
    fullStudent?.admissionNumber ??
    studentRecord?.admissionNumber ??
    profile.admissionNumber;

  const upiNumber: string | undefined =
    fullStudent?.upiNumber ?? studentRecord?.upiNumber;

  const studentName =
    [
      fullStudent?.firstName ?? studentRecord?.firstName,
      fullStudent?.middleName ?? studentRecord?.middleName,
      fullStudent?.lastName ?? studentRecord?.lastName,
    ]
      .filter(Boolean)
      .join(" ") || null;

  /* ── ✅ 8. THE GRADE TITLE — e.g. "Grade 8 · North" ─────── */
  // Priority: Grade + Stream → Grade → Class + Stream → Class
  const gradeTitle: string = (() => {
    const g = gradeName ?? className;
    if (g && stream) return `${g} · ${stream}`;
    return g ?? "My Class";
  })();

  // Short form for badges (e.g. "G8") if grade name has "Grade N"
  const gradeShort: string | undefined = (() => {
    const g = gradeName ?? className;
    if (!g) return undefined;
    const m = String(g).match(/grade\s*(\d+)/i);
    if (m) return `G${m[1]}`;
    const d = String(g).match(/^(\d+)/);
    if (d) return `G${d[1]}`;
    return g;
  })();

  /* ── 9. Timetable data ───────────────────────────────────── */
  const {
    data: ttData,
    isLoading: loadingTt,
    isError: ttError,
    error: ttErr,
  } = useGetClassTimetableQuery(classId as string, { skip: !classId });

  const { data: periodsData } = useListAllPeriodsQuery(schoolId as string, {
    skip: !schoolId,
  });

  const { data: currentData } = useGetClassCurrentLessonQuery(classId as string, {
    skip: !classId,
    pollingInterval: 60_000,
  });
  const { data: nextData } = useGetClassNextLessonQuery(classId as string, {
    skip: !classId,
    pollingInterval: 60_000,
  });

  const currentSlot = currentData?.slot ?? null;
  const nextSlot = nextData?.slot ?? null;
  const slots: TimetableSlot[] = useMemo(() => ttData?.slots ?? [], [ttData]);

  /* ── 10. Periods (rows) ──────────────────────────────────── */
  const periods: Period[] = useMemo(() => {
    const map = new Map<string, Period>();
    const fromApi: Period[] = ttData?.periods?.length
      ? ttData.periods
      : periodsData?.periods ?? [];
    fromApi.forEach((p) => map.set(p.id, p));
    slots.forEach((s) => {
      if (s.period && !map.has(s.period.id)) map.set(s.period.id, s.period);
    });
    return [...map.values()].sort(
      (a, b) =>
        (a.periodNumber ?? 0) - (b.periodNumber ?? 0) ||
        String(a.startTime).localeCompare(String(b.startTime))
    );
  }, [ttData, periodsData, slots]);

  /* ── 11. Days (columns) ──────────────────────────────────── */
  const days = useMemo(() => {
    const used = new Set(slots.map((s) => normDay(s.dayOfWeek)));
    return [...BASE_DAYS, ...EXTRA_DAYS.filter((d) => used.has(d.toLowerCase()))];
  }, [slots]);

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const selectedDay = pickedDay ?? (days.includes(todayName) ? todayName : days[0]);

  /* ── 12. Lookup map ──────────────────────────────────────── */
  const slotMap = useMemo(() => {
    const m = new Map<string, TimetableSlot>();
    slots.forEach((s) => {
      const key = `${normDay(s.dayOfWeek)}::${s.periodId}`;
      if (!m.has(key)) m.set(key, s);
    });
    return m;
  }, [slots]);

  const getSlot = (day: string, periodId: string) =>
    slotMap.get(`${normDay(day)}::${periodId}`);

  /* ── 13. Derived stats ───────────────────────────────────── */
  const teachingSlots = slots.filter((s) => !s.period?.isBreak);
  const lessonsThisWeek = teachingSlots.length;
  const subjectCount = new Set(teachingSlots.map((s) => s.subjectId).filter(Boolean)).size;
  const todayCount = teachingSlots.filter(
    (s) => normDay(s.dayOfWeek) === todayName.toLowerCase()
  ).length;

  const uniqueSubjects = useMemo(() => {
    const m = new Map<string, { id: string; name: string; code?: string; count: number }>();
    teachingSlots.forEach((s) => {
      if (!s.subjectId) return;
      const name = s.subject?.name ?? (s as any)?.subjectName ?? "Subject";
      const code = s.subject?.code;
      const existing = m.get(s.subjectId);
      if (existing) existing.count++;
      else m.set(s.subjectId, { id: s.subjectId, name, code, count: 1 });
    });
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [teachingSlots]);

  /* ── 14. Live timing ─────────────────────────────────────── */
  const nowMin = (() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  })();

  const curStart = toMin(currentSlot?.period?.startTime);
  const curEnd = toMin(currentSlot?.period?.endTime);
  const curDuration = curStart != null && curEnd != null ? curEnd - curStart : null;
  const curLeft = curEnd != null ? Math.max(0, curEnd - nowMin) : null;
  const curProgress =
    curDuration && curLeft != null
      ? Math.min(100, Math.max(0, Math.round(((curDuration - curLeft) / curDuration) * 100)))
      : null;

  const nextStart = toMin(nextSlot?.period?.startTime);
  const nextIn =
    nextStart != null && normDay(nextSlot?.dayOfWeek) === todayName.toLowerCase()
      ? Math.max(0, nextStart - nowMin)
      : null;

  const fmtMins = (m: number) =>
    m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;

  /* ── 15. Gates ───────────────────────────────────────────── */
  const resolvingIdentity =
    loadingProfile ||
    (!classId && (loadingStudent || loadingFull || loadingEnrollment));

  if (resolvingIdentity || (classId && loadingTt)) return <TimetableSkeleton />;

  if (profileError || ttError) {
    return (
      <div className="p-6 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">
          {errMsg(ttError ? ttErr : profileErr, "Could not load your timetable.")}
        </span>
      </div>
    );
  }

  if (!classId) {
    const message = studentLookupError
      ? "We couldn't find your student record. Please contact the school office."
      : "You haven't been assigned to a class yet.";
    return (
      <div className={`${CARD} max-w-xl mx-auto text-center space-y-3`}>
        <GraduationCap className="w-10 h-10 mx-auto text-primary" />
        <p className="text-base font-black">{message}</p>
        <p className="text-xs opacity-60">
          Once you're enrolled in a class, your timetable will appear here automatically.
        </p>
      </div>
    );
  }

  const isNow = (s?: TimetableSlot) =>
    !!s && !!currentSlot && s.id === currentSlot.id;

  /* ── Small pieces ────────────────────────────────────────── */
  const LessonMeta = ({ slot }: { slot: TimetableSlot }) => (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
      {teacherName(slot) && (
        <span className="inline-flex items-center gap-1 text-[11px] opacity-65">
          <User className="w-3 h-3" /> {teacherName(slot)}
        </span>
      )}
      {slot.room && (
        <span className="inline-flex items-center gap-1 text-[11px] opacity-65">
          <MapPin className="w-3 h-3" /> {slot.room}
        </span>
      )}
    </div>
  );

  const StatPill = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-base-100/70 border border-base-300">
      <div className="p-2 rounded-xl bg-primary/10 text-primary">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-black opacity-55">
          {label}
        </p>
        <p className="text-sm font-bold truncate">{value}</p>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-base-200 to-secondary/20 p-6 sm:p-8 rounded-3xl border border-base-300 shadow-sm">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-56 h-56 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-3xl bg-primary text-primary-content grid place-items-center shadow-lg shrink-0">
            <CalendarDays className="w-9 h-9" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-55 mb-1">
              Student Timetable
            </p>

            {/* ✅ BIG GRADE TITLE — e.g. "Grade 8 · North" */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary truncate">
              {gradeTitle}
            </h1>

            {/* Student name line */}
            {studentName && (
              <p className="text-sm font-bold opacity-80 mt-1 truncate">
                {studentName}
              </p>
            )}

            {/* identity badges */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {/* ✅ explicit grade badge — "G8" short form */}
              {gradeShort && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary/10 text-secondary text-[10px] font-black uppercase rounded-full border border-secondary/20">
                  <GraduationCap className="w-3 h-3" /> {gradeShort}
                  {educationStage && (
                    <span className="opacity-70">· {educationStage}</span>
                  )}
                </span>
              )}
              {className && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full border border-primary/20">
                  <School className="w-3 h-3" /> {className}
                  {stream && <> · {stream}</>}
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
              {upiNumber && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-base-100 border border-base-300 text-[10px] font-black uppercase rounded-full font-mono">
                  <BadgeCheck className="w-3 h-3" /> UPI {upiNumber}
                </span>
              )}
              {classTeacherName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-base-100 border border-base-300 text-[10px] font-black uppercase rounded-full">
                  <Users className="w-3 h-3" /> {classTeacherName}
                </span>
              )}
              {currentTerm?.termName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success text-[10px] font-black uppercase rounded-full border border-success/20">
                  <Sparkles className="w-3 h-3" /> {currentTerm.termName}
                  {currentTerm.academicYear && (
                    <span className="opacity-70">· {currentTerm.academicYear}</span>
                  )}
                </span>
              )}
            </div>

            {/* live indicator */}
            <div className="mt-4">
              {currentSlot ? (
                <div className="space-y-2 max-w-md">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase rounded-full bg-success/10 text-success">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    Now: {subjectName(currentSlot)}
                  </span>
                  {curLeft != null && curDuration != null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono opacity-60">
                        <span>{fmtMins(curLeft)} left</span>
                        <span>
                          {to12h(currentSlot.period?.startTime)} –{" "}
                          {to12h(currentSlot.period?.endTime)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-base-300/60 overflow-hidden">
                        <div
                          className="h-full bg-success transition-all duration-700"
                          style={{ width: `${curProgress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase rounded-full bg-base-300/60 opacity-80">
                  <Radio className="w-3.5 h-3.5" /> No lesson in progress
                </span>
              )}
            </div>
          </div>
        </div>

        {/* stats strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <StatPill icon={BookOpen} label="Lessons / week" value={lessonsThisWeek} />
          <StatPill icon={LayoutGrid} label="Subjects" value={subjectCount} />
          <StatPill icon={CalendarClock} label="Today" value={todayCount} />
          <StatPill
            icon={Timer}
            label="Current period"
            value={currentSlot?.period?.name ?? "—"}
          />
        </div>
      </div>

      {/* ── NOW / NEXT ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${CARD} !p-5 sm:!p-6 !border-success/30`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-success animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-wider opacity-70">
                Happening now
              </h2>
            </div>
            {curLeft != null && (
              <span className="px-2.5 py-1 bg-success/10 text-success text-[10px] font-black uppercase rounded-full">
                {fmtMins(curLeft)} left
              </span>
            )}
          </div>
          {currentSlot ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success/10 text-success rounded-2xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black truncate">
                    {subjectName(currentSlot)}
                  </p>
                  {currentSlot.subject?.code && (
                    <p className="text-[10px] font-mono opacity-55">
                      {currentSlot.subject.code}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t border-base-300">
                {teacherName(currentSlot) && (
                  <span className="inline-flex items-center gap-1 text-xs opacity-70">
                    <User className="w-3.5 h-3.5" /> {teacherName(currentSlot)}
                  </span>
                )}
                {currentSlot.room && (
                  <span className="inline-flex items-center gap-1 text-xs opacity-70">
                    <MapPin className="w-3.5 h-3.5" /> {currentSlot.room}
                  </span>
                )}
                {currentSlot.period && (
                  <span className="inline-flex items-center gap-1 text-xs opacity-70 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {to12h(currentSlot.period.startTime)} –{" "}
                    {to12h(currentSlot.period.endTime)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs opacity-60">There's no lesson right now.</p>
          )}
        </div>

        <div className={`${CARD} !p-5 sm:!p-6`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-wider opacity-70">
                Up next
              </h2>
            </div>
            {nextIn != null && (
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">
                in {fmtMins(nextIn)}
              </span>
            )}
          </div>
          {nextSlot ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black truncate">
                    {subjectName(nextSlot)}
                  </p>
                  {nextSlot.period && (
                    <p className="text-[10px] font-mono opacity-55">
                      {capDay(String(nextSlot.dayOfWeek))} ·{" "}
                      {to12h(nextSlot.period.startTime)} –{" "}
                      {to12h(nextSlot.period.endTime)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t border-base-300">
                {teacherName(nextSlot) && (
                  <span className="inline-flex items-center gap-1 text-xs opacity-70">
                    <User className="w-3.5 h-3.5" /> {teacherName(nextSlot)}
                  </span>
                )}
                {nextSlot.room && (
                  <span className="inline-flex items-center gap-1 text-xs opacity-70">
                    <MapPin className="w-3.5 h-3.5" /> {nextSlot.room}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs opacity-60">No more lessons scheduled today.</p>
          )}
        </div>
      </div>

      {/* ── SUBJECT CHIPS ───────────────────────────────────── */}
      {uniqueSubjects.length > 0 && (
        <div className={`${CARD} !p-5`}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-secondary" />
            <h2 className="text-xs font-black uppercase tracking-wider opacity-70">
              Subjects this week
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueSubjects.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-100 border border-base-300 text-xs font-bold"
              >
                <span className="text-primary">{s.name}</span>
                {s.code && (
                  <span className="text-[10px] font-mono opacity-55">{s.code}</span>
                )}
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                  {s.count}×
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── TABS ────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-base-300 pb-3">
        {([
          ["today", "By Day", CalendarClock],
          ["week", "Full Week", LayoutGrid],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              tab === id
                ? "bg-primary text-primary-content shadow-md"
                : "bg-base-200/50 hover:bg-base-200 opacity-75"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {slots.length === 0 && (
        <div className="p-10 text-center border-2 border-dashed border-base-300 rounded-3xl space-y-2">
          <CalendarDays className="w-8 h-8 mx-auto opacity-40" />
          <p className="text-sm font-bold">Timetable not published yet</p>
          <p className="text-xs opacity-60">
            Your class timetable hasn't been published. Check back soon.
          </p>
        </div>
      )}

      {/* ── BY DAY ──────────────────────────────────────────── */}
      {slots.length > 0 && tab === "today" && (
        <div className={`${CARD} space-y-5`}>
          <div className="flex gap-2 flex-wrap pb-4 border-b border-base-300">
            {days.map((d) => {
              const count = teachingSlots.filter(
                (s) => normDay(s.dayOfWeek) === normDay(d)
              ).length;
              return (
                <button
                  key={d}
                  onClick={() => setPickedDay(d)}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 ${
                    selectedDay === d
                      ? "bg-primary text-primary-content shadow-md"
                      : "bg-base-100 border border-base-300 hover:bg-base-200 opacity-80"
                  }`}
                >
                  {d.slice(0, 3)}
                  {d === todayName && (
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  )}
                  <span
                    className={`text-[9px] font-mono px-1 rounded ${
                      selectedDay === d
                        ? "bg-primary-content/20"
                        : "bg-base-300/50"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider opacity-70">
              {selectedDay === todayName ? "Today" : selectedDay}
            </h2>
            <span className="text-[11px] font-mono opacity-60">
              {
                teachingSlots.filter(
                  (s) => normDay(s.dayOfWeek) === normDay(selectedDay)
                ).length
              }{" "}
              lessons
            </span>
          </div>

          {teachingSlots.filter(
            (s) => normDay(s.dayOfWeek) === normDay(selectedDay)
          ).length === 0 && (
            <div className="py-10 text-center border-2 border-dashed border-base-300 rounded-2xl">
              <Coffee className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold opacity-70">
                No lessons on {selectedDay}
              </p>
              <p className="text-[11px] opacity-50">Enjoy your day off.</p>
            </div>
          )}

          <div className="space-y-2">
            {periods.map((p) => {
              const slot = getSlot(selectedDay, p.id);
              const time = `${to12h(p.startTime)} – ${to12h(p.endTime)}`;
              const dur =
                toMin(p.endTime) != null && toMin(p.startTime) != null
                  ? (toMin(p.endTime) as number) - (toMin(p.startTime) as number)
                  : null;

              if (p.isBreak) {
                return (
                  <div
                    key={p.id}
                    className="p-3 border-2 border-dashed border-base-300 rounded-2xl flex items-center gap-3 opacity-70"
                  >
                    <div className="p-2 bg-base-300/50 rounded-xl">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold flex-1">{p.name}</p>
                    {dur != null && (
                      <span className="text-[10px] font-mono opacity-50">
                        {dur} min
                      </span>
                    )}
                    <span className="text-[11px] font-mono opacity-70">{time}</span>
                  </div>
                );
              }

              const now = isNow(slot);
              return (
                <div
                  key={p.id}
                  className={`p-4 bg-base-100 border rounded-2xl flex items-center gap-3 transition-all ${
                    now
                      ? "border-success ring-2 ring-success/20 shadow-sm"
                      : "border-base-300"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl ${
                      now
                        ? "bg-success/10 text-success"
                        : slot
                        ? "bg-primary/10 text-primary"
                        : "bg-base-300/40 opacity-50"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {slot ? (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate">
                            {subjectName(slot)}
                          </p>
                          {slot.subject?.code && (
                            <span className="text-[9px] font-mono opacity-50 px-1.5 py-0.5 bg-base-300/50 rounded">
                              {slot.subject.code}
                            </span>
                          )}
                        </div>
                        <LessonMeta slot={slot} />
                      </>
                    ) : (
                      <p className="text-sm font-medium opacity-50">Free period</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    {now && (
                      <span className="inline-block mb-1 px-2 py-0.5 bg-success/10 text-success text-[10px] font-extrabold uppercase rounded">
                        Now
                      </span>
                    )}
                    <p className="text-[11px] font-mono opacity-60 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" /> {time}
                    </p>
                    <p className="text-[10px] opacity-50">
                      {p.name}
                      {dur != null && <> · {dur}m</>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FULL WEEK ───────────────────────────────────────── */}
      {slots.length > 0 && tab === "week" && (
        <div className={`${CARD} !p-4 sm:!p-6`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-1.5">
              <thead>
                <tr>
                  <th className="w-28 text-left text-[10px] font-black uppercase tracking-wider opacity-55 px-2">
                    Period
                  </th>
                  {days.map((d) => (
                    <th
                      key={d}
                      className={`text-[11px] font-black uppercase tracking-wider py-2 rounded-xl ${
                        d === todayName
                          ? "bg-primary text-primary-content shadow-sm"
                          : "bg-base-100 opacity-80"
                      }`}
                    >
                      {d.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((p) =>
                  p.isBreak ? (
                    <tr key={p.id}>
                      <td colSpan={days.length + 1}>
                        <div className="py-2 px-3 border-2 border-dashed border-base-300 rounded-xl text-[11px] font-bold opacity-65 flex items-center gap-2">
                          <Coffee className="w-3.5 h-3.5" /> {p.name}
                          <span className="font-mono opacity-70 ml-auto">
                            {to12h(p.startTime)} – {to12h(p.endTime)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id}>
                      <td className="px-2 align-middle">
                        <p className="text-xs font-bold">{p.name}</p>
                        <p className="text-[10px] font-mono opacity-55">
                          {to12h(p.startTime)} – {to12h(p.endTime)}
                        </p>
                      </td>
                      {days.map((d) => {
                        const slot = getSlot(d, p.id);
                        const now = isNow(slot);
                        return (
                          <td
                            key={d}
                            className={`align-top p-2.5 rounded-xl border transition-all ${
                              now
                                ? "border-success ring-2 ring-success/20 bg-success/5"
                                : d === todayName
                                ? "border-primary/30 bg-primary/5"
                                : "border-base-300 bg-base-100 hover:bg-base-200/40"
                            }`}
                          >
                            {slot ? (
                              <>
                                <p className="text-xs font-bold leading-tight">
                                  {subjectName(slot)}
                                </p>
                                {teacherName(slot) && (
                                  <p className="text-[10px] opacity-60 mt-0.5 truncate flex items-center gap-1">
                                    <User className="w-2.5 h-2.5" />{" "}
                                    {teacherName(slot)}
                                  </p>
                                )}
                                {slot.room && (
                                  <p className="text-[10px] opacity-50 font-mono truncate flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5" />{" "}
                                    {slot.room}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-[11px] opacity-30 text-center">—</p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}