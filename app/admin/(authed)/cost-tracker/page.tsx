'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, Pencil, Trash2, Upload, FileText, Download, ChevronLeft, ChevronRight, Check, Loader2, Receipt, DollarSign, TrendingUp, Paperclip, Eye } from 'lucide-react';
import {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getAllExpenseMonths, uploadReceipt, getReceiptSignedUrl,
} from './actions';

// ── Types ─────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  vendor: string | null;
  notes: string | null;
  receipt_path: string | null;
  receipt_url: string | null;
  created_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'software', label: 'Software & Tools' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'photography', label: 'Photography / Content' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'office', label: 'Office & Supplies' },
  { value: 'travel', label: 'Travel' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CATEGORY_COLORS: Record<string, string> = {
  marketing: 'bg-purple-50 text-purple-700',
  inventory: 'bg-blue-50 text-blue-700',
  shipping: 'bg-cyan-50 text-cyan-700',
  software: 'bg-indigo-50 text-indigo-700',
  payroll: 'bg-green-50 text-green-700',
  photography: 'bg-pink-50 text-pink-700',
  packaging: 'bg-orange-50 text-orange-700',
  office: 'bg-yellow-50 text-yellow-700',
  travel: 'bg-teal-50 text-teal-700',
  professional_services: 'bg-red-50 text-red-700',
  advertising: 'bg-fuchsia-50 text-fuchsia-700',
  equipment: 'bg-slate-50 text-slate-700',
  other: 'bg-rv-gray text-rv-tab-inactive',
};

// ── Helpers ───────────────────────────────────────────────────────────────

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function categoryLabel(val: string) {
  return CATEGORIES.find((c) => c.value === val)?.label || val;
}

function categoryColor(val: string) {
  return CATEGORY_COLORS[val] || CATEGORY_COLORS.other;
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Styles ────────────────────────────────────────────────────────────────

const inp = 'w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250';
const textarea = 'w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none';
const lbl = 'block text-xs font-medium mb-1.5 text-rv-tab-inactive uppercase tracking-wider';

// ── Add/Edit Modal ────────────────────────────────────────────────────────

function ExpenseModal({
  initial,
  onClose,
  onSave,
  currentYear,
  currentMonth,
}: {
  initial: Expense | null;
  onClose: () => void;
  onSave: () => void;
  currentYear: number;
  currentMonth: number;
}) {
  const isEdit = !!initial;
  const defaultDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

  const [date, setDate] = useState(initial?.date || defaultDate);
  const [description, setDescription] = useState(initial?.description || '');
  const [category, setCategory] = useState(initial?.category || 'other');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [vendor, setVendor] = useState(initial?.vendor || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Receipt upload
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(initial?.receipt_url || null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSave() {
    if (!description.trim()) { setError('Description is required'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) { setError('Enter a valid amount'); return; }
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await updateExpense(initial!.id, {
          date, description: description.trim(), category,
          amount: amt, vendor: vendor.trim() || null, notes: notes.trim() || null,
        });
        // Upload receipt if selected
        if (receiptFile) {
          const buf = await receiptFile.arrayBuffer();
          await uploadReceipt(initial!.id, Array.from(new Uint8Array(buf)), receiptFile.name, receiptFile.type);
        }
      } else {
        await createExpense({
          date, description: description.trim(), category,
          amount: amt, vendor: vendor.trim() || undefined, notes: notes.trim() || undefined,
        });
        // Note: receipt upload after create requires a re-fetch to get the id
        // For new records the user can add receipt after saving
      }
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      setReceiptPreview(URL.createObjectURL(file));
    } else {
      setReceiptPreview(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-w-lg mx-auto my-8 rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-rv-gray">
          <h2 className="text-lg font-medium">{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250">
            <X size={16} strokeWidth={1.6} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-2xl">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rv-tab-inactive text-sm">$</span>
                <input
                  type="number" step="0.01" min="0"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" className={inp + ' pl-7'}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={lbl}>Description *</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this expense for?" className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inp + ' bg-white'}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Vendor / Merchant</label>
              <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Shopify, UPS..." className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional details..." className={textarea} />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className={lbl}>Receipt / Invoice</label>
            {receiptPreview && (
              <div className="mb-2">
                <img src={receiptPreview} alt="Receipt preview" className="max-h-32 rounded-xl border border-rv-gray object-contain" />
              </div>
            )}
            {initial?.receipt_path && !receiptFile && (
              <div className="mb-2 flex items-center gap-2 text-sm text-rv-tab-inactive">
                <Paperclip size={13} strokeWidth={1.6} />
                <span>Receipt attached</span>
                <a
                  href={initial.receipt_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-black hover:underline"
                >
                  View
                </a>
              </div>
            )}
            {receiptFile && (
              <div className="mb-2 flex items-center gap-2 text-sm">
                <Paperclip size={13} strokeWidth={1.6} />
                <span className="truncate flex-1">{receiptFile.name}</span>
                <button onClick={() => { setReceiptFile(null); setReceiptPreview(null); }} className="text-rv-tab-inactive hover:text-red-600 transition-colors">
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="h-9 px-4 rounded-full border border-dashed border-rv-tab-inactive hover:border-black hover:bg-rv-gray text-xs text-rv-tab-inactive hover:text-black transition-all duration-250 flex items-center gap-2"
            >
              <Upload size={13} strokeWidth={1.6} />
              {receiptFile ? 'Change file' : 'Upload receipt / invoice'}
            </button>
            <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
            {!isEdit && receiptFile && (
              <p className="text-xs text-rv-tab-inactive mt-1">Receipt will be uploaded after saving</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 h-11 rounded-full border border-rv-gray text-sm font-medium transition-all duration-250 hover:opacity-70">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 rounded-full bg-black text-white text-sm font-medium flex items-center justify-center gap-2 transition-all duration-250 active:scale-95 hover:opacity-70 disabled:opacity-50"
          >
            {saving && <Loader2 size={15} strokeWidth={1.6} className="animate-spin" />}
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Receipt Upload After Create ───────────────────────────────────────────

function ReceiptUploader({ expenseId, onDone }: { expenseId: string; onDone: () => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      await uploadReceipt(expenseId, Array.from(new Uint8Array(buf)), file.name, file.type);
      onDone();
    } catch {
      // silent fail
    } finally {
      setUploading(false);
    }
  }

  return (
    <span className="inline-flex items-center">
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 text-rv-tab-inactive hover:text-black"
        title="Upload receipt"
      >
        {uploading ? <Loader2 size={13} strokeWidth={1.6} className="animate-spin" /> : <Upload size={13} strokeWidth={1.6} />}
      </button>
      <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleFile} />
    </span>
  );
}

// ── Category Breakdown ────────────────────────────────────────────────────

function CategoryBreakdown({ expenses }: { expenses: Expense[] }) {
  const totals: Record<string, number> = {};
  expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
  });
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const grandTotal = sorted.reduce((s, [, v]) => s + v, 0);

  if (sorted.length === 0) return null;

  return (
    <div className="border border-rv-gray rounded-2xl p-4">
      <h3 className="text-sm font-medium mb-3">By Category</h3>
      <div className="space-y-2">
        {sorted.map(([cat, total]) => {
          const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor(cat)}`}>{categoryLabel(cat)}</span>
                <span className="text-xs font-medium">{fmt(total)}</span>
              </div>
              <div className="h-1.5 bg-rv-gray rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function CostTrackerPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [pendingUploadId, setPendingUploadId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [exps, months] = await Promise.all([
      getExpenses(year, month),
      getAllExpenseMonths(),
    ]);
    setExpenses(exps as Expense[]);
    setAvailableMonths(months);
    setLoading(false);
  }

  useEffect(() => { load(); }, [year, month]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteExpense(id);
    load();
    setDeletingId(null);
  }

  const filtered = filterCategory === 'all'
    ? expenses
    : expenses.filter((e) => e.category === filterCategory);

  const totalAll = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount), 0);

  // Group by category for quick stats
  const catCounts: Record<string, number> = {};
  expenses.forEach((e) => { catCounts[e.category] = (catCounts[e.category] || 0) + 1; });

  // Jump to specific month from dropdown
  function jumpToMonth(val: string) {
    const [y, m] = val.split('-').map(Number);
    setYear(y);
    setMonth(m);
  }

  const currentKey = `${year}-${String(month).padStart(2, '0')}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium">Cost Tracker</h1>
          <p className="text-sm text-rv-tab-inactive mt-0.5">Track expenses, allocations, and upload receipts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-11 px-4 rounded-full bg-black text-white text-sm font-medium flex items-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70"
        >
          <Plus size={16} strokeWidth={1.6} />Add Expense
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={prevMonth}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250"
        >
          <ChevronLeft size={16} strokeWidth={1.6} />
        </button>
        <h2 className="text-lg font-medium w-44 text-center">{MONTHS[month - 1]} {year}</h2>
        <button
          onClick={nextMonth}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250"
        >
          <ChevronRight size={16} strokeWidth={1.6} />
        </button>
        {availableMonths.length > 0 && (
          <select
            value={currentKey}
            onChange={(e) => jumpToMonth(e.target.value)}
            className="ml-2 h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black bg-white transition-all duration-250"
          >
            {Array.from(new Set([currentKey, ...availableMonths])).sort((a, b) => b.localeCompare(a)).map((mk) => {
              const [y, m] = mk.split('-').map(Number);
              return <option key={mk} value={mk}>{MONTHS[m - 1]} {y}</option>;
            })}
          </select>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-rv-gray rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={15} strokeWidth={1.6} className="text-rv-tab-inactive" />
            <span className="text-xs text-rv-tab-inactive uppercase tracking-wider">Total Spend</span>
          </div>
          <p className="text-2xl font-medium">{fmt(totalAll)}</p>
          <p className="text-xs text-rv-tab-inactive mt-0.5">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="border border-rv-gray rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={15} strokeWidth={1.6} className="text-rv-tab-inactive" />
            <span className="text-xs text-rv-tab-inactive uppercase tracking-wider">Avg per Expense</span>
          </div>
          <p className="text-2xl font-medium">{expenses.length > 0 ? fmt(totalAll / expenses.length) : '$0.00'}</p>
          <p className="text-xs text-rv-tab-inactive mt-0.5">{Object.keys(catCounts).length} categor{Object.keys(catCounts).length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <div className="border border-rv-gray rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={15} strokeWidth={1.6} className="text-rv-tab-inactive" />
            <span className="text-xs text-rv-tab-inactive uppercase tracking-wider">Receipts</span>
          </div>
          <p className="text-2xl font-medium">{expenses.filter((e) => e.receipt_path).length}</p>
          <p className="text-xs text-rv-tab-inactive mt-0.5">of {expenses.length} have files</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: expense list */}
        <div className="col-span-2">
          {/* Filter */}
          <div className="flex items-center gap-2 mb-4">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black bg-white transition-all duration-250"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.filter((c) => catCounts[c.value]).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {filterCategory !== 'all' && (
              <span className="text-sm text-rv-tab-inactive">
                {fmt(totalFiltered)} total
              </span>
            )}
          </div>

          {loading && (
            <div className="py-16 flex items-center justify-center">
              <Loader2 size={24} strokeWidth={1.6} className="animate-spin text-rv-tab-inactive" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-rv-gray flex items-center justify-center mx-auto mb-3">
                <DollarSign size={20} strokeWidth={1.4} className="text-rv-tab-inactive" />
              </div>
              <p className="text-sm font-medium mb-1">No expenses this month</p>
              <p className="text-xs text-rv-tab-inactive mb-4">Add your first expense to get started</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="h-9 px-4 rounded-full bg-black text-white text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70"
              >
                Add Expense
              </button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="space-y-0">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 py-2 text-xs font-medium text-rv-tab-inactive uppercase tracking-wider border-b border-rv-gray">
                <span>Description</span>
                <span className="text-right w-24">Amount</span>
                <span className="w-6" />
                <span className="w-16" />
              </div>

              {filtered.map((expense) => (
                <div
                  key={expense.id}
                  className="group grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-3 py-3 border-b border-rv-gray hover:bg-rv-gray/40 transition-all duration-250"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">{expense.description}</p>
                      {expense.receipt_path && (
                        <a
                          href={expense.receipt_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-rv-tab-inactive hover:text-black transition-colors flex-shrink-0"
                          title="View receipt"
                        >
                          <Paperclip size={11} strokeWidth={1.6} />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rv-tab-inactive">{fmtDate(expense.date)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor(expense.category)}`}>
                        {categoryLabel(expense.category)}
                      </span>
                      {expense.vendor && (
                        <span className="text-xs text-rv-tab-inactive">{expense.vendor}</span>
                      )}
                    </div>
                    {expense.notes && (
                      <p className="text-xs text-rv-tab-inactive mt-0.5 truncate">{expense.notes}</p>
                    )}
                  </div>

                  <span className="text-sm font-medium w-24 text-right">{fmt(Number(expense.amount))}</span>

                  {/* Receipt actions */}
                  <div className="w-7 flex items-center justify-center">
                    {!expense.receipt_path ? (
                      <ReceiptUploader
                        expenseId={expense.id}
                        onDone={() => load()}
                      />
                    ) : (
                      <a
                        href={expense.receipt_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 text-rv-tab-inactive hover:text-black"
                        title="View receipt"
                      >
                        <Eye size={13} strokeWidth={1.6} />
                      </a>
                    )}
                  </div>

                  {/* Edit / Delete */}
                  <div className="w-16 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-250">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250"
                    >
                      <Pencil size={13} strokeWidth={1.6} />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={deletingId === expense.id}
                      className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray hover:text-red-600 transition-all duration-250 text-rv-tab-inactive"
                    >
                      {deletingId === expense.id ? (
                        <Loader2 size={13} strokeWidth={1.6} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} strokeWidth={1.6} />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {/* Total row */}
              <div className="flex items-center justify-between px-3 py-3 font-medium text-sm border-t-2 border-black mt-1">
                <span>{filterCategory === 'all' ? 'Monthly Total' : `Total – ${categoryLabel(filterCategory)}`}</span>
                <span className="text-lg">{fmt(totalFiltered)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: breakdown */}
        <div className="space-y-4">
          <CategoryBreakdown expenses={expenses} />

          {availableMonths.length > 1 && (
            <div className="border border-rv-gray rounded-2xl p-4">
              <h3 className="text-sm font-medium mb-3">Recent Months</h3>
              <div className="space-y-1.5">
                {availableMonths.slice(0, 6).map((mk) => {
                  const [y, m] = mk.split('-').map(Number);
                  const isCurrent = mk === currentKey;
                  return (
                    <button
                      key={mk}
                      onClick={() => jumpToMonth(mk)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-250 ${isCurrent ? 'bg-black text-white' : 'hover:bg-rv-gray'}`}
                    >
                      {MONTHS[m - 1]} {y}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <ExpenseModal
          initial={null}
          onClose={() => setShowAddModal(false)}
          onSave={() => { setShowAddModal(false); load(); }}
          currentYear={year}
          currentMonth={month}
        />
      )}
      {editingExpense && (
        <ExpenseModal
          initial={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={() => { setEditingExpense(null); load(); }}
          currentYear={year}
          currentMonth={month}
        />
      )}
    </div>
  );
        }
