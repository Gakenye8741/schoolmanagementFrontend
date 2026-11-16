import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  FileText, Building, CheckCircle2, AlertCircle, X, Loader2, Search, Eye,
  Printer, RefreshCw, Send, Undo2, Wand2, Users, BarChart3, ListChecks,
  Download, Edit3, Sparkles, GraduationCap, Layers, Award, ShieldCheck,
  ClipboardList, Save, Percent, Tag, BookOpen, MessageSquareQuote,
} from 'lucide-react';

import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import { useGetStudentsBySchoolQuery, type Student } from '../../features/Apis/students.Api';

import {
  useGetTermsBySchoolIdQuery,
  useGetCurrentTermBySchoolIdQuery,
  useGetClassesBySchoolQuery,
  useGetGradeLevelsBySchoolQuery,
  useGetSubjectsBySchoolQuery,
  useGetClassStudentsQuery,
  useCountClassStudentsQuery,
  useValidateClassReadinessQuery,
  type AcademicTerm,
  type ClassEntity,
  type GradeLevel,
  type Subject,
} from '../../features/Apis/academicStructure.Api';

import {
  reportCardsApi,
  usePreviewReportCardMutation,
  useGenerateReportCardMutation,
  useGenerateClassReportCardsMutation,
  useGenerateSchoolReportCardsMutation,
  useRegenerateReportCardMutation,
  useGetReportCardByIdQuery,
  useGetStudentReportCardsQuery,
  useGetClassReportCardsQuery,
  useGetTermReportCardsQuery,
  useUpdateReportCardRemarksMutation,
  useOverrideReportCardMutation,
  usePublishReportCardMutation,
  usePublishClassReportCardsMutation,
  useUnpublishReportCardMutation,
} from '../../features/Apis/ReportCard.Api';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const GRADE_TONES: Record<string, { bg: string; text: string }> = {
  top:  { bg: 'bg-success/10', text: 'text-success' },
  good: { bg: 'bg-primary/10', text: 'text-primary' },
  mid:  { bg: 'bg-warning/10', text: 'text-warning' },
  low:  { bg: 'bg-error/10',   text: 'text-error' },
  none: { bg: 'bg-base-300',   text: 'text-base-content/70' },
};

const INPUT =
  'w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary';
const INPUT_SM = 'px-3 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl';
const LABEL = 'block text-xs font-bold uppercase tracking-wider opacity-70';
const PANEL = 'bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Grade → remark + descriptor lookup.
 * Covers every standard template the grading-scales service seeds:
 *   • KCSE (A, A-, B+, B, B-, C+, C, C-, D+, D, D-, E)
 *   • CBC (EE, ME, AE, BE)
 *   • IGCSE 1–9 (9..1)
 *   • Percentage A–E (A..E) — shares letters with KCSE, so we reuse the
 *     same remarks; the school's own descriptor (if the backend sends it)
 *     always wins.
 *
 * Priority order used by getGradeRemark():
 *   1. Explicit teacher remark (r.remarks) from the exam result
 *   2. Backend-provided `descriptor` / `gradeRemark` from the band
 *   3. This lookup table
 *   4. null
 */
const GRADE_REMARKS: Record<string, { remark: string; descriptor: string }> = {
  // ── KCSE / Percentage A–E ──
  'A':  { remark: 'Outstanding performance.',  descriptor: 'Excellent' },
  'A-': { remark: 'Very good work.',           descriptor: 'Very Good' },
  'B+': { remark: 'Good performance.',         descriptor: 'Good' },
  'B':  { remark: 'Good performance.',         descriptor: 'Good' },
  'B-': { remark: 'Can improve.',              descriptor: 'Fair' },
  'C+': { remark: 'Can improve.',              descriptor: 'Fair' },
  'C':  { remark: 'Needs attention.',          descriptor: 'Fair' },
  'C-': { remark: 'Needs more effort.',        descriptor: 'Weak' },
  'D+': { remark: 'Needs more effort.',        descriptor: 'Weak' },
  'D':  { remark: 'Needs intervention.',       descriptor: 'Weak' },
  'D-': { remark: 'Needs intervention.',       descriptor: 'Very Weak' },
  'E':  { remark: 'Needs intervention.',       descriptor: 'Fail' },
  // ── CBC ──
  'EE': { remark: 'Exceeds expectations.',     descriptor: 'Exceeds Expectations' },
  'ME': { remark: 'Meets expectations.',       descriptor: 'Meets Expectations' },
  'AE': { remark: 'Approaches expectations.',  descriptor: 'Approaches Expectations' },
  'BE': { remark: 'Below expectations.',       descriptor: 'Below Expectations' },
  // ── IGCSE 1–9 ──
  '9':  { remark: 'Outstanding performance.',  descriptor: 'Outstanding' },
  '8':  { remark: 'Excellent performance.',    descriptor: 'Excellent' },
  '7':  { remark: 'Very good performance.',    descriptor: 'Very Good' },
  '6':  { remark: 'Good performance.',         descriptor: 'Good' },
  '5':  { remark: 'Satisfactory.',             descriptor: 'Satisfactory' },
  '4':  { remark: 'Adequate.',                 descriptor: 'Adequate' },
  '3':  { remark: 'Needs improvement.',        descriptor: 'Weak' },
  '2':  { remark: 'Needs improvement.',        descriptor: 'Poor' },
  '1':  { remark: 'Needs intervention.',       descriptor: 'Very Poor' },
};

type RemarkSource = 'teacher' | 'backend' | 'auto' | 'none';

interface GradeRemarkInfo {
  remark: string | null;
  descriptor: string | null;
  source: RemarkSource;
}

/**
 * Resolves a subject's remark + descriptor.
 *   explicitRemark  ← r.remarks (teacher typed in exam) or r.teacherRemarks
 *   explicitDescriptor ← r.descriptor / r.gradeDescriptor (from band)
 */
function getGradeRemark(
  grade?: string | null,
  explicitRemark?: string | null,
  explicitDescriptor?: string | null,
): GradeRemarkInfo {
  const trimmed = (explicitRemark ?? '').trim();
  if (trimmed) {
    return {
      remark: trimmed,
      descriptor: explicitDescriptor?.trim() || null,
      source: 'teacher',
    };
  }
  const key = grade ? String(grade).toUpperCase().trim() : '';
  const found = key ? GRADE_REMARKS[key] : undefined;
  if (explicitDescriptor?.trim()) {
    return {
      remark: found?.remark ?? null,
      descriptor: explicitDescriptor.trim(),
      source: 'backend',
    };
  }
  if (found) {
    return { remark: found.remark, descriptor: found.descriptor, source: 'auto' };
  }
  return { remark: null, descriptor: null, source: 'none' };
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
const isUuid = (v?: string | null) => !!v && UUID_RE.test(v.trim());
const shortId = (id?: string | null) => (id ? `${id.slice(0, 8)}…` : '—');

function errMsg(e: any): string {
  const raw = (
    e?.data?.message ||
    e?.data?.error ||
    (Array.isArray(e?.data?.errors) ? e.data.errors.map((x: any) => x?.message ?? x).join(', ') : '') ||
    e?.error ||
    e?.message ||
    ''
  ).toString().trim();

  if (/cannot read|undefined|null is not|is not a function|safeParse|\[object Object\]|is not iterable/i.test(raw)) {
    // eslint-disable-next-line no-console
    console.error('[ReportCardsManager] Opaque server error (raw):', raw, e);
    return 'The server rejected that request with an internal error. Please try again — if it keeps happening, ask your administrator to check the report-card validators.';
  }
  return raw || 'Operation failed.';
}

function extractList<T = any>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const k of [
    'reportCards', 'cards', 'records', 'students', 'terms', 'classes',
    'subjects', 'levels', 'gradeLevels', 'data', 'users',
  ]) {
    if (Array.isArray(data[k])) return data[k];
  }
  return [];
}

function extractStudents(data: any): Student[] {
  if (!data) return [];
  const raw = data.students ?? data.data ?? data;
  return Array.isArray(raw) ? raw : [];
}

function extractCard(res: any): any | undefined {
  if (!res) return undefined;
  if (res.data && !Array.isArray(res.data) && res.data.subjects) return res.data;
  if (res.preview) return res.preview;
  if (res.reportCard) return res.reportCard;
  if (res.data && !Array.isArray(res.data)) return res.data;
  return undefined;
}

function studentFullName(s?: any): string {
  if (!s) return '';
  return (
    s.name ||
    `${s.firstName ?? ''} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName ?? ''}`.trim()
  );
}

function studentLabel(s: Student): string {
  const name = studentFullName(s) || 'Unnamed';
  return s.admissionNumber ? `${name} · ${s.admissionNumber}` : name;
}

const toNum = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmtScore = (v: any) => {
  const n = toNum(v);
  return n === null ? '—' : n.toFixed(1);
};

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

function attendancePct(c: any): number | null {
  const rate = c?.attendance?.attendanceRate ?? c?.attendanceRate;
  if (rate !== undefined && rate !== null && rate !== '') {
    const n = toNum(rate);
    return n !== null ? Math.round(n) : null;
  }
  const a = toNum(c?.attendanceDays);
  const t = toNum(c?.totalSchoolDays);
  return a !== null && t ? Math.round((a / t) * 100) : null;
}

function gradeKey(g?: string | null): keyof typeof GRADE_TONES {
  if (!g) return 'none';
  const u = g.toUpperCase().trim();
  if (u === 'AE') return 'mid';
  if (u === 'EE') return 'top';
  if (u === 'ME') return 'good';
  if (u === 'BE') return 'low';
  if (u.startsWith('A')) return 'top';
  if (u.startsWith('B')) return 'good';
  if (u.startsWith('C')) return 'mid';
  if (/^[6-9]$/.test(u)) return u === '9' || u === '8' ? 'top' : 'good';
  if (/^[4-5]$/.test(u)) return 'mid';
  if (/^[1-3]$/.test(u)) return 'low';
  return 'low';
}

const escapeHtml = (s: any) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const body = rows
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Card field accessors — work for raw row AND payload ──
const cardGrade = (c: any): string | null => c?.grade ?? c?.totals?.meanGrade ?? null;
const cardPosition = (c: any): number | null => toNum(c?.position ?? c?.classPosition);
const cardOutOf = (c: any): number | null => toNum(c?.outOf ?? c?.streamSize);
const cardTotalMarks = (c: any): string | number | null =>
  c?.totalMarks ?? c?.totals?.totalMarks ?? null;
const cardTotalPoints = (c: any): string | number | null =>
  c?.totalPoints ?? c?.totals?.totalPoints ?? null;
const cardMeanScore = (c: any): string | number | null =>
  c?.meanScore ?? c?.totals?.meanScore ?? null;

/** Percentage from a subject row — prefers `percentage`, falls back to marks/outOf. */
function subjectPct(s: any): number | null {
  if (s?.percentage != null) return toNum(s.percentage);
  const m = toNum(s?.marks);
  const o = toNum(s?.outOf) ?? 100;
  return m !== null && o ? (m / o) * 100 : null;
}

// ═══════════════════════════════════════════════════════════════
// PRINT HTML — school-branded report form (logo, colours, motto)
// ═══════════════════════════════════════════════════════════════
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

const safeColor = (c: any, fallback: string) =>
  typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c.trim()) ? c.trim() : fallback;

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'S';

function buildPrintHtml(
  res: any,
  fallbackCard: any,
  names: { student: string; term: string; cls: string },
  brand: PrintBranding,
  subjectName: (id?: string) => string,
) {
  const P = safeColor(brand.primary, '#4f46e5');
  const S = safeColor(brand.secondary, '#f59e0b');

  const rd = res?.data && !Array.isArray(res.data) ? res.data : {};
  const card = res?.reportCard ?? rd.reportCard ?? (rd.id ? rd : fallbackCard) ?? {};
  const school = res?.school ?? rd.school ?? {};
  const student = res?.student ?? rd.student ?? card.student ?? {};
  const term = res?.term ?? rd.term ?? card.term ?? {};
  const subjects: any[] = rd.subjects ?? card.subjectResults ?? card.subjects ?? [];
  const exams: any[] = rd.exams ?? [];

  const grade = cardGrade(rd) ?? cardGrade(card) ?? '—';
  const gradeInfo = getGradeRemark(grade as string);
  const position = cardPosition(rd) ?? cardPosition(card);
  const outOf = cardOutOf(rd) ?? cardOutOf(card);
  const totalPoints = cardTotalPoints(rd) ?? cardTotalPoints(card) ?? '—';
  const totalMarks = cardTotalMarks(rd) ?? cardTotalMarks(card) ?? '—';
  const meanScore = cardMeanScore(rd) ?? cardMeanScore(card);
  const att = attendancePct(rd) ?? attendancePct(card);

  const schoolName = school.name ?? brand.name;
  const logoUrl = brand.logoUrl || school.logoUrl || null;
  const logoHtml = logoUrl
    ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="logo" />`
    : `<div class="logo mono">${escapeHtml(initials(schoolName))}</div>`;
  const watermark = logoUrl ? `<img class="wm" src="${escapeHtml(logoUrl)}" alt="" />` : '';

  const contact = [brand.address, brand.phone, brand.email, brand.website]
    .filter(Boolean).map(escapeHtml).join(' &nbsp;•&nbsp; ');

  const tone = (g?: string | null): string => {
    const k = String(gradeKey(g));
    const map: Record<string, string> = { top: '#15803d', good: P, mid: '#b45309', low: '#b91c1c', none: '#64748b' };
    return map[k] ?? '#64748b';
  };

  const subjectRows = subjects.map((s) => {
    const marksText = s.marks != null && s.outOf != null ? `${s.marks} / ${s.outOf}` : (s.marks ?? '—');
    const { remark, descriptor } = getGradeRemark(s.grade, s.teacherRemarks ?? s.remarks, s.descriptor);
    const pct = subjectPct(s);
    return `<tr>
      <td class="subj">${escapeHtml(s.subjectName ?? s.name ?? subjectName(s.subjectId))}</td>
      <td class="c">${escapeHtml(marksText)}${pct !== null ? `<small>${pct.toFixed(1)}%</small>` : ''}</td>
      <td class="c"><span class="pill" style="background:${tone(s.grade)}">${escapeHtml(s.grade ?? '—')}</span>${descriptor ? `<small>${escapeHtml(descriptor)}</small>` : ''}</td>
      <td class="c">${escapeHtml(s.points ?? '—')}</td>
      <td class="rem-cell">${escapeHtml(remark ?? '')}</td>
    </tr>`;
  }).join('');

  const examRows = exams.map((e) => `<tr>
    <td>${escapeHtml(e.examTitle)}</td><td>${escapeHtml(e.examCategory)}</td>
    <td class="c">${escapeHtml(e.weighting ?? '—')}</td><td class="c">${e.isLocked ? '✓' : '—'}</td></tr>`).join('');

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
        ${brand.motto ? `<div class="motto">“${escapeHtml(brand.motto)}”</div>` : ''}
        ${contact ? `<div class="contact">${contact}</div>` : ''}
      </div>
      <div style="width:84px"></div>
    </div>
    <div class="title">
      <b>Student Report Card</b>
      <span>${escapeHtml(names.term || term.termName || '')} ${escapeHtml(term.academicYear ?? '')}</span>
    </div>

    <div class="body">
      <div class="meta">
        <div><small>Student</small><b>${escapeHtml(studentFullName(student) || names.student)}</b></div>
        <div><small>Admission no.</small><b>${escapeHtml(student.admissionNumber ?? '—')}</b></div>
        <div><small>Class</small><b>${escapeHtml(names.cls || '—')}</b></div>
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
        <div><small>Position</small><b>${position ? `${escapeHtml(position)}/${escapeHtml(outOf ?? '—')}` : '—'}</b></div>
        <div><small>Attendance</small><b>${att === null ? '—' : att + '%'}</b></div>
      </div>
      <div class="sum" style="grid-template-columns:1fr;margin-top:6px"><div><small>Total points</small><b>${escapeHtml(totalPoints)}</b></div></div>
      ${gradeInfo.remark ? `<div class="overall"><b>Overall:</b> ${escapeHtml(gradeInfo.descriptor ?? '')} — ${escapeHtml(gradeInfo.remark)}</div>` : ''}

      ${exams.length ? `<h2>Exams Included</h2>
      <table><thead><tr><th>Exam</th><th>Category</th><th class="c">Weighting %</th><th class="c">Locked</th></tr></thead>
      <tbody>${examRows}</tbody></table>` : ''}

      <h2>Remarks</h2>
      <div class="remarks">
        <div><small style="color:#64748b;font-size:9px;text-transform:uppercase">Class teacher</small>
          <div class="box">${escapeHtml(card.classTeacherRemarks ?? '')}</div></div>
        <div><small style="color:#64748b;font-size:9px;text-transform:uppercase">Principal${brand.principalName ? ` – ${escapeHtml(brand.principalName)}` : ''}</small>
          <div class="box">${escapeHtml(card.principalRemarks ?? '')}</div></div>
      </div>

      <div class="sign">
        <div>Class teacher’s signature</div>
        <div>Principal’s signature &amp; stamp</div>
        <div>Parent / guardian’s signature</div>
      </div>
    </div>
    <div class="foot"><span>${escapeHtml(schoolName)}</span><span>${escapeHtml(brand.motto ?? '')}</span><span>Official report card</span></div>
  </div>
</div>
</body></html>`;
}

function openPrintWindow(html: string): boolean {
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  // Wait for the logo to load so it always appears on the printout
  const imgs = Array.from(w.document.images);
  const ready = Promise.all(
    imgs.map((i) =>
      i.complete
        ? Promise.resolve()
        : new Promise<void>((r) => { i.onload = () => r(); i.onerror = () => r(); }),
    ),
  );
  Promise.race([ready, new Promise((r) => setTimeout(r, 4000))]).then(() => w.print());
  return true;
}

/** School logo with a coloured monogram fallback (no logo / broken URL). */
function SchoolLogo({
  school, name, color, size = 56,
}: { school?: any; name: string; color: string; size?: number }) {
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

type Tab = 'overview' | 'cards' | 'generate' | 'preview' | 'publish';

type Ctx = {
  schoolId: string;
  schoolName: string;
  school?: any;
  termId: string;
  termLabel: (id?: string) => string;
  students: Student[];
  studentsLoading: boolean;
  termCards: any[];
  termCardsQ: any;
  classes: ClassEntity[];
  subjects: Subject[];
  gradeLevels: GradeLevel[];
  studentName: (c: any) => string;
  className: (c: any) => string;
  classLabelOf: (id?: string) => string;
  subjectName: (id?: string) => string;
  admissionOf: (c: any) => string;
  classOptions: Array<[string, string]>;
  primaryColor: string;
  secondaryColor: string;
  setSuccessMessage: (v: string) => void;
  setErrorMessage: (v: string) => void;
  openCard: (id: string) => void;
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ReportCardsManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [termId, setTermId] = useState('');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const { data: termsData } = useGetTermsBySchoolIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const { data: currentTermData } = useGetCurrentTermBySchoolIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const terms = useMemo(() => extractList<AcademicTerm>(termsData), [termsData]);

  useEffect(() => {
    if (termId || terms.length === 0) return;
    const cur = (currentTermData as any)?.data ?? (currentTermData as any)?.term;
    setTermId((cur?.id ?? terms.find((t) => t.isCurrentTerm)?.id ?? terms[0].id) as string);
  }, [terms, currentTermData, termId]);

  const termLabel = (id?: string) => {
    const t = terms.find((x) => x.id === id);
    return t ? `${t.termName} ${t.academicYear}` : shortId(id);
  };
  const termYear = terms.find((t) => t.id === termId)?.academicYear;

  const { data: classesData } = useGetClassesBySchoolQuery(currentSchoolId, { skip: !currentSchoolId });
  const { data: gradeData } = useGetGradeLevelsBySchoolQuery(currentSchoolId, { skip: !currentSchoolId });
  const { data: subjectsData } = useGetSubjectsBySchoolQuery(currentSchoolId, { skip: !currentSchoolId });

  const allClasses = useMemo(() => extractList<ClassEntity>(classesData), [classesData]);
  const gradeLevels = useMemo(() => extractList<GradeLevel>(gradeData), [gradeData]);
  const subjects = useMemo(() => extractList<Subject>(subjectsData), [subjectsData]);

  const gradeMap = useMemo(() => new Map(gradeLevels.map((g) => [g.id, g])), [gradeLevels]);
  const classMap = useMemo(() => new Map(allClasses.map((c) => [c.id, c])), [allClasses]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const classLabelOf = (id?: string) => {
    const c = id ? classMap.get(id) : undefined;
    if (!c) return '';
    const g = gradeMap.get(c.gradeLevelId);
    return `${g?.name ?? 'Class'} ${c.stream ?? ''}`.trim();
  };
  const subjectName = (id?: string) => (id ? subjectMap.get(id)?.name ?? shortId(id) : '—');

  const yearMatches = useMemo(
    () => allClasses.filter((c) => termYear && c.academicYear === termYear),
    [allClasses, termYear],
  );
  const classes = yearMatches.length > 0 ? yearMatches : allClasses;
  const classOptions: Array<[string, string]> = useMemo(
    () =>
      classes
        .map((c): [string, string] => [
          c.id,
          `${classLabelOf(c.id) || shortId(c.id)}${yearMatches.length === 0 && c.academicYear ? ` · ${c.academicYear}` : ''}`,
        ])
        .sort((a, b) => a[1].localeCompare(b[1])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classes, gradeMap, yearMatches.length],
  );

  const { data: studentsData, isFetching: studentsLoading } = useGetStudentsBySchoolQuery(currentSchoolId, {
    skip: !currentSchoolId,
  });
  const students = useMemo(() => extractStudents(studentsData), [studentsData]);
  const studentMap = useMemo(() => {
    const m = new Map<string, Student>();
    students.forEach((s: any) => {
      m.set(s.id, s);
      if (s.userId) m.set(s.userId, s);
    });
    return m;
  }, [students]);

  const termCardsQ = useGetTermReportCardsQuery(
    { schoolId: currentSchoolId, termId },
    { skip: !currentSchoolId || !termId },
  );
  const termCards = useMemo(() => extractList<any>(termCardsQ.data), [termCardsQ.data]);

  const studentName = (c: any) =>
    studentFullName(studentMap.get(c?.studentId)) || studentFullName(c?.student) || shortId(c?.studentId);
  const className = (c: any) =>
    classLabelOf(c?.classId) || c?.class?.name || c?.class?.className || c?.className || shortId(c?.classId);
  const admissionOf = (c: any) =>
    (studentMap.get(c?.studentId) as any)?.admissionNumber ?? c?.student?.admissionNumber ?? '';

  const activeCard = termCards.find((c) => c.id === activeCardId);

  const ctx: Ctx = {
    schoolId: currentSchoolId,
    schoolName,
    school,
    termId,
    termLabel,
    students,
    studentsLoading,
    termCards,
    termCardsQ,
    classes,
    subjects,
    gradeLevels,
    studentName,
    className,
    classLabelOf,
    subjectName,
    admissionOf,
    classOptions,
    primaryColor,
    secondaryColor,
    setSuccessMessage,
    setErrorMessage,
    openCard: setActiveCardId,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-base-100 text-base-content min-h-screen">
      {/* HEADER */}
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
              <FileText className="w-3.5 h-3.5" /> Reports & Results
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">Report Cards Manager</h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Generate, review, correct and publish end-of-term report cards for {schoolName}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            <div
              className="flex items-center gap-4 bg-base-100/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-base-300 shadow-sm"
              style={{ borderLeft: `4px solid ${secondaryColor}` }}
            >
              <SchoolLogo school={school} name={schoolName} color={primaryColor} size={52} />
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Institution</p>
                <p className="text-lg font-black text-primary truncate max-w-[200px]">{schoolName}</p>
                {school?.motto && (
                  <p className="text-[10px] italic opacity-60 truncate max-w-[200px]">“{school.motto}”</p>
                )}
              </div>
            </div>
            <div className="bg-base-100/80 backdrop-blur-md px-5 py-4 rounded-2xl border border-base-300 shadow-sm min-w-[220px]">
              <p className="text-[11px] font-black uppercase tracking-wider opacity-60 mb-1.5">Active Term</p>
              <select
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
                className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-bold cursor-pointer"
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
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-3 border-b border-base-300 pb-4">
        {[
          { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
          { id: 'cards' as Tab, label: 'Report Cards', icon: ListChecks },
          { id: 'generate' as Tab, label: 'Generate', icon: Wand2 },
          { id: 'preview' as Tab, label: 'Preview', icon: Eye },
          { id: 'publish' as Tab, label: 'Publish', icon: Send },
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
              {id === 'cards' && termCards.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] font-mono rounded bg-base-100/30">{termCards.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ALERTS */}
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

      {!currentSchoolId && (
        <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
          No school is linked to your account, so report cards can’t be loaded.
        </div>
      )}

      {/* CONTENT */}
      {currentSchoolId && activeTab === 'overview' && <OverviewTab ctx={ctx} goTo={setActiveTab} />}
      {currentSchoolId && activeTab === 'cards' && <CardsTab ctx={ctx} />}
      {currentSchoolId && activeTab === 'generate' && <GenerateTab ctx={ctx} />}
      {currentSchoolId && activeTab === 'preview' && <PreviewTab ctx={ctx} goTo={setActiveTab} />}
      {currentSchoolId && activeTab === 'publish' && <PublishTab ctx={ctx} />}

      {activeCardId && (
        <CardDrawer
          key={activeCardId}
          cardId={activeCardId}
          listCard={activeCard}
          ctx={ctx}
          onClose={() => setActiveCardId(null)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   OVERVIEW TAB
   ════════════════════════════════════════════════════════════════ */
function useTermStats(ctx: Ctx) {
  const { termCards, className } = ctx;
  return useMemo(() => {
    const total = termCards.length;
    const published = termCards.filter((c) => c.isPublished).length;
    const means = termCards.map((c) => toNum(c.meanScore)).filter((n): n is number => n !== null);
    const avg = means.length ? means.reduce((a, b) => a + b, 0) / means.length : null;
    const atts = termCards.map(attendancePct).filter((n): n is number => n !== null);
    const attAvg = atts.length ? atts.reduce((a, b) => a + b, 0) / atts.length : null;
    const grades: Record<string, number> = {};
    termCards.forEach((c) => { const g = cardGrade(c); if (g) grades[g] = (grades[g] ?? 0) + 1; });
    const byClass = new Map<string, { id: string; name: string; total: number; published: number; sum: number; n: number }>();
    termCards.forEach((c) => {
      const id = c.classId ?? 'unknown';
      const row = byClass.get(id) ?? { id, name: className(c), total: 0, published: 0, sum: 0, n: 0 };
      row.total++;
      if (c.isPublished) row.published++;
      const m = toNum(c.meanScore);
      if (m !== null) { row.sum += m; row.n++; }
      byClass.set(id, row);
    });
    return {
      total, published, drafts: total - published, avg, attAvg,
      max: means.length ? Math.max(...means) : null,
      min: means.length ? Math.min(...means) : null,
      grades: Object.entries(grades).sort((a, b) => a[0].localeCompare(b[0])),
      byClass: Array.from(byClass.values()).sort((a, b) => a.name.localeCompare(b.name)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termCards, ctx.classes]);
}

function OverviewTab({ ctx, goTo }: { ctx: Ctx; goTo: (t: Tab) => void }) {
  const { termId, termLabel, primaryColor, secondaryColor, termCardsQ, classes, subjects, gradeLevels } = ctx;
  const stats = useTermStats(ctx);
  const pct = stats.total ? (stats.published / stats.total) * 100 : 0;

  if (!termId) {
    return (
      <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl bg-base-200/20">
        Choose a term in the header to see its report card summary.
      </div>
    );
  }

  const checklist = [
    { label: 'Term selected', ok: !!termId, detail: termLabel(termId) },
    { label: 'Grade levels set up', ok: gradeLevels.length > 0, detail: `${gradeLevels.length} grade levels` },
    { label: 'Classes for this academic year', ok: classes.length > 0, detail: `${classes.length} classes` },
    { label: 'Subjects defined', ok: subjects.length > 0, detail: `${subjects.length} subjects` },
    { label: 'Report cards generated', ok: stats.total > 0, detail: `${stats.total} report cards` },
  ];
  const allOk = checklist.every((c) => c.ok);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatTile icon={FileText} label="Report cards" value={termCardsQ.isLoading ? '…' : stats.total} tone="primary" />
        <StatTile icon={CheckCircle2} label="Published" value={stats.published} tone="success" />
        <StatTile icon={Edit3} label="Drafts" value={stats.drafts} tone="warning" />
        <StatTile icon={Award} label="Avg mean score" value={stats.avg === null ? '—' : stats.avg.toFixed(1)} tone="primary" />
        <StatTile icon={BarChart3} label="High / low" value={stats.max === null ? '—' : `${stats.max.toFixed(0)} / ${stats.min!.toFixed(0)}`} tone="success" />
        <StatTile icon={Percent} label="Avg attendance" value={stats.attAvg === null ? '—' : `${Math.round(stats.attAvg)}%`} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${PANEL} space-y-5`}>
          <div className="flex items-center justify-between pb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><ShieldCheck className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Setup Checklist</h2>
                <p className="text-[11px] opacity-60">{termLabel(termId)}</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded ${allOk ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
              {allOk ? 'All set' : 'Needs attention'}
            </span>
          </div>
          <ul className="space-y-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-3 p-3 bg-base-100 border border-base-300 rounded-xl text-xs">
                {c.ok ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" /> : <AlertCircle className="w-4 h-4 text-warning shrink-0" />}
                <span className="font-bold flex-1">{c.label}</span>
                <span className="font-mono opacity-60">{c.detail}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => goTo('generate')}
            className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer"
            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
          >
            Go to Generate
          </button>
        </div>

        <div className={`${PANEL} space-y-5`}>
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <Send className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Publishing Progress</h2>
          </div>
          <div>
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-3xl font-black text-primary">{Math.round(pct)}%</span>
              <span className="text-xs font-mono opacity-60">{stats.published} / {stats.total} visible</span>
            </div>
            <div className="h-3 w-full rounded-full bg-base-200 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: primaryColor }} />
            </div>
          </div>
          <p className="text-xs opacity-70">
            {stats.drafts > 0
              ? `${stats.drafts} report card${stats.drafts === 1 ? '' : 's'} still hidden from parents and students.`
              : stats.total > 0 ? 'Every report card for this term is published.' : 'No report cards generated yet.'}
          </p>
          <button
            onClick={() => goTo('publish')}
            className="w-full py-3 rounded-2xl bg-base-100 border border-base-300 hover:border-primary hover:text-primary transition-all text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            Go to Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${PANEL} space-y-5`}>
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Tag className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Grade Distribution</h2>
          </div>
          {stats.grades.length === 0 ? (
            <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              Grades appear once report cards are generated.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.grades.map(([g, n]) => {
                const tone = GRADE_TONES[gradeKey(g)];
                const info = getGradeRemark(g);
                return (
                  <div key={g}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-black uppercase ${tone.text}`}>{g}</span>
                        {info.descriptor && (
                          <span className="text-[10px] opacity-50 truncate">· {info.descriptor}</span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-black">{n}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-base-200 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(n / stats.total) * 100}%`, backgroundColor: primaryColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <ClassBreakdown ctx={ctx} rows={stats.byClass} />
      </div>
    </div>
  );
}

function ClassBreakdown({
  ctx, rows, onPublish, publishing,
}: {
  ctx: Ctx;
  rows: Array<{ id: string; name: string; total: number; published: number; sum: number; n: number }>;
  onPublish?: (id: string, name: string) => void;
  publishing?: boolean;
}) {
  const { primaryColor, secondaryColor } = ctx;
  return (
    <div className={`${PANEL} space-y-5`}>
      <div className="flex items-center gap-3 pb-4 border-b border-base-300">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
          <Layers className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-black tracking-tight">By Class</h2>
        <span className="ml-auto text-xs font-mono font-bold opacity-60">{rows.length} classes</span>
      </div>
      {rows.length === 0 ? (
        <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
          Classes appear once report cards exist for this term.
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {rows.map((r) => {
            const done = r.published === r.total;
            return (
              <div key={r.id} className="p-4 bg-base-100 border border-base-300 rounded-2xl hover:border-primary transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-primary truncate">{r.name}</p>
                    <p className="text-[10px] font-mono opacity-60">
                      {r.total} cards · {r.published} published · avg {r.n ? (r.sum / r.n).toFixed(1) : '—'}
                    </p>
                  </div>
                  {onPublish && (
                    <button
                      onClick={() => onPublish(r.id, r.name)}
                      disabled={publishing || done || r.id === 'unknown'}
                      className="text-[10px] font-black uppercase px-3 py-2 rounded-lg text-white disabled:opacity-50 cursor-pointer"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {done ? 'All published' : 'Publish class'}
                    </button>
                  )}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-base-200 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(r.published / r.total) * 100}%`, backgroundColor: primaryColor }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   REPORT CARDS TAB
   ════════════════════════════════════════════════════════════════ */
function CardsTab({ ctx }: { ctx: Ctx }) {
  const {
    schoolId, termId, termLabel, termCards, termCardsQ, studentName, className, admissionOf,
    primaryColor, secondaryColor, setSuccessMessage, setErrorMessage, openCard,
  } = ctx;

  const [scope, setScope] = useState<'term' | 'class' | 'student'>('term');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'mean' | 'position' | 'updated'>('name');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<{ label: string; done: number; total: number } | null>(null);

  const classOk = isUuid(classId);
  const studentOk = isUuid(studentId);

  const classQ = useGetClassReportCardsQuery(
    { schoolId, classId: classId.trim(), termId },
    { skip: scope !== 'class' || !classOk || !termId },
  );
  const studentQ = useGetStudentReportCardsQuery(
    { schoolId, studentId },
    { skip: scope !== 'student' || !studentOk },
  );

  const [publishOne] = usePublishReportCardMutation();
  const [unpublishOne] = useUnpublishReportCardMutation();
  const [regenerateOne] = useRegenerateReportCardMutation();

  const activeQ = scope === 'term' ? termCardsQ : scope === 'class' ? classQ : studentQ;
  const scoped = useMemo(
    () => (scope === 'term' ? termCards : extractList<any>(activeQ.data)),
    [scope, termCards, activeQ.data],
  );

  const grades = useMemo(
    () => Array.from(new Set(scoped.map((c) => cardGrade(c)).filter(Boolean))).sort() as string[],
    [scoped],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = scoped.filter((c) => {
      if (statusFilter === 'published' && !c.isPublished) return false;
      if (statusFilter === 'draft' && c.isPublished) return false;
      if (gradeFilter && cardGrade(c) !== gradeFilter) return false;
      if (q && !`${studentName(c)} ${admissionOf(c)} ${className(c)} ${cardGrade(c) ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sortKey === 'mean') return (toNum(b.meanScore) ?? -1) - (toNum(a.meanScore) ?? -1);
      if (sortKey === 'position') return (cardPosition(a) ?? 1e9) - (cardPosition(b) ?? 1e9);
      if (sortKey === 'updated') return +new Date(b.updatedAt ?? 0) - +new Date(a.updatedAt ?? 0);
      return studentName(a).localeCompare(studentName(b));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, search, statusFilter, gradeFilter, sortKey, ctx.classes, ctx.students]);

  useEffect(() => { setSelected(new Set()); }, [scope, termId, classId, studentId]);

  const visibleIds = visible.map((c) => c.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const runBulk = async (kind: 'publish' | 'unpublish' | 'regenerate') => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const verb = { publish: 'Publish', unpublish: 'Unpublish', regenerate: 'Regenerate' }[kind];
    if (!window.confirm(`${verb} ${ids.length} report card${ids.length === 1 ? '' : 's'}?`)) return;
    setSuccessMessage(''); setErrorMessage('');
    const fn = { publish: publishOne, unpublish: unpublishOne, regenerate: regenerateOne }[kind];
    setBulk({ label: verb, done: 0, total: ids.length });
    let ok = 0; let fail = 0;
    for (const id of ids) {
      try { await fn(id).unwrap(); ok++; } catch { fail++; }
      setBulk((b) => (b ? { ...b, done: ok + fail } : b));
    }
    setBulk(null);
    setSelected(new Set());
    if (fail) setErrorMessage(`${verb}: ${ok} succeeded, ${fail} failed.`);
    else setSuccessMessage(`${verb}: ${ok} report card${ok === 1 ? '' : 's'} done.`);
  };

  const exportCsv = () => {
    downloadCsv(`report-cards-${Date.now()}.csv`, [
      ['Student', 'Admission no', 'Class', 'Term', 'Mean score', 'Grade', 'Descriptor', 'Position', 'Out of', 'Attendance %', 'Status'],
      ...visible.map((c) => {
        const g = cardGrade(c);
        const info = getGradeRemark(g);
        return [
          studentName(c), admissionOf(c), className(c), termLabel(c.termId),
          fmtScore(c.meanScore), g ?? '', info.descriptor ?? '',
          cardPosition(c) ?? '', cardOutOf(c) ?? '',
          attendancePct(c) ?? '', c.isPublished ? 'Published' : 'Draft',
        ];
      }),
    ]);
    setSuccessMessage(`Exported ${visible.length} report cards.`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex gap-1 bg-base-100 border border-base-300 rounded-xl p-1">
            {([['term', 'Whole term'], ['class', 'One class'], ['student', 'One student']] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setScope(k)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer ${
                  scope === k ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {scope === 'class' && (
            <div className="flex-1 min-w-[240px]">
              <ClassPicker ctx={ctx} value={classId} onChange={setClassId} />
            </div>
          )}
          {scope === 'student' && (
            <div className="flex-1 min-w-[260px]">
              <StudentSelector ctx={ctx} value={studentId} onChange={setStudentId} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, admission no., class or grade…"
              className="w-full pl-10 pr-3 py-2.5 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className={`${INPUT_SM} cursor-pointer`}>
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className={`${INPUT_SM} cursor-pointer`}>
            <option value="">All grades</option>
            {grades.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className={`${INPUT_SM} cursor-pointer`}>
            <option value="name">Sort: name</option>
            <option value="mean">Sort: mean score</option>
            <option value="position">Sort: position</option>
            <option value="updated">Sort: recently updated</option>
          </select>
          <button
            onClick={exportCsv}
            disabled={visible.length === 0}
            className="px-3 py-2 text-xs font-black bg-base-100 border border-base-300 rounded-xl hover:border-primary hover:text-primary flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          {(search || statusFilter !== 'all' || gradeFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setGradeFilter(''); }}
              className="text-xs font-bold text-primary hover:underline px-2 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="p-4 rounded-2xl border flex flex-wrap items-center gap-3 shadow-xs" style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10` }}>
          <span className="text-xs font-black">{selected.size} selected</span>
          <div className="flex flex-wrap gap-2 ml-auto">
            <button onClick={() => runBulk('publish')} disabled={!!bulk} className="px-3 py-2 text-[10px] font-black uppercase rounded-lg text-white disabled:opacity-60 cursor-pointer" style={{ backgroundColor: primaryColor }}>
              Publish
            </button>
            <button onClick={() => runBulk('unpublish')} disabled={!!bulk} className="px-3 py-2 text-[10px] font-black uppercase rounded-lg bg-warning/10 text-warning hover:bg-warning/20 disabled:opacity-60 cursor-pointer">
              Unpublish
            </button>
            <button onClick={() => runBulk('regenerate')} disabled={!!bulk} className="px-3 py-2 text-[10px] font-black uppercase rounded-lg bg-base-100 border border-base-300 hover:border-primary disabled:opacity-60 cursor-pointer">
              Regenerate
            </button>
            <button onClick={() => setSelected(new Set())} className="px-3 py-2 text-[10px] font-black uppercase rounded-lg hover:bg-base-200 cursor-pointer">
              Clear
            </button>
          </div>
        </div>
      )}
      {bulk && (
        <div className="p-4 bg-base-200/40 border border-base-300 rounded-2xl space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span><Loader2 className="w-3.5 h-3.5 animate-spin inline mr-2" />{bulk.label}…</span>
            <span className="font-mono">{bulk.done} / {bulk.total}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-base-200 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(bulk.done / bulk.total) * 100}%`, backgroundColor: primaryColor }} />
          </div>
        </div>
      )}

      <div className={`${PANEL} space-y-5`}>
        <div className="flex items-center justify-between pb-4 border-b border-base-300 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Report Cards</h2>
              <p className="text-[11px] opacity-60">{scope === 'student' ? 'All terms' : termLabel(termId)}</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-[11px] font-bold cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="checkbox checkbox-primary checkbox-xs" />
            Select all ({visible.length})
          </label>
        </div>

        {!termId && scope !== 'student' ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">Choose a term in the header first.</div>
        ) : scope === 'class' && !classOk ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">Pick a class to see its report cards.</div>
        ) : scope === 'student' && !studentOk ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">Pick a student to see their report cards across all terms.</div>
        ) : activeQ.isLoading ? (
          <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading report cards…</div>
        ) : activeQ.isError ? (
          <div className="p-4 bg-error/10 text-error rounded-2xl text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errMsg(activeQ.error)}</span>
            <button onClick={() => activeQ.refetch()} className="font-black underline cursor-pointer">Retry</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
            {scoped.length === 0 ? 'No report cards yet. Use the Generate tab to create them.' : 'No report cards match the current filters.'}
          </div>
        ) : (
          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {visible.map((c) => {
              const att = attendancePct(c);
              const grade = cardGrade(c);
              const pos = cardPosition(c);
              const outOf = cardOutOf(c);
              const info = getGradeRemark(grade);
              return (
                <div
                  key={c.id}
                  className={`p-4 bg-base-100 border rounded-2xl shadow-xs hover:border-primary transition-all flex items-center gap-4 ${
                    selected.has(c.id) ? 'border-primary' : 'border-base-300'
                  }`}
                >
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} className="checkbox checkbox-primary checkbox-sm" />
                  <GradeBadge grade={grade} descriptor={info.descriptor} large />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => openCard(c.id)} className="font-black text-sm text-primary truncate hover:underline cursor-pointer text-left">
                        {studentName(c)}
                      </button>
                      <StatusBadge published={c.isPublished} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono opacity-60">
                      {admissionOf(c) && <span>ADM {admissionOf(c)}</span>}
                      <span>{className(c)}</span>
                      {scope === 'student' && <span>{termLabel(c.termId)}</span>}
                      <span>Updated {fmtDate(c.updatedAt)}</span>
                    </div>
                    {info.remark && (
                      <p className="mt-1 text-[11px] opacity-70 italic">“{info.remark}”</p>
                    )}
                  </div>
                  <div className="hidden sm:grid grid-cols-3 gap-4 text-center shrink-0">
                    <div>
                      <p className="text-[9px] font-black uppercase opacity-50">Mean</p>
                      <p className="text-sm font-black">{fmtScore(c.meanScore)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase opacity-50">Position</p>
                      <p className="text-sm font-black">{pos ? `${pos}${outOf ? `/${outOf}` : ''}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase opacity-50">Attend.</p>
                      <p className="text-sm font-black">
                        {att !== null ? `${att}%` : (c.attendanceDays ? `${c.attendanceDays}d` : '—')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openCard(c.id)}
                    className="p-2 bg-base-200 rounded-xl hover:bg-primary/20 hover:text-primary transition-all cursor-pointer"
                    title="Open"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {visible.length > 0 && (
          <p className="text-[10px] font-mono opacity-60">Showing {visible.length} of {scoped.length}</p>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   GENERATE TAB
   ════════════════════════════════════════════════════════════════ */
function ClassReadiness({ classId }: { classId: string }) {
  const ok = isUuid(classId);
  const { data: ready, isFetching, isError, error } = useValidateClassReadinessQuery(classId, { skip: !ok });
  const { data: countData } = useCountClassStudentsQuery(classId, { skip: !ok });
  if (!ok) return null;

  const r: any = ready ?? {};
  const issues: string[] = (r.issues ?? r.errors ?? r.missing ?? r.problems ?? []).map((x: any) =>
    typeof x === 'string' ? x : x?.message ?? JSON.stringify(x),
  );
  const isReady: boolean | undefined = r.ready ?? r.isReady ?? (ready ? issues.length === 0 : undefined);
  const count = (countData as any)?.count;

  return (
    <div className="p-3 bg-base-100 border border-base-300 rounded-xl space-y-2">
      <div className="flex items-center gap-2 text-[11px]">
        <Users className="w-3.5 h-3.5 text-primary" />
        <span className="font-bold">{count ?? '…'} students</span>
        <span className="ml-auto">
          {isFetching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin opacity-60" />
          ) : isError ? (
            <span className="text-error font-bold">Check failed</span>
          ) : isReady === undefined ? null : (
            <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${isReady ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
              {isReady ? 'Class ready' : 'Not ready'}
            </span>
          )}
        </span>
      </div>
      {isError && <p className="text-[11px] text-error">{errMsg(error)}</p>}
      {issues.length > 0 && (
        <ul className="space-y-1">
          {issues.map((i, n) => (
            <li key={n} className="flex gap-2 text-[11px] text-warning">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> <span>{i}</span>
            </li>
          ))}
        </ul>
      )}
      {!issues.length && r.message && <p className="text-[11px] opacity-70">{r.message}</p>}
    </div>
  );
}

function GenerateTab({ ctx }: { ctx: Ctx }) {
  const {
    schoolId, termId, termLabel, classLabelOf, primaryColor, secondaryColor,
    setSuccessMessage, setErrorMessage, openCard,
  } = ctx;

  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');

  const [generateOne, { isLoading: genOne }] = useGenerateReportCardMutation();
  const [generateClass, { isLoading: genClass }] = useGenerateClassReportCardsMutation();
  const [generateSchool, { isLoading: genSchool }] = useGenerateSchoolReportCardsMutation();

  const reset = () => { setSuccessMessage(''); setErrorMessage(''); };
  const btn = 'w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60';
  const btnStyle = { backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` };

  const doOne = async () => {
    reset();
    if (!termId) return setErrorMessage('Choose a term first.');
    if (!isUuid(studentId)) return setErrorMessage('Pick a student.');
    try {
      const res = await generateOne({ schoolId, studentId, termId }).unwrap();
      setSuccessMessage('Report card generated.');
      const c = extractCard(res);
      if (c?.id) openCard(c.id);
    } catch (e) { setErrorMessage(errMsg(e)); }
  };

  const doClass = async () => {
    reset();
    if (!termId) return setErrorMessage('Choose a term first.');
    if (!isUuid(classId)) return setErrorMessage('Pick a class.');
    if (!window.confirm(`Generate report cards for ${classLabelOf(classId) || 'this class'} in ${termLabel(termId)}?`)) return;
    try {
      const res: any = await generateClass({ schoolId, classId: classId.trim(), termId }).unwrap();
      const n = res?.count ?? extractList(res).length;
      setSuccessMessage(`Class report cards generated${n ? ` (${n})` : ''}.`);
    } catch (e) { setErrorMessage(errMsg(e)); }
  };

  const doSchool = async () => {
    reset();
    if (!termId) return setErrorMessage('Choose a term first.');
    if (!window.confirm(`Generate report cards for EVERY student in ${termLabel(termId)}? This can take a while.`)) return;
    try {
      const res: any = await generateSchool({ schoolId, termId }).unwrap();
      const n = res?.count ?? extractList(res).length;
      setSuccessMessage(`School-wide generation complete${n ? ` (${n} report cards)` : ''}.`);
    } catch (e) { setErrorMessage(errMsg(e)); }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-info/10 border border-info/20 text-info rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-xs font-medium">
          Generating for <strong>{termId ? termLabel(termId) : 'no term selected'}</strong>. The term’s exams must be
          published first, otherwise the backend rejects generation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${PANEL} space-y-5`}>
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><GraduationCap className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">One Student</h2>
          </div>
          <StudentSelector ctx={ctx} value={studentId} onChange={setStudentId} />
          <button onClick={doOne} disabled={genOne} className={btn} style={btnStyle}>
            {genOne ? 'Generating…' : 'Generate Report Card'}
          </button>
        </div>

        <div className={`${PANEL} space-y-5`}>
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Users className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Whole Class</h2>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Class</label>
            <ClassPicker ctx={ctx} value={classId} onChange={setClassId} />
          </div>
          <ClassReadiness classId={classId} />
          <button onClick={doClass} disabled={genClass} className={btn} style={btnStyle}>
            {genClass ? 'Generating…' : 'Generate for Class'}
          </button>
        </div>

        <div className={`${PANEL} space-y-5`}>
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <Building className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Entire School</h2>
          </div>
          <p className="text-xs opacity-70">
            Creates report cards for every student in every class. Existing cards can be refreshed afterwards with
            Regenerate from the Report Cards tab.
          </p>
          <button onClick={doSchool} disabled={genSchool} className={btn} style={btnStyle}>
            {genSchool ? 'Generating…' : 'Generate for School'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PREVIEW TAB
   ════════════════════════════════════════════════════════════════ */
function PreviewTab({ ctx, goTo }: { ctx: Ctx; goTo: (t: Tab) => void }) {
  const { schoolId, termId, termLabel, primaryColor, secondaryColor, setErrorMessage, setSuccessMessage, subjectName } = ctx;
  const [studentId, setStudentId] = useState('');
  const [ct, setCt] = useState('');
  const [pr, setPr] = useState('');
  const [preview, { data, isLoading, isError, error }] = usePreviewReportCardMutation();
  const [generateOne, { isLoading: generating }] = useGenerateReportCardMutation();
  const card = extractCard(data);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); setSuccessMessage('');
    if (!termId) return setErrorMessage('Choose a term first.');
    if (!isUuid(studentId)) return setErrorMessage('Pick a student.');
    try {
      await preview({
        schoolId, studentId, termId,
        ...(ct.trim() ? { classTeacherRemarks: ct.trim() } : {}),
        ...(pr.trim() ? { principalRemarks: pr.trim() } : {}),
      }).unwrap();
    } catch (err) { setErrorMessage(errMsg(err)); }
  };

  const saveIt = async () => {
    setErrorMessage(''); setSuccessMessage('');
    try {
      await generateOne({ schoolId, studentId, termId }).unwrap();
      setSuccessMessage('Report card generated and saved.');
      goTo('cards');
    } catch (err) { setErrorMessage(errMsg(err)); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className={`lg:col-span-5 ${PANEL} space-y-6`}>
        <div className="flex items-center gap-3 pb-4 border-b border-base-300">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Eye className="w-5 h-5" /></div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Preview</h2>
            <p className="text-[11px] opacity-60">{termId ? termLabel(termId) : 'No term selected'} · nothing is saved</p>
          </div>
        </div>
        <form onSubmit={run} className="space-y-4">
          <div className="space-y-1.5">
            <label className={LABEL}>Student</label>
            <StudentSelector ctx={ctx} value={studentId} onChange={setStudentId} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Class teacher’s remarks (optional)</label>
            <textarea value={ct} onChange={(e) => setCt(e.target.value)} rows={2} className={`${INPUT} resize-none`} placeholder="Excellent performance this term." />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Principal’s remarks (optional)</label>
            <textarea value={pr} onChange={(e) => setPr(e.target.value)} rows={2} className={`${INPUT} resize-none`} placeholder="Promoted to next grade." />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
          >
            {isLoading ? 'Building preview…' : 'Run Preview'}
          </button>
        </form>
      </div>

      <div className={`lg:col-span-7 ${PANEL} space-y-5`}>
        <div className="flex items-center justify-between pb-4 border-b border-base-300 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Result</h2>
          </div>
          {card && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-warning/10 text-warning">Not saved</span>
              <button
                onClick={saveIt}
                disabled={generating}
                className="px-3 py-2 text-[10px] font-black uppercase rounded-lg text-white disabled:opacity-60 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                {generating ? 'Saving…' : 'Generate & save'}
              </button>
            </div>
          )}
        </div>
        {isError ? (
          <div className="p-4 bg-error/10 text-error rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errMsg(error)}</span>
          </div>
        ) : card ? (
          <>
            {(data as any)?.issues?.length > 0 && (
              <div className="p-4 bg-warning/10 border border-warning/20 text-warning rounded-2xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black mb-1">Grades may be missing</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {(data as any).issues.map((msg: string, i: number) => <li key={i}>{msg}</li>)}
                  </ul>
                </div>
              </div>
            )}
            <CardSummary card={card} primaryColor={primaryColor} subjectName={subjectName} />
          </>
        ) : (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
            Pick a student and run the preview to see the report card here.
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PUBLISH TAB
   ════════════════════════════════════════════════════════════════ */
function PublishTab({ ctx }: { ctx: Ctx }) {
  const { schoolId, termId, termLabel, classLabelOf, primaryColor, setSuccessMessage, setErrorMessage } = ctx;
  const stats = useTermStats(ctx);
  const [classId, setClassId] = useState('');
  const [publishClass, { isLoading }] = usePublishClassReportCardsMutation();

  const publish = async (id: string, label: string) => {
    setSuccessMessage(''); setErrorMessage('');
    if (!termId) return setErrorMessage('Choose a term first.');
    if (!isUuid(id)) return setErrorMessage('Pick a class.');
    if (!window.confirm(`Publish all report cards for ${label} in ${termLabel(termId)}? They become visible to parents and students.`)) return;
    try {
      await publishClass({ schoolId, classId: id.trim(), termId }).unwrap();
      setSuccessMessage(`Report cards for ${label} published.`);
    } catch (e) { setErrorMessage(errMsg(e)); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className={`lg:col-span-5 ${PANEL} space-y-6`}>
        <div className="flex items-center gap-3 pb-4 border-b border-base-300">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Send className="w-5 h-5" /></div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Publish a Class</h2>
            <p className="text-[11px] opacity-60">{termId ? termLabel(termId) : 'No term selected'}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={LABEL}>Class</label>
          <ClassPicker ctx={ctx} value={classId} onChange={setClassId} />
        </div>
        <button
          onClick={() => publish(classId, classLabelOf(classId) || shortId(classId))}
          disabled={isLoading}
          className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
        >
          {isLoading ? 'Publishing…' : 'Publish Class'}
        </button>
        <p className="text-[11px] opacity-60">
          Need to hide a single card again? Open it from the Report Cards tab and choose Unpublish.
        </p>
      </div>

      <div className="lg:col-span-7">
        <ClassBreakdown ctx={ctx} rows={stats.byClass} onPublish={publish} publishing={isLoading} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DETAIL DRAWER — createPortal
   ════════════════════════════════════════════════════════════════ */
function CardDrawer({
  cardId, listCard, ctx, onClose,
}: { cardId: string; listCard?: any; ctx: Ctx; onClose: () => void }) {
  const {
    primaryColor, secondaryColor, schoolName, school, termLabel, studentName, className, subjectName,
    setSuccessMessage, setErrorMessage,
  } = ctx;

  const { data, isFetching, isError, error, refetch } = useGetReportCardByIdQuery(cardId);
  const card = extractCard(data) ?? listCard;

  const [fetchRender, { data: renderData, isFetching: loadingRender }] = reportCardsApi.useLazyGetReportCardRenderDataQuery();

  useEffect(() => {
    if (cardId) fetchRender(cardId);
  }, [cardId, fetchRender]);

  const displayCard = (renderData as any)?.data ?? card;

  const [updateRemarks, { isLoading: savingRemarks }] = useUpdateReportCardRemarksMutation();
  const [override, { isLoading: overriding }] = useOverrideReportCardMutation();
  const [regenerate, { isLoading: regenerating }] = useRegenerateReportCardMutation();
  const [publish, { isLoading: publishing }] = usePublishReportCardMutation();
  const [unpublish, { isLoading: unpublishing }] = useUnpublishReportCardMutation();

  const [section, setSection] = useState<'results' | 'remarks' | 'corrections'>('results');
  const [ct, setCt] = useState('');
  const [pr, setPr] = useState('');
  const emptyOv = { meanScore: '', grade: '', attendanceDays: '', totalMarks: '', totalPoints: '', position: '', outOf: '' };
  const [ov, setOv] = useState(emptyOv);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setCt(card?.classTeacherRemarks ?? '');
    setPr(card?.principalRemarks ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, card?.updatedAt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const reset = () => { setSuccessMessage(''); setErrorMessage(''); setLocalError(''); };
  const busy = publishing || unpublishing || regenerating;
  const names = {
    student: card ? studentName(card) : 'Report card',
    term: termLabel(card?.termId),
    cls: card ? className(card) : '',
  };

  const doPublish = async () => {
    reset();
    try { await publish(cardId).unwrap(); setSuccessMessage('Report card published.'); fetchRender(cardId); }
    catch (e) { setErrorMessage(errMsg(e)); }
  };
  const doUnpublish = async () => {
    if (!window.confirm('Unpublish this report card? It will be hidden from parents and students.')) return;
    reset();
    try { await unpublish(cardId).unwrap(); setSuccessMessage('Report card unpublished.'); fetchRender(cardId); }
    catch (e) { setErrorMessage(errMsg(e)); }
  };
  const doRegenerate = async () => {
    if (!window.confirm('Regenerate from the latest data? Manual corrections may be replaced.')) return;
    reset();
    try { await regenerate(cardId).unwrap(); setSuccessMessage('Report card regenerated.'); fetchRender(cardId); }
    catch (e) { setErrorMessage(errMsg(e)); }
  };
  const doPrint = async () => {
    reset();
    try {
      const res = await fetchRender(cardId).unwrap();
      const brand: PrintBranding = {
        name: schoolName,
        logoUrl: school?.logoUrl,
        primary: school?.primaryColor || primaryColor,
        secondary: school?.secondaryColor || secondaryColor,
        motto: school?.motto,
        address: [school?.address, school?.county].filter(Boolean).join(', '),
        phone: school?.phone,
        email: school?.email,
        website: school?.website,
        principalName: school?.principalName,
      };
      if (!openPrintWindow(buildPrintHtml(res, card, names, brand, subjectName))) {
        setErrorMessage('Pop-ups are blocked. Allow pop-ups to print.');
      }
    } catch (e) { setErrorMessage(errMsg(e)); }
  };

  const saveRemarks = async () => {
    reset();
    try {
      await updateRemarks({ reportCardId: cardId, classTeacherRemarks: ct, principalRemarks: pr }).unwrap();
      setSuccessMessage('Remarks saved.');
      fetchRender(cardId);
    } catch (e) { setLocalError(errMsg(e)); }
  };

  const saveOverride = async () => {
    reset();
    const patch: Record<string, any> = {};
    for (const k of ['meanScore', 'attendanceDays', 'totalMarks', 'totalPoints', 'position', 'outOf'] as const) {
      const raw = ov[k].trim();
      if (!raw) continue;
      const n = Number(raw);
      if (!Number.isFinite(n)) return setLocalError(`${k} must be a number.`);
      if (n < 0) return setLocalError(`${k} cannot be negative.`);
      if (k === 'meanScore' && n > 100) return setLocalError('Mean score must be between 0 and 100.');
      patch[k] = k === 'meanScore' ? n.toFixed(2) : n;
    }
    if (ov.grade.trim()) patch.grade = ov.grade.trim();
    if (Object.keys(patch).length === 0) return setLocalError('Fill in at least one field to correct.');
    try {
      await override({ reportCardId: cardId, ...patch }).unwrap();
      setSuccessMessage('Correction applied.');
      setOv(emptyOv);
      fetchRender(cardId);
    } catch (e) { setLocalError(errMsg(e)); }
  };

  const actionBtn = 'px-3 py-2 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5 disabled:opacity-60 cursor-pointer';

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Report card details"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl h-full overflow-y-auto bg-base-100 text-base-content border-l border-base-300 shadow-2xl p-8 space-y-6 animate-in slide-in-from-right duration-200"
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-base-300">
          <div className="flex items-center gap-3 min-w-0">
            <GradeBadge grade={cardGrade(displayCard)} descriptor={getGradeRemark(cardGrade(displayCard)).descriptor} large />
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight text-primary truncate">{names.student}</h2>
              <p className="text-[11px] font-mono opacity-60">{names.cls} · {names.term}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SchoolLogo school={school} name={schoolName} color={primaryColor} size={40} />
            <button onClick={onClose} className="p-2 bg-base-200 rounded-xl hover:bg-base-300 cursor-pointer" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge published={card?.isPublished} />
          <span className="text-[10px] font-mono opacity-60">Generated {fmtDate(card?.generatedAt ?? card?.createdAt)}</span>
          {card?.publishedAt && <span className="text-[10px] font-mono opacity-60">· Published {fmtDate(card.publishedAt)}</span>}
        </div>

        <div className="flex flex-wrap gap-2">
          {card?.isPublished ? (
            <button onClick={doUnpublish} disabled={busy} className={`${actionBtn} bg-warning/10 text-warning hover:bg-warning/20`}>
              <Undo2 className="w-3 h-3" /> Unpublish
            </button>
          ) : (
            <button onClick={doPublish} disabled={busy} className={`${actionBtn} text-white`} style={{ backgroundColor: primaryColor }}>
              <Send className="w-3 h-3" /> {publishing ? 'Publishing…' : 'Publish'}
            </button>
          )}
          <button onClick={doRegenerate} disabled={busy} className={`${actionBtn} bg-base-200 hover:bg-primary/20 hover:text-primary`}>
            <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} /> Regenerate
          </button>
          <button onClick={doPrint} disabled={loadingRender} className={`${actionBtn} bg-base-200 hover:bg-primary/20 hover:text-primary`}>
            <Printer className="w-3 h-3" /> {loadingRender ? 'Preparing…' : 'Print / PDF'}
          </button>
          <button onClick={() => { refetch(); fetchRender(cardId); }} disabled={isFetching} className={`${actionBtn} hover:bg-base-200`}>
            <Loader2 className={`w-3 h-3 ${isFetching || loadingRender ? 'animate-spin' : 'opacity-0'}`} /> Refresh
          </button>
        </div>

        {isError && <div className="p-3 bg-error/10 text-error rounded-xl text-xs">{errMsg(error)}</div>}
        {localError && (
          <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> <span className="flex-1">{localError}</span>
            <button onClick={() => setLocalError('')}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        <div className="flex gap-1 bg-base-200/60 border border-base-300 rounded-xl p-1 w-fit">
          {([['results', 'Results'], ['remarks', 'Remarks'], ['corrections', 'Corrections']] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSection(k)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer ${
                section === k ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
              }`}
              style={section === k ? { borderBottom: `3px solid ${secondaryColor}` } : {}}
            >
              {l}
            </button>
          ))}
        </div>

        {!displayCard ? (
          <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…</div>
        ) : section === 'results' ? (
          <CardSummary card={displayCard} primaryColor={primaryColor} subjectName={subjectName} />
        ) : section === 'remarks' ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className={LABEL}>Class teacher’s remarks</label>
              <textarea value={ct} onChange={(e) => setCt(e.target.value)} rows={4} className={`${INPUT} resize-none`} />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>Principal’s remarks</label>
              <textarea value={pr} onChange={(e) => setPr(e.target.value)} rows={4} className={`${INPUT} resize-none`} />
            </div>
            <button
              onClick={saveRemarks}
              disabled={savingRemarks}
              className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
            >
              <Save className="w-4 h-4" /> {savingRemarks ? 'Saving…' : 'Save Remarks'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-xl text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Corrections replace computed values. Leave a field empty to keep its current value.
            </div>
            <div className="grid grid-cols-2 gap-4">
              {([
                ['meanScore', 'Mean score (0–100)', fmtScore(displayCard.meanScore ?? displayCard.totals?.meanScore)],
                ['grade', 'Grade', cardGrade(displayCard) ?? ''],
                ['attendanceDays', 'Attendance days', displayCard.attendanceDays ?? ''],
                ['totalMarks', 'Total marks', displayCard.totalMarks ?? displayCard.totals?.totalMarks ?? ''],
                ['totalPoints', 'Total points', displayCard.totalPoints ?? displayCard.totals?.totalPoints ?? ''],
                ['position', 'Position', cardPosition(displayCard) ?? ''],
                ['outOf', 'Out of', cardOutOf(displayCard) ?? ''],
              ] as const).map(([k, label, ph]) => (
                <div key={k} className="space-y-1.5">
                  <label className={LABEL}>{label}</label>
                  <input
                    type="text"
                    value={ov[k]}
                    onChange={(e) => setOv({ ...ov, [k]: e.target.value })}
                    placeholder={String(ph)}
                    className={INPUT}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={saveOverride}
              disabled={overriding}
              className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
            >
              {overriding ? 'Applying…' : 'Apply Correction'}
            </button>
          </div>
        )}
      </aside>
    </div>,
    document.body
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED — CardSummary with auto-remarks
   ════════════════════════════════════════════════════════════════ */
function CardSummary({
  card, primaryColor, subjectName,
}: { card: any; primaryColor: string; subjectName: (id?: string) => string }) {
  const p = card ?? {};
  const subjects: any[] = p.subjects ?? p.subjectResults ?? [];
  const exams: any[] = p.exams ?? [];

  const grade = cardGrade(p);
  const gradeInfo = getGradeRemark(grade);
  const position = cardPosition(p);
  const outOf = cardOutOf(p);
  const totalMarks = cardTotalMarks(p);
  const totalPoints = cardTotalPoints(p);
  const meanScore = cardMeanScore(p);
  const att = attendancePct(p);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile icon={Award} label="Mean score" value={fmtScore(meanScore)} tone="primary" />
        <StatTile icon={Tag} label="Mean grade" value={grade ?? '—'} sub={gradeInfo.descriptor ?? undefined} tone="success" />
        <StatTile icon={Layers} label="Position" value={position ? `${position}${outOf ? ` / ${outOf}` : ''}` : '—'} tone="warning" />
        <StatTile icon={Percent} label="Attendance" value={att === null ? '—' : `${att}%`} tone="success" />
        <StatTile icon={BarChart3} label="Total marks" value={totalMarks ?? '—'} tone="primary" />
        <StatTile icon={Sparkles} label="Total points" value={totalPoints ?? '—'} tone="warning" />
      </div>

      {gradeInfo.remark && (
        <div className="p-3 px-4 bg-success/5 border border-success/20 rounded-xl flex items-start gap-2 text-[12px]">
          <MessageSquareQuote className="w-4 h-4 text-success shrink-0 mt-0.5" />
          <div>
            <span className="font-black text-success">{grade}</span>
            {gradeInfo.descriptor && <span className="opacity-60"> — {gradeInfo.descriptor}</span>}
            <p className="mt-0.5 italic opacity-80">“{gradeInfo.remark}”</p>
          </div>
        </div>
      )}

      {exams.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" /> Exams included
          </h3>
          <div className="space-y-1.5">
            {exams.map((e: any, i: number) => (
              <div key={e.examId ?? i} className="p-2.5 px-3 bg-base-100 border border-base-300 rounded-lg flex items-center gap-2 text-[11px]">
                <span className="font-bold flex-1 truncate">{e.examTitle}</span>
                <span className="text-[9px] uppercase font-black opacity-60 px-1.5 py-0.5 bg-base-200 rounded">{e.examCategory}</span>
                {e.weighting && <span className="font-mono opacity-60">{e.weighting}%</span>}
                {e.isLocked && (
                  <span title="Locked"><ShieldCheck className="w-3 h-3 text-success" /></span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> Subject results
        </h3>
        {subjects.length === 0 ? (
          <div className="p-6 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
            No subject breakdown was returned.
          </div>
        ) : (
          <div className="space-y-2">
            {subjects.map((s, i) => {
              const pct = subjectPct(s);
              const info = getGradeRemark(s.grade, s.teacherRemarks, s.descriptor);
              const tone = GRADE_TONES[gradeKey(s.grade)];
              return (
                <div key={s.subjectId ?? i} className="p-3 bg-base-100 border border-base-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-3">
                    <p className="flex-1 min-w-0 text-xs font-black truncate">
                      {s.subjectName ?? s.name ?? subjectName(s.subjectId)}
                    </p>
                    <span className="text-xs font-mono font-black tabular-nums">
                      {s.marks ?? '—'}{s.outOf ? ` / ${s.outOf}` : ''}
                    </span>
                    <GradeBadge grade={s.grade} />
                    {s.points != null && (
                      <span className="text-[10px] font-mono opacity-60 whitespace-nowrap">{s.points} pts</span>
                    )}
                  </div>

                  {(info.descriptor || pct !== null) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {info.descriptor && (
                        <span className={`text-[10px] font-black uppercase tracking-wider ${tone.text}`}>
                          {info.descriptor}
                        </span>
                      )}
                      {pct !== null && (
                        <span className="text-[10px] font-mono opacity-60 ml-auto">{pct.toFixed(1)}%</span>
                      )}
                    </div>
                  )}

                  {pct !== null && (
                    <div className="h-1.5 w-full rounded-full bg-base-200 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: primaryColor }} />
                    </div>
                  )}

                  {info.remark && (
                    <p className="text-[11px] opacity-80 italic flex items-start gap-1.5">
                      <MessageSquareQuote className="w-3 h-3 mt-0.5 shrink-0 opacity-50" />
                      <span className="flex-1">
                        {info.remark}
                        {info.source === 'auto' && (
                          <span className="ml-2 text-[8px] font-black uppercase tracking-wider not-italic opacity-50 px-1 py-0.5 bg-base-200 rounded">
                            auto
                          </span>
                        )}
                        {info.source === 'teacher' && (
                          <span className="ml-2 text-[8px] font-black uppercase tracking-wider not-italic opacity-60 text-primary px-1 py-0.5 bg-primary/10 rounded">
                            teacher
                          </span>
                        )}
                      </span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 bg-base-100 border border-base-300 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-1">Class teacher</p>
          <p className="text-xs whitespace-pre-wrap">{p?.classTeacherRemarks || <span className="italic opacity-50">No remarks yet.</span>}</p>
        </div>
        <div className="p-4 bg-base-100 border border-base-300 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-1">Principal</p>
          <p className="text-xs whitespace-pre-wrap">{p?.principalRemarks || <span className="italic opacity-50">No remarks yet.</span>}</p>
        </div>
      </div>
    </div>
  );
}

/** Class dropdown fed by academicStructureApi (classes + grade levels). */
function ClassPicker({
  ctx, value, onChange, placeholder = '-- Choose class --',
}: { ctx: Ctx; value: string; onChange: (id: string) => void; placeholder?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT} cursor-pointer`}>
      <option value="">{ctx.classOptions.length === 0 ? 'No classes found' : placeholder}</option>
      {ctx.classOptions.map(([id, label]) => (
        <option key={id} value={id}>{label}</option>
      ))}
    </select>
  );
}

/** Optional class filter + searchable student dropdown. */
function StudentSelector({
  ctx, value, onChange,
}: { ctx: Ctx; value: string; onChange: (id: string) => void }) {
  const [classFilter, setClassFilter] = useState('');
  const { data, isFetching } = useGetClassStudentsQuery(classFilter, { skip: !isUuid(classFilter) });
  const classStudents = useMemo(() => extractStudents(data), [data]);
  const list = classFilter ? classStudents : ctx.students;

  return (
    <div className="space-y-2">
      <ClassPicker
        ctx={ctx}
        value={classFilter}
        onChange={(id) => { setClassFilter(id); onChange(''); }}
        placeholder="All classes"
      />
      <StudentPicker students={list} value={value} onChange={onChange} loading={isFetching || ctx.studentsLoading} />
    </div>
  );
}

function StudentPicker({
  students, value, onChange, loading,
}: { students: Student[]; value: string; onChange: (id: string) => void; loading?: boolean }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return students;
    return students.filter(
      (st) =>
        studentFullName(st).toLowerCase().includes(s) ||
        (st.admissionNumber ?? '').toLowerCase().includes(s),
    );
  }, [students, q]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={loading ? 'Loading students…' : `Search ${students.length} students…`}
          className="w-full pl-10 pr-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT} cursor-pointer`}>
        <option value="">
          {filtered.length === 0 ? 'No matching students' : `-- Choose from ${filtered.length} student${filtered.length === 1 ? '' : 's'} --`}
        </option>
        {filtered.slice(0, 200).map((s) => (
          <option key={s.id} value={s.id}>{studentLabel(s)}</option>
        ))}
      </select>
    </div>
  );
}

/** Grade badge with optional descriptor under it. */
function GradeBadge({
  grade, descriptor, large,
}: { grade?: string | null; descriptor?: string | null; large?: boolean }) {
  const tone = GRADE_TONES[gradeKey(grade)];
  if (large) {
    return (
      <div className="shrink-0 flex flex-col items-center gap-1">
        <span className={`grid place-items-center font-black rounded-xl w-11 h-11 text-sm ${tone.bg} ${tone.text}`}>
          {grade || '—'}
        </span>
        {descriptor && (
          <span className={`text-[8px] font-black uppercase tracking-wider ${tone.text} opacity-70 max-w-[64px] text-center leading-tight`}>
            {descriptor}
          </span>
        )}
      </div>
    );
  }
  return (
    <span className={`shrink-0 px-2 py-0.5 text-[10px] uppercase font-black rounded ${tone.bg} ${tone.text}`}>
      {grade || '—'}
    </span>
  );
}

function StatusBadge({ published }: { published?: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${
        published ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
      }`}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

/** Stat tile with an optional `sub` line under the value. */
function StatTile({
  icon: Icon, label, value, sub, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
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
        <div className={`p-1.5 rounded-lg ${toneMap}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</p>
      </div>
      <p className="text-xl font-black text-base-content truncate">{value}</p>
      {sub && <p className="text-[10px] font-bold opacity-60 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}