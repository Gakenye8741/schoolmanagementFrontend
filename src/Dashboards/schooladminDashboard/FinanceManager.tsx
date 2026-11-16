import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  Wallet, Receipt, CreditCard, BarChart3, Layers, PlusCircle, Edit3, Trash2,
  CheckCircle2, AlertCircle, X, Building, Loader2, Save, Send, Ban, Undo2,
  TrendingUp, Users, FileText, Percent, Copy, ShieldCheck, Clock, Wand2, User, Printer,
} from 'lucide-react';

import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import {
  useGetTermsBySchoolIdQuery,
  useGetCurrentTermBySchoolIdQuery,
} from '../../features/Apis/Term.Api';
import {
  useGetGradeLevelsBySchoolQuery,
  useGetClassesBySchoolQuery,
  type GradeLevel,
  type ClassEntity,
} from '../../features/Apis/academicStructure.Api';
import {
  useGetStudentsByClassQuery,
  type Student,
} from '../../features/Apis/students.Api';
import {
  useCreateFeeItemMutation,
  useGetFeeItemsBySchoolQuery,
  useUpdateFeeItemMutation,
  useDeleteFeeItemMutation,
  useBulkUpsertFeeStructuresMutation,
  useCopyFeeStructuresMutation,
  useGetFeeStructuresByTermQuery,
  useDeleteFeeStructureMutation,
  useLazyValidateFeeStructuresQuery,
  useGenerateStudentInvoiceMutation,
  useGenerateClassInvoicesMutation,
  useGenerateGradeInvoicesMutation,
  useGenerateSchoolInvoicesMutation,
  useGetInvoicesByTermQuery,
  useGetInvoicesByStudentQuery,
  useApplyInvoiceDiscountMutation,
  useWaiveInvoiceMutation,
  useMarkOverdueInvoicesMutation,
  useDeleteInvoiceMutation,
  useRecordPaymentMutation,
  useGetTransactionsByTermQuery,
  useReversePaymentMutation,
  useGetStudentBalanceQuery,
  useGetStudentStatementQuery,
  useGetTransactionsByStudentQuery,
  useGetTermSummaryQuery,
  useGetCollectionsByMethodQuery,
  useGetCollectionsByBoardingQuery,
  useGetCollectionsByGradeQuery,
  useGetAgingReportQuery,
  useGetExpectedVsCollectedQuery,
  useGetDefaultersQuery,
  useGetClearedStudentsQuery,
  useRecomputeInvoicesMutation,
  type FeeItem,
  type FeeStructure,
  type Invoice,
  type Transaction,
  type BoardingStatus,
  type PaymentMethod,
} from '../../features/Apis/Fees.Api';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const BOARDING: BoardingStatus[] = ['Day', 'Boarding'];
const METHODS: PaymentMethod[] = ['Cash', 'Bank', 'M-Pesa'];
const CURRENCY = 'KES';

const CARD = 'bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl';
const WIDGET = 'bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-2xl shadow-sm';
const INPUT = 'w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary';
const SELECT_SM = 'w-full px-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer';
const LABEL = 'block text-xs font-bold uppercase tracking-wider opacity-70';
const EMPTY = 'p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl';
const TH = 'px-3 py-2 font-black uppercase tracking-wider opacity-70';
const MINI_BTN = 'text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
function pick<T = any>(data: any, ...keys: string[]): T[] {
  if (!data) return [];
  for (const k of keys) if (Array.isArray(data[k])) return data[k];
  return Array.isArray(data) ? data : [];
}

const extractFeeItems = (d: any) => pick<FeeItem>(d, 'feeItems', 'items', 'data');
const extractStructures = (d: any) => pick<FeeStructure>(d, 'feeStructures', 'structures', 'data');
const extractInvoices = (d: any) => pick<Invoice>(d, 'invoices', 'data');
const extractTransactions = (d: any) => pick<Transaction>(d, 'transactions', 'payments', 'data');
const extractGrades = (d: any) => pick<GradeLevel>(d, 'gradeLevels', 'levels', 'data');
const extractClasses = (d: any) => pick<ClassEntity>(d, 'classes', 'data');
const extractStudents = (d: any) => pick<Student>(d, 'students', 'data');

const money = (v: any) =>
  v == null || v === '' || isNaN(Number(v))
    ? '—'
    : `${CURRENCY} ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  try {
    const safe = d.length === 10 ? `${d}T00:00:00` : d;
    return new Date(safe).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

function errMsg(err: any, fallback: string): string {
  if (err?.status === 401) return 'Your session has expired. Please sign in again.';
  if (err?.status === 403) return err?.data?.message || 'You do not have permission to do that.';
  return err?.data?.message || err?.message || fallback;
}

/** Best-effort student name for invoice / transaction rows. */
function personName(row: any, students?: Student[]): string {
  const s = row?.student ?? row;
  const full = row?.studentName || `${s?.firstName ?? ''} ${s?.lastName ?? ''}`.trim();
  if (full) return full;
  const found = students?.find((x) => x.id === row?.studentId);
  if (found) return `${found.firstName} ${found.lastName}`.trim();
  return row?.admissionNumber ? `ADM ${row.admissionNumber}` : (row?.studentId ?? '—').slice(0, 8);
}

const statusTone = (s?: string) => {
  switch ((s ?? '').toLowerCase()) {
    case 'paid': case 'completed': case 'cleared': return 'bg-success/10 text-success';
    case 'partial': case 'pending': return 'bg-warning/10 text-warning';
    case 'overdue': case 'reversed': case 'failed': case 'cancelled': return 'bg-error/10 text-error';
    case 'waived': return 'bg-info/10 text-info';
    default: return 'bg-base-200 text-base-content';
  }
};

/** Turn any report payload into table rows. Handles arrays and Record<key, stat>. */
function reportRows(data: any): any[] {
  if (!data) return [];
  const skip = new Set(['success', 'message', 'count', 'issues']);
  for (const [k, v] of Object.entries(data)) {
    if (skip.has(k)) continue;
    if (Array.isArray(v)) return v as any[];
    if (v && typeof v === 'object') {
      const vals = Object.values(v as any);
      if (vals.length && vals.every((x) => x && typeof x === 'object' && !Array.isArray(x))) {
        return Object.entries(v as any).map(([key, val]: [string, any]) => ({ key, ...val }));
      }
      return [v];
    }
  }
  return [];
}

/** First plain object in a payload, for summary tiles. */
function reportObject(data: any): Record<string, any> {
  if (!data) return {};
  const skip = new Set(['success', 'message']);
  for (const [k, v] of Object.entries(data)) {
    if (skip.has(k)) continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as any;
  }
  return Object.fromEntries(Object.entries(data).filter(([k, v]) => !skip.has(k) && typeof v !== 'object'));
}

const prettyKey = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim();
const MONEYISH = /amount|balance|total|paid|collected|expected|discount|outstanding|revenue|billed/i;
const PCTISH = /percent|rate/i;

function fmtCell(k: string, v: any): string {
  if (v == null) return '—';
  if (typeof v === 'object') return '…';
  if (typeof v === 'number' || (typeof v === 'string' && v !== '' && !isNaN(Number(v)))) {
    if (PCTISH.test(k)) return `${Number(v).toFixed(1)}%`;
    if (MONEYISH.test(k)) return money(v);
  }
  return String(v);
}

// ═══════════════════════════════════════════════════════════════
// RECEIPTS — opens a printable receipt in a new window
// ═══════════════════════════════════════════════════════════════
type ReceiptInput = {
  schoolName: string;
  tx: Transaction;
  studentName: string;
  admissionNumber?: string;
  className?: string;
  termLabel?: string;
  invoiceNumber?: string;
  invoiceBalance?: any;
};

const esc = (v: any) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const receiptNo = (tx: Transaction) => tx.receiptNumber || `RCT-${String(tx.id).slice(0, 8).toUpperCase()}`;

/** Returns false if the browser blocked the pop-up. */
function printReceipt(r: ReceiptInput): boolean {
  const w = window.open('', '_blank', 'width=820,height=960');
  if (!w) return false;
  const { tx } = r;
  const row = (label: string, value: any) =>
    value == null || value === '' ? '' : `<tr><td class="k">${esc(label)}</td><td class="v">${esc(value)}</td></tr>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${esc(receiptNo(tx))}</title>
<style>
  *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:32px;background:#fff}
  .receipt{max-width:640px;margin:0 auto;border:2px solid #111;padding:28px}
  h1{margin:0;font-size:22px;text-align:center;letter-spacing:1px;text-transform:uppercase}
  .sub{text-align:center;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:6px 0 18px;color:#555}
  .meta{display:flex;justify-content:space-between;font-size:12px;border-top:1px solid #111;border-bottom:1px solid #111;padding:8px 0;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:13px} td{padding:7px 0;border-bottom:1px dotted #aaa;vertical-align:top}
  .k{color:#555;width:40%} .v{font-weight:600;text-align:right}
  .amount{margin:20px 0;padding:14px;border:2px solid #111;text-align:center}
  .amount small{display:block;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#555}
  .amount strong{font-size:26px}
  .sign{display:flex;justify-content:space-between;margin-top:42px;font-size:11px;color:#555}
  .sign div{width:44%;border-top:1px solid #111;padding-top:6px;text-align:center}
  .foot{text-align:center;font-size:11px;color:#777;margin-top:22px}
  @media print{body{padding:0}.receipt{border-width:1px}}
</style></head><body>
<div class="receipt">
  <h1>${esc(r.schoolName)}</h1>
  <div class="sub">Official Payment Receipt</div>
  <div class="meta"><span>Receipt No: <b>${esc(receiptNo(tx))}</b></span><span>Date: <b>${esc(fmtDate(tx.paymentDate || tx.createdAt))}</b></span></div>
  <table>
    ${row('Received from', tx.payerName || r.studentName)}
    ${row('Student', r.studentName)}
    ${row('Admission No.', r.admissionNumber)}
    ${row('Class', r.className)}
    ${row('Term', r.termLabel)}
    ${row('Invoice', r.invoiceNumber)}
    ${row('Payment method', tx.paymentMethod)}
    ${row('Reference code', tx.referenceCode)}
    ${row('Payer phone', tx.payerPhone)}
    ${row('Notes', tx.notes)}
  </table>
  <div class="amount"><small>Amount received</small><strong>${esc(money(tx.amountPaid))}</strong></div>
  ${r.invoiceBalance != null && r.invoiceBalance !== '' ? `<table>${row('Invoice balance (current)', money(r.invoiceBalance))}</table>` : ''}
  <div class="sign"><div>Received by</div><div>Parent / Guardian</div></div>
  <div class="foot">Thank you for your payment. Keep this receipt for your records.</div>
</div>
</body></html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
  return true;
}

type Tab = 'items' | 'structures' | 'invoices' | 'payments' | 'student' | 'reports';

type SectionProps = {
  schoolId: string;
  schoolName: string;
  primaryColor: string;
  secondaryColor: string;
  setSuccessMessage: (v: string) => void;
  setErrorMessage: (v: string) => void;
};

// ═══════════════════════════════════════════════════════════════
// SHARED HOOKS & COMPONENTS
// ═══════════════════════════════════════════════════════════════
function useTermSelect(schoolId: string) {
  const [termId, setTermId] = useState('');
  const { data: termsData } = useGetTermsBySchoolIdQuery(schoolId, { skip: !schoolId });
  const { data: currentData } = useGetCurrentTermBySchoolIdQuery(schoolId, { skip: !schoolId });
  const terms: any[] = termsData?.terms ?? [];
  const currentTerm: any = currentData?.term ?? null;

  useEffect(() => {
    if (!termId && currentTerm) setTermId(currentTerm.id);
  }, [currentTerm, termId]);

  return { terms, termId, setTermId, term: terms.find((t) => t.id === termId) ?? null };
}

function useAcademic(schoolId: string) {
  const { data: gradesData } = useGetGradeLevelsBySchoolQuery(schoolId, { skip: !schoolId });
  const { data: classesData } = useGetClassesBySchoolQuery(schoolId, { skip: !schoolId });
  const grades = useMemo(() => extractGrades(gradesData), [gradesData]);
  const classes = useMemo(() => extractClasses(classesData), [classesData]);
  const gradeName = (id?: string | null) => grades.find((g) => g.id === id)?.name ?? '—';
  const classLabel = (c: ClassEntity) => `${gradeName(c.gradeLevelId)} ${c.stream ?? ''}`.trim();
  const className = (id?: string | null) => {
    const c = classes.find((x) => x.id === id);
    return c ? classLabel(c) : '—';
  };
  const classOptions = useMemo(
    () => classes.map((c): [string, string] => [c.id, classLabel(c)]).sort((a, b) => a[1].localeCompare(b[1])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classes, grades]
  );
  return { grades, classes, gradeName, className, classOptions };
}

function TermPicker({ ctrl }: { ctrl: ReturnType<typeof useTermSelect> }) {
  return (
    <div className="space-y-1.5">
      <label className={LABEL}>Term</label>
      <select value={ctrl.termId} onChange={(e) => ctrl.setTermId(e.target.value)} className={SELECT_SM}>
        <option value="">-- Choose term --</option>
        {ctrl.terms.map((t) => (
          <option key={t.id} value={t.id}>{t.termName} ({t.academicYear}){t.isCurrentTerm ? ' · current' : ''}</option>
        ))}
      </select>
    </div>
  );
}

function Loading({ text = 'Loading…' }: { text?: string }) {
  return <div className="p-8 text-center text-xs opacity-60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> {text}</div>;
}

function StatTile({ icon: Icon, label, value, tone = 'primary' }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; tone?: 'primary' | 'success' | 'warning' | 'error';
}) {
  const t = {
    primary: 'bg-primary/10 text-primary', success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning', error: 'bg-error/10 text-error',
  }[tone];
  return (
    <div className="p-4 bg-base-100 border border-base-300 rounded-2xl">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${t}`}><Icon className="w-3.5 h-3.5" /></div>
        <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</p>
      </div>
      <p className="text-lg font-black truncate">{value}</p>
    </div>
  );
}

function DataTable({ rows, className, nameOf }: { rows: any[]; className?: string; nameOf?: (r: any) => string }) {
  const cols = useMemo(() => {
    const set: string[] = [];
    rows.slice(0, 25).forEach((r) => Object.keys(r).forEach((k) => {
      const v = r[k];
      if (!set.includes(k) && (v == null || typeof v !== 'object') && !/(^id$|Id$)/.test(k) && !/createdAt|updatedAt|schoolId/.test(k)) set.push(k);
    }));
    return set.slice(0, 9);
  }, [rows]);

  if (rows.length === 0) return <div className={EMPTY}>No data for this report yet.</div>;
  return (
    <div className={`overflow-x-auto ${className ?? ''}`}>
      <table className="w-full text-xs">
        <thead className="bg-base-100 border-b border-base-300">
          <tr className="text-left">
            {nameOf && <th className={TH}>Student</th>}
            {cols.map((c) => <th key={c} className={TH}>{prettyKey(c)}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-base-300">
          {rows.map((r, i) => (
            <tr key={r.id ?? r.key ?? i}>
              {nameOf && <td className="px-3 py-2 font-bold">{nameOf(r)}</td>}
              {cols.map((c) => <td key={c} className="px-3 py-2 font-mono">{fmtCell(c, r[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Shared success/error runner. */
function useRunner(setOk: (v: string) => void, setErr: (v: string) => void) {
  return async (fn: () => Promise<any>, ok: string | ((res: any) => string), fail: string) => {
    setOk(''); setErr('');
    try {
      const res = await fn();
      setOk(typeof ok === 'function' ? ok(res) : ok);
      return res;
    } catch (err: any) {
      setErr(errMsg(err, fail));
      return null;
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function FinanceManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const [activeTab, setActiveTab] = useState<Tab>('items');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const sectionProps: SectionProps = {
    schoolId: currentSchoolId, schoolName, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
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
            <div className="inline-flex items-center gap-2 px-3 py-1 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-xs" style={{ backgroundColor: secondaryColor }}>
              <Wallet className="w-3.5 h-3.5" /> Finance
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">Finance Manager</h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Set fee items and structures, generate invoices, record payments and track collections for {schoolName}.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-base-100/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-base-300 shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl" style={{ borderLeft: `4px solid ${secondaryColor}` }}>
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Institution</p>
              <p className="text-lg font-black text-primary truncate max-w-[200px]">{schoolName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-3 border-b border-base-300 pb-4">
        {[
          { id: 'items' as Tab, label: 'Fee Items', icon: Layers },
          { id: 'structures' as Tab, label: 'Fee Structures', icon: Wallet },
          { id: 'invoices' as Tab, label: 'Invoices', icon: Receipt },
          { id: 'payments' as Tab, label: 'Payments', icon: CreditCard },
          { id: 'student' as Tab, label: 'Student Finance', icon: User },
          { id: 'reports' as Tab, label: 'Reports', icon: BarChart3 },
        ].map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSuccessMessage(''); setErrorMessage(''); }}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                active ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'bg-base-200/50 hover:bg-base-200 opacity-75'
              }`}
              style={active ? { borderBottom: `4px solid ${secondaryColor}` } : {}}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          );
        })}
      </div>

      {/* ALERTS */}
      {successMessage && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-2xl flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold flex-1">{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* CONTENT */}
      {activeTab === 'items' && <FeeItemsTab {...sectionProps} />}
      {activeTab === 'structures' && <StructuresTab {...sectionProps} />}
      {activeTab === 'invoices' && <InvoicesTab {...sectionProps} />}
      {activeTab === 'payments' && <PaymentsTab {...sectionProps} />}
      {activeTab === 'student' && <StudentFinanceTab {...sectionProps} />}
      {activeTab === 'reports' && <ReportsTab {...sectionProps} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FEE ITEMS TAB
   ════════════════════════════════════════════════════════════════ */
function FeeItemsTab({ schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage }: SectionProps) {
  const run = useRunner(setSuccessMessage, setErrorMessage);
  const [filter, setFilter] = useState<'all' | 'mandatory' | 'optional'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', isOptional: false });

  const { data, isLoading } = useGetFeeItemsBySchoolQuery(schoolId, { skip: !schoolId });
  const items = useMemo(() => extractFeeItems(data), [data]);
  const shown = items.filter((i) => filter === 'all' || (filter === 'optional' ? i.isOptional : !i.isOptional));

  const [createItem, { isLoading: creating }] = useCreateFeeItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateFeeItemMutation();
  const [deleteItem] = useDeleteFeeItemMutation();

  const reset = () => { setForm({ name: '', description: '', isOptional: false }); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setErrorMessage('Fee item name is required.');
    const body = { name: form.name.trim(), description: form.description.trim() || null, isOptional: form.isOptional };
    const res = await run(
      () => (editingId ? updateItem({ feeItemId: editingId, patch: body }).unwrap() : createItem({ schoolId, ...body }).unwrap()),
      `"${body.name}" ${editingId ? 'updated' : 'created'}.`,
      'Could not save the fee item.'
    );
    if (res) reset();
  };

  const handleEdit = (i: FeeItem) => {
    setForm({ name: i.name, description: i.description ?? '', isOptional: !!i.isOptional });
    setEditingId(i.id);
  };

  const handleDelete = (i: FeeItem) => {
    if (!window.confirm(`Delete "${i.name}"? Items already used in a fee structure cannot be deleted.`)) return;
    run(() => deleteItem(i.id).unwrap(), `"${i.name}" deleted.`, 'Delete failed.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className={`lg:col-span-5 ${CARD} space-y-6`}>
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><PlusCircle className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">{editingId ? 'Edit Fee Item' : 'Create Fee Item'}</h2>
          </div>
          {editingId && <button onClick={reset} className="text-xs text-error font-bold hover:underline cursor-pointer">Cancel</button>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className={LABEL}>Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tuition" className={INPUT} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" className={INPUT} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isOptional} onChange={(e) => setForm({ ...form, isOptional: e.target.checked })} className="checkbox checkbox-primary checkbox-sm" />
            <span className="text-xs font-bold">Optional item (e.g. Lunch, Transport)</span>
          </label>
          <button
            type="submit" disabled={creating || updating}
            className="w-full text-white font-black py-3.5 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
          >
            {creating || updating ? 'Saving…' : editingId ? 'Update Item' : 'Create Item'}
          </button>
        </form>
      </div>

      <div className={`lg:col-span-7 ${CARD} space-y-5`}>
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}><Layers className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Fee Items</h2>
            <span className="text-xs font-mono font-bold opacity-60">{shown.length}</span>
          </div>
          <div className="flex gap-1.5">
            {(['all', 'mandatory', 'optional'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`${MINI_BTN} ${filter === f ? 'bg-primary text-primary-content' : 'bg-base-200 hover:bg-base-300'}`}>{f}</button>
            ))}
          </div>
        </div>

        {isLoading ? <Loading /> : shown.length === 0 ? (
          <div className={EMPTY}>No fee items yet.</div>
        ) : (
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {shown.map((i) => (
              <div key={i.id} className="p-4 bg-base-100 border border-base-300 rounded-2xl flex items-center gap-3 hover:border-primary transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-primary truncate">{i.name}</p>
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${i.isOptional ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                      {i.isOptional ? 'Optional' : 'Mandatory'}
                    </span>
                  </div>
                  {i.description && <p className="text-[11px] opacity-60 truncate">{i.description}</p>}
                </div>
                <button onClick={() => handleEdit(i)} className={`${MINI_BTN} bg-base-200 hover:bg-primary/20 hover:text-primary`}><Edit3 className="w-3 h-3 inline mr-1" /> Edit</button>
                <button onClick={() => handleDelete(i)} className={`${MINI_BTN} bg-error/10 text-error hover:bg-error hover:text-error-content`}><Trash2 className="w-3 h-3 inline mr-1" /> Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FEE STRUCTURES TAB
   ════════════════════════════════════════════════════════════════ */
type Scope = 'school' | 'grade' | 'class';

function StructuresTab({ schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage }: SectionProps) {
  const run = useRunner(setSuccessMessage, setErrorMessage);
  const termCtrl = useTermSelect(schoolId);
  const { termId } = termCtrl;
  const acad = useAcademic(schoolId);

  const [boarding, setBoarding] = useState<BoardingStatus>('Day');
  const [scope, setScope] = useState<Scope>('school');
  const [gradeId, setGradeId] = useState('');
  const [classId, setClassId] = useState('');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [copyFrom, setCopyFrom] = useState('');

  const { data: itemsData } = useGetFeeItemsBySchoolQuery(schoolId, { skip: !schoolId });
  const items = useMemo(() => extractFeeItems(itemsData), [itemsData]);

  const { data: structData, isLoading } = useGetFeeStructuresByTermQuery({ schoolId, termId }, { skip: !schoolId || !termId });
  const structures = useMemo(() => extractStructures(structData), [structData]);

  const [bulkUpsert, { isLoading: saving }] = useBulkUpsertFeeStructuresMutation();
  const [deleteStructure] = useDeleteFeeStructureMutation();
  const [copyStructures, { isLoading: copying }] = useCopyFeeStructuresMutation();
  const [validate, { isFetching: validating }] = useLazyValidateFeeStructuresQuery();

  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? '—';
  const scopeReady = scope === 'school' || (scope === 'grade' && gradeId) || (scope === 'class' && classId);

  // Rows that match the scope currently being edited.
  const scoped = useMemo(() => structures.filter((s) =>
    s.boardingStatus === boarding &&
    (s.gradeLevelId ?? null) === (scope === 'grade' ? gradeId || null : null) &&
    (s.classId ?? null) === (scope === 'class' ? classId || null : null)
  ), [structures, boarding, scope, gradeId, classId]);

  useEffect(() => {
    const next: Record<string, string> = {};
    scoped.forEach((s) => { next[s.feeItemId] = String(Number(s.amount)); });
    setDraft(next);
  }, [scoped]);

  const handleSave = async () => {
    if (!termId) return setErrorMessage('Pick a term first.');
    if (!scopeReady) return setErrorMessage('Choose the grade or class these fees apply to.');

    const entries = Object.entries(draft).filter(([, v]) => v.trim() !== '');
    if (entries.some(([, v]) => isNaN(Number(v)) || Number(v) < 0)) return setErrorMessage('Amounts must be zero or more.');
    if (entries.length === 0 && scoped.length === 0) return setErrorMessage('Enter at least one amount.');

    const removed = scoped.filter((s) => !(draft[s.feeItemId] ?? '').trim());

    await run(async () => {
      if (entries.length > 0) {
        await bulkUpsert({
          schoolId, termId, boardingStatus: boarding,
          gradeLevelId: scope === 'grade' ? gradeId : null,
          classId: scope === 'class' ? classId : null,
          items: entries.map(([feeItemId, v]) => ({ feeItemId, amount: Number(v).toFixed(2) })),
        }).unwrap();
      }
      await Promise.all(removed.map((s) => deleteStructure(s.id).unwrap()));
    }, `Saved ${entries.length} fee${entries.length === 1 ? '' : 's'}${removed.length ? `, removed ${removed.length}` : ''}.`, 'Could not save fees.');
  };

  const handleCopy = () => {
    if (!copyFrom || !termId) return setErrorMessage('Pick the term to copy from, and a target term.');
    if (copyFrom === termId) return setErrorMessage('Source and target term must differ.');
    if (!window.confirm('Copy every fee structure from the chosen term into this term?')) return;
    run(() => copyStructures({ schoolId, fromTermId: copyFrom, toTermId: termId }).unwrap(), (r) => r?.message || 'Fee structures copied.', 'Copy failed.');
  };

  const handleValidate = async () => {
    setSuccessMessage(''); setErrorMessage('');
    try {
      const res: any = await validate({ schoolId, termId }).unwrap();
      const issues: string[] = res?.issues ?? [];
      issues.length ? setErrorMessage(`Fee structure issues: ${issues.join(' · ')}`) : setSuccessMessage(res?.message || 'Fee structure is complete.');
    } catch (err: any) { setErrorMessage(errMsg(err, 'Validation failed.')); }
  };

  const scopeLabel = (s: FeeStructure) =>
    s.classId ? acad.className(s.classId) : s.gradeLevelId ? acad.gradeName(s.gradeLevelId) : 'School-wide';

  const total = Object.values(draft).reduce((n, v) => n + (Number(v) || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT: editor */}
      <div className="lg:col-span-5 space-y-4">
        <div className={`${WIDGET} space-y-3`}>
          <TermPicker ctrl={termCtrl} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={LABEL}>Boarding</label>
              <select value={boarding} onChange={(e) => setBoarding(e.target.value as BoardingStatus)} className={SELECT_SM}>
                {BOARDING.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>Applies to</label>
              <select value={scope} onChange={(e) => { setScope(e.target.value as Scope); setGradeId(''); setClassId(''); }} className={SELECT_SM}>
                <option value="school">Whole school</option>
                <option value="grade">A grade</option>
                <option value="class">A class</option>
              </select>
            </div>
          </div>
          {scope === 'grade' && (
            <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className={SELECT_SM}>
              <option value="">-- Grade --</option>
              {acad.grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          {scope === 'class' && (
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={SELECT_SM}>
              <option value="">-- Class --</option>
              {acad.classOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          )}
          <p className="text-[11px] opacity-60">More specific fees override broader ones: class → grade → whole school.</p>
        </div>

        <div className={`${CARD} space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Wand2 className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Set Amounts</h2>
                <p className="text-[11px] opacity-60">Leave blank to exclude an item</p>
              </div>
            </div>
            <span className="text-xs font-mono font-black text-primary">{money(total)}</span>
          </div>

          {items.length === 0 ? <div className={EMPTY}>Create fee items first.</div> : !termId || !scopeReady ? (
            <div className={EMPTY}>Pick a term{scope !== 'school' ? ` and a ${scope}` : ''} to edit amounts.</div>
          ) : (
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 p-2.5 bg-base-100 border border-base-300 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{i.name}</p>
                    <p className="text-[10px] opacity-60">{i.isOptional ? 'Optional' : 'Mandatory'}</p>
                  </div>
                  <input
                    type="number" min="0" step="0.01" placeholder="—" value={draft[i.id] ?? ''}
                    onChange={(e) => setDraft({ ...draft, [i.id]: e.target.value })}
                    className="w-32 px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-right font-mono text-xs"
                  />
                </div>
              ))}
              <button
                onClick={handleSave} disabled={saving}
                className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60 mt-2"
                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
              >
                <Save className="w-3.5 h-3.5 inline mr-1" /> {saving ? 'Saving…' : 'Save Fees'}
              </button>
            </div>
          )}
        </div>

        <div className={`${WIDGET} space-y-3`}>
          <p className={LABEL}>Copy from another term</p>
          <div className="flex gap-2">
            <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)} className={SELECT_SM}>
              <option value="">-- Source term --</option>
              {termCtrl.terms.filter((t) => t.id !== termId).map((t) => <option key={t.id} value={t.id}>{t.termName} ({t.academicYear})</option>)}
            </select>
            <button onClick={handleCopy} disabled={copying} className={`${MINI_BTN} bg-base-200 hover:bg-primary/20 hover:text-primary shrink-0`}>
              <Copy className="w-3 h-3 inline mr-1" /> Copy
            </button>
          </div>
          <button onClick={handleValidate} disabled={!termId || validating} className={`${MINI_BTN} bg-success/10 text-success hover:bg-success/20`}>
            <ShieldCheck className="w-3 h-3 inline mr-1" /> {validating ? 'Checking…' : 'Validate this term'}
          </button>
        </div>
      </div>

      {/* RIGHT: current structures */}
      <div className={`lg:col-span-7 ${CARD} space-y-5`}>
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}><Wallet className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">All Fees in Term</h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{structures.length}</span>
        </div>
        {!termId ? <div className={EMPTY}>Pick a term.</div> : isLoading ? <Loading /> : structures.length === 0 ? (
          <div className={EMPTY}>No fees set for this term yet.</div>
        ) : (
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-base-100 border-b border-base-300 sticky top-0">
                <tr className="text-left">
                  <th className={TH}>Item</th><th className={TH}>Boarding</th><th className={TH}>Applies to</th><th className={`${TH} text-right`}>Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {[...structures]
                  .sort((a, b) => a.boardingStatus.localeCompare(b.boardingStatus) || scopeLabel(a).localeCompare(scopeLabel(b)))
                  .map((s) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2 font-bold">{s.feeItem?.name ?? itemName(s.feeItemId)}</td>
                      <td className="px-3 py-2">{s.boardingStatus}</td>
                      <td className="px-3 py-2">{scopeLabel(s)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{money(s.amount)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INVOICES TAB
   ════════════════════════════════════════════════════════════════ */
type GenScope = 'student' | 'class' | 'grade' | 'school';
const INVOICE_STATUSES = ['Unpaid', 'Partial', 'Paid', 'Overdue', 'Waived'];

function InvoicesTab({ schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage }: SectionProps) {
  const run = useRunner(setSuccessMessage, setErrorMessage);
  const termCtrl = useTermSelect(schoolId);
  const { termId } = termCtrl;
  const acad = useAcademic(schoolId);

  const [genScope, setGenScope] = useState<GenScope>('class');
  const [gradeId, setGradeId] = useState('');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: studentsData } = useGetStudentsByClassQuery(classId, { skip: !classId });
  const students = useMemo(() => extractStudents(studentsData), [studentsData]);

  const { data: invData, isLoading } = useGetInvoicesByTermQuery({ schoolId, termId }, { skip: !schoolId || !termId });
  const invoices = useMemo(() => extractInvoices(invData), [invData]);

  const [genStudent, { isLoading: g1 }] = useGenerateStudentInvoiceMutation();
  const [genClass, { isLoading: g2 }] = useGenerateClassInvoicesMutation();
  const [genGrade, { isLoading: g3 }] = useGenerateGradeInvoicesMutation();
  const [genSchool, { isLoading: g4 }] = useGenerateSchoolInvoicesMutation();
  const [applyDiscount] = useApplyInvoiceDiscountMutation();
  const [waive] = useWaiveInvoiceMutation();
  const [markOverdue] = useMarkOverdueInvoicesMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const generating = g1 || g2 || g3 || g4;

  const filtered = invoices.filter((i) =>
    (statusFilter === 'all' || (i.status ?? '').toLowerCase() === statusFilter.toLowerCase()) &&
    (!search.trim() || `${personName(i)} ${i.invoiceNumber ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()))
  );

  const totals = useMemo(() => invoices.reduce((t, i) => ({
    billed: t.billed + (Number(i.totalAmount) || 0),
    paid: t.paid + (Number(i.amountPaid) || 0),
    balance: t.balance + (Number(i.balance) || 0),
  }), { billed: 0, paid: 0, balance: 0 }), [invoices]);

  const handleGenerate = async () => {
    if (!termId) return setErrorMessage('Pick a term first.');
    const common = { schoolId, termId, dueDate: dueDate || null, notes: notes.trim() || null };
    let fn: (() => Promise<any>) | null = null;
    if (genScope === 'student') { if (!studentId) return setErrorMessage('Pick a student.'); fn = () => genStudent({ ...common, studentId }).unwrap(); }
    if (genScope === 'class') { if (!classId) return setErrorMessage('Pick a class.'); fn = () => genClass({ ...common, classId }).unwrap(); }
    if (genScope === 'grade') { if (!gradeId) return setErrorMessage('Pick a grade.'); fn = () => genGrade({ ...common, gradeLevelId: gradeId }).unwrap(); }
    if (genScope === 'school') {
      if (!window.confirm('Generate invoices for every student in the school?')) return;
      fn = () => genSchool(common).unwrap();
    }
    if (fn) await run(fn, (r) => r?.message || 'Invoices generated.', 'Could not generate invoices.');
  };

  const handleDiscount = (i: Invoice) => {
    const v = window.prompt(`Discount for ${personName(i)} (${CURRENCY}):`, i.discount ?? '0');
    if (v == null) return;
    if (isNaN(Number(v)) || Number(v) < 0) return setErrorMessage('Discount must be a number of zero or more.');
    run(() => applyDiscount({ invoiceId: i.id, discount: Number(v).toFixed(2) }).unwrap(), 'Discount applied.', 'Could not apply discount.');
  };
  const handleWaive = (i: Invoice) => {
    const reason = window.prompt(`Reason for waiving ${personName(i)}'s invoice:`);
    if (reason == null) return;
    if (!reason.trim()) return setErrorMessage('A reason is required to waive an invoice.');
    run(() => waive({ invoiceId: i.id, reason: reason.trim() }).unwrap(), 'Invoice waived.', 'Could not waive invoice.');
  };
  const handleDelete = (i: Invoice) => {
    if (!window.confirm(`Delete this invoice for ${personName(i)}? Invoices with payments cannot be deleted.`)) return;
    run(() => deleteInvoice(i.id).unwrap(), 'Invoice deleted.', 'Delete failed.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT: generate */}
      <div className="lg:col-span-4 space-y-4">
        <div className={`${CARD} space-y-4`}>
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Receipt className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Generate Invoices</h2>
          </div>
          <TermPicker ctrl={termCtrl} />
          <div className="space-y-1.5">
            <label className={LABEL}>For</label>
            <select value={genScope} onChange={(e) => { setGenScope(e.target.value as GenScope); setStudentId(''); }} className={SELECT_SM}>
              <option value="class">A whole class</option>
              <option value="grade">A whole grade</option>
              <option value="student">One student</option>
              <option value="school">Whole school</option>
            </select>
          </div>
          {genScope === 'grade' && (
            <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className={SELECT_SM}>
              <option value="">-- Grade --</option>
              {acad.grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          {(genScope === 'class' || genScope === 'student') && (
            <select value={classId} onChange={(e) => { setClassId(e.target.value); setStudentId(''); }} className={SELECT_SM}>
              <option value="">-- Class --</option>
              {acad.classOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          )}
          {genScope === 'student' && (
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!classId} className={`${SELECT_SM} disabled:opacity-60`}>
              <option value="">-- Student --</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>)}
            </select>
          )}
          <div className="space-y-1.5">
            <label className={LABEL}>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${INPUT} font-mono`} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className={INPUT} />
          </div>
          <button
            onClick={handleGenerate} disabled={generating}
            className="w-full text-white font-black py-3.5 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
          >
            <Send className="w-3.5 h-3.5 inline mr-1" /> {generating ? 'Generating…' : 'Generate'}
          </button>
          <button
            onClick={() => run(() => markOverdue(schoolId).unwrap(), (r) => r?.message || 'Overdue invoices marked.', 'Could not mark overdue.')}
            className={`${MINI_BTN} w-full bg-warning/10 text-warning hover:bg-warning/20`}
          >
            <Clock className="w-3 h-3 inline mr-1" /> Mark overdue invoices
          </button>
        </div>
      </div>

      {/* RIGHT: list */}
      <div className={`lg:col-span-8 ${CARD} space-y-5`}>
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}><FileText className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Invoices</h2>
            <span className="text-xs font-mono font-bold opacity-60">{filtered.length}/{invoices.length}</span>
          </div>
          <div className="flex gap-2">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs w-36" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs">
              <option value="all">All statuses</option>
              {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {invoices.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <StatTile icon={Receipt} label="Billed" value={money(totals.billed)} />
            <StatTile icon={TrendingUp} label="Collected" value={money(totals.paid)} tone="success" />
            <StatTile icon={AlertCircle} label="Outstanding" value={money(totals.balance)} tone="warning" />
          </div>
        )}

        {!termId ? <div className={EMPTY}>Pick a term.</div> : isLoading ? <Loading /> : filtered.length === 0 ? (
          <div className={EMPTY}>No invoices match.</div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-base-100 border-b border-base-300 sticky top-0">
                <tr className="text-left">
                  <th className={TH}>Student</th><th className={`${TH} text-right`}>Total</th><th className={`${TH} text-right`}>Paid</th>
                  <th className={`${TH} text-right`}>Balance</th><th className={TH}>Due</th><th className={TH}>Status</th><th className={TH} />
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {filtered.map((i) => (
                  <tr key={i.id}>
                    <td className="px-3 py-2">
                      <p className="font-bold">{personName(i)}</p>
                      {i.invoiceNumber && <p className="text-[10px] font-mono opacity-60">{i.invoiceNumber}</p>}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{money(i.totalAmount)}</td>
                    <td className="px-3 py-2 text-right font-mono">{money(i.amountPaid)}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{money(i.balance)}</td>
                    <td className="px-3 py-2 font-mono">{fmtDate(i.dueDate)}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${statusTone(i.status)}`}>{i.status}</span></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleDiscount(i)} title="Apply discount" className={`${MINI_BTN} bg-base-200 hover:bg-primary/20 hover:text-primary`}><Percent className="w-3 h-3" /></button>
                        <button onClick={() => handleWaive(i)} title="Waive" className={`${MINI_BTN} bg-base-200 hover:bg-info/20 hover:text-info`}><Ban className="w-3 h-3" /></button>
                        <button onClick={() => handleDelete(i)} title="Delete" className={`${MINI_BTN} bg-error/10 text-error hover:bg-error hover:text-error-content`}><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PAYMENTS TAB
   ════════════════════════════════════════════════════════════════ */
function PaymentsTab({ schoolId, schoolName, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage }: SectionProps) {
  const run = useRunner(setSuccessMessage, setErrorMessage);
  const termCtrl = useTermSelect(schoolId);
  const { termId } = termCtrl;
  const acad = useAcademic(schoolId);

  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [form, setForm] = useState({
    invoiceId: '', amountPaid: '', paymentMethod: 'Cash' as PaymentMethod, referenceCode: '',
    payerName: '', payerPhone: '', mpesaCheckoutRequestId: '', notes: '',
  });

  const { data: studentsData } = useGetStudentsByClassQuery(classId, { skip: !classId });
  const students = useMemo(() => extractStudents(studentsData), [studentsData]);

  const { data: invData } = useGetInvoicesByStudentQuery({ schoolId, studentId }, { skip: !schoolId || !studentId });
  const studentInvoices = useMemo(
    () => extractInvoices(invData).filter((i) => i.termId === termId && Number(i.balance) > 0),
    [invData, termId]
  );

  const { data: balanceData } = useGetStudentBalanceQuery({ studentId, schoolId, termId }, { skip: !studentId || !termId || !schoolId });
  const balance = reportObject(balanceData);
  const balanceValue = balance.balance ?? balance.totalBalance ?? balance.outstanding;

  const { data: txData, isLoading: loadingTx } = useGetTransactionsByTermQuery({ schoolId, termId }, { skip: !schoolId || !termId });
  const transactions = useMemo(() => extractTransactions(txData), [txData]);

  const [recordPayment, { isLoading: recording }] = useRecordPaymentMutation();
  const [reversePayment] = useReversePaymentMutation();

  const receiptFor = (t: Transaction) => {
    const st: any = students.find((x) => x.id === t.studentId) ?? t.student ?? {};
    const ok = printReceipt({
      schoolName,
      tx: t,
      studentName: personName(t, students),
      admissionNumber: st.admissionNumber ?? (t as any).admissionNumber,
      className: classId ? acad.className(classId) : undefined,
      termLabel: termCtrl.term ? `${termCtrl.term.termName} (${termCtrl.term.academicYear})` : undefined,
    });
    if (!ok) setErrorMessage('Your browser blocked the receipt window. Allow pop-ups for this site and try again.');
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termId) return setErrorMessage('Pick a term first.');
    if (!studentId) return setErrorMessage('Pick a student.');
    if (!(Number(form.amountPaid) > 0)) return setErrorMessage('Amount must be greater than zero.');
    if (!form.referenceCode.trim()) return setErrorMessage('A reference code is required.');

    const res = await run(() => recordPayment({
      schoolId, studentId, termId,
      invoiceId: form.invoiceId || null,
      amountPaid: Number(form.amountPaid).toFixed(2),
      paymentMethod: form.paymentMethod,
      referenceCode: form.referenceCode.trim(),
      payerName: form.payerName.trim() || null,
      payerPhone: form.payerPhone.trim() || null,
      mpesaCheckoutRequestId: form.paymentMethod === 'M-Pesa' ? form.mpesaCheckoutRequestId.trim() || null : null,
      notes: form.notes.trim() || null,
    }).unwrap(), (r) => r?.message || 'Payment recorded.', 'Could not record payment.');

    if (res) {
      setForm({ ...form, invoiceId: '', amountPaid: '', referenceCode: '', mpesaCheckoutRequestId: '', notes: '' });
      const tx: Transaction | undefined = res.transaction ?? res.payment;
      if (tx && window.confirm('Payment recorded. Print a receipt now?')) receiptFor({ ...tx, studentId: tx.studentId ?? studentId });
    }
  };

  const handleReverse = (t: Transaction) => {
    const reason = window.prompt(`Reason for reversing ${money(t.amountPaid)} (${t.referenceCode}):`);
    if (reason == null) return;
    if (!reason.trim()) return setErrorMessage('A reason is required.');
    run(() => reversePayment({ transactionId: t.id, reason: reason.trim() }).unwrap(), 'Payment reversed.', 'Could not reverse payment.');
  };

  const f = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className={`lg:col-span-5 ${CARD} space-y-4`}>
        <div className="flex items-center gap-3 pb-3 border-b border-base-300">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><CreditCard className="w-5 h-5" /></div>
          <h2 className="text-lg font-black tracking-tight">Record Payment</h2>
        </div>
        <TermPicker ctrl={termCtrl} />

        <div className="grid grid-cols-2 gap-3">
          <select value={classId} onChange={(e) => { setClassId(e.target.value); setStudentId(''); }} className={SELECT_SM}>
            <option value="">-- Class --</option>
            {acad.classOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <select value={studentId} onChange={(e) => { setStudentId(e.target.value); f('invoiceId', ''); }} disabled={!classId} className={`${SELECT_SM} disabled:opacity-60`}>
            <option value="">-- Student --</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
          </select>
        </div>

        {studentId && termId && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary flex items-center justify-between">
            <span>Outstanding balance this term</span>
            <span className="font-mono">{money(balanceValue)}</span>
          </div>
        )}

        <form onSubmit={handleRecord} className="space-y-3">
          <div className="space-y-1.5">
            <label className={LABEL}>Apply to invoice</label>
            <select value={form.invoiceId} onChange={(e) => f('invoiceId', e.target.value)} disabled={!studentId} className={`${SELECT_SM} disabled:opacity-60`}>
              <option value="">Auto (oldest open invoice first)</option>
              {studentInvoices.map((i) => <option key={i.id} value={i.id}>{i.invoiceNumber ?? i.id.slice(0, 8)} · balance {money(i.balance)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={LABEL}>Amount ({CURRENCY})</label>
              <input type="number" min="0.01" step="0.01" required value={form.amountPaid} onChange={(e) => f('amountPaid', e.target.value)} className={`${INPUT} font-mono`} />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>Method</label>
              <select value={form.paymentMethod} onChange={(e) => f('paymentMethod', e.target.value)} className={`${INPUT} cursor-pointer`}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>{form.paymentMethod === 'M-Pesa' ? 'M-Pesa code' : 'Reference code'}</label>
            <input type="text" required value={form.referenceCode} onChange={(e) => f('referenceCode', e.target.value)} placeholder={form.paymentMethod === 'M-Pesa' ? 'e.g. QKJ4X7Y2Z1' : 'e.g. CASH-2026-0001'} className={`${INPUT} font-mono`} />
          </div>
          {form.paymentMethod === 'M-Pesa' && (
            <div className="space-y-1.5">
              <label className={LABEL}>Checkout request ID (optional)</label>
              <input type="text" value={form.mpesaCheckoutRequestId} onChange={(e) => f('mpesaCheckoutRequestId', e.target.value)} className={`${INPUT} font-mono`} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.payerName} onChange={(e) => f('payerName', e.target.value)} placeholder="Payer name" className={INPUT} />
            <input type="tel" value={form.payerPhone} onChange={(e) => f('payerPhone', e.target.value)} placeholder="Payer phone" className={INPUT} />
          </div>
          <input type="text" value={form.notes} onChange={(e) => f('notes', e.target.value)} placeholder="Notes (optional)" className={INPUT} />
          <button
            type="submit" disabled={recording}
            className="w-full text-white font-black py-3.5 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
          >
            {recording ? 'Recording…' : 'Record Payment'}
          </button>
        </form>
      </div>

      <div className={`lg:col-span-7 ${CARD} space-y-5`}>
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}><Receipt className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Transactions</h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{transactions.length}</span>
        </div>
        {!termId ? <div className={EMPTY}>Pick a term.</div> : loadingTx ? <Loading /> : transactions.length === 0 ? (
          <div className={EMPTY}>No payments recorded this term.</div>
        ) : (
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-base-100 border-b border-base-300 sticky top-0">
                <tr className="text-left">
                  <th className={TH}>Student</th><th className={`${TH} text-right`}>Amount</th><th className={TH}>Method</th>
                  <th className={TH}>Reference</th><th className={TH}>Status</th><th className={TH} />
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {transactions.map((t) => {
                  const done = (t.status ?? 'Completed').toLowerCase() === 'completed';
                  return (
                    <tr key={t.id}>
                      <td className="px-3 py-2">
                        <p className="font-bold">{personName(t)}</p>
                        <p className="text-[10px] font-mono opacity-60">{fmtDate(t.createdAt)}</p>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{money(t.amountPaid)}</td>
                      <td className="px-3 py-2">{t.paymentMethod}</td>
                      <td className="px-3 py-2 font-mono">{t.referenceCode}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${statusTone(t.status ?? 'Completed')}`}>{t.status ?? 'Completed'}</span></td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <button onClick={() => receiptFor(t)} disabled={!done} className={`${MINI_BTN} bg-primary/10 text-primary hover:bg-primary/20 mr-1`}>
                          <Printer className="w-3 h-3 inline mr-1" /> Receipt
                        </button>
                        <button onClick={() => handleReverse(t)} disabled={!done} className={`${MINI_BTN} bg-error/10 text-error hover:bg-error hover:text-error-content`}>
                          <Undo2 className="w-3 h-3 inline mr-1" /> Reverse
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STUDENT FINANCE TAB — one student's invoices, payments, statement
   ════════════════════════════════════════════════════════════════ */
function StudentFinanceTab({ schoolId, schoolName, secondaryColor, setSuccessMessage, setErrorMessage }: SectionProps) {
  const termCtrl = useTermSelect(schoolId);
  const { termId, term } = termCtrl;
  const acad = useAcademic(schoolId);

  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [allTerms, setAllTerms] = useState(false);
  const [showStatement, setShowStatement] = useState(false);

  const { data: studentsData } = useGetStudentsByClassQuery(classId, { skip: !classId });
  const students = useMemo(() => extractStudents(studentsData), [studentsData]);
  const student: any = students.find((s) => s.id === studentId) ?? null;

  const { data: invData, isLoading: loadingInv } = useGetInvoicesByStudentQuery({ schoolId, studentId }, { skip: !schoolId || !studentId });
  const { data: txData, isLoading: loadingTx } = useGetTransactionsByStudentQuery({ schoolId, studentId }, { skip: !schoolId || !studentId });
  const { data: balanceData } = useGetStudentBalanceQuery({ studentId, schoolId, termId }, { skip: !studentId || !termId || !schoolId || allTerms });
  const { data: statementData, isFetching: loadingStatement } = useGetStudentStatementQuery({ studentId, schoolId }, { skip: !studentId || !schoolId || !showStatement });

  const termLabelOf = (id?: string | null) => {
    const t = termCtrl.terms.find((x) => x.id === id);
    return t ? `${t.termName} (${t.academicYear})` : '—';
  };

  const invoices = useMemo(() => extractInvoices(invData).filter((i) => allTerms || i.termId === termId), [invData, allTerms, termId]);
  const transactions = useMemo(() => extractTransactions(txData).filter((t) => allTerms || t.termId === termId), [txData, allTerms, termId]);

  const totals = useMemo(() => invoices.reduce((t, i) => ({
    billed: t.billed + (Number(i.totalAmount) || 0),
    discount: t.discount + (Number(i.discount) || 0),
    paid: t.paid + (Number(i.amountPaid) || 0),
    balance: t.balance + (Number(i.balance) || 0),
  }), { billed: 0, discount: 0, paid: 0, balance: 0 }), [invoices]);

  const balanceObj = reportObject(balanceData);
  const apiBalance = balanceObj.balance ?? balanceObj.totalBalance ?? balanceObj.outstanding;
  const shownBalance = !allTerms && apiBalance != null ? apiBalance : totals.balance;

  const statementRows = useMemo(() => reportRows(statementData), [statementData]);
  const cleared = invoices.length > 0 && Number(shownBalance) <= 0;

  const printFor = (t: Transaction) => {
    const inv = invoices.find((i) => i.id === t.invoiceId);
    const ok = printReceipt({
      schoolName,
      tx: t,
      studentName: student ? `${student.firstName} ${student.lastName}`.trim() : personName(t),
      admissionNumber: student?.admissionNumber,
      className: classId ? acad.className(classId) : undefined,
      termLabel: termLabelOf(t.termId) !== '—' ? termLabelOf(t.termId) : undefined,
      invoiceNumber: inv?.invoiceNumber,
      invoiceBalance: inv?.balance,
    });
    if (!ok) setErrorMessage('Your browser blocked the receipt window. Allow pop-ups for this site and try again.');
    else setSuccessMessage('');
  };

  return (
    <div className="space-y-6">
      <div className={WIDGET}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <TermPicker ctrl={termCtrl} />
          <div className="space-y-1.5">
            <label className={LABEL}>Class</label>
            <select value={classId} onChange={(e) => { setClassId(e.target.value); setStudentId(''); }} className={SELECT_SM}>
              <option value="">-- Class --</option>
              {acad.classOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Student</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!classId} className={`${SELECT_SM} disabled:opacity-60`}>
              <option value="">-- Student --</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pb-2">
            <input type="checkbox" checked={allTerms} onChange={(e) => setAllTerms(e.target.checked)} className="checkbox checkbox-primary checkbox-sm" />
            <span className="text-xs font-bold">All terms</span>
          </label>
        </div>
      </div>

      {!studentId ? (
        <div className={`${EMPTY} bg-base-200/20`}>Choose a class and a student to see their finances.</div>
      ) : (
        <>
          {/* Student header */}
          <div className={`${WIDGET} flex items-center justify-between flex-wrap gap-4`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl" style={{ borderLeft: `4px solid ${secondaryColor}` }}><User className="w-6 h-6" /></div>
              <div>
                <p className="text-lg font-black text-primary">{student ? `${student.firstName} ${student.lastName}` : 'Student'}</p>
                <p className="text-[11px] font-mono opacity-60">
                  {student?.admissionNumber ? `ADM ${student.admissionNumber} · ` : ''}{acad.className(classId)} · {allTerms ? 'All terms' : term ? `${term.termName} (${term.academicYear})` : '—'}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 text-[11px] font-black uppercase rounded-full ${cleared ? 'bg-success/10 text-success' : invoices.length === 0 ? 'bg-base-200' : 'bg-warning/10 text-warning'}`}>
              {invoices.length === 0 ? 'No invoice' : cleared ? 'Fully paid' : 'Balance due'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile icon={Receipt} label="Billed" value={money(totals.billed)} />
            <StatTile icon={Percent} label="Discounts" value={money(totals.discount)} tone="warning" />
            <StatTile icon={TrendingUp} label="Paid" value={money(totals.paid)} tone="success" />
            <StatTile icon={AlertCircle} label="Balance" value={money(shownBalance)} tone={Number(shownBalance) > 0 ? 'error' : 'success'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoices */}
            <div className={`${CARD} space-y-4`}>
              <div className="flex items-center gap-3 pb-3 border-b border-base-300">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><FileText className="w-5 h-5" /></div>
                <h2 className="text-lg font-black tracking-tight">Invoices</h2>
                <span className="text-xs font-mono font-bold opacity-60">{invoices.length}</span>
              </div>
              {loadingInv ? <Loading /> : invoices.length === 0 ? <div className={EMPTY}>No invoices for this selection.</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-base-100 border-b border-base-300">
                      <tr className="text-left">
                        <th className={TH}>Invoice</th><th className={`${TH} text-right`}>Total</th>
                        <th className={`${TH} text-right`}>Paid</th><th className={`${TH} text-right`}>Balance</th><th className={TH}>Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-300">
                      {invoices.map((i) => (
                        <tr key={i.id}>
                          <td className="px-3 py-2">
                            <p className="font-bold">{i.invoiceNumber ?? i.id.slice(0, 8)}</p>
                            <p className="text-[10px] opacity-60">{termLabelOf(i.termId)} · due {fmtDate(i.dueDate)}</p>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{money(i.totalAmount)}</td>
                          <td className="px-3 py-2 text-right font-mono">{money(i.amountPaid)}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold">{money(i.balance)}</td>
                          <td className="px-3 py-2"><span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${statusTone(i.status)}`}>{i.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payments + receipts */}
            <div className={`${CARD} space-y-4`}>
              <div className="flex items-center gap-3 pb-3 border-b border-base-300">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}><CreditCard className="w-5 h-5" /></div>
                <h2 className="text-lg font-black tracking-tight">Payments</h2>
                <span className="text-xs font-mono font-bold opacity-60">{transactions.length}</span>
              </div>
              {loadingTx ? <Loading /> : transactions.length === 0 ? <div className={EMPTY}>No payments recorded.</div> : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {transactions.map((t) => {
                    const done = (t.status ?? 'Completed').toLowerCase() === 'completed';
                    return (
                      <div key={t.id} className="p-3 bg-base-100 border border-base-300 rounded-xl flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black font-mono">{money(t.amountPaid)}</p>
                          <p className="text-[10px] opacity-60 truncate">
                            {t.paymentMethod} · {t.referenceCode} · {fmtDate(t.paymentDate || t.createdAt)}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${statusTone(t.status ?? 'Completed')}`}>{t.status ?? 'Completed'}</span>
                        <button onClick={() => printFor(t)} disabled={!done} className={`${MINI_BTN} bg-primary/10 text-primary hover:bg-primary/20`}>
                          <Printer className="w-3 h-3 inline mr-1" /> Receipt
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Statement */}
          <div className={`${CARD} space-y-4`}>
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-base-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><BarChart3 className="w-5 h-5" /></div>
                <h2 className="text-lg font-black tracking-tight">Statement (all terms)</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowStatement((v) => !v)} className={`${MINI_BTN} bg-base-200 hover:bg-base-300`}>
                  {showStatement ? 'Hide' : 'Load statement'}
                </button>
                {showStatement && statementRows.length > 0 && (
                  <button onClick={() => window.print()} className={`${MINI_BTN} bg-base-100 border border-base-300 hover:bg-base-200`}>
                    <Printer className="w-3 h-3 inline mr-1" /> Print
                  </button>
                )}
              </div>
            </div>
            {showStatement && (loadingStatement ? <Loading /> : <DataTable rows={statementRows} />)}
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   REPORTS TAB
   ════════════════════════════════════════════════════════════════ */
type ReportKey = 'method' | 'boarding' | 'grade' | 'aging' | 'expected' | 'defaulters' | 'cleared';

const REPORTS: Array<{ id: ReportKey; label: string }> = [
  { id: 'defaulters', label: 'Defaulters' },
  { id: 'method', label: 'By method' },
  { id: 'boarding', label: 'By boarding' },
  { id: 'grade', label: 'By grade' },
  { id: 'aging', label: 'Aging' },
  { id: 'expected', label: 'Expected vs collected' },
  { id: 'cleared', label: 'Cleared' },
];

function ReportsTab({ schoolId, secondaryColor, setSuccessMessage, setErrorMessage }: SectionProps) {
  const run = useRunner(setSuccessMessage, setErrorMessage);
  const termCtrl = useTermSelect(schoolId);
  const { termId } = termCtrl;
  const acad = useAcademic(schoolId);

  const [report, setReport] = useState<ReportKey>('defaulters');
  const [minBalance, setMinBalance] = useState('');

  const args = { schoolId, termId };
  const skip = !schoolId || !termId;

  const { data: summary, isLoading: loadingSummary } = useGetTermSummaryQuery(args, { skip });
  const byMethod = useGetCollectionsByMethodQuery(args, { skip: skip || report !== 'method' });
  const byBoarding = useGetCollectionsByBoardingQuery(args, { skip: skip || report !== 'boarding' });
  const byGrade = useGetCollectionsByGradeQuery(args, { skip: skip || report !== 'grade' });
  const aging = useGetAgingReportQuery(args, { skip: skip || report !== 'aging' });
  const expected = useGetExpectedVsCollectedQuery(args, { skip: skip || report !== 'expected' });
  const defaulters = useGetDefaultersQuery({ ...args, minBalance: Number(minBalance) || undefined }, { skip: skip || report !== 'defaulters' });
  const cleared = useGetClearedStudentsQuery(args, { skip: skip || report !== 'cleared' });
  const [recompute, { isLoading: recomputing }] = useRecomputeInvoicesMutation();

  const active = { method: byMethod, boarding: byBoarding, grade: byGrade, aging, expected, defaulters, cleared }[report];
  const rows = useMemo(() => reportRows(active.data), [active.data]);

  const summaryObj = useMemo(() => reportObject(summary), [summary]);
  const tiles = Object.entries(summaryObj).filter(([, v]) => v != null && typeof v !== 'object').slice(0, 8);
  const withNames = report === 'defaulters' || report === 'cleared';
  const nameOf = (r: any) => personName(r);

  // Show a readable grade name when the report is keyed by id.
  const decorated = useMemo(() => rows.map((r) => {
    if (report === 'grade' && r.key && !r.gradeName) return { ...r, grade: acad.gradeName(r.key) !== '—' ? acad.gradeName(r.key) : r.key };
    return r;
  }), [rows, report, acad]);

  return (
    <div className="space-y-6">
      <div className={WIDGET}>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="w-full md:w-72"><TermPicker ctrl={termCtrl} /></div>
          <button
            onClick={() => run(() => recompute({ schoolId, termId }).unwrap(), (r) => r?.message || 'Invoice statuses recomputed.', 'Recompute failed.')}
            disabled={!termId || recomputing} className={`${MINI_BTN} bg-base-100 border border-base-300 hover:bg-base-200`}
          >
            <Wand2 className="w-3 h-3 inline mr-1" /> {recomputing ? 'Recomputing…' : 'Recompute invoice statuses'}
          </button>
        </div>
      </div>

      {!termId ? <div className={`${EMPTY} bg-base-200/20`}>Pick a term to see reports.</div> : (
        <>
          {loadingSummary ? <Loading /> : tiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tiles.map(([k, v], i) => (
                <StatTile
                  key={k} icon={[Receipt, TrendingUp, Users, Percent][i % 4]}
                  label={prettyKey(k)} value={fmtCell(k, v)}
                  tone={(['primary', 'success', 'warning', 'primary'] as const)[i % 4]}
                />
              ))}
            </div>
          )}

          <div className={`${CARD} space-y-5`}>
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-base-300">
              <div className="flex gap-1.5 flex-wrap">
                {REPORTS.map((r) => (
                  <button key={r.id} onClick={() => setReport(r.id)} className={`${MINI_BTN} ${report === r.id ? 'text-white' : 'bg-base-200 hover:bg-base-300'}`} style={report === r.id ? { backgroundColor: secondaryColor } : {}}>
                    {r.label}
                  </button>
                ))}
              </div>
              {report === 'defaulters' && (
                <input type="number" min="0" value={minBalance} onChange={(e) => setMinBalance(e.target.value)} placeholder={`Min balance (${CURRENCY})`} className="px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs w-44 font-mono" />
              )}
            </div>
            {active.isLoading || active.isFetching ? <Loading /> : <DataTable rows={decorated} nameOf={withNames ? nameOf : undefined} />}
          </div>
        </>
      )}
    </div>
  );
}