import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet, Receipt, CreditCard, FileText, Download, Printer, School,
  GraduationCap, Hash, CalendarRange, AlertCircle, Loader2, CheckCircle2,
  Clock, XCircle, Banknote, Building2, Smartphone, ChevronDown, Filter,
  Info, TrendingUp, TrendingDown, Sparkles, ListChecks, Receipt as ReceiptIcon,
  ShieldCheck, ArrowDownLeft, ArrowUpRight, Copy, Check,
} from "lucide-react";
import { useGetMyProfileQuery } from "../../features/Apis/Auth.Api";
import {
  useGetStudentByUserIdQuery,
  useGetStudentWithRelationsQuery,
} from "../../features/Apis/students.Api";
import {
  useGetStudentBalanceQuery,
  useGetInvoicesByStudentQuery,
  useGetTransactionsByStudentQuery,
  useGetStudentStatementQuery,
} from "../../features/Apis/Fees.Api";
import type { Invoice, Transaction } from "../../features/Apis/Fees.Api";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";
import {
  useGetTermsBySchoolIdQuery,
  useGetCurrentTermBySchoolIdQuery,
} from "../../features/Apis/Term.Api";
import { useGetGradeLevelByIdQuery } from "../../features/Apis/academicStructure.Api";
import type { AcademicTerm } from "../../features/Apis/Term.Api";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const CARD =
  "bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 sm:p-8 rounded-3xl shadow-xl";

const INPUT_SM = "px-3 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl";

const STATUS_TONES: Record<string, { chip: string; dot: string; label: string; icon: any }> = {
  Paid: {
    chip: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
    label: "Paid",
    icon: CheckCircle2,
  },
  Cleared: {
    chip: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
    label: "Cleared",
    icon: ShieldCheck,
  },
  Partial: {
    chip: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
    label: "Partially Paid",
    icon: Clock,
  },
  Unpaid: {
    chip: "bg-error/10 text-error border-error/20",
    dot: "bg-error",
    label: "Unpaid",
    icon: XCircle,
  },
  Overdue: {
    chip: "bg-error/15 text-error border-error/30",
    dot: "bg-error",
    label: "Overdue",
    icon: AlertCircle,
  },
  Waived: {
    chip: "bg-info/10 text-info border-info/20",
    dot: "bg-info",
    label: "Waived",
    icon: ShieldCheck,
  },
  Reversed: {
    chip: "bg-base-300 text-base-content/70 border-base-300",
    dot: "bg-base-300",
    label: "Reversed",
    icon: XCircle,
  },
  Completed: {
    chip: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
    label: "Completed",
    icon: CheckCircle2,
  },
  Pending: {
    chip: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
    label: "Pending",
    icon: Clock,
  },
  Failed: {
    chip: "bg-error/10 text-error border-error/20",
    dot: "bg-error",
    label: "Failed",
    icon: XCircle,
  },
};

const METHOD_TONES: Record<string, { chip: string; icon: any; label: string }> = {
  Cash: { chip: "bg-success/10 text-success", icon: Banknote, label: "Cash" },
  Bank: { chip: "bg-primary/10 text-primary", icon: Building2, label: "Bank" },
  "M-Pesa": { chip: "bg-warning/10 text-warning", icon: Smartphone, label: "M-Pesa" },
};

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const ksh = (v: any): string => {
  const n = Number(v ?? 0);
  if (!isFinite(n)) return "KSh 0.00";
  return `KSh ${n.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const toNum = (v: any): number => {
  const n = Number(v ?? 0);
  return isFinite(n) ? n : 0;
};

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

const extractInvoices = (v: any): Invoice[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of ["invoices", "data", "records", "items"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const extractTransactions = (v: any): Transaction[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of ["transactions", "payments", "data", "records"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const extractTerms = (v: any): AcademicTerm[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of ["terms", "data", "records"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const ordinal = (n?: number | null) => {
  if (n == null || n <= 0) return "";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "S";

const escapeHtml = (s: any) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );

const safeColor = (c: any, fallback: string) =>
  typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c.trim()) ? c.trim() : fallback;

/* ── html2pdf loader ─────────────────────────────────────── */
let html2pdfLoading: Promise<void> | null = null;
function loadHtml2Pdf(): Promise<void> {
  if ((window as any).html2pdf) return Promise.resolve();
  if (html2pdfLoading) return html2pdfLoading;
  html2pdfLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
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
      i.complete ? Promise.resolve() : new Promise<void>((r) => { i.onload = () => r(); i.onerror = () => r(); })
    )
  );
  Promise.race([ready, new Promise((r) => setTimeout(r, 4000))]).then(() => w.print());
  return true;
}

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function StatusChip({ status }: { status?: string | null }) {
  const tone = STATUS_TONES[status ?? ""] ?? STATUS_TONES.Unpaid;
  const Icon = tone.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${tone.chip}`}
    >
      <Icon className="w-3 h-3" />
      {tone.label}
    </span>
  );
}

function MethodChip({ method }: { method?: string | null }) {
  const tone = METHOD_TONES[method ?? ""] ?? {
    chip: "bg-base-300 text-base-content/70",
    icon: CreditCard,
    label: method ?? "Payment",
  };
  const Icon = tone.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${tone.chip}`}>
      <Icon className="w-3 h-3" />
      {tone.label}
    </span>
  );
}

function CopyableRef({ value }: { value?: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-[10px] font-mono opacity-60 hover:opacity-100 transition"
      title="Copy reference"
    >
      {value}
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function BalanceHero({
  total,
  paid,
  balance,
  dueDate,
  primaryColor,
}: {
  total: number;
  paid: number;
  balance: number;
  dueDate?: string | null;
  primaryColor: string;
}) {
  const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const isCleared = balance <= 0;
  const isOverdue = !isCleared && dueDate ? new Date(dueDate) < new Date() : false;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-base-300 shadow-lg">
      <div
        className="p-6 sm:p-8 text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor}aa 100%)`,
        }}
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur grid place-items-center shrink-0">
            <Wallet className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-80 mb-1">
              Outstanding Balance
            </p>
            <p className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
              {ksh(balance)}
            </p>
            {isCleared ? (
              <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 text-[11px] font-black uppercase rounded-full bg-white/25 backdrop-blur">
                <CheckCircle2 className="w-3.5 h-3.5" /> Account Cleared
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 text-[11px] font-black uppercase rounded-full bg-error/90">
                <AlertCircle className="w-3.5 h-3.5" /> Overdue
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 text-[11px] font-black uppercase rounded-full bg-white/25 backdrop-blur">
                <Clock className="w-3.5 h-3.5" /> Due {dueDate ? fmtDate(dueDate) : "soon"}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-[11px] font-mono opacity-90">
            <span>{ksh(paid)} paid</span>
            <span>{ksh(total)} total</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[10px] font-mono opacity-75">{percent}% settled</p>
        </div>
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

/* ═══════════════════════════════════════════════════════════════
   INVOICE ROW (expandable)
   ═══════════════════════════════════════════════════════════════ */
function InvoiceRow({ invoice, primaryColor }: { invoice: Invoice; primaryColor: string }) {
  const [open, setOpen] = useState(false);
  const items: any[] = invoice.items ?? [];
  const total = toNum(invoice.totalAmount);
  const paid = toNum(invoice.amountPaid);
  const discount = toNum(invoice.discount);
  const balance = toNum(invoice.balance ?? total - paid - discount);
  const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  return (
    <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
      <button
        onClick={() => items.length > 0 && setOpen(!open)}
        className="w-full p-4 flex items-center gap-3 hover:bg-base-200/40 transition text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
          <Receipt className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black truncate">
              {invoice.invoiceNumber ?? `Invoice ${invoice.id.slice(0, 8)}`}
            </p>
            <StatusChip status={invoice.status} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] opacity-60 font-mono">
            {invoice.dueDate && <span>Due {fmtDate(invoice.dueDate)}</span>}
            {items.length > 0 && <span>{items.length} item{items.length === 1 ? "" : "s"}</span>}
            {invoice.term?.termName && <span>{invoice.term.termName}</span>}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-base font-black leading-none">{ksh(balance > 0 ? balance : 0)}</p>
          <p className="text-[10px] font-mono opacity-55 mt-1">
            of {ksh(total)}
          </p>
        </div>

        {items.length > 0 && (
          <ChevronDown
            className={`w-4 h-4 shrink-0 opacity-40 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-1 rounded-full bg-base-300/50 overflow-hidden">
          <div
            className={`h-full transition-all ${balance <= 0 ? "bg-success" : "bg-warning"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Expanded items */}
      {open && items.length > 0 && (
        <div className="px-4 pb-4 space-y-1.5 border-t border-base-300 pt-3">
          {items.map((it, i) => (
            <div
              key={it.id ?? i}
              className="flex items-center justify-between text-xs p-2 rounded-lg bg-base-200/40"
            >
              <span className="font-bold truncate">{it.feeItem?.name ?? it.name ?? "Fee item"}</span>
              <span className="font-mono">{ksh(it.amount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-base-200/60 mt-2">
            <span className="font-black uppercase tracking-wider opacity-60 text-[10px]">Total</span>
            <span className="font-mono font-black">{ksh(total)}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-info/10 text-info">
              <span className="font-bold">Discount</span>
              <span className="font-mono">-{ksh(discount)}</span>
            </div>
          )}
          {paid > 0 && (
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-success/10 text-success">
              <span className="font-bold">Amount paid</span>
              <span className="font-mono">{ksh(paid)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAYMENT ROW
   ═══════════════════════════════════════════════════════════════ */
function PaymentRow({ payment }: { payment: Transaction }) {
  const amount = toNum(payment.amountPaid);
  const isReversed = (payment.status ?? "").toLowerCase() === "reversed";

  return (
    <div className="p-4 bg-base-100 border border-base-300 rounded-2xl flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
          isReversed ? "bg-base-300 text-base-content/60" : "bg-success/10 text-success"
        }`}
      >
        {isReversed ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-black truncate ${isReversed ? "line-through opacity-60" : ""}`}>
            {ksh(amount)}
          </p>
          <MethodChip method={payment.paymentMethod} />
          {payment.status && payment.status !== "Completed" && (
            <StatusChip status={payment.status} />
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] opacity-60">
          <CopyableRef value={payment.referenceCode} />
          {payment.payerName && <span>by {payment.payerName}</span>}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-[11px] font-mono opacity-70">{fmtDate(payment.createdAt)}</p>
        {payment.notes && (
          <p className="text-[10px] opacity-50 truncate max-w-[140px]">{payment.notes}</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATEMENT PRINT HTML
   ═══════════════════════════════════════════════════════════════ */
interface Branding {
  name: string;
  logoUrl?: string | null;
  primary: string;
  secondary: string;
  motto?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

function buildStatementHtml(
  studentName: string,
  admissionNumber: string,
  className: string,
  invoices: Invoice[],
  payments: Transaction[],
  totals: { total: number; paid: number; balance: number; discount: number },
  brand: Branding
): string {
  const P = safeColor(brand.primary, "#4f46e5");
  const S = safeColor(brand.secondary, "#f59e0b");

  const logoHtml = brand.logoUrl
    ? `<img class="logo" src="${escapeHtml(brand.logoUrl)}" alt="logo" />`
    : `<div class="logo mono">${escapeHtml(initials(brand.name))}</div>`;

  const contact = [brand.address, brand.phone, brand.email, brand.website]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" &nbsp;•&nbsp; ");

  const invoiceRows = invoices
    .map((inv) => {
      const total = toNum(inv.totalAmount);
      const paid = toNum(inv.amountPaid);
      const discount = toNum(inv.discount);
      const balance = toNum(inv.balance ?? total - paid - discount);
      const tone =
        balance <= 0 ? "#15803d" : inv.status === "Overdue" ? "#b91c1c" : "#b45309";
      return `<tr>
        <td>${escapeHtml(inv.invoiceNumber ?? inv.id.slice(0, 8))}</td>
        <td>${escapeHtml(inv.term?.termName ?? "—")}</td>
        <td>${escapeHtml(fmtDate(inv.dueDate))}</td>
        <td class="c"><span class="pill" style="background:${tone}">${escapeHtml(inv.status ?? "Unpaid")}</span></td>
        <td class="r">${escapeHtml(ksh(total))}</td>
        <td class="r">${escapeHtml(ksh(paid))}</td>
        <td class="r">${discount > 0 ? escapeHtml(ksh(discount)) : "—"}</td>
        <td class="r"><strong>${escapeHtml(ksh(balance))}</strong></td>
      </tr>`;
    })
    .join("");

  const paymentRows = payments
    .map(
      (p) => `<tr>
        <td>${escapeHtml(fmtDate(p.createdAt))}</td>
        <td>${escapeHtml(p.referenceCode)}</td>
        <td>${escapeHtml(p.paymentMethod ?? "—")}</td>
        <td>${escapeHtml(p.payerName ?? "—")}</td>
        <td>${escapeHtml(p.notes ?? "—")}</td>
        <td class="r"><strong>${escapeHtml(ksh(toNum(p.amountPaid)))}</strong></td>
      </tr>`
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8">
<title>Fee Statement – ${escapeHtml(studentName)}</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; font-size: 12px; }
  .page { position: relative; border: 2px solid ${P}; border-radius: 10px; overflow: hidden; min-height: 275mm; }
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
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  thead th { background: ${P}; color: #fff; padding: 7px 8px; text-align: left; font-size: 9px; letter-spacing: .8px; text-transform: uppercase; }
  tbody td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  tbody tr:nth-child(even) { background: ${P}0d; }
  .c { text-align: center; } .r { text-align: right; } th.c { text-align: center; } th.r { text-align: right; }
  .pill { display: inline-block; min-width: 40px; padding: 2px 8px; border-radius: 99px; color: #fff; font-weight: 800; font-size: 10px; }
  .sum { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
  .sum div { text-align: center; padding: 9px 6px; border-radius: 8px; border: 1px solid ${P}33; background: ${P}0f; }
  .sum div:nth-child(4) { background: ${S}22; border-color: ${S}; }
  .sum small { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .8px; color: #64748b; }
  .sum b { font-size: 16px; color: ${P}; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 32px; }
  .sign div { border-top: 1.5px solid ${P}; padding-top: 4px; text-align: center; font-size: 10px; color: #475569; }
  .foot { display: flex; justify-content: space-between; padding: 8px 24px; background: ${P}; color: #fff; font-size: 9.5px; }
</style></head><body>
<div class="page">
  <div class="inner">
    <div class="band"></div>
    <div class="letterhead">
      ${logoHtml}
      <div class="lh-text">
        <h1>${escapeHtml(brand.name)}</h1>
        ${brand.motto ? `<div class="motto">"${escapeHtml(brand.motto)}"</div>` : ""}
        ${contact ? `<div class="contact">${contact}</div>` : ""}
      </div>
      <div style="width:84px"></div>
    </div>
    <div class="title">
      <b>Fee Statement</b>
      <span>${escapeHtml(fmtLongDate(new Date().toISOString()))}</span>
    </div>

    <div class="body">
      <div class="meta">
        <div><small>Student</small><b>${escapeHtml(studentName)}</b></div>
        <div><small>Admission no.</small><b>${escapeHtml(admissionNumber || "—")}</b></div>
        <div><small>Class</small><b>${escapeHtml(className || "—")}</b></div>
        <div><small>Generated</small><b>${escapeHtml(fmtDate(new Date().toISOString()))}</b></div>
      </div>

      <div class="sum">
        <div><small>Total billed</small><b>${escapeHtml(ksh(totals.total))}</b></div>
        <div><small>Total paid</small><b>${escapeHtml(ksh(totals.paid))}</b></div>
        <div><small>Discount</small><b>${escapeHtml(ksh(totals.discount))}</b></div>
        <div><small>Balance</small><b>${escapeHtml(ksh(totals.balance))}</b></div>
      </div>

      <h2>Invoices</h2>
      <table>
        <thead><tr>
          <th>Invoice</th><th>Term</th><th>Due date</th><th class="c">Status</th>
          <th class="r">Total</th><th class="r">Paid</th><th class="r">Disc.</th><th class="r">Balance</th>
        </tr></thead>
        <tbody>${invoiceRows || '<tr><td colspan="8" class="c">No invoices.</td></tr>'}</tbody>
      </table>

      <h2>Payment History</h2>
      <table>
        <thead><tr>
          <th>Date</th><th>Reference</th><th>Method</th><th>Payer</th><th>Notes</th><th class="r">Amount</th>
        </tr></thead>
        <tbody>${paymentRows || '<tr><td colspan="6" class="c">No payments.</td></tr>'}</tbody>
      </table>

      <div class="sign">
        <div>Bursar's signature &amp; stamp</div>
        <div>Parent / guardian's signature</div>
      </div>
    </div>
    <div class="foot"><span>${escapeHtml(brand.name)}</span><span>${escapeHtml(brand.motto ?? "")}</span><span>Official fee statement</span></div>
  </div>
</div>
</body></html>`;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
type Tab = "overview" | "invoices" | "payments" | "statement";

export default function StudentFees() {
  const [tab, setTab] = useState<Tab>("overview");
  const [termFilter, setTermFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [localError, setLocalError] = useState("");
  const [downloading, setDownloading] = useState(false);

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

  /* ── 2. School + term + grade lookups ── */
  const { data: school } = useGetSchoolByIdQuery(schoolId as string, { skip: !schoolId });
  const { data: termsData } = useGetTermsBySchoolIdQuery(schoolId as string, { skip: !schoolId });
  const { data: currentTermData } = useGetCurrentTermBySchoolIdQuery(schoolId as string, {
    skip: !schoolId,
  });

  const terms = useMemo(() => extractTerms(termsData), [termsData]);
  const currentTerm: any = (currentTermData as any)?.data ?? (currentTermData as any)?.term;

  const gradeLevelId: string | undefined =
    fullStudent?.class?.gradeLevelId ?? fullStudent?.class?.gradeLevel?.id;
  const { data: gradeLevelData } = useGetGradeLevelByIdQuery(gradeLevelId as string, {
    skip: !gradeLevelId,
  });
  const gradeLevel: any = (gradeLevelData as any)?.data ?? (gradeLevelData as any)?.gradeLevel;

  const activeTermId = termFilter || currentTerm?.id || "";

  /* ── 3. Data queries ── */
  const {
    data: balanceData,
    isLoading: loadingBalance,
    isError: balanceError,
    error: balanceErr,
  } = useGetStudentBalanceQuery(
    { studentId: studentId!, schoolId: schoolId!, termId: activeTermId },
    { skip: !studentId || !schoolId || !activeTermId }
  );

  const {
    data: invoicesData,
    isLoading: loadingInvoices,
  } = useGetInvoicesByStudentQuery(
    { studentId: studentId!, schoolId: schoolId! },
    { skip: !studentId || !schoolId }
  );

  const {
    data: transactionsData,
    isLoading: loadingPayments,
  } = useGetTransactionsByStudentQuery(
    { studentId: studentId!, schoolId: schoolId! },
    { skip: !studentId || !schoolId }
  );

  const { data: statementData } = useGetStudentStatementQuery(
    { studentId: studentId!, schoolId: schoolId! },
    { skip: !studentId || !schoolId }
  );

  /* ── 4. Normalise data ── */
  const balance: any = (balanceData as any)?.data ?? balanceData ?? {};
  const invoices = useMemo(() => extractInvoices(invoicesData), [invoicesData]);
  const payments = useMemo(() => extractTransactions(transactionsData), [transactionsData]);
  const statement = useMemo(() => {
    const d: any = (statementData as any)?.data ?? statementData;
    if (Array.isArray(d)) return d;
    return d?.entries ?? d?.statement ?? d?.transactions ?? [];
  }, [statementData]);

  /* ── 5. Filter by term ── */
  const filteredInvoices = useMemo(
    () =>
      termFilter
        ? invoices.filter((i) => i.termId === termFilter)
        : invoices,
    [invoices, termFilter]
  );

  const filteredPayments = useMemo(
    () =>
      termFilter
        ? payments.filter((p) => p.termId === termFilter)
        : payments,
    [payments, termFilter]
  );

  /* ── 6. Totals (prefer API, fallback to sum) ── */
  const computed = useMemo(() => {
    const invTotal = filteredInvoices.reduce((s, i) => s + toNum(i.totalAmount), 0);
    const invPaid = filteredInvoices.reduce((s, i) => s + toNum(i.amountPaid), 0);
    const invDiscount = filteredInvoices.reduce((s, i) => s + toNum(i.discount), 0);
    const invBalance = filteredInvoices.reduce((s, i) => {
      const b = i.balance != null ? toNum(i.balance) : toNum(i.totalAmount) - toNum(i.amountPaid) - toNum(i.discount);
      return s + Math.max(0, b);
    }, 0);

    return {
      total: toNum(balance?.totalFee ?? balance?.totalAmount ?? balance?.totalBilled ?? invTotal),
      paid: toNum(balance?.totalPaid ?? balance?.amountPaid ?? invPaid),
      balance: toNum(
        balance?.balance ??
          balance?.outstandingBalance ??
          balance?.currentBalance ??
          invBalance
      ),
      discount: toNum(balance?.discount ?? invDiscount),
      dueDate: balance?.dueDate as string | null | undefined,
      invoiceCount: filteredInvoices.length,
      paymentCount: filteredPayments.length,
    };
  }, [balance, filteredInvoices, filteredPayments]);

  /* ── 7. Unique statuses for filter ── */
  const invoiceStatuses = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((i) => i.status && set.add(i.status));
    return [...set];
  }, [invoices]);

  const displayedInvoices = useMemo(() => {
    if (!statusFilter) return filteredInvoices;
    return filteredInvoices.filter((i) => i.status === statusFilter);
  }, [filteredInvoices, statusFilter]);

  /* ── 8. Print / Download statement ── */
  const buildBrand = (): Branding => ({
    name: school?.name ?? "School",
    logoUrl: school?.logoUrl,
    primary: school?.primaryColor || "#6366f1",
    secondary: school?.secondaryColor || "#f59e0b",
    motto: school?.motto,
    address: [school?.address, school?.county].filter(Boolean).join(", "),
    phone: school?.phone,
    email: school?.email,
    website: school?.website,
  });

  const buildHtml = () => {
    const studentName =
      [
        fullStudent?.firstName ?? studentRecord?.firstName,
        fullStudent?.lastName ?? studentRecord?.lastName,
      ]
        .filter(Boolean)
        .join(" ") || "Student";
    const admissionNumber =
      fullStudent?.admissionNumber ?? studentRecord?.admissionNumber ?? "";
    const className = fullStudent?.class?.name ?? profile.className ?? "";

    return buildStatementHtml(
      studentName,
      admissionNumber,
      className,
      filteredInvoices,
      filteredPayments,
      {
        total: computed.total,
        paid: computed.paid,
        balance: computed.balance,
        discount: computed.discount,
      },
      buildBrand()
    );
  };

  const doPrint = () => {
    setLocalError("");
    const html = buildHtml();
    if (!openPrintWindow(html)) {
      setLocalError("Pop-ups are blocked. Allow pop-ups to print the statement.");
    }
  };

  const doDownload = async () => {
    setLocalError("");
    setDownloading(true);
    try {
      const html = buildHtml();
      await loadHtml2Pdf();
      const studentName =
        [
          fullStudent?.firstName ?? studentRecord?.firstName,
          fullStudent?.lastName ?? studentRecord?.lastName,
        ]
          .filter(Boolean)
          .join(" ") || "Student";
      const filename = `Fee-Statement-${studentName}`.replace(/[^\w\-]+/g, "_");
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
    } catch (e: any) {
      setLocalError(errMsg(e, "Could not download the PDF."));
    } finally {
      setDownloading(false);
    }
  };

  /* ── 9. Labels ── */
  const className: string =
    fullStudent?.class?.name ?? fullStudent?.className ?? profile.className ?? "My Class";
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

  /* ── 10. Loading / error gates ── */
  const resolvingIdentity =
    loadingProfile || (!studentId && (loadingStudent || loadingFull));

  if (resolvingIdentity) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-40 rounded-3xl bg-base-200/60" />
        <div className="h-32 rounded-3xl bg-base-200/60" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-base-200/60" />
          ))}
        </div>
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
            <Wallet className="w-9 h-9" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-55 mb-1">
              My Fees
            </p>
            <h1
              className="text-2xl sm:text-3xl font-black tracking-tight truncate"
              style={{ color: primaryColor }}
            >
              {gradeTitle}
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

          {/* Term selector */}
          <div className="w-full sm:w-auto min-w-[220px]">
            <label className="block text-[10px] uppercase tracking-wider font-black opacity-55 mb-1">
              Viewing term
            </label>
            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              <option value="">
                Current ({currentTerm?.termName ?? "—"})
              </option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.termName} ({t.academicYear}){t.isCurrentTerm ? " · current" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── ERROR ── */}
      {localError && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium flex-1">{localError}</span>
          <button onClick={() => setLocalError("")} className="opacity-60 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {balanceError && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium flex-1">
            {errMsg(balanceErr, "Could not load your balance.")}
          </span>
        </div>
      )}

      {/* ── BALANCE HERO ── */}
      {loadingBalance ? (
        <div className="h-48 rounded-3xl bg-base-200/60 animate-pulse" />
      ) : (
        <BalanceHero
          total={computed.total}
          paid={computed.paid}
          balance={computed.balance}
          dueDate={computed.dueDate}
          primaryColor={primaryColor}
        />
      )}

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          icon={ReceiptIcon}
          label="Invoices"
          value={computed.invoiceCount}
          sub={termFilter ? "this term" : "all terms"}
        />
        <StatTile
          icon={ArrowUpRight}
          label="Payments"
          value={computed.paymentCount}
          tone="text-success"
          bg="bg-success/10"
          sub={termFilter ? "this term" : "all terms"}
        />
        <StatTile
          icon={TrendingUp}
          label="Total billed"
          value={ksh(computed.total)}
          tone="text-warning"
          bg="bg-warning/10"
        />
        <StatTile
          icon={ShieldCheck}
          label="Total paid"
          value={ksh(computed.paid)}
          tone="text-success"
          bg="bg-success/10"
        />
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 border-b border-base-300 pb-3 flex-wrap">
        {(
          [
            ["overview", "Overview", Wallet],
            ["invoices", "Invoices", Receipt],
            ["payments", "Payments", CreditCard],
            ["statement", "Statement", FileText],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              tab === id
                ? "text-white shadow-md"
                : "bg-base-200/50 hover:bg-base-200 opacity-75"
            }`}
            style={tab === id ? { backgroundColor: primaryColor } : {}}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
        {tab === "statement" && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={doPrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-base-100 border border-base-300 hover:bg-base-200 text-[11px] font-black uppercase transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={doDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[11px] font-black uppercase transition disabled:opacity-60"
              style={{ backgroundColor: secondaryColor }}
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {downloading ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          OVERVIEW TAB
         ═══════════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent invoices */}
          <div className={`${CARD} space-y-4`}>
            <div className="flex items-center gap-3 pb-3 border-b border-base-300">
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                <Receipt className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider">Recent invoices</h2>
              <button
                onClick={() => setTab("invoices")}
                className="ml-auto text-[10px] font-black uppercase text-primary hover:underline"
              >
                View all →
              </button>
            </div>
            {loadingInvoices ? (
              <div className="p-6 text-center text-xs opacity-60">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-6 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-xl">
                No invoices yet.
              </div>
            ) : (
              <div className="space-y-2">
                {[...filteredInvoices]
                  .sort((a, b) =>
                    (b.createdAt ?? b.dueDate ?? "").localeCompare(
                      a.createdAt ?? a.dueDate ?? ""
                    )
                  )
                  .slice(0, 3)
                  .map((inv) => (
                    <InvoiceRow key={inv.id} invoice={inv} primaryColor={primaryColor} />
                  ))}
              </div>
            )}
          </div>

          {/* Recent payments */}
          <div className={`${CARD} space-y-4`}>
            <div className="flex items-center gap-3 pb-3 border-b border-base-300">
              <div className="p-2 rounded-xl bg-success/10 text-success">
                <CreditCard className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider">Recent payments</h2>
              <button
                onClick={() => setTab("payments")}
                className="ml-auto text-[10px] font-black uppercase text-primary hover:underline"
              >
                View all →
              </button>
            </div>
            {loadingPayments ? (
              <div className="p-6 text-center text-xs opacity-60">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-6 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-xl">
                No payments recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {[...filteredPayments]
                  .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
                  .slice(0, 3)
                  .map((p) => (
                    <PaymentRow key={p.id} payment={p} />
                  ))}
              </div>
            )}
          </div>

          {/* How to pay */}
          <div className={`${CARD} lg:col-span-2 space-y-3`}>
            <div className="flex items-center gap-2 pb-3 border-b border-base-300">
              <Info className="w-4 h-4 text-info" />
              <h2 className="text-sm font-black uppercase tracking-wider">How to pay</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-success/5 border border-success/20">
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className="w-4 h-4 text-success" />
                  <p className="font-black text-xs">Cash</p>
                </div>
                <p className="text-[11px] opacity-70">
                  Pay at the school bursar's office during working hours. A receipt will be issued
                  immediately.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-primary" />
                  <p className="font-black text-xs">Bank deposit</p>
                </div>
                <p className="text-[11px] opacity-70">
                  Deposit into the school account and submit the slip to the bursar for capture.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4 text-warning" />
                  <p className="font-black text-xs">M-Pesa</p>
                </div>
                <p className="text-[11px] opacity-70">
                  Pay via Paybill using your admission number as the account reference.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          INVOICES TAB
         ═══════════════════════════════════════════════════════════ */}
      {tab === "invoices" && (
        <div className={`${CARD} space-y-4`}>
          <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-base-300">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-wider">Invoices</h2>
            </div>
            <div className="flex gap-2 ml-auto flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`${INPUT_SM} cursor-pointer`}
              >
                <option value="">All statuses</option>
                {invoiceStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className="text-[10px] font-mono opacity-55 self-center">
                {displayedInvoices.length} of {filteredInvoices.length}
              </span>
            </div>
          </div>

          {loadingInvoices ? (
            <div className="p-12 text-center text-xs opacity-60">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading invoices…
            </div>
          ) : displayedInvoices.length === 0 ? (
            <div className="p-12 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              {filteredInvoices.length === 0
                ? "No invoices for this term."
                : "No invoices match the current filter."}
            </div>
          ) : (
            <div className="space-y-2">
              {[...displayedInvoices]
                .sort((a, b) =>
                  (b.createdAt ?? b.dueDate ?? "").localeCompare(
                    a.createdAt ?? a.dueDate ?? ""
                  )
                )
                .map((inv) => (
                  <InvoiceRow key={inv.id} invoice={inv} primaryColor={primaryColor} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PAYMENTS TAB
         ═══════════════════════════════════════════════════════════ */}
      {tab === "payments" && (
        <div className={`${CARD} space-y-4`}>
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-success" />
              <h2 className="text-sm font-black uppercase tracking-wider">Payment history</h2>
            </div>
            <span className="ml-auto text-[10px] font-mono opacity-55">
              {filteredPayments.length} payment{filteredPayments.length === 1 ? "" : "s"}
            </span>
          </div>

          {loadingPayments ? (
            <div className="p-12 text-center text-xs opacity-60">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading payments…
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              No payments recorded for this term yet.
            </div>
          ) : (
            <div className="space-y-2">
              {[...filteredPayments]
                .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
                .map((p) => (
                  <PaymentRow key={p.id} payment={p} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          STATEMENT TAB
         ═══════════════════════════════════════════════════════════ */}
      {tab === "statement" && (
        <div className={`${CARD} space-y-5`}>
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">Fee statement</h2>
              <p className="text-[11px] opacity-60">
                {termFilter ? "Single term" : "All terms combined"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] uppercase font-black opacity-55">Generated</span>
              <span className="text-[11px] font-mono">{fmtDate(new Date().toISOString())}</span>
            </div>
          </div>

          {/* Summary tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-base-100 border border-base-300">
              <p className="text-[9px] uppercase font-black opacity-55">Total billed</p>
              <p className="text-lg font-black">{ksh(computed.total)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-success/5 border border-success/20">
              <p className="text-[9px] uppercase font-black opacity-55">Total paid</p>
              <p className="text-lg font-black text-success">{ksh(computed.paid)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-info/5 border border-info/20">
              <p className="text-[9px] uppercase font-black opacity-55">Discount</p>
              <p className="text-lg font-black text-info">{ksh(computed.discount)}</p>
            </div>
            <div
              className={`p-3 rounded-2xl border ${
                computed.balance > 0
                  ? "bg-warning/5 border-warning/20"
                  : "bg-success/5 border-success/20"
              }`}
            >
              <p className="text-[9px] uppercase font-black opacity-55">Balance</p>
              <p
                className={`text-lg font-black ${
                  computed.balance > 0 ? "text-warning" : "text-success"
                }`}
              >
                {ksh(computed.balance)}
              </p>
            </div>
          </div>

          {/* Ledger */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5" /> Transaction ledger
            </h3>
            {[...filteredInvoices, ...filteredPayments]
              .sort((a: any, b: any) => {
                const da = a.createdAt ?? a.dueDate ?? "";
                const db = b.createdAt ?? b.dueDate ?? "";
                return da.localeCompare(db);
              })
              .map((entry: any, i) => {
                const isPayment = entry.paymentMethod != null;
                const amount = isPayment ? toNum(entry.amountPaid) : toNum(entry.totalAmount);
                const label = isPayment
                  ? entry.referenceCode ?? "Payment"
                  : entry.invoiceNumber ?? `Invoice ${entry.id.slice(0, 8)}`;
                return (
                  <div
                    key={entry.id ?? i}
                    className="flex items-center gap-3 p-3 bg-base-100 border border-base-300 rounded-xl"
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isPayment ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isPayment ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{label}</p>
                      <p className="text-[10px] font-mono opacity-60">
                        {fmtDate(entry.createdAt ?? entry.dueDate)}
                        {isPayment && ` · ${entry.paymentMethod}`}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-black ${
                        isPayment ? "text-success" : "text-primary"
                      }`}
                    >
                      {isPayment ? "+" : ""}
                      {ksh(amount)}
                    </p>
                  </div>
                );
              })}
            {filteredInvoices.length === 0 && filteredPayments.length === 0 && (
              <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
                No transactions to show.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-base-300 flex items-start gap-2 px-4 py-3 rounded-2xl bg-base-200/40 text-[11px] opacity-70">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>Print</strong> opens the branded statement in a new window — choose your
              printer or "Save as PDF". <strong>Download PDF</strong> generates a ready-to-share
              A4 PDF.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}