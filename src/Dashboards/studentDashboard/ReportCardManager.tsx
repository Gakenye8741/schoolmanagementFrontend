import React, { useEffect, useMemo, useState } from "react";
import {
  FileText, Download, Printer, GraduationCap, Award, CalendarRange, School,
  User, Hash, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2, Clock,
  BookOpen, Percent, FileX2, Sparkles, Info, Filter, RefreshCw, Layers,
  MessageSquareQuote, BarChart3, Tag, ShieldCheck, ClipboardList,
} from "lucide-react";
import { useGetMyProfileQuery } from "../../features/Apis/Auth.Api";
import {
  useGetStudentByUserIdQuery,
  useGetStudentWithRelationsQuery,
  useGetCurrentEnrollmentQuery,
} from "../../features/Apis/students.Api";
import {
  useGetStudentReportCardsQuery,
  reportCardsApi,
} from "../../features/Apis/ReportCard.Api";
import type { ReportCard } from "../../features/Apis/ReportCard.Api";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";
import {
  useGetSubjectsBySchoolQuery,
  useGetGradeLevelByIdQuery,
} from "../../features/Apis/academicStructure.Api";
import { useGetCurrentTermBySchoolIdQuery } from "../../features/Apis/Term.Api";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const CARD =
  "bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 sm:p-8 rounded-3xl shadow-xl";

const INPUT_SM = "px-3 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl";

const GRADE_TONES: Record<string, { bg: string; text: string }> = {
  top: { bg: "bg-success/10", text: "text-success" },
  good: { bg: "bg-primary/10", text: "text-primary" },
  mid: { bg: "bg-warning/10", text: "text-warning" },
  low: { bg: "bg-error/10", text: "text-error" },
  none: { bg: "bg-base-300", text: "text-base-content/70" },
};

/* ═══════════════════════════════════════════════════════════════
   SHARED HELPERS
   ═══════════════════════════════════════════════════════════════ */
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

const toNum = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmtScore = (v: any) => {
  const n = toNum(v);
  return n === null ? "—" : n.toFixed(1);
};

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
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

const ordinal = (n?: number | null) => {
  if (n == null || n <= 0) return "";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const escapeHtml = (s: any) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );

const safeColor = (c: any, fallback: string) =>
  typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c.trim()) ? c.trim() : fallback;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "S";

/* ── Grade → remark mapping ── */
const GRADE_REMARKS: Record<string, { remark: string; descriptor: string }> = {
  A: { remark: "Outstanding performance.", descriptor: "Excellent" },
  "A-": { remark: "Very good work.", descriptor: "Very Good" },
  "B+": { remark: "Good performance.", descriptor: "Good" },
  B: { remark: "Good performance.", descriptor: "Good" },
  "B-": { remark: "Can improve.", descriptor: "Fair" },
  "C+": { remark: "Can improve.", descriptor: "Fair" },
  C: { remark: "Needs attention.", descriptor: "Fair" },
  "C-": { remark: "Needs more effort.", descriptor: "Weak" },
  "D+": { remark: "Needs more effort.", descriptor: "Weak" },
  D: { remark: "Needs intervention.", descriptor: "Weak" },
  "D-": { remark: "Needs intervention.", descriptor: "Very Weak" },
  E: { remark: "Needs intervention.", descriptor: "Fail" },
  EE: { remark: "Exceeds expectations.", descriptor: "Exceeds Expectations" },
  ME: { remark: "Meets expectations.", descriptor: "Meets Expectations" },
  AE: { remark: "Approaches expectations.", descriptor: "Approaches Expectations" },
  BE: { remark: "Below expectations.", descriptor: "Below Expectations" },
  "9": { remark: "Outstanding performance.", descriptor: "Outstanding" },
  "8": { remark: "Excellent performance.", descriptor: "Excellent" },
  "7": { remark: "Very good performance.", descriptor: "Very Good" },
  "6": { remark: "Good performance.", descriptor: "Good" },
  "5": { remark: "Satisfactory.", descriptor: "Satisfactory" },
  "4": { remark: "Adequate.", descriptor: "Adequate" },
  "3": { remark: "Needs improvement.", descriptor: "Weak" },
  "2": { remark: "Needs improvement.", descriptor: "Poor" },
  "1": { remark: "Needs intervention.", descriptor: "Very Poor" },
};

function getGradeRemark(
  grade?: string | null,
  explicitRemark?: string | null,
  explicitDescriptor?: string | null
) {
  const trimmed = (explicitRemark ?? "").trim();
  if (trimmed) {
    return { remark: trimmed, descriptor: explicitDescriptor?.trim() || null, source: "teacher" as const };
  }
  const key = grade ? String(grade).toUpperCase().trim() : "";
  const found = key ? GRADE_REMARKS[key] : undefined;
  if (explicitDescriptor?.trim()) {
    return { remark: found?.remark ?? null, descriptor: explicitDescriptor.trim(), source: "backend" as const };
  }
  if (found) return { remark: found.remark, descriptor: found.descriptor, source: "auto" as const };
  return { remark: null, descriptor: null, source: "none" as const };
}

function gradeKey(g?: string | null): keyof typeof GRADE_TONES {
  if (!g) return "none";
  const u = g.toUpperCase().trim();
  if (u === "AE") return "mid";
  if (u === "EE") return "top";
  if (u === "ME") return "good";
  if (u === "BE") return "low";
  if (u.startsWith("A")) return "top";
  if (u.startsWith("B")) return "good";
  if (u.startsWith("C")) return "mid";
  if (/^[6-9]$/.test(u)) return u === "9" || u === "8" ? "top" : "good";
  if (/^[4-5]$/.test(u)) return "mid";
  if (/^[1-3]$/.test(u)) return "low";
  return "low";
}

function subjectPct(s: any): number | null {
  if (s?.percentage != null) return toNum(s.percentage);
  const m = toNum(s?.marks);
  const o = toNum(s?.outOf) ?? 100;
  return m !== null && o ? (m / o) * 100 : null;
}

function attendancePct(c: any): number | null {
  const rate = c?.attendance?.attendanceRate ?? c?.attendanceRate;
  if (rate !== undefined && rate !== null && rate !== "") {
    const n = toNum(rate);
    return n !== null ? Math.round(n) : null;
  }
  const a = toNum(c?.attendanceDays);
  const t = toNum(c?.totalSchoolDays);
  return a !== null && t ? Math.round((a / t) * 100) : null;
}

const cardGrade = (c: any): string | null => c?.grade ?? c?.totals?.meanGrade ?? null;
const cardPosition = (c: any): number | null => toNum(c?.position ?? c?.classPosition);
const cardOutOf = (c: any): number | null => toNum(c?.outOf ?? c?.streamSize);
const cardTotalMarks = (c: any): string | number | null => c?.totalMarks ?? c?.totals?.totalMarks ?? null;
const cardTotalPoints = (c: any): string | number | null => c?.totalPoints ?? c?.totals?.totalPoints ?? null;
const cardMeanScore = (c: any): string | number | null => c?.meanScore ?? c?.totals?.meanScore ?? null;

function extractCard(res: any): any | undefined {
  if (!res) return undefined;
  if (res.data && !Array.isArray(res.data) && res.data.subjects) return res.data;
  if (res.preview) return res.preview;
  if (res.reportCard) return res.reportCard;
  if (res.data && !Array.isArray(res.data)) return res.data;
  return undefined;
}

/* ═══════════════════════════════════════════════════════════════
   PDF / PRINT HELPERS
   ═══════════════════════════════════════════════════════════════ */
let html2pdfLoading: Promise<void> | null = null;
function loadHtml2Pdf(): Promise<void> {
  if ((window as any).html2pdf) return Promise.resolve();
  if (html2pdfLoading) return html2pdfLoading;
  html2pdfLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load html2pdf"));
    document.head.appendChild(s);
  });
  return html2pdfLoading;
}

function openPrintWindow(html: string): boolean {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  const imgs = Array.from(w.document.images);
  const ready = Promise.all(
    imgs.map((i) =>
      i.complete
        ? Promise.resolve()
        : new Promise<void>((r) => {
            i.onload = () => r();
            i.onerror = () => r();
          })
    )
  );
  Promise.race([ready, new Promise((r) => setTimeout(r, 4000))]).then(() => w.print());
  return true;
}

/* ═══════════════════════════════════════════════════════════════
   BRANDED PRINT HTML — same layout as the admin manager
   ═══════════════════════════════════════════════════════════════ */
interface PrintBranding {
  name: string;
  logoUrl?: string | null;
  primary: string;
  secondary: string;
  motto?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  principalName?: string | null;
}

function buildPrintHtml(
  res: any,
  fallbackCard: any,
  names: { student: string; term: string; cls: string },
  brand: PrintBranding,
  subjectName: (id?: string) => string
) {
  const P = safeColor(brand.primary, "#4f46e5");
  const S = safeColor(brand.secondary, "#f59e0b");

  const rd = res?.data && !Array.isArray(res.data) ? res.data : {};
  const card = res?.reportCard ?? rd.reportCard ?? (rd.id ? rd : fallbackCard) ?? {};
  const school = res?.school ?? rd.school ?? {};
  const student = res?.student ?? rd.student ?? card.student ?? {};
  const term = res?.term ?? rd.term ?? card.term ?? {};
  const subjects: any[] = rd.subjects ?? card.subjectResults ?? card.subjects ?? [];
  const exams: any[] = rd.exams ?? [];

  const grade = cardGrade(rd) ?? cardGrade(card) ?? "—";
  const gradeInfo = getGradeRemark(grade as string);
  const position = cardPosition(rd) ?? cardPosition(card);
  const outOf = cardOutOf(rd) ?? cardOutOf(card);
  const totalPoints = cardTotalPoints(rd) ?? cardTotalPoints(card) ?? "—";
  const totalMarks = cardTotalMarks(rd) ?? cardTotalMarks(card) ?? "—";
  const meanScore = cardMeanScore(rd) ?? cardMeanScore(card);
  const att = attendancePct(rd) ?? attendancePct(card);

  const schoolName = school.name ?? brand.name;
  const logoUrl = brand.logoUrl || school.logoUrl || null;
  const logoHtml = logoUrl
    ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="logo" />`
    : `<div class="logo mono">${escapeHtml(initials(schoolName))}</div>`;
  const watermark = logoUrl ? `<img class="wm" src="${escapeHtml(logoUrl)}" alt="" />` : "";

  const contact = [brand.address, brand.phone, brand.email, brand.website]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" &nbsp;•&nbsp; ");

  const tone = (g?: string | null): string => {
    const k = String(gradeKey(g));
    const map: Record<string, string> = {
      top: "#15803d",
      good: P,
      mid: "#b45309",
      low: "#b91c1c",
      none: "#64748b",
    };
    return map[k] ?? "#64748b";
  };

  const subjectRows = subjects
    .map((s) => {
      const marksText =
        s.marks != null && s.outOf != null ? `${s.marks} / ${s.outOf}` : s.marks ?? "—";
      const { remark, descriptor } = getGradeRemark(
        s.grade,
        s.teacherRemarks ?? s.remarks,
        s.descriptor
      );
      const pct = subjectPct(s);
      return `<tr>
        <td class="subj">${escapeHtml(s.subjectName ?? s.name ?? subjectName(s.subjectId))}</td>
        <td class="c">${escapeHtml(marksText)}${pct !== null ? `<small>${pct.toFixed(1)}%</small>` : ""}</td>
        <td class="c"><span class="pill" style="background:${tone(s.grade)}">${escapeHtml(s.grade ?? "—")}</span>${descriptor ? `<small>${escapeHtml(descriptor)}</small>` : ""}</td>
        <td class="c">${escapeHtml(s.points ?? "—")}</td>
        <td class="rem-cell">${escapeHtml(remark ?? "")}</td>
      </tr>`;
    })
    .join("");

  const examRows = exams
    .map(
      (e) => `<tr>
      <td>${escapeHtml(e.examTitle)}</td><td>${escapeHtml(e.examCategory)}</td>
      <td class="c">${escapeHtml(e.weighting ?? "—")}</td><td class="c">${e.isLocked ? "✓" : "—"}</td></tr>`
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8">
<title>Report card – ${escapeHtml(studentFullName(student) || names.student)}</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; font-size: 12px; }
  .page { position: relative; border: 2px solid ${P}; border-radius: 10px; overflow: hidden; min-height: 275mm; }
  .wm { position: absolute; top: 50%; left: 50%; width: 380px; transform: translate(-50%,-50%); opacity: .05; z-index: 0; }
  .inner { position: relative; z-index: 1; }
  .band { height: 10px; background: linear-gradient(90deg, ${P} 0 70%, ${S} 70% 100%); }
  .letterhead { display: flex; align-items: center; gap: 18px; padding: 16px 24px;
    background: linear-gradient(135deg, ${P}14, ${S}14); border-bottom: 3px solid ${S}; }
  .logo { width: 84px; height: 84px; object-fit: contain; border-radius: 12px; background: #fff; padding: 4px; border: 2px solid ${P}; }
  .logo.mono { display: grid; place-items: center; font-size: 30px; font-weight: 800; color: #fff; background: ${P}; border-color: ${S}; }
  .lh-text { flex: 1; text-align: center; }
  .lh-text h1 { margin: 0; font-size: 24px; letter-spacing: .5px; text-transform: uppercase; color: ${P}; }
  .motto { font-style: italic; color: ${S}; font-weight: 600; margin: 3px 0; font-size: 12px; }
  .contact { font-size: 10px; color: #475569; }
  .title { display: flex; justify-content: space-between; align-items: center; background: ${P}; color: #fff; padding: 9px 24px; }
  .title b { font-size: 14px; letter-spacing: 2px; text-transform: uppercase; }
  .title span { font-size: 12px; background: ${S}; padding: 3px 12px; border-radius: 99px; font-weight: 700; }
  .body { padding: 16px 24px 20px; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
  .meta div { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${S}; border-radius: 6px; padding: 7px 10px; }
  .meta small { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .8px; color: #64748b; }
  .meta b { font-size: 12.5px; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1.2px; color: ${P}; margin: 16px 0 6px;
    padding-bottom: 4px; border-bottom: 2px solid ${S}; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  thead th { background: ${P}; color: #fff; padding: 7px 8px; text-align: left; font-size: 10px; letter-spacing: .8px; text-transform: uppercase; }
  tbody td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  tbody tr:nth-child(even) { background: ${P}0d; }
  .c { text-align: center; } th.c { text-align: center; }
  .subj { font-weight: 700; }
  td small { display: block; font-size: 9px; color: #64748b; font-style: italic; }
  .pill { display: inline-block; min-width: 30px; padding: 2px 8px; border-radius: 99px; color: #fff; font-weight: 800; font-size: 11px; }
  .rem-cell { font-style: italic; color: #475569; }
  .sum { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 12px; }
  .sum div { text-align: center; padding: 9px 6px; border-radius: 8px; border: 1px solid ${P}33; background: ${P}0f; }
  .sum div:nth-child(2) { background: ${S}22; border-color: ${S}; }
  .sum small { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .8px; color: #64748b; }
  .sum b { font-size: 19px; color: ${P}; }
  .overall { margin-top: 10px; padding: 9px 12px; border-left: 4px solid ${S}; background: ${S}14; border-radius: 4px; }
  .remarks { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .box { min-height: 62px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; background: #fff; }
  .sign { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 28px; margin-top: 26px; }
  .sign div { border-top: 1.5px solid ${P}; padding-top: 4px; text-align: center; font-size: 10px; color: #475569; }
  .foot { display: flex; justify-content: space-between; padding: 8px 24px; background: ${P}; color: #fff; font-size: 9.5px; }
</style></head><body>
<div class="page">
  ${watermark}
  <div class="inner">
    <div class="band"></div>
    <div class="letterhead">
      ${logoHtml}
      <div class="lh-text">
        <h1>${escapeHtml(schoolName)}</h1>
        ${brand.motto ? `<div class="motto">"${escapeHtml(brand.motto)}"</div>` : ""}
        ${contact ? `<div class="contact">${contact}</div>` : ""}
      </div>
      <div style="width:84px"></div>
    </div>
    <div class="title">
      <b>Student Report Card</b>
      <span>${escapeHtml(names.term || term.termName || "")} ${escapeHtml(term.academicYear ?? "")}</span>
    </div>

    <div class="body">
      <div class="meta">
        <div><small>Student</small><b>${escapeHtml(studentFullName(student) || names.student)}</b></div>
        <div><small>Admission no.</small><b>${escapeHtml(student.admissionNumber ?? "—")}</b></div>
        <div><small>Class</small><b>${escapeHtml(names.cls || "—")}</b></div>
        <div><small>Date issued</small><b>${escapeHtml(fmtDate(card.generatedAt ?? card.createdAt))}</b></div>
      </div>

      <h2>Academic Results</h2>
      <table>
        <thead><tr><th>Subject</th><th class="c">Marks</th><th class="c">Grade</th><th class="c">Points</th><th>Remarks</th></tr></thead>
        <tbody>${subjectRows || '<tr><td colspan="5" class="c">No subject breakdown available.</td></tr>'}</tbody>
      </table>

      <div class="sum">
        <div><small>Total marks</small><b>${escapeHtml(totalMarks)}</b></div>
        <div><small>Mean grade</small><b>${escapeHtml(grade)}</b></div>
        <div><small>Mean score</small><b>${escapeHtml(fmtScore(meanScore))}</b></div>
        <div><small>Position</small><b>${position ? `${escapeHtml(position)}/${escapeHtml(outOf ?? "—")}` : "—"}</b></div>
        <div><small>Attendance</small><b>${att === null ? "—" : att + "%"}</b></div>
      </div>
      <div class="sum" style="grid-template-columns:1fr;margin-top:6px"><div><small>Total points</small><b>${escapeHtml(totalPoints)}</b></div></div>
      ${gradeInfo.remark ? `<div class="overall"><b>Overall:</b> ${escapeHtml(gradeInfo.descriptor ?? "")} — ${escapeHtml(gradeInfo.remark)}</div>` : ""}

      ${exams.length ? `<h2>Exams Included</h2>
      <table><thead><tr><th>Exam</th><th>Category</th><th class="c">Weighting %</th><th class="c">Locked</th></tr></thead>
      <tbody>${examRows}</tbody></table>` : ""}

      <h2>Remarks</h2>
      <div class="remarks">
        <div><small style="color:#64748b;font-size:9px;text-transform:uppercase">Class teacher</small>
          <div class="box">${escapeHtml(card.classTeacherRemarks ?? "")}</div></div>
        <div><small style="color:#64748b;font-size:9px;text-transform:uppercase">Principal${brand.principalName ? ` – ${escapeHtml(brand.principalName)}` : ""}</small>
          <div class="box">${escapeHtml(card.principalRemarks ?? "")}</div></div>
      </div>

      <div class="sign">
        <div>Class teacher's signature</div>
        <div>Principal's signature &amp; stamp</div>
        <div>Parent / guardian's signature</div>
      </div>
    </div>
    <div class="foot"><span>${escapeHtml(schoolName)}</span><span>${escapeHtml(brand.motto ?? "")}</span><span>Official report card</span></div>
  </div>
</div>
</body></html>`;
}

function studentFullName(s?: any): string {
  if (!s) return "";
  return (
    s.name ||
    `${s.firstName ?? ""} ${s.middleName ? s.middleName + " " : ""}${s.lastName ?? ""}`.trim()
  );
}

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function GradeChip({
  grade,
  descriptor,
  size = "sm",
}: {
  grade?: string | null;
  descriptor?: string | null;
  size?: "sm" | "lg";
}) {
  const tone = GRADE_TONES[gradeKey(grade)];
  if (size === "lg") {
    return (
      <div className="shrink-0 flex flex-col items-center gap-1">
        <span
          className={`grid place-items-center font-black rounded-xl w-12 h-12 text-base ${tone.bg} ${tone.text}`}
        >
          {grade || "—"}
        </span>
        {descriptor && (
          <span
            className={`text-[8px] font-black uppercase tracking-wider ${tone.text} opacity-70 max-w-[68px] text-center leading-tight`}
          >
            {descriptor}
          </span>
        )}
      </div>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${tone.bg} ${tone.text} border-current/20`}
    >
      {grade || "—"}
    </span>
  );
}

function SchoolLogo({
  school,
  name,
  color,
  size = 56,
}: {
  school?: any;
  name: string;
  color: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (school?.logoUrl && !failed) {
    return (
      <img
        src={school.logoUrl}
        alt={`${name} logo`}
        onError={() => setFailed(true)}
        className="object-contain rounded-2xl bg-white p-1 border-2 shadow-sm shrink-0"
        style={{ width: size, height: size, borderColor: color }}
      />
    );
  }
  return (
    <div
      className="grid place-items-center rounded-2xl text-white font-black shadow-sm shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.34 }}
    >
      {initials(name)}
    </div>
  );
}

function StatusBadge({ published }: { published?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${
        published
          ? "bg-success/10 text-success border-success/20"
          : "bg-warning/10 text-warning border-warning/20"
      }`}
    >
      {published ? (
        <>
          <CheckCircle2 className="w-3 h-3" /> Published
        </>
      ) : (
        <>
          <Clock className="w-3 h-3" /> Draft
        </>
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD SUMMARY — inline preview matching the print layout
   ═══════════════════════════════════════════════════════════════ */
function CardSummary({
  card,
  primaryColor,
  subjectName,
}: {
  card: any;
  primaryColor: string;
  subjectName: (id?: string) => string;
}) {
  const subjects: any[] = card?.subjects ?? card?.subjectResults ?? [];
  const exams: any[] = card?.exams ?? [];
  const grade = cardGrade(card);
  const gradeInfo = getGradeRemark(grade);
  const position = cardPosition(card);
  const outOf = cardOutOf(card);
  const totalMarks = cardTotalMarks(card);
  const totalPoints = cardTotalPoints(card);
  const meanScore = cardMeanScore(card);
  const att = attendancePct(card);

  return (
    <div className="space-y-5">
      {/* Summary grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {[
          { label: "Total marks", value: totalMarks ?? "—", icon: ClipboardList },
          { label: "Mean grade", value: grade ?? "—", icon: Award },
          { label: "Mean score", value: fmtScore(meanScore), icon: Percent },
          {
            label: "Position",
            value: position ? `${position}${outOf ? `/${outOf}` : ""}` : "—",
            icon: Layers,
          },
          { label: "Attendance", value: att === null ? "—" : `${att}%`, icon: CheckCircle2 },
          { label: "Total points", value: totalPoints ?? "—", icon: Sparkles },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="p-3 rounded-2xl bg-base-100 border border-base-300 flex items-center gap-2.5"
          >
            <div
              className="p-2 rounded-lg shrink-0"
              style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase font-black tracking-wider opacity-55">
                {label}
              </p>
              <p className="text-sm font-black truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overall remark */}
      {gradeInfo.remark && (
        <div className="p-3 px-4 bg-success/5 border border-success/20 rounded-xl flex items-start gap-2.5 text-xs">
          <MessageSquareQuote className="w-4 h-4 text-success shrink-0 mt-0.5" />
          <div>
            <span className="font-black text-success">{grade}</span>
            {gradeInfo.descriptor && (
              <span className="opacity-60"> — {gradeInfo.descriptor}</span>
            )}
            <p className="mt-0.5 italic opacity-80">"{gradeInfo.remark}"</p>
          </div>
        </div>
      )}

      {/* Subject table */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> Academic results
        </h3>
        {subjects.length === 0 ? (
          <div className="p-6 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
            No subject breakdown available.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-base-300">
            <table className="w-full text-xs">
              <thead className="bg-base-200/60">
                <tr>
                  <th className="text-left px-3 py-2 font-black uppercase tracking-wider text-[10px]">
                    Subject
                  </th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider text-[10px] text-center">
                    Marks
                  </th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider text-[10px] text-center">
                    Grade
                  </th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider text-[10px] text-center">
                    Points
                  </th>
                  <th className="text-left px-3 py-2 font-black uppercase tracking-wider text-[10px]">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, i) => {
                  const pct = subjectPct(s);
                  const info = getGradeRemark(s.grade, s.teacherRemarks, s.descriptor);
                  const marksText =
                    s.marks != null && s.outOf != null
                      ? `${s.marks} / ${s.outOf}`
                      : s.marks ?? "—";
                  return (
                    <tr key={s.subjectId ?? i} className="border-t border-base-300/60">
                      <td className="px-3 py-2">
                        <p className="font-bold truncate">
                          {s.subjectName ?? s.name ?? subjectName(s.subjectId)}
                        </p>
                        {pct !== null && (
                          <p className="text-[10px] font-mono opacity-55">
                            {pct.toFixed(1)}%
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold">
                        {marksText}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <GradeChip grade={s.grade} />
                      </td>
                      <td className="px-3 py-2 text-center font-mono opacity-70">
                        {s.points ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-[11px] italic opacity-70 max-w-[180px]">
                        {info.remark ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exams included */}
      {exams.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" /> Exams included
          </h3>
          <div className="space-y-1">
            {exams.map((e: any, i: number) => (
              <div
                key={e.examId ?? i}
                className="p-2 px-3 bg-base-100 border border-base-300 rounded-lg flex items-center gap-2 text-[11px]"
              >
                <span className="font-bold flex-1 truncate">{e.examTitle}</span>
                <span className="text-[9px] uppercase font-black opacity-60 px-1.5 py-0.5 bg-base-200 rounded">
                  {e.examCategory}
                </span>
                {e.weighting && (
                  <span className="font-mono opacity-60">{e.weighting}%</span>
                )}
                {e.isLocked && (
                  <span title="Locked">
                    <ShieldCheck className="w-3 h-3 text-success" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remarks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-base-100 border border-base-300 rounded-xl">
          <p className="text-[9px] font-black uppercase tracking-wider opacity-55 mb-1">
            Class teacher's remarks
          </p>
          <p className="text-xs whitespace-pre-wrap min-h-[36px]">
            {card?.classTeacherRemarks || (
              <span className="italic opacity-50">No remarks yet.</span>
            )}
          </p>
        </div>
        <div className="p-3 bg-base-100 border border-base-300 rounded-xl">
          <p className="text-[9px] font-black uppercase tracking-wider opacity-55 mb-1">
            Principal's remarks
          </p>
          <p className="text-xs whitespace-pre-wrap min-h-[36px]">
            {card?.principalRemarks || (
              <span className="italic opacity-50">No remarks yet.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function StudentReportCards() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [filterTerm, setFilterTerm] = useState<string>("");
  const [onlyPublished, setOnlyPublished] = useState<boolean>(false);
  const [localError, setLocalError] = useState("");

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

  const { data: studentByUser, isLoading: loadingStudent } =
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
  const enrollment = useMemo(() => unwrap<any>(enrollmentData), [enrollmentData]);
  const enrollmentClassId = enrollment?.classId ?? enrollment?.class?.id;
  const classId = directClassId ?? enrollmentClassId;

  /* ── 2. School, grade, term, subjects ── */
  const { data: school } = useGetSchoolByIdQuery(schoolId as string, {
    skip: !schoolId,
  });

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

  const { data: subjectsData } = useGetSubjectsBySchoolQuery(schoolId as string, {
    skip: !schoolId,
  });
  const subjectsMap = useMemo(() => {
    const m = new Map<string, any>();
    const list =
      (subjectsData as any)?.data ??
      (subjectsData as any)?.subjects ??
      subjectsData ??
      [];
    (Array.isArray(list) ? list : []).forEach((s: any) => {
      if (s?.id) m.set(s.id, s);
    });
    return m;
  }, [subjectsData]);
  const subjectName = (id?: string) =>
    (id ? subjectsMap.get(id)?.name : "") ?? "Subject";

  /* ── 3. Labels ── */
  const className: string =
    fullStudent?.class?.name ??
    fullStudent?.className ??
    profile.className ??
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

  const primaryColor = school?.primaryColor || "#6366f1";
  const secondaryColor = school?.secondaryColor || "#f59e0b";
  const schoolName = school?.name ?? "School";

  /* ── 4. Report cards list ── */
  const {
    data: rcData,
    isLoading: loadingCards,
    isError: cardsError,
    error: cardsErr,
  } = useGetStudentReportCardsQuery(
    { schoolId: schoolId!, studentId: studentId! },
    { skip: !schoolId || !studentId }
  );

  const reportCards: ReportCard[] = useMemo(() => {
    const d: any = rcData ?? {};
    return d.reportCards ?? d.cards ?? d.records ?? d.data ?? [];
  }, [rcData]);

  /* ── 5. Lazy render data ── */
  const [fetchRender] = reportCardsApi.useLazyGetReportCardRenderDataQuery();

  /* ── 6. Print / Download ── */
  const buildBrand = (): PrintBranding => ({
    name: schoolName,
    logoUrl: school?.logoUrl,
    primary: school?.primaryColor || primaryColor,
    secondary: school?.secondaryColor || secondaryColor,
    motto: school?.motto,
    address: [school?.address, school?.county].filter(Boolean).join(", "),
    phone: school?.phone,
    email: school?.email,
    website: school?.website,
    principalName: school?.principalName,
  });

  const doPrint = async (card: ReportCard) => {
    setLocalError("");
    setPrintingId(card.id);
    try {
      const res: any = await fetchRender(card.id).unwrap();
      const html = buildPrintHtml(
        res,
        card,
        {
          student: studentName ?? "Student",
          term: card?.term?.termName ?? "",
          cls: className,
        },
        buildBrand(),
        subjectName
      );
      if (!openPrintWindow(html)) {
        setLocalError("Pop-ups are blocked. Allow pop-ups for this site to print.");
      }
    } catch (e) {
      setLocalError(errMsg(e, "Could not prepare the report card for printing."));
    } finally {
      setPrintingId(null);
    }
  };

  const doDownload = async (card: ReportCard) => {
    setLocalError("");
    setDownloadingId(card.id);
    try {
      const res: any = await fetchRender(card.id).unwrap();
      const html = buildPrintHtml(
        res,
        card,
        {
          student: studentName ?? "Student",
          term: card?.term?.termName ?? "",
          cls: className,
        },
        buildBrand(),
        subjectName
      );
      await loadHtml2Pdf();
      const filename =
        `${studentName ?? "Student"}-${card?.term?.termName ?? "ReportCard"}${
          card?.term?.academicYear ? `-${card.term.academicYear}` : ""
        }`.replace(/[^\w\-]+/g, "_");

      await (window as any)
        .html2pdf()
        .set({
          margin: [6, 6, 6, 6],
          filename: `${filename}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(html)
        .save();
    } catch (e) {
      setLocalError(errMsg(e, "Could not download the PDF."));
    } finally {
      setDownloadingId(null);
    }
  };

  /* ── 7. Filters ── */
  const termOptions = useMemo(() => {
    const set = new Set<string>();
    reportCards.forEach((r) => {
      const t = r.term?.termName ?? "";
      const y = r.term?.academicYear ?? "";
      if (t || y) set.add(`${t}${y ? ` · ${y}` : ""}`);
    });
    return [...set];
  }, [reportCards]);

  const visible = useMemo(() => {
    let list = reportCards;
    if (onlyPublished) list = list.filter((r) => r.isPublished);
    if (filterTerm) {
      list = list.filter((r) => {
        const t = r.term?.termName ?? "";
        const y = r.term?.academicYear ?? "";
        return `${t}${y ? ` · ${y}` : ""}` === filterTerm;
      });
    }
    return [...list].sort((a, b) => {
      const da = a.publishedAt ?? a.updatedAt ?? a.createdAt ?? "";
      const db = b.publishedAt ?? b.updatedAt ?? b.createdAt ?? "";
      return db.localeCompare(da);
    });
  }, [reportCards, onlyPublished, filterTerm]);

  /* ── 8. Loading / error gates ── */
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
        <div className="h-72 rounded-3xl bg-base-200/60" />
      </div>
    );
  }

  if (profileError || !studentId) {
    return (
      <div className={`${CARD} max-w-xl mx-auto text-center space-y-3`}>
        <GraduationCap className="w-10 h-10 mx-auto text-primary" />
        <p className="text-base font-black">
          We couldn't find your student record.
        </p>
        <p className="text-xs opacity-60">
          Please contact the school office to have your record linked to your
          account.
        </p>
      </div>
    );
  }

  if (cardsError) {
    return (
      <div className="p-6 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">
          {errMsg(cardsErr, "Could not load your report cards.")}
        </span>
      </div>
    );
  }

  const isBusy = !!printingId || !!downloadingId;

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
            <FileText className="w-9 h-9" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-55 mb-1">
              My Report Cards
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate" style={{ color: primaryColor }}>
              {gradeTitle}
            </h1>
            {studentName && (
              <p className="text-sm font-bold opacity-80 mt-1 truncate">
                {studentName}
              </p>
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

        {reportCards.length > 0 && (
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { icon: FileText, label: "Total", value: reportCards.length },
              {
                icon: CheckCircle2,
                label: "Published",
                value: reportCards.filter((r) => r.isPublished).length,
              },
              {
                icon: Clock,
                label: "Draft",
                value: reportCards.filter((r) => !r.isPublished).length,
              },
              {
                icon: Award,
                label: "Latest mean",
                value: (() => {
                  const latest = visible[0];
                  return latest?.meanScore != null
                    ? `${fmtScore(latest.meanScore)}%`
                    : "—";
                })(),
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-4 rounded-2xl bg-base-100/70 border border-base-300"
              >
                <div
                  className="p-2.5 rounded-xl shrink-0"
                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-black opacity-55">
                    {label}
                  </p>
                  <p className="text-base font-black truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ERROR BANNER ── */}
      {localError && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium flex-1">{localError}</span>
          <button onClick={() => setLocalError("")} className="opacity-60 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* ── FILTER BAR ── */}
      {reportCards.length > 0 && (
        <div className={`${CARD} !p-4 sm:!p-5 flex flex-wrap items-center gap-3`}>
          <div className="inline-flex items-center gap-1.5">
            <Filter className="w-4 h-4 opacity-60" />
            <span className="text-[10px] uppercase font-black tracking-wider opacity-60">
              Filter
            </span>
          </div>
          <button
            onClick={() => setOnlyPublished((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${
              onlyPublished
                ? "bg-success text-success-content shadow-sm"
                : "bg-base-100 border border-base-300 hover:bg-base-200"
            }`}
          >
            {onlyPublished ? "Showing published" : "Show published only"}
          </button>
          {termOptions.length > 1 && (
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className={`${INPUT_SM} cursor-pointer`}
            >
              <option value="">All terms</option>
              {termOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
          <span className="ml-auto text-[10px] font-mono opacity-55">
            {visible.length} of {reportCards.length}
          </span>
        </div>
      )}

      {/* ── LOADING ── */}
      {loadingCards && (
        <div className="p-16 text-center text-sm opacity-60">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
          Loading your report cards…
        </div>
      )}

      {/* ── EMPTY ── */}
      {!loadingCards && reportCards.length === 0 && (
        <div className={`${CARD} text-center space-y-3 py-12`}>
          <FileX2 className="w-10 h-10 mx-auto opacity-40" />
          <p className="text-sm font-black">No report cards yet</p>
          <p className="text-xs opacity-60 max-w-sm mx-auto">
            Your report cards will appear here once your class teacher
            generates them at the end of the term.
          </p>
        </div>
      )}

      {/* ── CARD LIST ── */}
      {visible.map((rc) => {
        const isOpen = expandedId === rc.id;
        const termLabel = rc.term?.termName ?? "Term";
        const yearLabel = rc.term?.academicYear ?? "";
        const grade = cardGrade(rc);
        const gradeInfo = getGradeRemark(grade);
        const meanScore = toNum(cardMeanScore(rc));
        const tone = meanScore === null
          ? GRADE_TONES.none
          : GRADE_TONES[
              meanScore >= 75 ? "top" : meanScore >= 50 ? "good" : "low"
            ];
        const isPrintBusy = printingId === rc.id;
        const isDlBusy = downloadingId === rc.id;

        return (
          <div key={rc.id} className={`${CARD} space-y-4`}>
            <div className="flex items-start gap-4 flex-wrap">
              <GradeChip
                grade={grade}
                descriptor={gradeInfo.descriptor}
                size="lg"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black truncate">
                    {termLabel}
                    {yearLabel && (
                      <span className="text-xs opacity-60 ml-1.5 font-mono">
                        · {yearLabel}
                      </span>
                    )}
                  </h3>
                  <StatusBadge published={rc.isPublished} />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] opacity-65">
                  {rc.publishedAt && (
                    <span>Published {fmtDate(rc.publishedAt)}</span>
                  )}
                  {rc.class?.name && (
                    <span className="inline-flex items-center gap-1">
                      <School className="w-3 h-3" /> {rc.class.name}
                    </span>
                  )}
                  {rc.classTeacherRemarks && (
                    <span className="italic truncate max-w-xs">
                      "{rc.classTeacherRemarks}"
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0 min-w-[90px]">
                <p className={`text-2xl font-black leading-none ${tone.text}`}>
                  {meanScore !== null ? `${meanScore.toFixed(1)}%` : "—"}
                </p>
                <p className="text-[10px] uppercase font-black opacity-55 tracking-wider mt-0.5">
                  mean
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setExpandedId(isOpen ? null : rc.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-base-100 border border-base-300 hover:bg-base-200 text-[11px] font-black uppercase transition"
              >
                {isOpen ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> View details
                  </>
                )}
              </button>
              <button
                onClick={() => doPrint(rc)}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[11px] font-black uppercase transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor }}
              >
                {isPrintBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                Print
              </button>
              <button
                onClick={() => doDownload(rc)}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[11px] font-black uppercase transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: secondaryColor }}
              >
                {isDlBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isDlBusy ? "Preparing…" : "Download PDF"}
              </button>
            </div>

            {/* Inline preview — same style as the printed card */}
            {isOpen && (
              <div className="mt-3 pt-4 border-t border-base-300">
                <CardSummary
                  card={rc}
                  primaryColor={primaryColor}
                  subjectName={subjectName}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* ── INFO FOOTER ── */}
      {reportCards.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-base-200/40 border border-base-300 text-[11px] opacity-70">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>Print</strong> opens the school-branded report card in a new
            window — choose your printer or "Save as PDF".{" "}
            <strong>Download PDF</strong> produces a ready-to-share A4 PDF named
            after you and the term.
          </span>
        </div>
      )}
    </div>
  );
}