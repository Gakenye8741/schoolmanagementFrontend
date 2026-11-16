import React, { useMemo, useState } from "react";
import {
  TrendingUp, TrendingDown, Award, Wallet, GraduationCap, School, Hash,
  Sparkles, AlertCircle, Loader2, CheckCircle2, XCircle, Clock, Target,
  Percent, Layers, BarChart3, Activity as ActivityIcon, Bell, Megaphone,
  Users, Star, ArrowUpRight, ArrowDownRight, Minus, Info, CalendarRange,
  Trophy, Zap, Flame, ClipboardList, Send, FileText, Coffee, CalendarCheck,
  LayoutGrid, LineChart as LineChartIcon, PieChart, Home, Timer, Award as Medal,
  ChevronRight, Lightbulb, BookOpen, ThumbsUp, ShieldCheck, Hourglass,
  Lock, Crown, Gem,
} from "lucide-react";
import { useGetMyProfileQuery } from "../../features/Apis/Auth.Api";
import {
  useGetStudentByUserIdQuery,
  useGetStudentWithRelationsQuery,
} from "../../features/Apis/students.Api";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";
import {
  useGetCurrentTermBySchoolIdQuery,
  useGetTermsBySchoolIdQuery,
} from "../../features/Apis/Term.Api";
import { useGetGradeLevelByIdQuery } from "../../features/Apis/academicStructure.Api";
import {
  useGetStudentHistoryQuery,
  useGetStudentStatsQuery,
} from "../../features/Apis/Attendance.Apis";
import { useGetStudentTranscriptQuery } from "../../features/Apis/Exams.Api";
import { useGetStudentReportCardsQuery } from "../../features/Apis/ReportCard.Api";
import {
  useGetStudentHomeworkSummaryQuery,
  useGetSubmissionsByStudentQuery,
} from "../../features/Apis/Homework.Api";
import {
  useGetStudentBalanceQuery,
  useGetTransactionsByStudentQuery,
} from "../../features/Apis/Fees.Api";
import {
  useGetStudentActivitiesQuery,
  useGetUpcomingEventsQuery,
} from "../../features/Apis/Events.Api";
import { useGetMyActiveAnnouncementsQuery } from "../../features/Apis/Notifications.Api";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const CARD =
  "bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 sm:p-8 rounded-3xl shadow-xl";

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const pad = (n: number) => String(n).padStart(2, "0");
const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

const fmtMoney = (v: any): string => {
  const n = Number(v ?? 0);
  if (!isFinite(n)) return "KSh 0";
  return `KSh ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
};

const toNum = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
};

const safeNum = (v: any, d = 0): number => toNum(v) ?? d;

const pct = (score: any, max: any): number | null => {
  const s = toNum(score);
  const m = toNum(max);
  if (s === null || m === null || m === 0) return null;
  return Math.round((s / m) * 1000) / 10;
};

const daysBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

const ordinal = (n?: number | null) => {
  if (n == null || n <= 0) return "";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const flattenProfile = (data: any): Record<string, any> => {
  const root = data?.user ?? data?.profile ?? data?.data ?? data ?? {};
  const nested = root?.student ?? root?.studentProfile ?? {};
  return { ...nested, ...root };
};

const unwrap = <T,>(v: any): T | null =>
  (v?.student ?? v?.enrollment ?? v?.data ?? v ?? null) as T | null;

const extractList = <T,>(v: any, keys: string[]): T[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of keys) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const pctToGrade = (p: number | null): string => {
  if (p === null) return "—";
  if (p >= 80) return "A";
  if (p >= 75) return "A-";
  if (p >= 70) return "B+";
  if (p >= 65) return "B";
  if (p >= 60) return "B-";
  if (p >= 55) return "C+";
  if (p >= 50) return "C";
  if (p >= 45) return "C-";
  if (p >= 40) return "D+";
  if (p >= 35) return "D";
  if (p >= 30) return "D-";
  return "E";
};

const GRADE_ORDER = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E"];

type Tone = {
  text: string;
  bg: string;
  border: string;
  fill: string;
  accent: string;
};

const gradeTone = (p: number | null): Tone => {
  if (p === null)
    return { text: "text-base-content/60", bg: "bg-base-300/50", border: "border-base-300", fill: "bg-base-300", accent: "#94a3b8" };
  if (p >= 75)
    return { text: "text-success", bg: "bg-success/10", border: "border-success/20", fill: "bg-success", accent: "#16a34a" };
  if (p >= 60)
    return { text: "text-info", bg: "bg-info/10", border: "border-info/20", fill: "bg-info", accent: "#0284c7" };
  if (p >= 45)
    return { text: "text-warning", bg: "bg-warning/10", border: "border-warning/20", fill: "bg-warning", accent: "#d97706" };
  return { text: "text-error", bg: "bg-error/10", border: "border-error/20", fill: "bg-error", accent: "#dc2626" };
};

const attendanceTone = (rate: number | null): Tone => {
  if (rate === null)
    return { text: "text-base-content/60", bg: "bg-base-300/50", border: "border-base-300", fill: "bg-base-300", accent: "#94a3b8" };
  if (rate >= 90)
    return { text: "text-success", bg: "bg-success/10", border: "border-success/20", fill: "bg-success", accent: "#16a34a" };
  if (rate >= 75)
    return { text: "text-warning", bg: "bg-warning/10", border: "border-warning/20", fill: "bg-warning", accent: "#d97706" };
  return { text: "text-error", bg: "bg-error/10", border: "border-error/20", fill: "bg-error", accent: "#dc2626" };
};

/* ═══════════════════════════════════════════════════════════════
   CHART COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function LineChart({
  points, height = 160, color = "#6366f1", yMax = 100, xLabels = [], showValueDots = true,
}: { points: number[]; height?: number; color?: string; yMax?: number; xLabels?: string[]; showValueDots?: boolean }) {
  const width = 640;
  const padX = 34;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const n = points.length;
  if (n === 0) return <div className="p-6 text-center text-xs opacity-50">No data for chart</div>;
  const stepX = n > 1 ? innerW / (n - 1) : 0;
  const xOf = (i: number) => padX + (n > 1 ? i * stepX : innerW / 2);
  const yOf = (v: number) => padY + innerH - (v / yMax) * innerH;
  const linePath = points.map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i)},${yOf(v)}`).join(" ");
  const areaPath = `${linePath} L${xOf(n - 1)},${padY + innerH} L${xOf(0)},${padY + innerH} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
      {[0, 25, 50, 75, 100].map((g) => {
        const y = yOf(g);
        return (
          <g key={g}>
            <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeDasharray="3 3" />
            <text x={padX - 6} y={y + 3} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.4} fontFamily="monospace">{g}</text>
          </g>
        );
      })}
      <path d={areaPath} fill={color} fillOpacity={0.1} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} />
      {showValueDots && points.map((v, i) => (
        <g key={i}>
          <circle cx={xOf(i)} cy={yOf(v)} r={4} fill="#fff" stroke={color} strokeWidth={2} />
          <title>{`${xLabels[i] ?? `#${i + 1}`}: ${v.toFixed(1)}%`}</title>
        </g>
      ))}
      {xLabels.map((label, i) => (
        <text key={i} x={xOf(i)} y={height - 4} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.4} fontFamily="monospace">{label}</text>
      ))}
    </svg>
  );
}

/** NEW: Inverted line chart — position 1 at top, higher number lower */
function PositionLineChart({
  positions, height = 160, color = "#16a34a", maxPos = 50,
}: { positions: Array<{ label: string; position: number; outOf?: number | null }>; height?: number; color?: string; maxPos?: number }) {
  const width = 640;
  const padX = 44;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const n = positions.length;
  if (n === 0) return <div className="p-6 text-center text-xs opacity-50">No position data</div>;
  const stepX = n > 1 ? innerW / (n - 1) : 0;
  const xOf = (i: number) => padX + (n > 1 ? i * stepX : innerW / 2);
  // Position 1 → top (padY), maxPos → bottom (padY+innerH)
  const yOf = (p: number) => padY + (Math.min(maxPos, Math.max(1, p)) / maxPos) * innerH;
  const linePath = positions.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i)},${yOf(p.position)}`).join(" ");
  const grids = [1, Math.round(maxPos * 0.25), Math.round(maxPos * 0.5), Math.round(maxPos * 0.75), maxPos];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
      {grids.map((g) => {
        const y = yOf(g);
        return (
          <g key={g}>
            <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeDasharray="3 3" />
            <text x={padX - 6} y={y + 3} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.4} fontFamily="monospace">{ordinal(g)}</text>
          </g>
        );
      })}
      <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} />
      {positions.map((p, i) => (
        <g key={i}>
          <circle cx={xOf(i)} cy={yOf(p.position)} r={4.5} fill="#fff" stroke={color} strokeWidth={2.5} />
          <text x={xOf(i)} y={yOf(p.position) - 9} textAnchor="middle" fontSize={10} fontWeight={800} fill="currentColor" opacity={0.85}>
            {p.position}
          </text>
          <title>{`${p.label}: ${ordinal(p.position)}${p.outOf ? ` of ${p.outOf}` : ""}`}</title>
        </g>
      ))}
      {positions.map((p, i) => (
        <text key={i} x={xOf(i)} y={height - 4} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.4} fontFamily="monospace">
          {p.label.length > 10 ? p.label.slice(0, 9) + "…" : p.label}
        </text>
      ))}
    </svg>
  );
}

function BarChart({
  data, height = 180, yMax = 100, primaryColor = "#6366f1",
}: { data: Array<{ label: string; value: number; color?: string }>; height?: number; yMax?: number; primaryColor?: string }) {
  const width = 640;
  const padX = 34;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY - 30;
  const n = data.length;
  if (n === 0) return <div className="p-6 text-center text-xs opacity-50">No data for chart</div>;
  const barW = Math.min(56, (innerW / n) * 0.7);
  const stepX = innerW / n;
  const yOf = (v: number) => padY + innerH - (v / yMax) * innerH;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
      {[0, 25, 50, 75, 100].map((g) => {
        const y = yOf(g);
        return (
          <g key={g}>
            <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeDasharray="3 3" />
            <text x={padX - 6} y={y + 3} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.4} fontFamily="monospace">{g}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = padX + stepX * i + (stepX - barW) / 2;
        const y = yOf(Math.max(0, Math.min(yMax, d.value)));
        const h = padY + innerH - y;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={6} fill={d.color ?? primaryColor} fillOpacity={0.85}>
              <title>{`${d.label}: ${d.value.toFixed(1)}%`}</title>
            </rect>
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={10} fontWeight={800} fill="currentColor" opacity={0.85}>{d.value.toFixed(0)}</text>
            <text x={x + barW / 2} y={height - 10} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.55} fontFamily="monospace">
              {d.label.length > 9 ? d.label.slice(0, 8) + "…" : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Donut({
  segments, size = 160, stroke = 20, centerLabel, centerSub,
}: { segments: Array<{ label: string; value: number; color: string }>; size?: number; stroke?: number; centerLabel?: React.ReactNode; centerSub?: React.ReactNode }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  let accumulated = 0;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="stroke-base-300/40" fill="none" />
        {segments.map((seg, i) => {
          const portion = seg.value / total;
          const dash = portion * circ;
          const gap = circ - dash;
          const offset = -accumulated * circ;
          accumulated += portion;
          if (seg.value === 0) return null;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} stroke={seg.color} fill="none"
              strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset} strokeLinecap="butt">
              <title>{`${seg.label}: ${seg.value}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-xl font-black leading-none">{centerLabel}</p>
          {centerSub && <p className="text-[9px] uppercase tracking-wider opacity-60 font-bold mt-1">{centerSub}</p>}
        </div>
      </div>
    </div>
  );
}

function Ring({
  value, max = 100, size = 120, stroke = 10, color = "#16a34a", label, sublabel,
}: { value: number; max?: number; size?: number; stroke?: number; color?: string; label?: React.ReactNode; sublabel?: React.ReactNode }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(max, value));
  const offset = circ - (clamped / max) * circ;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="stroke-base-300/60" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} style={{ stroke: color }} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-2xl font-black leading-none">{label}</p>
          {sublabel && <p className="text-[9px] uppercase tracking-wider opacity-60 font-bold mt-1">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

function Sparkline({ points, width = 80, height = 28, color = "#16a34a" }: { points: number[]; width?: number; height?: number; color?: string }) {
  if (points.length === 0) return null;
  const max = Math.max(...points, 100);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"}${i * step},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={(points.length - 1) * step} cy={height - ((points[points.length - 1] - min) / range) * height} r={2.5} fill={color} />
    </svg>
  );
}

function StackedBar({ segments, height = 10 }: { segments: Array<{ value: number; color: string; label?: string }>; height?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="flex rounded-full overflow-hidden bg-base-300/40" style={{ height }}>
      {segments.map((s, i) =>
        s.value === 0 ? null : (
          <div key={i} style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }} title={`${s.label ?? ""}: ${s.value}`} />
        )
      )}
    </div>
  );
}

function GradeDistributionBar({ data, total }: { data: Array<{ grade: string; count: number }>; total: number }) {
  return (
    <div className="space-y-1.5">
      {data.map(({ grade, count }) => {
        const percent = total > 0 ? (count / total) * 100 : 0;
        const tone = gradeTone(
          grade === "A" ? 90 : grade === "A-" ? 77 : grade === "B+" ? 72 : grade === "B" ? 67 :
          grade === "B-" ? 62 : grade === "C+" ? 57 : grade === "C" ? 52 : grade === "C-" ? 47 :
          grade === "D+" ? 42 : grade === "D" ? 37 : grade === "D-" ? 32 : 25
        );
        return (
          <div key={grade} className="flex items-center gap-2">
            <span className={`inline-block w-8 text-center text-[10px] font-black uppercase px-1 py-0.5 rounded ${tone.bg} ${tone.text}`}>{grade}</span>
            <div className="flex-1 h-4 rounded-full bg-base-300/40 overflow-hidden">
              <div className={`h-full ${tone.fill} transition-all`} style={{ width: `${percent}%` }} />
            </div>
            <span className="w-10 text-right text-[11px] font-mono font-black tabular-nums">{count}</span>
            <span className="w-10 text-right text-[9px] font-mono opacity-50">{percent.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ═══════════════════════════════════════════════════════════════ */
function Clarification({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-info/5 border border-info/20 text-[11px] leading-relaxed">
      <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-info" />
      <p className="opacity-80">{children}</p>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, trend, tone, bg, accent, spark, sparkColor,
}: { icon: any; label: string; value: React.ReactNode; sub?: React.ReactNode; trend?: "up" | "down" | "flat" | null; tone: string; bg: string; accent: string; spark?: number[]; sparkColor?: string }) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendTone = trend === "up" ? "text-success" : trend === "down" ? "text-error" : "opacity-40";
  return (
    <div className="relative overflow-hidden p-5 rounded-3xl bg-base-100 border border-base-300 shadow-sm group hover:shadow-md transition">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none transition-opacity group-hover:opacity-30" style={{ backgroundColor: accent }} />
      <div className="flex items-start justify-between gap-2 relative">
        <div className={`p-2.5 rounded-xl ${bg} ${tone}`}><Icon className="w-4 h-4" /></div>
        {trend && <span className={`inline-flex items-center gap-0.5 text-[10px] font-black ${trendTone}`}><TrendIcon className="w-3.5 h-3.5" /></span>}
      </div>
      <div className="mt-3 relative flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider font-black opacity-55">{label}</p>
          <p className="text-2xl font-black leading-tight truncate">{value}</p>
          {sub && <p className="text-[11px] opacity-60 mt-1 truncate">{sub}</p>}
        </div>
        {spark && spark.length > 1 && <Sparkline points={spark} width={56} height={24} color={sparkColor ?? accent} />}
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, tone = "text-primary", bg = "bg-primary/10" }: { icon: any; label: string; value: React.ReactNode; tone?: string; bg?: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-base-100 border border-base-300">
      <div className={`p-2 rounded-lg ${bg} ${tone}`}><Icon className="w-3.5 h-3.5" /></div>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider font-black opacity-55">{label}</p>
        <p className="text-sm font-black truncate">{value}</p>
      </div>
    </div>
  );
}

function Insight({ icon: Icon, tone, title, detail }: { icon: any; tone: "success" | "warning" | "error" | "info"; title: string; detail: string }) {
  const toneMap = {
    success: "bg-success/5 border-success/20 text-success",
    warning: "bg-warning/5 border-warning/20 text-warning",
    error: "bg-error/5 border-error/20 text-error",
    info: "bg-info/5 border-info/20 text-info",
  };
  return (
    <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${toneMap[tone]}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs font-black">{title}</p>
        <p className="text-[11px] opacity-75 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

function SectionHead({ icon: Icon, title, sub, action }: { icon: any; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-base-300 flex-wrap">
      <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Icon className="w-5 h-5" /></div>
      <div className="min-w-0 flex-1">
        <h2 className="text-base sm:text-lg font-black tracking-tight">{title}</h2>
        {sub && <p className="text-[11px] opacity-60">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════════════════════════ */
type TabId = "overview" | "academic" | "attendance" | "homework" | "fees" | "engagement";

const TABS: Array<{ id: TabId; label: string; icon: any }> = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "academic", label: "Academic", icon: Award },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "homework", label: "Homework", icon: ClipboardList },
  { id: "fees", label: "Fees", icon: Wallet },
  { id: "engagement", label: "Engagement", icon: Sparkles },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function StudentAnalytics() {
  const [tab, setTab] = useState<TabId>("overview");
  const [selectedTermId, setSelectedTermId] = useState<string>("");

  /* ── Identity ── */
  const { data: profileData, isLoading: loadingProfile, isError: profileError } = useGetMyProfileQuery(undefined);
  const profile = useMemo(() => flattenProfile(profileData), [profileData]);
  const userId: string | undefined = profile.userId ?? profile.id ?? profile.user?.id ?? profile.authUserId;

  const { data: studentByUser, isLoading: loadingStudent } = useGetStudentByUserIdQuery(userId as string, { skip: !userId });
  const studentRecord = useMemo(() => unwrap<any>(studentByUser), [studentByUser]);
  const studentId: string | undefined = studentRecord?.id ?? profile.studentId ?? profile.student?.id;

  const { data: fullStudentData, isLoading: loadingFull } = useGetStudentWithRelationsQuery(studentId as string, { skip: !studentId });
  const fullStudent = useMemo(() => unwrap<any>(fullStudentData), [fullStudentData]);

  const schoolId: string | undefined = fullStudent?.schoolId ?? studentRecord?.schoolId ?? profile.schoolId;

  /* ── School + term ── */
  const { data: school } = useGetSchoolByIdQuery(schoolId as string, { skip: !schoolId });
  const { data: termsData } = useGetTermsBySchoolIdQuery(schoolId as string, { skip: !schoolId });
  const { data: currentTermData } = useGetCurrentTermBySchoolIdQuery(schoolId as string, { skip: !schoolId });

  const terms = useMemo(() => extractList<any>(termsData, ["terms", "data"]), [termsData]);
  const currentTerm: any = (currentTermData as any)?.data ?? (currentTermData as any)?.term;
  const activeTermId = selectedTermId || currentTerm?.id || "";

  const gradeLevelId: string | undefined = fullStudent?.class?.gradeLevelId ?? fullStudent?.class?.gradeLevel?.id;
  const { data: gradeLevelData } = useGetGradeLevelByIdQuery(gradeLevelId as string, { skip: !gradeLevelId });
  const gradeLevel: any = (gradeLevelData as any)?.data ?? (gradeLevelData as any)?.gradeLevel;

  /* ── Data sources ── */
  const { data: attendanceHistory, isLoading: loadingAtt } = useGetStudentHistoryQuery({ studentId: studentId! }, { skip: !studentId });
  const { data: attendanceStats, isLoading: loadingAttStats } = useGetStudentStatsQuery(studentId as string, { skip: !studentId });
  const { data: transcriptData, isLoading: loadingTranscript } = useGetStudentTranscriptQuery(studentId as string, { skip: !studentId });
  const { data: reportCardsData } = useGetStudentReportCardsQuery(
    { schoolId: schoolId!, studentId: studentId! },
    { skip: !schoolId || !studentId }
  );
  const { data: homeworkSummaryData, isLoading: loadingHomework } = useGetStudentHomeworkSummaryQuery({ studentId: studentId! }, { skip: !studentId });
  const { data: submissionsData } = useGetSubmissionsByStudentQuery(studentId as string, { skip: !studentId });
  const { data: balanceData, isLoading: loadingBalance } = useGetStudentBalanceQuery(
    { studentId: studentId!, schoolId: schoolId!, termId: activeTermId },
    { skip: !studentId || !schoolId || !activeTermId }
  );
  const { data: transactionsData } = useGetTransactionsByStudentQuery(
    { studentId: studentId!, schoolId: schoolId! },
    { skip: !studentId || !schoolId }
  );
  const { data: activitiesData } = useGetStudentActivitiesQuery({ studentId: studentId! }, { skip: !studentId });
  const { data: eventsData } = useGetUpcomingEventsQuery({ schoolId: schoolId!, withinDays: 30, limit: 10 }, { skip: !schoolId });
  const { data: announcementsData } = useGetMyActiveAnnouncementsQuery();

  /* ── Normalise ── */
  const attendance: any = (attendanceStats as any)?.stats ?? (attendanceStats as any)?.data?.stats ?? {};
  const attRecords = useMemo(() => extractList<any>(attendanceHistory, ["records", "attendanceRecords", "data"]), [attendanceHistory]);
  const transcript = useMemo(() => extractList<any>(transcriptData, ["transcript", "data"]), [transcriptData]);
  const reportCards = useMemo(() => extractList<any>(reportCardsData, ["reportCards", "cards", "records", "data"]), [reportCardsData]);
  const homeworkSummary: any = (homeworkSummaryData as any)?.summary ?? (homeworkSummaryData as any)?.data?.summary ?? {};
  const submissions = useMemo(() => extractList<any>(submissionsData, ["submissions", "data"]), [submissionsData]);
  const balance: any = (balanceData as any)?.data ?? balanceData ?? {};
  const transactions = useMemo(() => extractList<any>(transactionsData, ["transactions", "payments", "data"]), [transactionsData]);
  const activities = useMemo(() => extractList<any>(activitiesData, ["activities", "data"]), [activitiesData]);
  const upcomingEvents = useMemo(() => extractList<any>(eventsData, ["events", "data"]), [eventsData]);
  const announcements = useMemo(() => extractList<any>(announcementsData, ["announcements", "data"]), [announcementsData]);

  /* ── Exam aggregation ── */
  const examAgg = useMemo(() => {
    const exams: Array<{ examId: string; examTitle: string; shortTitle: string; termName?: string; meanPercent: number; grade: string; date?: string; subjectsCount: number }> = [];
    const subjectMap = new Map<string, { subjectId: string; name: string; code?: string; percents: number[]; best: number; worst: number }>();
    const gradeCounts: Record<string, number> = {};

    transcript.forEach((entry: any) => {
      const results = entry.results ?? [];
      const present = results.filter((r: any) => !r.isAbsent && r.marks != null);
      const totalMarks = present.reduce((s: number, r: any) => s + Number(r.marks ?? 0), 0);
      const totalOutOf = present.reduce((s: number, r: any) => s + Number(r.outOf ?? 100), 0);
      const meanPercent = totalOutOf > 0 ? Math.round((totalMarks / totalOutOf) * 1000) / 10 : 0;
      exams.push({
        examId: entry.examId, examTitle: entry.examTitle, shortTitle: (entry.examTitle ?? "").slice(0, 12),
        termName: entry.termName, meanPercent, grade: pctToGrade(meanPercent), date: entry.date ?? null, subjectsCount: present.length,
      });
      present.forEach((r: any) => {
        const sid = r.subjectId ?? r.subject?.id;
        if (!sid) return;
        const name = r.subject?.name ?? r.subjectName ?? "Subject";
        const code = r.subject?.code;
        const p = pct(r.marks, r.outOf) ?? 0;
        const g = pctToGrade(p);
        gradeCounts[g] = (gradeCounts[g] ?? 0) + 1;
        const existing = subjectMap.get(sid);
        if (existing) { existing.percents.push(p); existing.best = Math.max(existing.best, p); existing.worst = Math.min(existing.worst, p); }
        else { subjectMap.set(sid, { subjectId: sid, name, code, percents: [p], best: p, worst: p }); }
      });
    });

    exams.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

    const subjects = [...subjectMap.values()].map((s) => {
      const mean = s.percents.reduce((a, b) => a + b, 0) / s.percents.length;
      return {
        subjectId: s.subjectId, name: s.name, code: s.code,
        meanPercent: Math.round(mean * 10) / 10, grade: pctToGrade(mean), examCount: s.percents.length,
        best: Math.round(s.best * 10) / 10, worst: Math.round(s.worst * 10) / 10, percents: s.percents,
        trend: s.percents.length >= 2 ? s.percents[s.percents.length - 1] - s.percents[s.percents.length - 2] : null,
      };
    }).sort((a, b) => b.meanPercent - a.meanPercent);

    const overallMean = exams.length > 0 ? Math.round((exams.reduce((s, e) => s + e.meanPercent, 0) / exams.length) * 10) / 10 : null;

    let consistency: number | null = null;
    if (exams.length >= 2 && overallMean !== null) {
      const variance = exams.reduce((s, e) => s + Math.pow(e.meanPercent - overallMean, 2), 0) / exams.length;
      consistency = Math.round(Math.sqrt(variance) * 10) / 10;
    }

    const sortedByMean = [...exams].sort((a, b) => b.meanPercent - a.meanPercent);
    const bestExam = sortedByMean[0];
    const worstExam = sortedByMean[sortedByMean.length - 1];

    const gradeDist = GRADE_ORDER.map((grade) => ({ grade, count: gradeCounts[grade] ?? 0 })).filter((g) => g.count > 0);
    const gradeTotal = gradeDist.reduce((s, g) => s + g.count, 0);

    const latest = exams[exams.length - 1];
    const prev = exams[exams.length - 2];
    const trend: "up" | "down" | "flat" | null =
      latest && prev
        ? latest.meanPercent > prev.meanPercent + 0.5 ? "up" : latest.meanPercent < prev.meanPercent - 0.5 ? "down" : "flat"
        : null;

    return { exams, subjects, overallMean, latest, trend, consistency, bestExam, worstExam, gradeDist, gradeTotal };
  }, [transcript]);

  /* ── NEW: Predicted next exam score ── */
  const predictedNext = useMemo(() => {
    const means = examAgg.exams.map((e) => e.meanPercent);
    if (means.length < 2) return null;
    const n = means.length;
    const xs = means.map((_, i) => i);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = means.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * means[i], 0);
    const sumXX = xs.reduce((a, x) => a + x * x, 0);
    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return null;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    const predicted = intercept + slope * n;
    const clamped = Math.max(0, Math.min(100, predicted));
    const confidence: "high" | "medium" | "low" = n >= 5 ? "high" : n >= 3 ? "medium" : "low";
    return { value: Math.round(clamped * 10) / 10, confidence, n, slope: Math.round(slope * 10) / 10 };
  }, [examAgg.exams]);

  /* ── NEW: Subject consistency ── */
  const subjectConsistency = useMemo(() => {
    return examAgg.subjects
      .filter((s) => s.percents.length >= 2)
      .map((s) => {
        const mean = s.percents.reduce((a, b) => a + b, 0) / s.percents.length;
        const variance = s.percents.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / s.percents.length;
        const stdDev = Math.sqrt(variance);
        return {
          subjectId: s.subjectId, name: s.name, stdDev: Math.round(stdDev * 10) / 10,
          mean: s.meanPercent, consistency: Math.max(0, Math.round(100 - stdDev * 2)),
        };
      })
      .sort((a, b) => a.stdDev - b.stdDev);
  }, [examAgg.subjects]);

  /* ── NEW: Position trend from report cards ── */
  const positionTrend = useMemo(() => {
    return reportCards
      .filter((rc) => rc.position != null && rc.position > 0 && rc.term)
      .map((rc) => ({
        term: `${rc.term?.termName ?? "Term"} ${rc.term?.academicYear ?? ""}`.trim(),
        position: Number(rc.position), outOf: rc.outOf ?? null,
        meanScore: rc.meanScore != null ? Number(rc.meanScore) : null,
        key: `${rc.term?.academicYear ?? ""}-${rc.term?.termName ?? ""}`,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [reportCards]);

  /* ── NEW: Term-over-term comparison ── */
  const termComparison = useMemo(() => {
    const rows = reportCards
      .filter((rc) => rc.meanScore != null && rc.term)
      .map((rc) => ({
        termName: `${rc.term?.termName ?? "Term"} ${rc.term?.academicYear ?? ""}`.trim(),
        meanScore: Number(rc.meanScore), position: rc.position ?? null, outOf: rc.outOf ?? null,
        attendanceDays: rc.attendanceDays ?? null, totalDays: rc.totalSchoolDays ?? null,
        key: `${rc.term?.academicYear ?? ""}-${rc.term?.termName ?? ""}`,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));

    const latest = rows[rows.length - 1];
    const prev = rows[rows.length - 2];
    const deltas = latest && prev ? {
      mean: latest.meanScore - prev.meanScore,
      position: latest.position != null && prev.position != null ? prev.position - latest.position : null,
      attendance: latest.attendanceDays != null && prev.attendanceDays != null ? latest.attendanceDays - prev.attendanceDays : null,
    } : null;

    return { rows, latest, prev, deltas };
  }, [reportCards]);

  /* ── NEW: Payment timeline ── */
  const paymentTimeline = useMemo(() => {
    return [...transactions]
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
      .slice(0, 8)
      .map((t) => ({
        id: t.id, amount: safeNum(t.amountPaid), method: t.paymentMethod,
        ref: t.referenceCode, payer: t.payerName, date: t.createdAt, status: t.status,
      }));
  }, [transactions]);

  /* ── Attendance aggregation ── */
  const attAgg = useMemo(() => {
    const present = safeNum(attendance.present);
    const absent = safeNum(attendance.absent);
    const late = safeNum(attendance.late);
    const excused = safeNum(attendance.excused);
    const total = safeNum(attendance.totalDays) || present + absent + late + excused;
    const rate = toNum(attendance.attendanceRate) ?? (total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : null);

    const byDate = new Map<string, string>();
    attRecords.forEach((r: any) => { const d = (r.date ?? "").split("T")[0]; if (d) byDate.set(d, r.status); });

    const last30: Array<{ date: string; status: string | null; weekday: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      last30.push({ date: key, status: byDate.get(key) ?? null, weekday: d.getDay() });
    }

    const weekly: Array<{ label: string; present: number; absent: number; rate: number }> = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - w * 7 - 6);
      let p = 0; let a = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const st = byDate.get(key);
        if (st === "Present" || st === "Late") p++;
        else if (st === "Absent") a++;
      }
      weekly.push({ label: `W-${w}`, present: p, absent: a, rate: p + a > 0 ? Math.round((p / (p + a)) * 100) : 0 });
    }

    const dowAgg = Array.from({ length: 7 }, () => ({ present: 0, absent: 0, total: 0 }));
    attRecords.forEach((r: any) => {
      const d = new Date(r.date);
      const dow = d.getDay();
      if (isNaN(dow)) return;
      dowAgg[dow].total++;
      if (r.status === "Present" || r.status === "Late") dowAgg[dow].present++;
      else if (r.status === "Absent") dowAgg[dow].absent++;
    });
    const dayOfWeekRates = dowAgg.map((d, i) => ({
      label: DOW_LABELS[i], rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
      total: d.total, present: d.present, absent: d.absent,
    }));

    const eligible = dayOfWeekRates.filter((d) => d.total >= 3);
    const bestDay = eligible.sort((a, b) => b.rate - a.rate)[0] ?? null;
    const worstDay = eligible[eligible.length - 1] ?? null;

    let streak = 0;
    for (let i = 0; i < last30.length; i++) {
      const day = last30[last30.length - 1 - i];
      if (day.status === "Present" || day.status === "Late") streak++;
      else if (day.status === "Absent" || day.status === "Excused") break;
    }

    const orderedDates = attRecords.map((r: any) => ({ date: (r.date ?? "").split("T")[0], status: r.status })).filter((r) => r.date).sort((a, b) => a.date.localeCompare(b.date));
    let longestStreak = 0; let currentRun = 0;
    orderedDates.forEach((r) => {
      if (r.status === "Present" || r.status === "Late") { currentRun++; longestStreak = Math.max(longestStreak, currentRun); }
      else if (r.status === "Absent" || r.status === "Excused") currentRun = 0;
    });

    return { present, absent, late, excused, total, rate, last30, streak, weekly, dayOfWeekRates, bestDay, worstDay, longestStreak };
  }, [attendance, attRecords]);

  /* ── Homework aggregation ── */
  const hwAgg = useMemo(() => {
    const total = safeNum(homeworkSummary.totalAssignments);
    const submitted = safeNum(homeworkSummary.submitted);
    const graded = safeNum(homeworkSummary.graded);
    const pending = safeNum(homeworkSummary.pending);
    const avgScore = toNum(homeworkSummary.averageScore) ?? toNum(homeworkSummary.averagePercentage);
    const done = submitted + graded;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    const bySubject: Array<{ subjectId: string; name: string; total: number; graded: number; averageScore: number | null }> =
      Array.isArray(homeworkSummary.bySubject)
        ? homeworkSummary.bySubject.map((s: any) => ({
            subjectId: s.subjectId, name: s.subjectName ?? "Subject",
            total: safeNum(s.total), graded: safeNum(s.graded), averageScore: toNum(s.averageScore),
          }))
        : [];

    const recentPending = submissions
      .filter((s: any) => s.status === "Pending" || s.status === "Returned" || s.status === "Late")
      .sort((a: any, b: any) => (a.assignment?.dueDate ?? "").localeCompare(b.assignment?.dueDate ?? ""))
      .slice(0, 6);

    const completedSubs = submissions.filter((s: any) => s.status === "Submitted" || s.status === "Graded");
    const onTime = completedSubs.filter((s: any) => s.status !== "Late").length;
    const late = completedSubs.filter((s: any) => s.status === "Late").length;
    const onTimeRate = completedSubs.length > 0 ? Math.round((onTime / completedSubs.length) * 100) : null;

    const sortedByGrade = [...bySubject].filter((s) => s.averageScore !== null).sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));
    const bestSubject = sortedByGrade[0];
    const worstSubject = sortedByGrade[sortedByGrade.length - 1];

    return { total, submitted, graded, pending, done, rate, avgScore, bySubject, recentPending, onTime, late, onTimeRate, bestSubject, worstSubject };
  }, [homeworkSummary, submissions]);

  /* ── Fees aggregation ── */
  const feesAgg = useMemo(() => {
    const total = safeNum(balance.totalFee ?? balance.totalAmount ?? balance.totalBilled);
    const paid = safeNum(balance.totalPaid ?? balance.amountPaid);
    const bal = safeNum(balance.balance ?? balance.outstandingBalance);
    const percentPaid = total > 0 ? Math.round((paid / total) * 100) : 0;
    const dueDate = balance.dueDate as string | null;
    const isOverdue = bal > 0 && dueDate ? new Date(dueDate) < new Date() : false;
    let daysRelative: number | null = null;
    if (dueDate) daysRelative = daysBetween(new Date(), new Date(dueDate));
    return { total, paid, balance: bal, percentPaid, dueDate, isOverdue, daysRelative };
  }, [balance]);

  /* ── Labels ── */
  const className: string = fullStudent?.class?.name ?? fullStudent?.className ?? profile.className ?? "My Class";
  const stream: string | undefined = fullStudent?.class?.stream ?? studentRecord?.class?.stream;
  const gradeName: string | undefined = fullStudent?.class?.gradeLevel?.name ?? gradeLevel?.name;
  const academicYear: string | undefined = fullStudent?.class?.academicYear ?? fullStudent?.academicYear;
  const admissionNumber: string | undefined = fullStudent?.admissionNumber ?? studentRecord?.admissionNumber;
  const studentName = [fullStudent?.firstName ?? studentRecord?.firstName, fullStudent?.lastName ?? studentRecord?.lastName].filter(Boolean).join(" ") || null;

  const gradeTitle = (() => {
    const g = gradeName ?? className;
    if (g && stream) return `${g} · ${stream}`;
    return g ?? "My Class";
  })();

  const primaryColor = school?.primaryColor || "#6366f1";

  /* ── NEW: Achievement badges ── */
  const badges = useMemo(() => {
    let improvingRun = 0;
    for (let i = 1; i < examAgg.exams.length; i++) {
      if (examAgg.exams[i].meanPercent > examAgg.exams[i - 1].meanPercent) improvingRun++;
      else improvingRun = 0;
    }
    return [
      { id: "streak-5", icon: Flame, label: "5-Day Streak", desc: "Present 5 days in a row", earned: attAgg.longestStreak >= 5, tier: "warning" as const },
      { id: "streak-10", icon: Flame, label: "10-Day Streak", desc: "Present 10 days in a row", earned: attAgg.longestStreak >= 10, tier: "warning" as const },
      { id: "streak-30", icon: Zap, label: "30-Day Streak", desc: "Present 30 days in a row", earned: attAgg.longestStreak >= 30, tier: "success" as const },
      { id: "att-90", icon: CalendarCheck, label: "Attendance Ace", desc: "90%+ attendance rate", earned: (attAgg.rate ?? 0) >= 90, tier: "success" as const },
      { id: "hw-80", icon: BookOpen, label: "Homework Hero", desc: "80%+ homework average", earned: (hwAgg.avgScore ?? 0) >= 80, tier: "info" as const },
      { id: "hw-perfect", icon: CheckCircle2, label: "On Top of It", desc: "100% homework completion", earned: hwAgg.rate === 100 && hwAgg.total > 0, tier: "success" as const },
      { id: "mean-80", icon: Trophy, label: "Academic Star", desc: "80%+ overall mean", earned: (examAgg.overallMean ?? 0) >= 80, tier: "success" as const },
      { id: "improving-3", icon: TrendingUp, label: "On Fire", desc: "3 exams improving in a row", earned: improvingRun >= 3, tier: "success" as const },
      { id: "fees-cleared", icon: Wallet, label: "Fees Cleared", desc: "Fully paid this term", earned: feesAgg.total > 0 && feesAgg.balance <= 0, tier: "success" as const },
      { id: "active", icon: Star, label: "Well-Rounded", desc: "In 3+ activities", earned: activities.length >= 3, tier: "info" as const },
    ];
  }, [attAgg, hwAgg, feesAgg, examAgg, activities]);

  const earnedBadges = badges.filter((b) => b.earned).length;

  /* ── Insights ── */
  const insights = useMemo(() => {
    const list: Array<{ icon: any; tone: "success" | "warning" | "error" | "info"; title: string; detail: string }> = [];

    if (attAgg.rate !== null && attAgg.rate < 80)
      list.push({ icon: AlertCircle, tone: "warning", title: `Attendance is ${attAgg.rate.toFixed(1)}%`, detail: "Aim for 90%+ — students who attend regularly score ~15% higher on average." });
    if (attAgg.rate !== null && attAgg.rate >= 90)
      list.push({ icon: CheckCircle2, tone: "success", title: `Excellent attendance (${attAgg.rate.toFixed(1)}%)`, detail: "Consistent attendance is one of the strongest predictors of academic success." });
    if (attAgg.streak >= 5)
      list.push({ icon: Flame, tone: "success", title: `${attAgg.streak}-day attendance streak`, detail: "Keep it going — consistency builds habits that stick." });
    if (attAgg.worstDay && attAgg.worstDay.rate < 75)
      list.push({ icon: AlertCircle, tone: "warning", title: `${attAgg.worstDay.label} attendance is low (${attAgg.worstDay.rate}%)`, detail: "You tend to miss days on this weekday — plan ahead to avoid it." });

    if (hwAgg.pending > 0)
      list.push({ icon: ClipboardList, tone: "warning", title: `${hwAgg.pending} pending assignment${hwAgg.pending === 1 ? "" : "s"}`, detail: "Complete them before the due date to keep your completion rate high." });
    if (hwAgg.avgScore !== null && hwAgg.avgScore >= 80)
      list.push({ icon: Award, tone: "success", title: `Strong homework average (${hwAgg.avgScore.toFixed(0)}%)`, detail: "Consistent quality at home translates directly to exam performance." });

    if (feesAgg.balance > 0 && feesAgg.isOverdue)
      list.push({ icon: Wallet, tone: "error", title: `Fees overdue: ${fmtMoney(feesAgg.balance)}`, detail: "Please clear the outstanding balance to avoid disruption." });

    if (examAgg.subjects.length > 0) {
      const best = examAgg.subjects[0];
      list.push({ icon: Trophy, tone: "success", title: `Strongest: ${best.name} (${best.meanPercent}%)`, detail: `Grade ${best.grade} across ${best.examCount} exam${best.examCount === 1 ? "" : "s"}.` });
      const worst = examAgg.subjects[examAgg.subjects.length - 1];
      if (worst.meanPercent < 50)
        list.push({ icon: Target, tone: "warning", title: `Focus area: ${worst.name} (${worst.meanPercent}%)`, detail: "Ask your teacher for extra support — small gains compound quickly." });
    }

    if (examAgg.trend === "down" && examAgg.latest)
      list.push({ icon: TrendingDown, tone: "warning", title: `Slight decline in ${examAgg.latest.examTitle}`, detail: "Review the recent topics while they're fresh — improvement is often quick." });
    if (examAgg.trend === "up" && examAgg.latest)
      list.push({ icon: TrendingUp, tone: "success", title: `Improving in ${examAgg.latest.examTitle}`, detail: "Keep up the momentum — steady growth is the goal." });
    if (examAgg.consistency !== null && examAgg.consistency <= 5)
      list.push({ icon: ShieldCheck, tone: "success", title: `Very consistent (variance ${examAgg.consistency.toFixed(1)})`, detail: "Your scores don't fluctuate much — reliability like this is a real strength." });

    if (termComparison.deltas?.position != null && termComparison.deltas.position > 0)
      list.push({ icon: Crown, tone: "success", title: `Climbed ${termComparison.deltas.position} place${termComparison.deltas.position === 1 ? "" : "s"} this term`, detail: `${ordinal(termComparison.latest?.position ?? 0)} vs ${ordinal(termComparison.prev?.position ?? 0)} previously.` });
    if (termComparison.deltas?.position != null && termComparison.deltas.position < 0)
      list.push({ icon: AlertCircle, tone: "warning", title: `Dropped ${Math.abs(termComparison.deltas.position)} place${Math.abs(termComparison.deltas.position) === 1 ? "" : "s"} this term`, detail: "Look at what changed in your study habits or attendance." });

    if (predictedNext && predictedNext.slope > 0.5 && predictedNext.confidence !== "low")
      list.push({ icon: Target, tone: "info", title: `Trend suggests ${predictedNext.value.toFixed(0)}% next exam`, detail: `Confidence: ${predictedNext.confidence}. Based on ${predictedNext.n} exams.` });

    return list.slice(0, 8);
  }, [attAgg, hwAgg, feesAgg, examAgg, termComparison, predictedNext]);

  /* ── Gates ── */
  const resolving = loadingProfile || (!studentId && (loadingStudent || loadingFull));

  if (resolving) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-48 rounded-3xl bg-base-200/60" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-3xl bg-base-200/60" />)}
        </div>
        <div className="h-96 rounded-3xl bg-base-200/60" />
      </div>
    );
  }

  if (profileError || !studentId) {
    return (
      <div className={`${CARD} max-w-xl mx-auto text-center space-y-3`}>
        <GraduationCap className="w-10 h-10 mx-auto text-primary" />
        <p className="text-base font-black">We couldn't find your student record.</p>
        <p className="text-xs opacity-60">Please contact the school office to have your record linked to your account.</p>
      </div>
    );
  }

  const loading = loadingAtt || loadingAttStats || loadingTranscript || loadingHomework || loadingBalance;

  const examLine = examAgg.exams.map((e) => e.meanPercent);
  const examLabels = examAgg.exams.map((e) => e.shortTitle);
  const subjectBar = examAgg.subjects.slice(0, 8).map((s) => ({ label: s.name, value: s.meanPercent, color: gradeTone(s.meanPercent).accent }));
  const positionMax = Math.max(10, ...positionTrend.map((p) => p.outOf ?? p.position));

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-base-200 to-secondary/20 p-6 sm:p-8 rounded-3xl border border-base-300 shadow-sm">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-56 h-56 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-3xl text-white grid place-items-center shadow-lg shrink-0" style={{ backgroundColor: primaryColor }}>
            <BarChart3 className="w-9 h-9" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-55 mb-1">My Analytics</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate" style={{ color: primaryColor }}>{gradeTitle}</h1>
            {studentName && <p className="text-sm font-bold opacity-80 mt-1 truncate">{studentName}</p>}
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase rounded-full border" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor, borderColor: `${primaryColor}40` }}>
                <School className="w-3 h-3" /> {className}{stream && <> · {stream}</>}
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
                  <Sparkles className="w-3 h-3" /> {currentTerm.termName} {currentTerm.academicYear}
                </span>
              )}
            </div>
          </div>
          <div className="w-full sm:w-auto min-w-[200px]">
            <label className="block text-[10px] uppercase tracking-wider font-black opacity-55 mb-1">Academic term</label>
            <select value={selectedTermId} onChange={(e) => setSelectedTermId(e.target.value)} className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-bold cursor-pointer">
              <option value="">Current ({currentTerm?.termName ?? "—"})</option>
              {terms.map((t) => <option key={t.id} value={t.id}>{t.termName} ({t.academicYear})</option>)}
            </select>
          </div>
        </div>
        {loading && (
          <div className="relative z-10 mt-4 flex items-center gap-2 text-[11px] opacity-60">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing your data…
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="sticky top-2 z-20 bg-base-100/80 backdrop-blur-xl border border-base-300 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${active ? "text-white shadow-md" : "hover:bg-base-200 opacity-70"}`}
                style={active ? { backgroundColor: primaryColor } : {}}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          OVERVIEW TAB
         ══════════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Award} label="Academic Mean" value={examAgg.overallMean !== null ? `${examAgg.overallMean.toFixed(1)}%` : "—"}
              sub={examAgg.latest ? `${examAgg.latest.grade} · ${examAgg.latest.examTitle}` : "No exams yet"}
              trend={examAgg.trend} tone={gradeTone(examAgg.overallMean).text} bg={gradeTone(examAgg.overallMean).bg} accent={gradeTone(examAgg.overallMean).accent}
              spark={examLine.length > 1 ? examLine : undefined} />
            <KpiCard icon={CalendarCheck} label="Attendance" value={attAgg.rate !== null ? `${attAgg.rate.toFixed(1)}%` : "—"}
              sub={`${attAgg.present + attAgg.late} present · ${attAgg.absent} absent`}
              trend={attAgg.rate !== null && attAgg.rate >= 90 ? "up" : attAgg.rate !== null && attAgg.rate < 75 ? "down" : null}
              tone={attendanceTone(attAgg.rate).text} bg={attendanceTone(attAgg.rate).bg} accent={attendanceTone(attAgg.rate).accent} />
            <KpiCard icon={ClipboardList} label="Homework" value={`${hwAgg.rate}%`}
              sub={`${hwAgg.done}/${hwAgg.total} done${hwAgg.pending > 0 ? ` · ${hwAgg.pending} pending` : ""}`}
              tone={hwAgg.rate >= 80 ? "text-success" : "text-warning"} bg={hwAgg.rate >= 80 ? "bg-success/10" : "bg-warning/10"}
              accent={hwAgg.rate >= 80 ? "#16a34a" : "#d97706"} />
            <KpiCard icon={Wallet} label="Fees Cleared" value={`${feesAgg.percentPaid}%`}
              sub={feesAgg.balance > 0 ? `${fmtMoney(feesAgg.balance)} outstanding` : "Fully cleared"}
              tone={feesAgg.balance <= 0 ? "text-success" : "text-warning"} bg={feesAgg.balance <= 0 ? "bg-success/10" : "bg-warning/10"}
              accent={feesAgg.balance <= 0 ? "#16a34a" : "#d97706"} />
          </div>

          {/* NEW: Achievement badges */}
          <div className={`${CARD} !p-5`}>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-base-300">
              <Trophy className="w-4 h-4 text-warning" />
              <h2 className="text-xs font-black uppercase tracking-wider">Achievements</h2>
              <span className="ml-auto text-[10px] font-mono opacity-55">
                {earnedBadges} / {badges.length} earned
              </span>
            </div>
            <div className="overflow-x-auto pb-1">
              <div className="flex gap-2 min-w-max">
                {badges.map((b) => {
                  const Icon = b.earned ? b.icon : Lock;
                  const tone =
                    !b.earned
                      ? "bg-base-200 border-base-300 text-base-content/40"
                      : b.tier === "success"
                      ? "bg-success/10 border-success/30 text-success"
                      : b.tier === "warning"
                      ? "bg-warning/10 border-warning/30 text-warning"
                      : "bg-info/10 border-info/30 text-info";
                  return (
                    <div key={b.id} title={b.desc}
                      className={`shrink-0 w-32 p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 ${tone} ${!b.earned ? "opacity-60" : ""}`}>
                      <div className="w-10 h-10 rounded-full bg-white/40 grid place-items-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-wider leading-tight">{b.label}</p>
                      <p className="text-[9px] opacity-60 leading-tight">{b.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <Clarification>
              Milestones you've unlocked from your real data. Locked badges show what to aim for —
              hover each to see the requirement.
            </Clarification>
          </div>

          {/* At-a-glance */}
          <div className={`${CARD} !p-5`}>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-base-300">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-wider">At a glance</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <Tile icon={BookOpen} label="Exams" value={examAgg.exams.length} tone="text-primary" bg="bg-primary/10" />
              <Tile icon={Layers} label="Subjects" value={examAgg.subjects.length} tone="text-info" bg="bg-info/10" />
              <Tile icon={Flame} label="Streak" value={`${attAgg.streak}d`} tone="text-warning" bg="bg-warning/10" />
              <Tile icon={Medal} label="Longest streak" value={`${attAgg.longestStreak}d`} tone="text-success" bg="bg-success/10" />
              <Tile icon={Award} label="Best exam" value={examAgg.bestExam ? `${examAgg.bestExam.meanPercent.toFixed(0)}%` : "—"} tone="text-success" bg="bg-success/10" />
              <Tile icon={Clock} label="Pending HW" value={hwAgg.pending} tone="text-warning" bg="bg-warning/10" />
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className={`${CARD} !p-5`}>
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-base-300">
                <Zap className="w-4 h-4 text-warning" />
                <h2 className="text-xs font-black uppercase tracking-wider">Insights & recommendations</h2>
                <span className="ml-auto text-[10px] font-mono opacity-50">{insights.length} generated</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {insights.map((ins, i) => <Insight key={i} {...ins} />)}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={LineChartIcon} title="Exam trend" sub={`${examAgg.exams.length} exam${examAgg.exams.length === 1 ? "" : "s"} tracked`} />
              {examAgg.exams.length > 0 ? (
                <>
                  <LineChart points={examLine} color={primaryColor} xLabels={examLabels} height={160} />
                  <Clarification>
                    Each dot is one exam's average score. A rising line means you're improving over time.
                    Compare the last two dots to see if your recent study habits are paying off.
                  </Clarification>
                  <div className="flex justify-between text-[10px] font-mono opacity-60 pt-1">
                    <span>Earliest</span>
                    <span>Latest {examAgg.latest?.meanPercent.toFixed(1)}% · <span className={gradeTone(examAgg.latest?.meanPercent ?? null).text}>{examAgg.latest?.grade}</span></span>
                  </div>
                </>
              ) : (
                <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">No exam data yet</div>
              )}
            </div>

            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={BarChart3} title="Subject means" sub="Higher is better" />
              {subjectBar.length > 0 ? (
                <>
                  <BarChart data={subjectBar} height={160} />
                  <Clarification>
                    Each bar is your average in that subject. Green bars (≥75%) are strong —
                    red bars (&lt;45%) need attention.
                  </Clarification>
                </>
              ) : (
                <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">No subject data yet</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          ACADEMIC TAB
         ══════════════════════════════════════════════════════════ */}
      {tab === "academic" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Tile icon={Award} label="Overall mean" value={examAgg.overallMean !== null ? `${examAgg.overallMean.toFixed(1)}%` : "—"} tone={gradeTone(examAgg.overallMean).text} bg={gradeTone(examAgg.overallMean).bg} />
            <Tile icon={Timer} label="Consistency" value={examAgg.consistency !== null ? `±${examAgg.consistency.toFixed(1)}` : "—"} tone={examAgg.consistency !== null && examAgg.consistency <= 5 ? "text-success" : "text-warning"} bg={examAgg.consistency !== null && examAgg.consistency <= 5 ? "bg-success/10" : "bg-warning/10"} />
            <Tile icon={Trophy} label="Best exam" value={examAgg.bestExam ? `${examAgg.bestExam.meanPercent.toFixed(0)}%` : "—"} tone="text-success" bg="bg-success/10" />
            <Tile icon={Target} label="Needs work" value={examAgg.worstExam && examAgg.worstExam !== examAgg.bestExam ? `${examAgg.worstExam.meanPercent.toFixed(0)}%` : "—"} tone="text-warning" bg="bg-warning/10" />
          </div>

          {/* NEW: Predicted next exam */}
          {predictedNext && (
            <div className={`${CARD} space-y-3`}>
              <SectionHead icon={Target} title="Predicted next exam" sub="Linear projection from recent trend" />
              <div className="flex items-center gap-5 flex-wrap">
                <Ring value={predictedNext.value} size={120} stroke={10} color={gradeTone(predictedNext.value).accent} label={`${predictedNext.value.toFixed(0)}%`} sublabel="predicted" />
                <div className="flex-1 min-w-[200px] space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${
                      predictedNext.confidence === "high" ? "bg-success/10 text-success" :
                      predictedNext.confidence === "medium" ? "bg-warning/10 text-warning" :
                      "bg-base-300 text-base-content/60"
                    }`}>
                      {predictedNext.confidence} confidence
                    </span>
                    <span className="text-[10px] font-mono opacity-55">Based on {predictedNext.n} exams</span>
                  </div>
                  <p className="text-xs opacity-75">
                    {predictedNext.slope > 0.5
                      ? `If the current trend continues, you're on track for ${predictedNext.value.toFixed(1)}% on the next exam. Keep it up.`
                      : predictedNext.slope < -0.5
                      ? `Your trend suggests a possible dip to ${predictedNext.value.toFixed(1)}%. Focus on the recent weak topics while they're fresh.`
                      : `Your score is holding steady around ${predictedNext.value.toFixed(1)}%. Consistency like this is a strength.`}
                  </p>
                </div>
              </div>
              <Clarification>
                A straight-line projection based on your past exams. It's a hint, not a promise —
                real study habits, health, and teacher changes matter more than any projection.
              </Clarification>
            </div>
          )}

          {/* NEW: Class position trend */}
          {positionTrend.length >= 2 && (
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={Crown} title="Class position trend" sub={`${positionTrend.length} term${positionTrend.length === 1 ? "" : "s"} tracked · lower is better`} />
              <PositionLineChart
                positions={positionTrend.map((p) => ({ label: p.term, position: p.position, outOf: p.outOf }))}
                maxPos={positionMax}
                color={positionTrend[positionTrend.length - 1].position < positionTrend[0].position ? "#16a34a" : "#dc2626"}
              />
              <Clarification>
                Higher on the chart = better rank in class. A line going up means you're climbing.
                {positionTrend.length >= 2 && positionTrend[positionTrend.length - 1].position < positionTrend[0].position && " Nice — you've improved since your first term."}
              </Clarification>
            </div>
          )}

          {/* NEW: Term comparison */}
          {termComparison.rows.length >= 2 && (
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={TrendingUp} title="Term-over-term comparison" sub={termComparison.latest && termComparison.prev ? `${termComparison.prev.termName} → ${termComparison.latest.termName}` : ""} />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-base-200/60">
                      <th className="text-left px-3 py-2 font-black uppercase tracking-wider text-[10px]">Metric</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wider text-[10px] text-center">{termComparison.prev?.termName ?? "Previous"}</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wider text-[10px] text-center">{termComparison.latest?.termName ?? "Latest"}</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wider text-[10px] text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-base-300/60">
                      <td className="px-3 py-2 font-bold">Mean score</td>
                      <td className="px-3 py-2 text-center font-mono">{termComparison.prev?.meanScore.toFixed(1) ?? "—"}%</td>
                      <td className="px-3 py-2 text-center font-mono font-black">{termComparison.latest?.meanScore.toFixed(1) ?? "—"}%</td>
                      <td className={`px-3 py-2 text-right font-mono font-black ${
                        (termComparison.deltas?.mean ?? 0) > 0 ? "text-success" : (termComparison.deltas?.mean ?? 0) < 0 ? "text-error" : "opacity-60"
                      }`}>
                        {termComparison.deltas?.mean != null ? (
                          <span className="inline-flex items-center gap-0.5">
                            {termComparison.deltas.mean > 0 ? <TrendingUp className="w-3 h-3" /> : termComparison.deltas.mean < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {termComparison.deltas.mean > 0 ? "+" : ""}{termComparison.deltas.mean.toFixed(1)}%
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                    {termComparison.prev?.position != null && termComparison.latest?.position != null && (
                      <tr className="border-t border-base-300/60">
                        <td className="px-3 py-2 font-bold">Class position</td>
                        <td className="px-3 py-2 text-center font-mono">{ordinal(termComparison.prev.position)}{termComparison.prev.outOf ? ` / ${termComparison.prev.outOf}` : ""}</td>
                        <td className="px-3 py-2 text-center font-mono font-black">{ordinal(termComparison.latest.position)}{termComparison.latest.outOf ? ` / ${termComparison.latest.outOf}` : ""}</td>
                        <td className={`px-3 py-2 text-right font-mono font-black ${
                          (termComparison.deltas?.position ?? 0) > 0 ? "text-success" : (termComparison.deltas?.position ?? 0) < 0 ? "text-error" : "opacity-60"
                        }`}>
                          {termComparison.deltas?.position != null ? (
                            <span className="inline-flex items-center gap-0.5">
                              {termComparison.deltas.position > 0 ? <ArrowUpRight className="w-3 h-3" /> : termComparison.deltas.position < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                              {termComparison.deltas.position > 0 ? "+" : ""}{termComparison.deltas.position}
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    )}
                    {termComparison.prev?.attendanceDays != null && termComparison.latest?.attendanceDays != null && (
                      <tr className="border-t border-base-300/60">
                        <td className="px-3 py-2 font-bold">Attendance days</td>
                        <td className="px-3 py-2 text-center font-mono">{termComparison.prev.attendanceDays}</td>
                        <td className="px-3 py-2 text-center font-mono font-black">{termComparison.latest.attendanceDays}</td>
                        <td className={`px-3 py-2 text-right font-mono font-black ${
                          (termComparison.deltas?.attendance ?? 0) > 0 ? "text-success" : (termComparison.deltas?.attendance ?? 0) < 0 ? "text-error" : "opacity-60"
                        }`}>
                          {termComparison.deltas?.attendance != null ? (
                            <span className="inline-flex items-center gap-0.5">
                              {termComparison.deltas.attendance > 0 ? <ArrowUpRight className="w-3 h-3" /> : termComparison.deltas.attendance < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                              {termComparison.deltas.attendance > 0 ? "+" : ""}{termComparison.deltas.attendance}
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Clarification>
                Side-by-side of your last two generated report cards. Green arrows mean improvement,
                red arrows mean a setback. Use this to see whether recent habits are working.
              </Clarification>
            </div>
          )}

          {examAgg.exams.length > 0 && (
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={LineChartIcon} title="Performance over time" sub="Mean % across all exams"
                action={examAgg.trend && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase rounded-full ${
                    examAgg.trend === "up" ? "bg-success/10 text-success" : examAgg.trend === "down" ? "bg-error/10 text-error" : "bg-base-300 text-base-content/60"
                  }`}>
                    {examAgg.trend === "up" && <TrendingUp className="w-3 h-3" />}
                    {examAgg.trend === "down" && <TrendingDown className="w-3 h-3" />}
                    {examAgg.trend === "flat" && <Minus className="w-3 h-3" />}
                    {examAgg.trend}
                  </span>
                )} />
              <LineChart points={examLine} color={primaryColor} xLabels={examLabels} height={200} />
              <Clarification>
                Your exam-by-exam journey. Up means improving, flat means steady, down means a recent dip.
              </Clarification>
            </div>
          )}

          {examAgg.gradeDist.length > 0 && (
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={BarChart3} title="Grade distribution" sub={`${examAgg.gradeTotal} grades across ${examAgg.subjects.length} subject${examAgg.subjects.length === 1 ? "" : "s"}`} />
              <GradeDistributionBar data={examAgg.gradeDist} total={examAgg.gradeTotal} />
              <Clarification>
                How your grades break down. Lots of A's and B's is great — if most sit at C or below,
                that's a signal to focus on core subjects.
              </Clarification>
            </div>
          )}

          {subjectBar.length > 0 && (
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={BarChart3} title="Subject comparison" sub={`${subjectBar.length} subject${subjectBar.length === 1 ? "" : "s"}`} />
              <BarChart data={subjectBar} height={200} />
              <Clarification>
                Side-by-side comparison of all subjects. Highest = strength, lowest = biggest opportunity.
              </Clarification>
            </div>
          )}

          {/* NEW: Subject consistency */}
          {subjectConsistency.length > 0 && (
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={ShieldCheck} title="Subject consistency" sub="Lowest variance = most reliable" />
              <div className="space-y-2">
                {subjectConsistency.map((s) => (
                  <div key={s.subjectId} className="flex items-center gap-2 p-2.5 rounded-xl bg-base-100 border border-base-300">
                    <span className="text-xs font-black truncate flex-1">{s.name}</span>
                    <div className="w-24 sm:w-40">
                      <div className="h-2 rounded-full bg-base-300/40 overflow-hidden">
                        <div className={`h-full ${
                          s.stdDev <= 5 ? "bg-success" : s.stdDev <= 10 ? "bg-info" : s.stdDev <= 15 ? "bg-warning" : "bg-error"
                        }`} style={{ width: `${s.consistency}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono opacity-55 w-14 text-right">±{s.stdDev}</span>
                    <span className={`text-[10px] font-black uppercase w-12 text-right ${
                      s.stdDev <= 5 ? "text-success" : s.stdDev <= 10 ? "text-info" : s.stdDev <= 15 ? "text-warning" : "text-error"
                    }`}>
                      {s.stdDev <= 5 ? "Solid" : s.stdDev <= 10 ? "Good" : s.stdDev <= 15 ? "Mixed" : "Spiky"}
                    </span>
                  </div>
                ))}
              </div>
              <Clarification>
                Low numbers (±5 or less) mean your scores in that subject are consistent — a strength.
                High numbers mean your scores jump around, which often points to uneven understanding.
              </Clarification>
            </div>
          )}

          {examAgg.subjects.length > 0 && (
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={Layers} title="Subject breakdown" sub="Best, low, trend & exam count per subject" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {examAgg.subjects.map((s) => {
                  const tone = gradeTone(s.meanPercent);
                  return (
                    <div key={s.subjectId} className="p-4 rounded-2xl bg-base-100 border border-base-300 space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-black truncate">{s.name}</p>
                            {s.code && <span className="text-[9px] font-mono opacity-50 px-1.5 py-0.5 bg-base-300/40 rounded">{s.code}</span>}
                          </div>
                          <p className="text-[10px] font-mono opacity-55 mt-0.5">{s.examCount} exam{s.examCount === 1 ? "" : "s"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-2xl font-black leading-none ${tone.text}`}>{s.meanPercent.toFixed(1)}%</p>
                          <p className="text-[9px] font-black uppercase opacity-55 mt-0.5">Grade {s.grade}</p>
                        </div>
                      </div>
                      {s.percents.length > 1 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] opacity-55 uppercase font-black tracking-wider">Trend</span>
                          <Sparkline points={s.percents} width={120} height={30} color={tone.accent} />
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-1.5 rounded-lg bg-success/5 border border-success/20">
                          <p className="text-[8px] uppercase font-black opacity-55">Best</p>
                          <p className="text-xs font-black text-success">{s.best}%</p>
                        </div>
                        <div className="p-1.5 rounded-lg bg-warning/5 border border-warning/20">
                          <p className="text-[8px] uppercase font-black opacity-55">Low</p>
                          <p className="text-xs font-black text-warning">{s.worst}%</p>
                        </div>
                        <div className="p-1.5 rounded-lg bg-info/5 border border-info/20">
                          <p className="text-[8px] uppercase font-black opacity-55">Trend</p>
                          <p className={`text-xs font-black ${s.trend === null ? "opacity-50" : s.trend > 0 ? "text-success" : s.trend < 0 ? "text-error" : "opacity-60"}`}>
                            {s.trend === null ? "—" : `${s.trend > 0 ? "+" : ""}${s.trend.toFixed(1)}%`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Clarification>
                Per-subject deep-dive. Best = highest, Low = lowest, Trend = change between last two exams.
              </Clarification>
            </div>
          )}

          {examAgg.exams.length === 0 && (
            <div className={`${CARD} text-center space-y-3 py-12`}>
              <Award className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-black">No exam results yet</p>
              <p className="text-xs opacity-60">Results will appear here once your exams are graded.</p>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          ATTENDANCE TAB
         ══════════════════════════════════════════════════════════ */}
      {tab === "attendance" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${CARD} flex flex-col items-center justify-center gap-4`}>
              <Ring value={attAgg.rate ?? 0} size={180} stroke={14} color={attendanceTone(attAgg.rate).accent}
                label={attAgg.rate !== null ? `${attAgg.rate.toFixed(0)}%` : "—"} sublabel="attendance" />
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider font-black opacity-55">Current streak</p>
                <p className="text-3xl font-black flex items-center justify-center gap-2">{attAgg.streak}<Flame className="w-5 h-5 text-warning" /></p>
                <p className="text-[11px] opacity-60">consecutive day{attAgg.streak === 1 ? "" : "s"} present</p>
                <p className="text-[10px] font-mono opacity-50 mt-1">Longest ever: {attAgg.longestStreak} day{attAgg.longestStreak === 1 ? "" : "s"}</p>
              </div>
              <Clarification>
                Overall rate = (Present + Late) ÷ total marked days. Above 90% is excellent; below 75% means you're falling behind.
              </Clarification>
            </div>
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={PieChart} title="Distribution" sub={`${attAgg.total} day${attAgg.total === 1 ? "" : "s"} marked`} />
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <Donut size={140} stroke={16}
                  segments={[
                    { label: "Present", value: attAgg.present, color: "#16a34a" },
                    { label: "Late", value: attAgg.late, color: "#d97706" },
                    { label: "Excused", value: attAgg.excused, color: "#0284c7" },
                    { label: "Absent", value: attAgg.absent, color: "#dc2626" },
                  ]}
                  centerLabel={attAgg.present + attAgg.late} centerSub="attended" />
                <div className="grid grid-cols-2 gap-2 text-[11px] flex-1 min-w-[180px]">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-success" /><span className="font-bold">Present</span><span className="ml-auto font-mono opacity-60">{attAgg.present}</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-warning" /><span className="font-bold">Late</span><span className="ml-auto font-mono opacity-60">{attAgg.late}</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-info" /><span className="font-bold">Excused</span><span className="ml-auto font-mono opacity-60">{attAgg.excused}</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-error" /><span className="font-bold">Absent</span><span className="ml-auto font-mono opacity-60">{attAgg.absent}</span></div>
                </div>
              </div>
              <Clarification>
                Colour split of attendance days. Big green slice = great. If red or amber dominate, check what's getting in the way.
              </Clarification>
            </div>
          </div>

          {attAgg.dayOfWeekRates.some((d) => d.total > 0) && (
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={CalendarCheck} title="Day-of-week pattern" sub={`Best: ${attAgg.bestDay?.label ?? "—"} · Weakest: ${attAgg.worstDay?.label ?? "—"}`} />
              <BarChart data={attAgg.dayOfWeekRates.map((d) => ({ label: d.label, value: d.rate, color: d.rate >= 90 ? "#16a34a" : d.rate >= 75 ? "#d97706" : "#dc2626" }))} height={160} />
              <Clarification>
                Are you consistently absent on a specific weekday? Mondays and Fridays often dip — plan ahead.
              </Clarification>
            </div>
          )}

          <div className={`${CARD} space-y-4`}>
            <SectionHead icon={BarChart3} title="Weekly breakdown" sub="Attendance per week" />
            <BarChart data={attAgg.weekly.map((w) => ({ label: w.label, value: w.rate, color: w.rate >= 90 ? "#16a34a" : w.rate >= 75 ? "#d97706" : "#dc2626" }))} height={160} />
            <Clarification>
              Week-to-week. A sudden dip tells you exactly which week to investigate.
            </Clarification>
          </div>

          <div className={`${CARD} space-y-4`}>
            <SectionHead icon={CalendarCheck} title="30-day heatmap" sub="Each square is one day" />
            <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
              {attAgg.last30.map((day) => {
                let bg = "bg-base-300/40";
                if (day.status === "Present") bg = "bg-success";
                else if (day.status === "Late") bg = "bg-warning";
                else if (day.status === "Absent") bg = "bg-error";
                else if (day.status === "Excused") bg = "bg-info";
                return <div key={day.date} title={`${day.date}: ${day.status ?? "No record"}`} className={`aspect-square rounded-md ${bg} transition hover:scale-110 hover:ring-2 ring-primary/30 cursor-help`} />;
              })}
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] pt-2">
              {[["Present", "#16a34a"], ["Late", "#d97706"], ["Excused", "#0284c7"], ["Absent", "#dc2626"], ["No record", "#94a3b8"]].map(([label, color]) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="font-bold opacity-70">{label}</span>
                </span>
              ))}
            </div>
            <Clarification>
              Last 30 days snapshot. Long green streaks are great. Clusters of red or amber are your watch zones.
            </Clarification>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          HOMEWORK TAB
         ══════════════════════════════════════════════════════════ */}
      {tab === "homework" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Tile icon={Award} label="Completion" value={`${hwAgg.rate}%`} tone={hwAgg.rate >= 80 ? "text-success" : "text-warning"} bg={hwAgg.rate >= 80 ? "bg-success/10" : "bg-warning/10"} />
            <Tile icon={CheckCircle2} label="On-time rate" value={hwAgg.onTimeRate !== null ? `${hwAgg.onTimeRate}%` : "—"} tone={(hwAgg.onTimeRate ?? 0) >= 80 ? "text-success" : "text-warning"} bg={(hwAgg.onTimeRate ?? 0) >= 80 ? "bg-success/10" : "bg-warning/10"} />
            <Tile icon={Clock} label="Late" value={hwAgg.late} tone="text-error" bg="bg-error/10" />
            <Tile icon={Target} label="Avg score" value={hwAgg.avgScore !== null ? `${hwAgg.avgScore.toFixed(0)}%` : "—"} tone="text-primary" bg="bg-primary/10" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${CARD} flex flex-col items-center justify-center gap-3`}>
              <Ring value={hwAgg.rate} size={160} stroke={13} color={hwAgg.rate >= 80 ? "#16a34a" : hwAgg.rate >= 50 ? "#d97706" : "#dc2626"} label={`${hwAgg.rate}%`} sublabel="completion" />
              <p className="text-[11px] opacity-60 text-center">{hwAgg.done} of {hwAgg.total} assignments completed</p>
              <Clarification>
                Percentage of assignments submitted or graded. Aim for 90%+. A low number = lots of pending work.
              </Clarification>
            </div>
            <div className={`${CARD} lg:col-span-2 space-y-3`}>
              <SectionHead icon={ClipboardList} title="Breakdown" sub="By status" />
              <div className="grid grid-cols-2 gap-2">
                <Tile icon={Clock} label="Pending" value={hwAgg.pending} tone="text-warning" bg="bg-warning/10" />
                <Tile icon={Send} label="Submitted" value={hwAgg.submitted} tone="text-info" bg="bg-info/10" />
                <Tile icon={CheckCircle2} label="Graded" value={hwAgg.graded} tone="text-success" bg="bg-success/10" />
                <Tile icon={Award} label="Avg score" value={hwAgg.avgScore !== null ? `${hwAgg.avgScore.toFixed(1)}%` : "—"} tone="text-primary" bg="bg-primary/10" />
              </div>
              <div className="mt-3">
                <StackedBar segments={[{ value: hwAgg.graded, color: "#16a34a", label: "Graded" }, { value: hwAgg.submitted, color: "#0284c7", label: "Submitted" }, { value: hwAgg.pending, color: "#d97706", label: "Pending" }]} height={10} />
              </div>
              <Clarification>
                Green = done and marked. Blue = sent, waiting for feedback. Amber = needs your action.
              </Clarification>
            </div>
          </div>

          {hwAgg.bySubject.length > 0 && (
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={BarChart3} title="Completion by subject" sub={`${hwAgg.bySubject.length} subject${hwAgg.bySubject.length === 1 ? "" : "s"}`} />
              <BarChart data={hwAgg.bySubject.map((s) => {
                const p = s.total > 0 ? Math.round((s.graded / s.total) * 100) : 0;
                return { label: s.name, value: p, color: p >= 80 ? "#16a34a" : p >= 50 ? "#d97706" : "#dc2626" };
              })} height={180} />
              <Clarification>
                Each bar shows how many assignments are graded. Low bars = behind in that subject.
              </Clarification>
            </div>
          )}

          {hwAgg.recentPending.length > 0 && (
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={Clock} title="Upcoming deadlines" sub={`${hwAgg.recentPending.length} pending`} />
              <div className="space-y-2">
                {hwAgg.recentPending.map((s: any) => {
                  const due = s.assignment?.dueDate;
                  const isOverdue = due && new Date(due) < new Date();
                  return (
                    <div key={s.id} className={`p-3 rounded-xl bg-base-100 border flex items-center gap-3 ${isOverdue ? "border-error/30" : "border-base-300"}`}>
                      <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${isOverdue ? "bg-error/10 text-error" : "bg-warning/10 text-warning"}`}>
                        {isOverdue ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate">{s.assignment?.title ?? "Assignment"}</p>
                        <p className="text-[10px] font-mono opacity-60">{isOverdue ? "Overdue · " : "Due "}{fmtDate(due)}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${isOverdue ? "bg-error/10 text-error" : s.status === "Returned" ? "bg-secondary/10 text-secondary" : "bg-warning/10 text-warning"}`}>
                        {s.status}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Clarification>Nearest assignments. Red items are overdue — handle them first.</Clarification>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          FEES TAB
         ══════════════════════════════════════════════════════════ */}
      {tab === "fees" && (
        <>
          {feesAgg.total > 0 ? (
            <div className={`${CARD} space-y-5`}>
              <SectionHead icon={Wallet} title="Fee clearance" sub={activeTermId ? "Current term" : "All terms"} />
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Ring value={feesAgg.percentPaid} size={150} stroke={12}
                  color={feesAgg.percentPaid >= 100 ? "#16a34a" : feesAgg.percentPaid >= 50 ? "#d97706" : "#dc2626"}
                  label={`${feesAgg.percentPaid}%`} sublabel="cleared" />
                <div className="flex-1 w-full space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-2xl bg-base-100 border border-base-300">
                      <p className="text-[9px] uppercase tracking-wider font-black opacity-55">Total</p>
                      <p className="text-sm font-black truncate">{fmtMoney(feesAgg.total)}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-success/5 border border-success/20">
                      <p className="text-[9px] uppercase tracking-wider font-black opacity-55">Paid</p>
                      <p className="text-sm font-black text-success truncate">{fmtMoney(feesAgg.paid)}</p>
                    </div>
                    <div className={`p-3 rounded-2xl border ${feesAgg.balance > 0 ? "bg-warning/5 border-warning/20" : "bg-success/5 border-success/20"}`}>
                      <p className="text-[9px] uppercase tracking-wider font-black opacity-55">Balance</p>
                      <p className={`text-sm font-black truncate ${feesAgg.balance > 0 ? "text-warning" : "text-success"}`}>{fmtMoney(feesAgg.balance)}</p>
                    </div>
                  </div>
                  {feesAgg.dueDate && (
                    <p className={`text-[11px] font-mono ${feesAgg.isOverdue ? "text-error font-black" : "opacity-60"}`}>
                      {feesAgg.isOverdue ? `Overdue by ${Math.abs(feesAgg.daysRelative ?? 0)} day${Math.abs(feesAgg.daysRelative ?? 0) === 1 ? "" : "s"}` : `Due in ${feesAgg.daysRelative ?? 0} day${(feesAgg.daysRelative ?? 0) === 1 ? "" : "s"}`}
                      {" · "}{fmtDate(feesAgg.dueDate)}
                    </p>
                  )}
                </div>
              </div>
              <StackedBar segments={[{ value: feesAgg.paid, color: "#16a34a", label: "Paid" }, { value: Math.max(0, feesAgg.balance), color: "#d97706", label: "Outstanding" }]} height={12} />
              <Clarification>
                Percentage of fees paid. 100% = fully cleared. Below 50% = significant balance. Check the due date.
              </Clarification>
            </div>
          ) : (
            <div className={`${CARD} text-center space-y-3 py-12`}>
              <Wallet className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-black">No fee data available</p>
              <p className="text-xs opacity-60">Fees for this term will appear here once billed.</p>
            </div>
          )}

          {/* NEW: Payment timeline */}
          {paymentTimeline.length > 0 && (
            <div className={`${CARD} space-y-4`}>
              <SectionHead icon={Hourglass} title="Payment history" sub={`${paymentTimeline.length} recent payment${paymentTimeline.length === 1 ? "" : "s"}`} />
              <div className="relative pl-6 space-y-3">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-base-300" />
                {paymentTimeline.map((t, i) => {
                  const tone = t.method === "M-Pesa" ? "bg-warning/10 text-warning" : t.method === "Bank" ? "bg-info/10 text-info" : "bg-success/10 text-success";
                  const dotTone = t.method === "M-Pesa" ? "bg-warning" : t.method === "Bank" ? "bg-info" : "bg-success";
                  const reversed = (t.status ?? "").toLowerCase() === "reversed";
                  return (
                    <div key={t.id ?? i} className="relative">
                      <div className={`absolute -left-[18px] top-2 w-3 h-3 rounded-full border-2 border-base-100 ${reversed ? "bg-base-300" : dotTone}`} />
                      <div className={`p-3 rounded-xl bg-base-100 border ${reversed ? "border-base-300 opacity-60" : "border-base-300"}`}>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-black ${reversed ? "line-through" : ""}`}>{fmtMoney(t.amount)}</p>
                              {t.method && (
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${tone}`}>{t.method}</span>
                              )}
                              {reversed && <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-error/10 text-error">Reversed</span>}
                            </div>
                            {t.ref && <p className="text-[10px] font-mono opacity-55 mt-0.5">{t.ref}</p>}
                            {t.payer && <p className="text-[10px] opacity-55 mt-0.5">by {t.payer}</p>}
                          </div>
                          <p className="text-[10px] font-mono opacity-55 shrink-0">{fmtDate(t.date)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Clarification>
                Most recent payments, newest first. Each dot is one payment — colour shows the method.
              </Clarification>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          ENGAGEMENT TAB
         ══════════════════════════════════════════════════════════ */}
      {tab === "engagement" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`${CARD} !p-5 space-y-3`}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-secondary/10 text-secondary"><Star className="w-4 h-4" /></div>
                <p className="text-[10px] uppercase tracking-wider font-black opacity-55">Activities</p>
              </div>
              <p className="text-4xl font-black">{activities.length}</p>
              <div className="space-y-1.5">
                {activities.slice(0, 3).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    <span className="font-bold truncate flex-1">{a.name}</span>
                    <span className="text-[9px] uppercase opacity-55">{a.category}</span>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-[11px] opacity-60 italic">Not enrolled in any activities</p>}
              </div>
            </div>
            <div className={`${CARD} !p-5 space-y-3`}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-warning/10 text-warning"><CalendarCheck className="w-4 h-4" /></div>
                <p className="text-[10px] uppercase tracking-wider font-black opacity-55">Upcoming events</p>
              </div>
              <p className="text-4xl font-black">{upcomingEvents.length}</p>
              <div className="space-y-1.5">
                {upcomingEvents.slice(0, 3).map((e: any) => (
                  <div key={e.id} className="flex items-start gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1 shrink-0" />
                    <span className="font-bold truncate flex-1">{e.title}</span>
                    <span className="text-[9px] font-mono opacity-55 shrink-0">{fmtDate(e.startDate)}</span>
                  </div>
                ))}
                {upcomingEvents.length === 0 && <p className="text-[11px] opacity-60 italic">No upcoming events</p>}
              </div>
            </div>
            <div className={`${CARD} !p-5 space-y-3`}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary"><Megaphone className="w-4 h-4" /></div>
                <p className="text-[10px] uppercase tracking-wider font-black opacity-55">Announcements</p>
              </div>
              <p className="text-4xl font-black">{announcements.length}</p>
              <div className="space-y-1.5">
                {announcements.slice(0, 3).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                    <span className="font-bold truncate flex-1">{a.title}</span>
                  </div>
                ))}
                {announcements.length === 0 && <p className="text-[11px] opacity-60 italic">No active announcements</p>}
              </div>
            </div>
          </div>

          {activities.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`${CARD} flex flex-col items-center gap-3`}>
                <SectionHead icon={PieChart} title="Categories" sub={`${activities.length} activities`} />
                {(() => {
                  const catCounts: Record<string, number> = {};
                  activities.forEach((a: any) => { const c = a.category ?? "Other"; catCounts[c] = (catCounts[c] ?? 0) + 1; });
                  const palette = ["#6366f1", "#16a34a", "#f59e0b", "#0284c7", "#dc2626", "#94a3b8"];
                  const segments = Object.entries(catCounts).map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }));
                  return (
                    <>
                      <Donut size={150} stroke={18} segments={segments} centerLabel={activities.length} centerSub="activities" />
                      <div className="grid grid-cols-2 gap-1 w-full mt-2">
                        {segments.map((s) => (
                          <div key={s.label} className="flex items-center gap-1.5 text-[10px]">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                            <span className="font-bold truncate">{s.label}</span>
                            <span className="ml-auto font-mono opacity-55">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
                <Clarification>
                  Mix of activity categories. Balance is good — a single dominant category may mean missing out.
                </Clarification>
              </div>
              <div className={`${CARD} lg:col-span-2 space-y-4`}>
                <SectionHead icon={ActivityIcon} title="All my activities" sub={`${activities.length} total`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activities.map((a: any) => (
                    <div key={a.id} className="p-3 rounded-2xl bg-base-100 border border-base-300 flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary grid place-items-center shrink-0"><Star className="w-4 h-4" /></div>
                      <div className="min-w-0">
                        <p className="text-xs font-black truncate">{a.name}</p>
                        <p className="text-[10px] opacity-55 uppercase font-bold tracking-wider">{a.category}</p>
                        {a.patron?.name && <p className="text-[10px] opacity-60 truncate mt-0.5">Patron: {a.patron.name}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <Clarification>Every club, team or society you belong to. Extracurriculars build skills grades alone can't.</Clarification>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── FOOTER ── */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-base-200/40 border border-base-300 text-[11px] opacity-70">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Analytics update as new data is recorded. Grades shown are derived from your marks —
          official report cards take precedence. Predictions are hints, not promises.
        </span>
      </div>
    </div>
  );
}