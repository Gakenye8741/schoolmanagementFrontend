import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  Wallet, Receipt, TrendingUp, PlusCircle, Edit3, CheckCircle2, AlertCircle,
  X, Sparkles, Building, Loader2, Save, Check, Undo2, Banknote,
  CreditCard, Smartphone, Calendar, Filter, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight, Scale, Percent, Trophy, Search,
  ChevronDown, ChevronRight, Wand2, Trash2, ShieldCheck,
} from 'lucide-react';

import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import {
  useCreateExpenseMutation,
  useBulkCreateExpensesMutation,
  useGetExpensesBySchoolQuery,
  useGetExpensesByDateRangeQuery,
  useGetPendingApprovalsQuery,
  useApproveExpenseMutation,
  useRevokeApprovalMutation,
  useUpdateExpenseMutation,
  useGetExpenseSummaryQuery,
  useGetMonthlyTrendQuery,
  useGetCategoryBreakdownQuery,
  useGetTopCategoriesQuery,
  useGetFeeComparisonQuery,
  type Expense,
  type ExpenseCategory,
  type PaymentMethod,
} from '../../features/Apis/Expenses.Api';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Utilities', 'Salary', 'Maintenance', 'Supplies', 'Transport',
];

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'Bank', label: 'Bank', icon: Banknote },
  { value: 'Cash', label: 'Cash', icon: Wallet },
  { value: 'M-Pesa', label: 'M-Pesa', icon: Smartphone },
];

const CATEGORY_TONES: Record<string, { bg: string; text: string }> = {
  Utilities:   { bg: 'bg-info/10',      text: 'text-info' },
  Salary:      { bg: 'bg-primary/10',   text: 'text-primary' },
  Maintenance: { bg: 'bg-warning/10',   text: 'text-warning' },
  Supplies:    { bg: 'bg-success/10',   text: 'text-success' },
  Transport:   { bg: 'bg-error/10',     text: 'text-error' },
};

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
function extractExpenses(data: any): Expense[] {
  if (!data) return [];
  const raw = data.expenses ?? data.data ?? data;
  return Array.isArray(raw) ? raw : [];
}

function fmtCurrency(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const n = typeof v === 'number' ? v : Number(v);
  if (isNaN(n)) return String(v);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

function toLocalDate(iso?: string): string {
  if (!iso) return '';
  return iso.split('T')[0];
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function catTone(cat: string) {
  return CATEGORY_TONES[cat] ?? { bg: 'bg-base-300', text: 'text-base-content/70' };
}

function paymentIcon(pm: string) {
  return PAYMENT_METHODS.find((p) => p.value === pm)?.icon ?? Wallet;
}

type Tab = 'record' | 'browse' | 'insights';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ExpensesManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const [activeTab, setActiveTab] = useState<Tab>('record');
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleEditFromBrowse = (expense: Expense) => {
    setEditTarget(expense);
    setActiveTab('record');
    setSuccessMessage('');
    setErrorMessage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-base-100 text-base-content min-h-screen">
      {/* ─────────── HEADER ─────────── */}
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
              <Wallet className="w-3.5 h-3.5" /> Finance
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">
              Expenses Manager
            </h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Record and track expenses, approve payments, and monitor your school's financial health for {schoolName}.
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

      {/* ─────────── TABS ─────────── */}
      <div className="flex flex-wrap gap-3 border-b border-base-300 pb-4">
        {[
          { id: 'record' as Tab, label: 'Record', icon: PlusCircle },
          { id: 'browse' as Tab, label: 'Browse', icon: Receipt },
          { id: 'insights' as Tab, label: 'Insights', icon: BarChart3 },
        ].map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setSuccessMessage('');
                setErrorMessage('');
                if (id !== 'record') setEditTarget(null);
              }}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                active
                  ? 'bg-primary text-primary-content shadow-lg shadow-primary/20'
                  : 'bg-base-200/50 hover:bg-base-200 opacity-75'
              }`}
              style={active ? { borderBottom: `4px solid ${secondaryColor}` } : {}}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          );
        })}
      </div>

      {/* ─────────── ALERTS ─────────── */}
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

      {/* ─────────── CONTENT ─────────── */}
      {activeTab === 'record' && (
        <RecordTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          editTarget={editTarget}
          onClearEdit={() => setEditTarget(null)}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'browse' && (
        <BrowseTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          onEdit={handleEditFromBrowse}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'insights' && (
        <InsightsTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   RECORD TAB
   ════════════════════════════════════════════════════════════════ */
function RecordTab({
  schoolId, primaryColor, secondaryColor, editTarget, onClearEdit,
  setSuccessMessage, setErrorMessage,
}: SectionProps & { editTarget: Expense | null; onClearEdit: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'Utilities' as ExpenseCategory,
    amount: '',
    paymentMethod: 'Bank' as PaymentMethod,
    referenceCode: '',
    expenseDate: todayIso(),
  });

  // Bulk payroll
  const [showBulk, setShowBulk] = useState(false);
  const [bulkRows, setBulkRows] = useState<Array<{
    title: string;
    category: ExpenseCategory;
    amount: string;
    paymentMethod: PaymentMethod;
    referenceCode: string;
    expenseDate: string;
  }>>([{ title: '', category: 'Salary', amount: '', paymentMethod: 'Bank', referenceCode: '', expenseDate: todayIso() }]);

  // Mutations
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: updating }] = useUpdateExpenseMutation();
  const [bulkCreate, { isLoading: bulkCreating }] = useBulkCreateExpensesMutation();
  const [approveExpense] = useApproveExpenseMutation();
  const [revokeApproval] = useRevokeApprovalMutation();

  // Widgets
  const { data: pendingData } = useGetPendingApprovalsQuery(schoolId, { skip: !schoolId });
  const pending = useMemo(() => extractExpenses(pendingData), [pendingData]);

  const { data: todayData } = useGetExpensesByDateRangeQuery(
    { schoolId, fromDate: todayIso(), toDate: todayIso() },
    { skip: !schoolId }
  );
  const todayExpenses = useMemo(() => extractExpenses(todayData), [todayData]);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);

  // Sync edit target
  useEffect(() => {
    if (editTarget) {
      setForm({
        title: editTarget.title,
        category: editTarget.category,
        amount: String(editTarget.amount ?? ''),
        paymentMethod: editTarget.paymentMethod,
        referenceCode: editTarget.referenceCode ?? '',
        expenseDate: toLocalDate(editTarget.expenseDate),
      });
      setIsEditing(true);
      setEditingId(editTarget.id);
    } else {
      setIsEditing(false);
      setEditingId(null);
    }
  }, [editTarget]);

  const resetForm = () => {
    setForm({
      title: '',
      category: 'Utilities',
      amount: '',
      paymentMethod: 'Bank',
      referenceCode: '',
      expenseDate: todayIso(),
    });
    setIsEditing(false);
    setEditingId(null);
    onClearEdit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');

    if (!form.title.trim()) return setErrorMessage('Title is required.');
    if (form.title.trim().length < 2) return setErrorMessage('Title must be at least 2 characters.');
    const amountNum = Number(form.amount);
    if (isNaN(amountNum) || amountNum <= 0) return setErrorMessage('Amount must be a positive number.');
    if (!form.expenseDate) return setErrorMessage('Expense date is required.');
    if (new Date(form.expenseDate) > new Date()) return setErrorMessage('Expense date cannot be in the future.');

    const payload = {
      schoolId,
      title: form.title.trim(),
      category: form.category,
      amount: form.amount,
      paymentMethod: form.paymentMethod,
      referenceCode: form.referenceCode.trim() || undefined,
      expenseDate: form.expenseDate,
    };

    try {
      if (isEditing && editingId) {
        await updateExpense({
          expenseId: editingId,
          patch: {
            title: payload.title,
            category: payload.category,
            amount: payload.amount,
            paymentMethod: payload.paymentMethod,
            referenceCode: payload.referenceCode,
            expenseDate: payload.expenseDate,
          },
        }).unwrap();
        setSuccessMessage(`Expense "${payload.title}" updated.`);
      } else {
        await createExpense(payload).unwrap();
        setSuccessMessage(`Expense "${payload.title}" recorded.`);
      }
      resetForm();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Operation failed.');
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');

    const clean = bulkRows
      .filter((r) => r.title.trim().length >= 2 && Number(r.amount) > 0 && r.expenseDate)
      .map((r) => ({
        title: r.title.trim(),
        category: r.category,
        amount: r.amount,
        paymentMethod: r.paymentMethod,
        referenceCode: r.referenceCode.trim() || undefined,
        expenseDate: r.expenseDate,
      }));

    if (clean.length === 0) return setErrorMessage('Add at least one valid row.');

    try {
      const res = await bulkCreate({ schoolId, expenses: clean }).unwrap();
      const inserted = (res as any)?.inserted ?? clean.length;
      const skipped = (res as any)?.skipped ?? 0;
      setSuccessMessage(`Recorded ${inserted} expense${inserted === 1 ? '' : 's'}${skipped > 0 ? `, ${skipped} skipped` : ''}.`);
      setBulkRows([{ title: '', category: 'Salary', amount: '', paymentMethod: 'Bank', referenceCode: '', expenseDate: todayIso() }]);
      setShowBulk(false);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Bulk create failed.');
    }
  };

  const handleApprove = async (id: string, title: string) => {
    setSuccessMessage(''); setErrorMessage('');
    try {
      await approveExpense(id).unwrap();
      setSuccessMessage(`"${title}" approved.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Approve failed.');
    }
  };

  const handleRevoke = async (id: string, title: string) => {
    setSuccessMessage(''); setErrorMessage('');
    try {
      await revokeApproval(id).unwrap();
      setSuccessMessage(`"${title}" approval revoked.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Revoke failed.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── LEFT: Forms ── */}
      <div className="lg:col-span-7 space-y-6">
        {/* Create / edit form */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">
                {isEditing ? 'Edit Expense' : 'Record Expense'}
              </h2>
            </div>
            {isEditing && (
              <button onClick={resetForm} className="text-xs text-error font-bold hover:underline cursor-pointer">
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. November Electricity Bill"
                required
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Amount</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="45000.00"
                  required
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Expense Date</label>
                <input
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                  max={todayIso()}
                  required
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">
                Reference Code <span className="opacity-50 normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.referenceCode}
                onChange={(e) => setForm({ ...form, referenceCode: e.target.value })}
                placeholder="e.g. KPLC-2026-11-001"
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={creating || updating}
              className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-2 disabled:opacity-60"
              style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
            >
              {creating || updating ? 'Saving…' : isEditing ? 'Update Expense' : 'Record Expense'}
            </button>
          </form>
        </div>

        {/* Bulk payroll collapsible */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
          <button
            type="button"
            onClick={() => setShowBulk(!showBulk)}
            className="w-full flex items-center justify-between gap-3 pb-2 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Wand2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-black tracking-tight">Bulk Import</h2>
                <p className="text-[11px] opacity-60">Record multiple expenses at once (e.g. payroll)</p>
              </div>
            </div>
            {showBulk ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
          </button>

          {showBulk && (
            <form onSubmit={handleBulkSubmit} className="space-y-3">
              {bulkRows.map((row, idx) => (
                <div key={idx} className="p-3 bg-base-100 border border-base-300 rounded-xl space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, title: e.target.value } : r))}
                      placeholder="Title"
                      className="flex-1 px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-[11px]"
                    />
                    {bulkRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setBulkRows(bulkRows.filter((_, i) => i !== idx))}
                        className="p-2 bg-error/10 text-error rounded-lg hover:bg-error hover:text-error-content transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={row.category}
                      onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, category: e.target.value as ExpenseCategory } : r))}
                      className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px]"
                    >
                      {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.amount}
                      onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, amount: e.target.value } : r))}
                      placeholder="Amount"
                      className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px] font-mono"
                    />
                    <select
                      value={row.paymentMethod}
                      onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, paymentMethod: e.target.value as PaymentMethod } : r))}
                      className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px]"
                    >
                      {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={row.referenceCode}
                      onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, referenceCode: e.target.value } : r))}
                      placeholder="Ref code (optional)"
                      className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[10px] font-mono"
                    />
                    <input
                      type="date"
                      value={row.expenseDate}
                      max={todayIso()}
                      onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, expenseDate: e.target.value } : r))}
                      className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[10px] font-mono"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setBulkRows([...bulkRows, { title: '', category: 'Salary', amount: '', paymentMethod: 'Bank', referenceCode: '', expenseDate: todayIso() }])}
                className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
              >
                <PlusCircle className="w-3 h-3" /> Add row
              </button>
              <button
                type="submit"
                disabled={bulkCreating}
                className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
              >
                {bulkCreating ? 'Recording…' : `Record ${bulkRows.filter((r) => r.title.trim().length >= 2 && Number(r.amount) > 0).length} expenses`}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── RIGHT: Widgets ── */}
      <div className="lg:col-span-5 space-y-6">
        {/* Today's spend */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-3xl shadow-xl space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-black tracking-tight">Today's Spend</h2>
              <p className="text-[10px] font-mono opacity-60">{fmtDate(todayIso())}</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-primary">{fmtCurrency(todayTotal)}</p>
              <p className="text-[11px] opacity-60 mt-1">{todayExpenses.length} transaction{todayExpenses.length === 1 ? '' : 's'}</p>
            </div>
          </div>
        </div>

        {/* Pending approvals */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-black tracking-tight">Pending Approvals</h2>
              <p className="text-[10px] font-mono opacity-60">{pending.length} awaiting action</p>
            </div>
          </div>

          {pending.length === 0 ? (
            <div className="p-6 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              All caught up — nothing pending.
            </div>
          ) : (
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {pending.slice(0, 20).map((exp) => (
                <div key={exp.id} className="p-3 bg-base-100 border border-base-300 rounded-xl">
                  <div className="flex items-start gap-2">
                    <div className={`shrink-0 w-7 h-7 rounded-lg grid place-items-center ${catTone(exp.category).bg} ${catTone(exp.category).text}`}>
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black truncate">{exp.title}</p>
                      <p className="text-[10px] font-mono opacity-60">
                        {exp.category} · {fmtDate(exp.expenseDate)}
                      </p>
                    </div>
                    <p className="text-xs font-black text-primary shrink-0">{fmtCurrency(exp.amount)}</p>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={() => handleApprove(exp.id, exp.title)}
                      className="flex-1 text-[10px] font-black uppercase px-2 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-all cursor-pointer"
                    >
                      <Check className="w-3 h-3 inline mr-1" /> Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent approved (last 5) */}
        <RecentApprovedWidget schoolId={schoolId} primaryColor={primaryColor} onRevoke={handleRevoke} />
      </div>
    </div>
  );
}

function RecentApprovedWidget({
  schoolId, primaryColor, onRevoke,
}: {
  schoolId: string; primaryColor: string;
  onRevoke: (id: string, title: string) => void;
}) {
  const { data } = useGetExpensesBySchoolQuery(
    { schoolId, approved: true },
    { skip: !schoolId }
  );
  const recent = useMemo(() => {
    const list = extractExpenses(data);
    return [...list]
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
      .slice(0, 5);
  }, [data]);

  return (
    <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-3xl shadow-xl space-y-3">
      <div className="flex items-center gap-3 pb-3 border-b border-base-300">
        <div className="p-2.5 bg-success/10 text-success rounded-xl">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-black tracking-tight">Recently Approved</h2>
          <p className="text-[10px] font-mono opacity-60">Latest 5</p>
        </div>
      </div>

      {recent.length === 0 ? (
        <div className="p-6 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
          No approved expenses yet.
        </div>
      ) : (
        <div className="space-y-1.5">
          {recent.map((exp) => (
            <div key={exp.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-base-100 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
              <span className="flex-1 text-[11px] font-bold truncate">{exp.title}</span>
              <span className="text-[10px] font-mono opacity-60 shrink-0">{fmtCurrency(exp.amount)}</span>
              <button
                onClick={() => onRevoke(exp.id, exp.title)}
                className="p-1 text-warning/70 hover:text-warning transition-all cursor-pointer"
                title="Revoke approval"
              >
                <Undo2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BROWSE TAB
   ════════════════════════════════════════════════════════════════ */
function BrowseTab({
  schoolId, primaryColor, secondaryColor, onEdit, setSuccessMessage, setErrorMessage,
}: SectionProps & { onEdit: (e: Expense) => void }) {
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | ''>('');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  // Choose query based on date filter
  const useDateRange = !!fromDate || !!toDate;
  const approvedParam = approvalFilter === 'all' ? undefined : approvalFilter === 'approved';

  const listQuery = useGetExpensesBySchoolQuery(
    { schoolId, approved: approvedParam },
    { skip: !schoolId || useDateRange }
  );
  const rangeQuery = useGetExpensesByDateRangeQuery(
    { schoolId, fromDate: fromDate || todayIso(), toDate: toDate || todayIso() },
    { skip: !schoolId || !useDateRange }
  );

  const activeQuery = useDateRange ? rangeQuery : listQuery;
  const allExpenses = useMemo(() => extractExpenses(activeQuery.data), [activeQuery.data]);

  // Client-side filters
  const filtered = useMemo(() => {
    let list = allExpenses;
    if (categoryFilter) list = list.filter((e) => e.category === categoryFilter);
    if (approvalFilter !== 'all') {
      list = list.filter((e) => approvalFilter === 'approved' ? e.isApproved : !e.isApproved);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        (e.referenceCode ?? '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
  }, [allExpenses, categoryFilter, approvalFilter, search]);

  const totalAmount = filtered.reduce((s, e) => s + Number(e.amount ?? 0), 0);

  const [approveExpense] = useApproveExpenseMutation();
  const [revokeApproval] = useRevokeApprovalMutation();

  const handleApprove = async (id: string, title: string) => {
    setSuccessMessage(''); setErrorMessage('');
    try {
      await approveExpense(id).unwrap();
      setSuccessMessage(`"${title}" approved.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Approve failed.');
    }
  };

  const handleRevoke = async (id: string, title: string) => {
    setSuccessMessage(''); setErrorMessage('');
    try {
      await revokeApproval(id).unwrap();
      setSuccessMessage(`"${title}" approval revoked.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Revoke failed.');
    }
  };

  const clearFilters = () => {
    setCategoryFilter('');
    setApprovalFilter('all');
    setFromDate('');
    setToDate('');
    setSearch('');
  };

  const hasFilters = !!(categoryFilter || approvalFilter !== 'all' || fromDate || toDate || search);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── LEFT: Filters ── */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Filter className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Filters</h2>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Search</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-primary">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title or ref code…"
                className="w-full pl-9 pr-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | '')}
              className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Status</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'all' as const, label: 'All' },
                { id: 'approved' as const, label: 'Approved' },
                { id: 'pending' as const, label: 'Pending' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setApprovalFilter(s.id)}
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-2 rounded-lg transition-all cursor-pointer ${
                    approvalFilter === s.id
                      ? 'bg-primary text-primary-content shadow'
                      : 'bg-base-100 border border-base-300 hover:bg-base-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Date Range</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="w-full text-xs font-bold py-2 rounded-xl bg-base-100 border border-base-300 hover:bg-base-200 transition-all cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Totals card */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-3xl shadow-xl space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Filtered Total</p>
          <p className="text-3xl font-black text-primary">{fmtCurrency(totalAmount)}</p>
          <p className="text-[11px] opacity-60">{filtered.length} expense{filtered.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      {/* ── RIGHT: List ── */}
      <div className="lg:col-span-8 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <Receipt className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Expenses</h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{filtered.length}</span>
        </div>

        {activeQuery.isLoading ? (
          <div className="p-8 text-center text-xs opacity-60">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
            {hasFilters ? 'No expenses match the current filters.' : 'No expenses recorded yet.'}
          </div>
        ) : (
          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {filtered.map((exp) => {
              const tone = catTone(exp.category);
              const PayIcon = paymentIcon(exp.paymentMethod);
              return (
                <div key={exp.id} className="p-4 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-10 h-10 rounded-xl grid place-items-center ${tone.bg} ${tone.text}`}>
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-sm text-primary truncate">{exp.title}</h3>
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${tone.bg} ${tone.text}`}>
                          {exp.category}
                        </span>
                        {exp.isApproved ? (
                          <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-extrabold uppercase rounded flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-warning/10 text-warning text-[10px] font-extrabold uppercase rounded">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] font-mono opacity-60 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {fmtDate(exp.expenseDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <PayIcon className="w-3 h-3" /> {exp.paymentMethod}
                        </span>
                        {exp.referenceCode && (
                          <span className="truncate">#{exp.referenceCode}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-primary">{fmtCurrency(exp.amount)}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-base-300 flex justify-end gap-1.5">
                    {exp.isApproved ? (
                      <button
                        onClick={() => handleRevoke(exp.id, exp.title)}
                        className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-all cursor-pointer"
                      >
                        <Undo2 className="w-3 h-3 inline mr-1" /> Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(exp.id, exp.title)}
                        className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-all cursor-pointer"
                      >
                        <Check className="w-3 h-3 inline mr-1" /> Approve
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(exp)}
                      className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-base-200 hover:bg-primary/20 hover:text-primary transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 inline mr-1" /> Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INSIGHTS TAB
   ════════════════════════════════════════════════════════════════ */
function InsightsTab({
  schoolId, primaryColor, secondaryColor,
}: {
  schoolId: string; primaryColor: string; secondaryColor: string;
}) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [months, setMonths] = useState(6);

  const { data: summaryData, isLoading: loadingSummary } = useGetExpenseSummaryQuery(
    { schoolId, fromDate: fromDate || undefined, toDate: toDate || undefined },
    { skip: !schoolId }
  );
  const { data: trendData, isLoading: loadingTrend } = useGetMonthlyTrendQuery(
    { schoolId, months },
    { skip: !schoolId }
  );
  const { data: breakdownData, isLoading: loadingBreakdown } = useGetCategoryBreakdownQuery(schoolId, { skip: !schoolId });
  const { data: topCatsData } = useGetTopCategoriesQuery({ schoolId, limit: 3 }, { skip: !schoolId });
  const { data: comparisonData, isLoading: loadingComparison } = useGetFeeComparisonQuery(
    { schoolId, fromDate: fromDate || undefined, toDate: toDate || undefined },
    { skip: !schoolId }
  );

  const summary = (summaryData as any)?.summary ?? {};
  const trend: any[] = (trendData as any)?.trend ?? [];
  const breakdown: any[] = (breakdownData as any)?.breakdown ?? [];
  const topCats: any[] = (topCatsData as any)?.categories ?? [];
  const comparison = (comparisonData as any)?.comparison ?? {};

  const total = summary.total ?? 0;
  const approved = summary.approved ?? 0;
  const pending = summary.pending ?? 0;
  const pendingCount = summary.pendingCount ?? 0;

  const maxTrend = Math.max(1, ...trend.map((t) => Number(t.total ?? t.amount ?? 0)));
  const maxBreakdown = Math.max(1, ...breakdown.map((b) => Number(b.total ?? b.amount ?? 0)));

  const totalFees = Number(comparison.totalFees ?? 0);
  const totalExpenses = Number(comparison.totalExpenses ?? total);
  const net = Number(comparison.net ?? (totalFees - totalExpenses));
  const isProfit = net >= 0;

  return (
    <div className="space-y-6">
      {/* Date scope */}
      <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-black uppercase tracking-wider opacity-70">Filter</span>
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-1.5 bg-base-100 border border-base-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-xs opacity-60">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-1.5 bg-base-100 border border-base-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary/20"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="text-xs font-bold text-primary hover:underline px-2 cursor-pointer"
            >
              Clear
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase opacity-70">Trend</span>
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  months === m ? 'bg-primary text-primary-content' : 'bg-base-100 border border-base-300 hover:bg-base-200'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile icon={Wallet} label="Total Spent" value={loadingSummary ? '…' : fmtCurrency(total)} tone="primary" />
        <StatTile icon={CheckCircle2} label="Approved" value={loadingSummary ? '…' : fmtCurrency(approved)} tone="success" />
        <StatTile icon={AlertCircle} label="Pending" value={loadingSummary ? '…' : fmtCurrency(pending)} tone="warning" />
        <StatTile icon={Receipt} label="Pending Count" value={loadingSummary ? '…' : (pendingCount || '—')} tone="warning" />
      </div>

      {/* Fee vs expense comparison */}
      <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-base-300">
          <div className={`p-2.5 rounded-xl ${isProfit ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
            <Scale className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black tracking-tight">Fees vs Expenses</h2>
            <p className="text-[11px] opacity-60">Bursar's dashboard · {fromDate || toDate ? 'custom range' : 'all time'}</p>
          </div>
          {isProfit ? (
            <span className="px-3 py-1.5 bg-success/10 text-success text-[10px] font-black uppercase rounded-lg flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Surplus
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-error/10 text-error text-[10px] font-black uppercase rounded-lg flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> Deficit
            </span>
          )}
        </div>

        {loadingComparison ? (
          <div className="p-6 text-center text-xs opacity-60">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-base-100 border border-base-300 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Total Fees</p>
                <p className="text-xl font-black text-primary mt-1">{fmtCurrency(totalFees)}</p>
              </div>
              <div className="p-4 bg-base-100 border border-base-300 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Total Expenses</p>
                <p className="text-xl font-black text-warning mt-1">{fmtCurrency(totalExpenses)}</p>
              </div>
              <div className={`p-4 rounded-2xl border-2 ${isProfit ? 'bg-success/5 border-success/30' : 'bg-error/5 border-error/30'}`}>
                <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Net</p>
                <p className={`text-xl font-black mt-1 ${isProfit ? 'text-success' : 'text-error'}`}>
                  {fmtCurrency(net)}
                </p>
              </div>
            </div>

            {/* Mini bar comparison */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] font-mono font-bold opacity-70 mb-1">
                  <span>Fees</span>
                  <span>100%</span>
                </div>
                <div className="h-2.5 rounded-full bg-base-200 overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono font-bold opacity-70 mb-1">
                  <span>Expenses</span>
                  <span>{totalFees > 0 ? `${((totalExpenses / totalFees) * 100).toFixed(1)}%` : '—'}</span>
                </div>
                <div className="h-2.5 rounded-full bg-base-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{ width: `${Math.min(100, totalFees > 0 ? (totalExpenses / totalFees) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {comparison.margin != null && (
              <div className="flex items-center gap-2 text-xs">
                <Percent className="w-3.5 h-3.5 text-primary" />
                <span className="opacity-70">Margin:</span>
                <span className="font-black">{Number(comparison.margin).toFixed(2)}%</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Monthly Trend</h2>
              <p className="text-[11px] opacity-60">Last {months} months</p>
            </div>
          </div>

          {loadingTrend ? (
            <div className="p-6 text-center text-xs opacity-60">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
            </div>
          ) : trend.length === 0 ? (
            <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              No trend data.
            </div>
          ) : (
            <>
              <div className="flex items-end gap-1.5 h-40 px-2">
                {trend.map((t, i) => {
                  const val = Number(t.total ?? t.amount ?? 0);
                  const h = (val / maxTrend) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <span className="absolute -top-4 text-[9px] font-mono font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {fmtCurrency(val)}
                      </span>
                      <div
                        className="w-full rounded-t transition-all"
                        style={{ height: `${h}%`, backgroundColor: primaryColor, minHeight: val > 0 ? 4 : 0 }}
                        title={`${t.month ?? i}: ${fmtCurrency(val)}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] font-mono opacity-50 px-2">
                <span>{trend[0]?.month ?? ''}</span>
                <span>{trend[trend.length - 1]?.month ?? ''}</span>
              </div>
            </>
          )}
        </div>

        {/* Category breakdown */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <PieChart className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">By Category</h2>
          </div>

          {loadingBreakdown ? (
            <div className="p-6 text-center text-xs opacity-60">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
            </div>
          ) : breakdown.length === 0 ? (
            <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              No category data.
            </div>
          ) : (
            <div className="space-y-3">
              {breakdown.map((b, idx) => {
                const val = Number(b.total ?? b.amount ?? 0);
                const pct = (val / maxBreakdown) * 100;
                const tone = catTone(b.category);
                return (
                  <div key={b.category ?? idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-black uppercase ${tone.text}`}>{b.category}</span>
                      <span className="text-[11px] font-mono font-black">{fmtCurrency(val)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-base-200 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: primaryColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top categories */}
      {topCats.length > 0 && (
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-warning/10 text-warning rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Top Spending Categories</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topCats.map((c, i) => {
              const tone = catTone(c.category);
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
              return (
                <div key={c.category ?? i} className={`p-4 rounded-2xl border-2 ${tone.bg} ${tone.text.replace('text-', 'border-').replace('/10', '/30')}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{medal}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider">{c.category}</span>
                  </div>
                  <p className="text-xl font-black mt-1">{fmtCurrency(c.total ?? c.amount ?? 0)}</p>
                  {c.percentage != null && (
                    <p className="text-[10px] font-mono opacity-70 mt-1">{Number(c.percentage).toFixed(1)}% of total</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED
   ════════════════════════════════════════════════════════════════ */
type SectionProps = {
  schoolId: string;
  primaryColor: string;
  secondaryColor: string;
  setSuccessMessage: (v: string) => void;
  setErrorMessage: (v: string) => void;
};

function StatTile({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
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
    </div>
  );
}