import React, { useMemo, useState } from "react";
import {
  CalendarDays, Calendar, Sparkles, Trophy, Users, Palette, GraduationCap,
  MapPin, Clock, AlertCircle, Loader2, School, Hash, ChevronLeft, ChevronRight,
  ChevronDown, Filter, Info, Star, Award, Activity, CalendarRange, List,
  LayoutGrid, ArrowRight, CheckCircle2,
} from "lucide-react";
import { useGetMyProfileQuery } from "../../features/Apis/Auth.Api";
import {
  useGetStudentByUserIdQuery,
  useGetStudentWithRelationsQuery,
} from "../../features/Apis/students.Api";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";
import { useGetCurrentTermBySchoolIdQuery } from "../../features/Apis/Term.Api";
import {
  useGetTodayEventsQuery,
  useGetUpcomingEventsQuery,
  useGetEventsForSchoolQuery,
  useGetEventCalendarQuery,
  useGetEventStatsQuery,
  useGetStudentActivitiesQuery,
  useGetStudentActivitySummaryQuery,
} from "../../features/Apis/Events.Api";
import type {
  SchoolEvent,
  CoCurricularActivity,
  ActivityMembership,
} from "../../features/Apis/Events.Api";

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */
const CARD =
  "bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 sm:p-8 rounded-3xl shadow-xl";

const EVENT_STYLES: Record<
  string,
  { icon: any; chip: string; dot: string }
> = {
  Academic: {
    icon: GraduationCap,
    chip: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  Sports: {
    icon: Trophy,
    chip: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  Meeting: {
    icon: Users,
    chip: "bg-info/10 text-info border-info/20",
    dot: "bg-info",
  },
  Cultural: {
    icon: Sparkles,
    chip: "bg-secondary/10 text-secondary border-secondary/20",
    dot: "bg-secondary",
  },
  General: {
    icon: CalendarDays,
    chip: "bg-base-300 text-base-content/70 border-base-300",
    dot: "bg-base-content/40",
  },
};

const ACTIVITY_STYLES: Record<
  string,
  { icon: any; chip: string; dot: string }
> = {
  Sports: {
    icon: Trophy,
    chip: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  Academic: {
    icon: GraduationCap,
    chip: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  Clubs: {
    icon: Users,
    chip: "bg-info/10 text-info border-info/20",
    dot: "bg-info",
  },
  Arts: {
    icon: Palette,
    chip: "bg-secondary/10 text-secondary border-secondary/20",
    dot: "bg-secondary",
  },
  Cultural: {
    icon: Sparkles,
    chip: "bg-secondary/10 text-secondary border-secondary/20",
    dot: "bg-secondary",
  },
};

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const pad = (n: number) => String(n).padStart(2, "0");

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const fmtTime = (d?: string | null) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
};

const fmtLongDate = (d?: string | null) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const fmtMonthLabel = (y: number, m: number) =>
  new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

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

const extractEvents = (v: any): SchoolEvent[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of ["events", "data", "records"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const extractActivities = (v: any): CoCurricularActivity[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of ["activities", "data", "records"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const extractMemberships = (v: any): ActivityMembership[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return [];
  for (const k of ["memberships", "members", "data"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/* ═══════════════════════════════════════════════════════════════
   EVENT STATUS
   ═══════════════════════════════════════════════════════════════ */
function eventStatus(ev: SchoolEvent) {
  const now = new Date();
  const start = new Date(ev.startDate);
  const end = new Date(ev.endDate);
  if (end < now) return { label: "Past", tone: "bg-base-300 text-base-content/60" };
  if (start <= now && end >= now)
    return { label: "Ongoing", tone: "bg-success text-success-content animate-pulse" };
  if (sameDay(start, now))
    return { label: "Today", tone: "bg-primary text-primary-content" };
  return { label: "Upcoming", tone: "bg-info/10 text-info border border-info/20" };
}

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function CategoryChip({
  category,
  type = "event",
}: {
  category: string;
  type?: "event" | "activity";
}) {
  const styles = type === "event" ? EVENT_STYLES : ACTIVITY_STYLES;
  const s = styles[category] ?? styles.General ?? EVENT_STYLES.General;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${s.chip}`}
    >
      <Icon className="w-3 h-3" />
      {category}
    </span>
  );
}

function DateBlock({ date, highlight }: { date: string; highlight?: boolean }) {
  const dt = new Date(date);
  const day = dt.getDate();
  const month = dt.toLocaleDateString("en-US", { month: "short" });
  const weekday = dt.toLocaleDateString("en-US", { weekday: "short" });
  return (
    <div
      className={`w-14 shrink-0 rounded-xl text-center overflow-hidden border ${
        highlight ? "border-primary bg-primary text-primary-content" : "border-base-300 bg-base-100"
      }`}
    >
      <div
        className={`text-[9px] font-black uppercase py-0.5 ${
          highlight ? "bg-primary-content/20" : "bg-base-200 opacity-70"
        }`}
      >
        {month}
      </div>
      <div className="text-base font-black leading-tight py-0.5">{day}</div>
      <div className="text-[9px] uppercase opacity-60 pb-0.5">{weekday}</div>
    </div>
  );
}

function EventCard({ event, compact }: { event: SchoolEvent; compact?: boolean }) {
  const status = eventStatus(event);
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const isToday = sameDay(start, new Date());

  return (
    <div className="p-3.5 bg-base-100 border border-base-300 rounded-2xl flex items-start gap-3 hover:border-primary/40 transition">
      <DateBlock date={event.startDate} highlight={isToday || status.label === "Ongoing"} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-black truncate">{event.title}</p>
          <CategoryChip category={event.category} />
          <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${status.tone}`}>
            {status.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] opacity-65">
          <span className="inline-flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" />
            {fmtTime(event.startDate)} – {fmtTime(event.endDate)}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {event.location}
            </span>
          )}
        </div>

        {!compact && event.description && (
          <p className="text-xs opacity-70 mt-1.5 line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
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
        <p className="text-[10px] uppercase tracking-wider font-black opacity-55">{label}</p>
        <p className="text-base font-black leading-tight truncate">{value}</p>
        {sub && <p className="text-[10px] opacity-50 font-mono">{sub}</p>}
      </div>
    </div>
  );
}

function ActivityCard({
  activity,
  membership,
}: {
  activity: CoCurricularActivity;
  membership?: ActivityMembership;
}) {
  const style = ACTIVITY_STYLES[activity.category] ?? ACTIVITY_STYLES.Clubs;
  const Icon = style.icon;

  return (
    <div className="p-4 bg-base-100 border border-base-300 rounded-2xl hover:border-primary/40 transition">
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-2xl grid place-items-center shrink-0 ${style.chip}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black truncate">{activity.name}</p>
            <CategoryChip category={activity.category} type="activity" />
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] opacity-65">
            {membership?.performanceRole && (
              <span className="inline-flex items-center gap-1 font-bold text-primary">
                <Star className="w-3 h-3" /> {membership.performanceRole}
              </span>
            )}
            {activity.patron?.name && (
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" /> Patron: {activity.patron.name}
              </span>
            )}
            {membership?.termId && (
              <span className="inline-flex items-center gap-1 font-mono">
                <CalendarRange className="w-3 h-3" /> {membership.termId.slice(0, 8)}…
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
type Tab = "overview" | "events" | "calendar" | "activities";

export default function StudentEvents() {
  const [tab, setTab] = useState<Tab>("overview");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showPast, setShowPast] = useState<boolean>(false);
  const [activitiesTerm, setActivitiesTerm] = useState<string>("");

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);

  /* ── 1. Identity chain ── */
  const {
    data: profileData,
    isLoading: loadingProfile,
    isError: profileError,
    error: profileErr,
  } = useGetMyProfileQuery(undefined);
  const profile = useMemo(() => flattenProfile(profileData), [profileData]);
  const userId: string | undefined =
    profile.userId ?? profile.id ?? profile.user?.id ?? profile.authUserId;

  const { data: studentByUser, isLoading: loadingStudent } = useGetStudentByUserIdQuery(
    userId as string,
    { skip: !userId }
  );
  const studentRecord = useMemo(() => unwrap<any>(studentByUser), [studentByUser]);
  const studentId: string | undefined =
    studentRecord?.id ?? profile.studentId ?? profile.student?.id;

  const { data: fullStudentData, isLoading: loadingFull } = useGetStudentWithRelationsQuery(
    studentId as string,
    { skip: !studentId }
  );
  const fullStudent = useMemo(() => unwrap<any>(fullStudentData), [fullStudentData]);

  const schoolId: string | undefined =
    fullStudent?.schoolId ??
    studentRecord?.schoolId ??
    profile.schoolId ??
    profile.school?.id;

  /* ── 2. School + term ── */
  const { data: school } = useGetSchoolByIdQuery(schoolId as string, { skip: !schoolId });
  const { data: currentTermData } = useGetCurrentTermBySchoolIdQuery(schoolId as string, {
    skip: !schoolId,
  });
  const currentTerm: any = (currentTermData as any)?.data ?? (currentTermData as any)?.term;
  const currentTermId: string | undefined = currentTerm?.id;

  /* ── 3. Events queries ── */
  const { data: todayData, isLoading: loadingToday } = useGetTodayEventsQuery(
    schoolId as string,
    { skip: !schoolId }
  );
  const { data: upcomingData, isLoading: loadingUpcoming } = useGetUpcomingEventsQuery(
    { schoolId: schoolId!, withinDays: 30, limit: 5 },
    { skip: !schoolId }
  );
  const { data: statsData } = useGetEventStatsQuery(schoolId as string, {
    skip: !schoolId,
  });

  /* ── 4. Full events list ── */
  const {
    data: listData,
    isLoading: loadingList,
    isError: listError,
    error: listErr,
  } = useGetEventsForSchoolQuery(
    {
      schoolId: schoolId!,
      limit: 100,
      ...(categoryFilter ? { category: categoryFilter } : {}),
      upcomingOnly: !showPast,
    },
    { skip: !schoolId }
  );

  /* ── 5. Calendar ── */
  const monthStart = `${calYear}-${pad(calMonth)}-01T00:00:00.000Z`;
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const monthEnd = `${calYear}-${pad(calMonth)}-${pad(daysInMonth)}T23:59:59.999Z`;

  const {
    data: calendarData,
    isLoading: loadingCalendar,
    isError: calendarError,
    error: calendarErr,
  } = useGetEventCalendarQuery(
    { schoolId: schoolId!, from: monthStart, to: monthEnd },
    { skip: !schoolId }
  );

  /* ── 6. Activities ── */
  const {
    data: activitiesData,
    isLoading: loadingActivities,
    isError: activitiesError,
    error: activitiesErr,
  } = useGetStudentActivitiesQuery(
    {
      studentId: studentId!,
      ...(activitiesTerm ? { termId: activitiesTerm } : {}),
    },
    { skip: !studentId }
  );

  const { data: summaryData } = useGetStudentActivitySummaryQuery(studentId as string, {
    skip: !studentId,
  });

  /* ── 7. Normalise ── */
  const todayEvents = useMemo(() => extractEvents(todayData), [todayData]);
  const upcomingEvents = useMemo(() => extractEvents(upcomingData), [upcomingData]);
  const listEvents = useMemo(() => extractEvents(listData), [listData]);
  const stats = (statsData as any)?.stats ?? {};
  const calendarMap: Record<string, SchoolEvent[]> =
    (calendarData as any)?.calendar ?? (calendarData as any)?.data?.calendar ?? {};
  const activities = useMemo(() => extractActivities(activitiesData), [activitiesData]);
  const memberships = useMemo(() => extractMemberships(activitiesData), [activitiesData]);
  const summary = (summaryData as any)?.summary ?? (summaryData as any)?.data?.summary ?? {};

  const membershipByActivity = useMemo(() => {
    const m = new Map<string, ActivityMembership>();
    memberships.forEach((mem) => m.set(mem.activityId, mem));
    return m;
  }, [memberships]);

  /* ── 8. Calendar cells ── */
  const firstWeekday = new Date(calYear, calMonth - 1, 1).getDay();
  const calendarCells: Array<{ date: string | null; day: number | null }> = [];
  for (let i = 0; i < firstWeekday; i++) calendarCells.push({ date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      date: `${calYear}-${pad(calMonth)}-${pad(d)}`,
      day: d,
    });
  }

  const eventsByDay = useMemo(() => {
    const m = new Map<string, SchoolEvent[]>();
    const all = Object.values(calendarMap).flat();
    all.forEach((ev) => {
      const d = new Date(ev.startDate);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const arr = m.get(key) ?? [];
      arr.push(ev);
      m.set(key, arr);
    });
    return m;
  }, [calendarMap]);

  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  /* ── 9. Labels ── */
  const className: string =
    fullStudent?.class?.name ?? fullStudent?.className ?? profile.className ?? "My Class";
  const stream: string | undefined =
    fullStudent?.class?.stream ?? studentRecord?.class?.stream;
  const admissionNumber: string | undefined =
    fullStudent?.admissionNumber ?? studentRecord?.admissionNumber;
  const studentName =
    [
      fullStudent?.firstName ?? studentRecord?.firstName,
      fullStudent?.lastName ?? studentRecord?.lastName,
    ]
      .filter(Boolean)
      .join(" ") || null;

  const primaryColor = school?.primaryColor || "#6366f1";

  /* ── 10. Gates ── */
  const resolvingIdentity =
    loadingProfile || (!studentId && (loadingStudent || loadingFull));

  if (resolvingIdentity) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-40 rounded-3xl bg-base-200/60" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-base-200/60" />
          ))}
        </div>
        <div className="h-72 rounded-3xl bg-base-200/60" />
      </div>
    );
  }

  if (profileError || !studentId) {
    return (
      <div className={`${CARD} max-w-xl mx-auto text-center space-y-3`}>
        <GraduationCap className="w-10 h-10 mx-auto text-primary" />
        <p className="text-base font-black">We couldn't find your student record.</p>
        <p className="text-xs opacity-60">
          Please contact the school office to have your record linked to your account.
        </p>
      </div>
    );
  }

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
          <div
            className="w-20 h-20 rounded-3xl text-white grid place-items-center shadow-lg shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <CalendarDays className="w-9 h-9" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-55 mb-1">
              Events & Activities
            </p>
            <h1
              className="text-2xl sm:text-3xl font-black tracking-tight truncate"
              style={{ color: primaryColor }}
            >
              {className}
            </h1>
            {studentName && (
              <p className="text-sm font-bold opacity-80 mt-1 truncate">{studentName}</p>
            )}

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase rounded-full border"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  borderColor: `${primaryColor}40`,
                }}
              >
                <School className="w-3 h-3" /> {className}
                {stream && <> · {stream}</>}
              </span>
              {admissionNumber && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-base-100 border border-base-300 text-[10px] font-black uppercase rounded-full font-mono">
                  <Hash className="w-3 h-3" /> {admissionNumber}
                </span>
              )}
              {currentTerm?.termName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success text-[10px] font-black uppercase rounded-full border border-success/20">
                  <Sparkles className="w-3 h-3" /> {currentTerm.termName}{" "}
                  {currentTerm.academicYear}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <StatTile
            icon={Calendar}
            label="Total events"
            value={stats.total ?? listEvents.length}
          />
          <StatTile
            icon={CalendarRange}
            label="Upcoming"
            value={stats.upcoming ?? upcomingEvents.length}
            tone="text-info"
            bg="bg-info/10"
          />
          <StatTile
            icon={Star}
            label="This month"
            value={stats.thisMonth ?? 0}
            tone="text-warning"
            bg="bg-warning/10"
          />
          <StatTile
            icon={Award}
            label="My activities"
            value={summary.totalActivities ?? activities.length}
            tone="text-secondary"
            bg="bg-secondary/10"
          />
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 border-b border-base-300 pb-3 flex-wrap">
        {(
          [
            ["overview", "Overview", LayoutGrid],
            ["events", "All Events", List],
            ["calendar", "Calendar", CalendarDays],
            ["activities", "My Activities", Star],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              tab === id ? "text-white shadow-md" : "bg-base-200/50 hover:bg-base-200 opacity-75"
            }`}
            style={tab === id ? { backgroundColor: primaryColor } : {}}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          OVERVIEW
         ═══════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today */}
          <div className={`${CARD} space-y-4`}>
            <div className="flex items-center gap-3 pb-3 border-b border-base-300">
              <div className="p-2 rounded-xl bg-success/10 text-success">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider">Today</h2>
                <p className="text-[10px] font-mono opacity-60">{fmtLongDate(new Date().toISOString())}</p>
              </div>
            </div>

            {loadingToday ? (
              <div className="p-6 text-center text-xs opacity-60">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
              </div>
            ) : todayEvents.length === 0 ? (
              <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
                <Calendar className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="font-bold">No events today</p>
                <p className="opacity-70">Enjoy your regular schedule.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className={`${CARD} space-y-4`}>
            <div className="flex items-center gap-3 pb-3 border-base-300 border-b">
              <div className="p-2 rounded-xl bg-info/10 text-info">
                <CalendarRange className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider">Coming up</h2>
              <button
                onClick={() => setTab("events")}
                className="ml-auto text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loadingUpcoming ? (
              <div className="p-6 text-center text-xs opacity-60">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
                <CalendarRange className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="font-bold">No upcoming events</p>
                <p className="opacity-70">Within the next 30 days.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 5).map((ev) => (
                  <EventCard key={ev.id} event={ev} compact />
                ))}
              </div>
            )}
          </div>

          {/* My activities snapshot */}
          <div className={`${CARD} lg:col-span-2 space-y-4`}>
            <div className="flex items-center gap-3 pb-3 border-b border-base-300">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                <Star className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider">My activities</h2>
              <button
                onClick={() => setTab("activities")}
                className="ml-auto text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loadingActivities ? (
              <div className="p-6 text-center text-xs opacity-60">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
                <Star className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="font-bold">Not enrolled in any activities yet</p>
                <p className="opacity-70">Speak to your class teacher to join one.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activities.slice(0, 6).map((a) => {
                  const style = ACTIVITY_STYLES[a.category] ?? ACTIVITY_STYLES.Clubs;
                  const Icon = style.icon;
                  const mem = membershipByActivity.get(a.id);
                  return (
                    <span
                      key={a.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border ${style.chip}`}
                    >
                      <Icon className="w-3 h-3" />
                      {a.name}
                      {mem?.performanceRole && (
                        <span className="opacity-65 text-[10px]">· {mem.performanceRole}</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ALL EVENTS
         ═══════════════════════════════════════════════════════ */}
      {tab === "events" && (
        <div className={`${CARD} space-y-4`}>
          <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-base-300">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-wider">School events</h2>
            </div>
            <div className="flex gap-2 ml-auto flex-wrap">
              <button
                onClick={() => setShowPast((v) => !v)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition ${
                  showPast
                    ? "bg-primary text-primary-content shadow-sm"
                    : "bg-base-100 border border-base-300 hover:bg-base-200"
                }`}
              >
                {showPast ? "Showing all" : "Upcoming only"}
              </button>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-[10px] font-black uppercase bg-base-100 border border-base-300 rounded-lg cursor-pointer"
              >
                <option value="">All categories</option>
                {Object.keys(EVENT_STYLES).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingList ? (
            <div className="p-12 text-center text-xs opacity-60">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading events…
            </div>
          ) : listError ? (
            <div className="p-4 bg-error/10 text-error rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errMsg(listErr, "Could not load events.")}
            </div>
          ) : listEvents.length === 0 ? (
            <div className="p-12 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-bold">No events</p>
              <p className="opacity-70">
                {showPast && !categoryFilter
                  ? "The school hasn't scheduled any events yet."
                  : "No events match the current filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...listEvents]
                .sort((a, b) => a.startDate.localeCompare(b.startDate))
                .map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          CALENDAR
         ═══════════════════════════════════════════════════════ */}
      {tab === "calendar" && (
        <div className={`${CARD} space-y-5`}>
          {/* Month nav */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-base-300">
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
                {Object.values(calendarMap).flat().length} events
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

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[9px] font-black uppercase tracking-wider opacity-55 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          {loadingCalendar ? (
            <div className="grid grid-cols-7 gap-1 animate-pulse">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-base-200/60" />
              ))}
            </div>
          ) : calendarError ? (
            <div className="p-4 bg-error/10 text-error rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errMsg(calendarErr, "Could not load calendar.")}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((c, i) => {
                if (!c.date) return <div key={i} />;
                const events = eventsByDay.get(c.date) ?? [];
                const isToday = c.date === todayKey;
                const hasEvents = events.length > 0;

                return (
                  <div
                    key={i}
                    title={
                      hasEvents
                        ? events.map((e) => `${fmtTime(e.startDate)} · ${e.title}`).join("\n")
                        : fmtLongDate(c.date)
                    }
                    className={`aspect-square rounded-xl border p-1 flex flex-col items-center justify-between transition ${
                      isToday
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : hasEvents
                        ? "border-primary/40 bg-primary/5"
                        : "border-base-300 bg-base-100"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-black leading-none ${
                        isToday ? "text-primary" : ""
                      }`}
                    >
                      {c.day}
                    </span>
                    {hasEvents && (
                      <div className="flex gap-0.5 flex-wrap justify-center">
                        {events.slice(0, 3).map((ev, j) => {
                          const style = EVENT_STYLES[ev.category] ?? EVENT_STYLES.General;
                          return (
                            <span
                              key={j}
                              className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                            />
                          );
                        })}
                        {events.length > 3 && (
                          <span className="text-[7px] font-black opacity-60">
                            +{events.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-3 border-t border-base-300 text-[10px]">
            {Object.entries(EVENT_STYLES).map(([cat, style]) => (
              <span key={cat} className="inline-flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className="font-bold opacity-70">{cat}</span>
              </span>
            ))}
          </div>

          {/* Events in this month */}
          <div className="space-y-2 pt-3 border-t border-base-300">
            <h3 className="text-[10px] font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Events this month
            </h3>
            {Object.values(calendarMap).flat().length === 0 ? (
              <div className="p-6 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
                No events in {fmtMonthLabel(calYear, calMonth)}.
              </div>
            ) : (
              <div className="space-y-2">
                {Object.values(calendarMap)
                  .flat()
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map((ev) => (
                    <EventCard key={ev.id} event={ev} compact />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MY ACTIVITIES
         ═══════════════════════════════════════════════════════ */}
      {tab === "activities" && (
        <div className={`${CARD} space-y-4`}>
          <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-base-300">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary" />
              <h2 className="text-sm font-black uppercase tracking-wider">My activities</h2>
            </div>
            <div className="ml-auto flex gap-2 items-center">
              <button
                onClick={() => setActivitiesTerm("")}
                className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition ${
                  !activitiesTerm
                    ? "bg-primary text-primary-content shadow-sm"
                    : "bg-base-100 border border-base-300 hover:bg-base-200"
                }`}
              >
                All terms
              </button>
              {currentTermId && (
                <button
                  onClick={() => setActivitiesTerm(currentTermId)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition ${
                    activitiesTerm === currentTermId
                      ? "bg-primary text-primary-content shadow-sm"
                      : "bg-base-100 border border-base-300 hover:bg-base-200"
                  }`}
                >
                  {currentTerm?.termName ?? "Current term"}
                </button>
              )}
            </div>
          </div>

          {/* Summary */}
          {summary.totalActivities != null && summary.totalActivities > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-base-100 border border-base-300">
                <p className="text-[9px] uppercase font-black opacity-55">Activities</p>
                <p className="text-lg font-black">{summary.totalActivities}</p>
              </div>
              {summary.byCategory &&
                Object.entries(summary.byCategory)
                  .slice(0, 3)
                  .map(([cat, count]) => (
                    <div
                      key={cat}
                      className="p-3 rounded-xl bg-base-100 border border-base-300"
                    >
                      <p className="text-[9px] uppercase font-black opacity-55">{cat}</p>
                      <p className="text-lg font-black">{count as any}</p>
                    </div>
                  ))}
            </div>
          )}

          {loadingActivities ? (
            <div className="p-12 text-center text-xs opacity-60">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading activities…
            </div>
          ) : activitiesError ? (
            <div className="p-4 bg-error/10 text-error rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errMsg(activitiesErr, "Could not load activities.")}
            </div>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-bold">Not enrolled in any activities</p>
              <p className="opacity-70">
                {activitiesTerm
                  ? "You're not in any activities for this term."
                  : "Speak to your class teacher to join a club, team, or society."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activities.map((a) => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  membership={membershipByActivity.get(a.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── INFO FOOTER ── */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-base-200/40 border border-base-300 text-[11px] opacity-70">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Events are set by the school administration. Activities and roles are
          managed by your club patron or class teacher. Contact them if any
          details need updating.
        </span>
      </div>
    </div>
  );
}