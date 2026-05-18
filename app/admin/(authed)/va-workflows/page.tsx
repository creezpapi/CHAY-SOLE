'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, ChevronRight, ChevronDown, Copy, Check, Search, Filter, Pencil, Archive, Layers, GitBranch, FileUp, Paperclip, Eye, Loader2, MoreHorizontal, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status = 'draft' | 'active' | 'needs_review' | 'archived';
type Platform = 'instagram' | 'tiktok_shop' | 'tiktok_social' | 'email_outreach' | 'shopify' | 'shipping' | 'customer_service' | 'general_admin' | 'custom';

interface ChecklistItem { id: string; text: string; done: boolean; }
interface Branch {
  id: string;
  name: string;
  condition: string;
  instructions: string;
  prompt: string;
  notes: string;
  files: UploadedFile[];
  steps: Step[];
}
interface Step {
  id: string;
  title: string;
  instructions: string;
  prompt: string;
  notes: string;
  checklist: ChecklistItem[];
  dueDate: string;
  frequency: string;
  files: UploadedFile[];
  branches: Branch[];
}
interface UploadedFile { id: string; name: string; size: number; url: string; }
interface Workflow {
  id: string;
  platform: Platform;
  platformName: string;
  loginEmail: string;
  loginPassword: string;
  loginUrl: string;
  twoFaNotes: string;
  platformNotes: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  owner: string;
  tags: string[];
  steps: Step[];
  files: UploadedFile[];
  createdAt: string;
  updatedAt: string;
  activityLog: string[];
}
// ── Constants ─────────────────────────────────────────────────────────────

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok_shop', label: 'TikTok Shop' },
  { value: 'tiktok_social', label: 'TikTok / Social Posting' },
  { value: 'email_outreach', label: 'Email / Influencer Outreach' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'shipping', label: 'Shipping / Tracking' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'general_admin', label: 'General Admin' },
  { value: 'custom', label: 'Other / Custom Platform' },
];

const PRIORITIES: { value: Priority; label: string; cls: string }[] = [
  { value: 'low', label: 'Low', cls: 'bg-rv-gray text-rv-tab-inactive' },
  { value: 'medium', label: 'Medium', cls: 'bg-blue-50 text-blue-700' },
  { value: 'high', label: 'High', cls: 'bg-orange-50 text-orange-700' },
  { value: 'urgent', label: 'Urgent', cls: 'bg-red-50 text-red-700' },
];

const STATUSES: { value: Status; label: string; cls: string }[] = [
  { value: 'draft', label: 'Draft', cls: 'bg-rv-gray text-rv-tab-inactive' },
  { value: 'active', label: 'Active', cls: 'bg-black text-white' },
  { value: 'needs_review', label: 'Needs Review', cls: 'bg-yellow-50 text-yellow-700' },
  { value: 'archived', label: 'Archived', cls: 'bg-rv-gray text-rv-tab-inactive line-through' },
];

const STORAGE_KEY = 'va_workflows_v1';

// ── Helpers ───────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function platformLabel(p: Platform) { return PLATFORMS.find(x => x.value === p)?.label || p; }
function priorityInfo(p: Priority) { return PRIORITIES.find(x => x.value === p) || PRIORITIES[0]; }
function statusInfo(s: Status) { return STATUSES.find(x => x.value === s) || STATUSES[0]; }
function now() { return new Date().toISOString(); }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

function newStep(): Step {
  return { id: uid(), title: '', instructions: '', prompt: '', notes: '', checklist: [], dueDate: '', frequency: '', files: [], branches: [] };
}
function newBranch(): Branch {
  return { id: uid(), name: '', condition: '', instructions: '', prompt: '', notes: '', files: [], steps: [] };
}
function newWorkflow(): Workflow {
  return {
    id: uid(), platform: 'instagram', platformName: '', loginEmail: '', loginPassword: '', loginUrl: '', twoFaNotes: '', platformNotes: '',
    title: '', description: '', priority: 'medium', status: 'draft', owner: '', tags: [], steps: [newStep()], files: [],
    createdAt: now(), updatedAt: now(), activityLog: ['Workflow created.'],
  };
}
// ── Small UI Components ───────────────────────────────────────────────────

function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium ${cls}`}>{children}</span>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 text-rv-tab-inactive hover:text-black" title="Copy">
      {copied ? <Check size={13} strokeWidth={2} className="text-green-600" /> : <Copy size={13} strokeWidth={1.6} />}
    </button>
  );
}

function Collapsible({ title, defaultOpen = false, badge, children }: { title: string; defaultOpen?: boolean; badge?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-rv-gray rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-rv-gray transition-all duration-250">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge}
        </div>
        {open ? <ChevronDown size={15} strokeWidth={1.6} className="text-rv-tab-inactive" /> : <ChevronRight size={15} strokeWidth={1.6} className="text-rv-tab-inactive" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

const inp = 'w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250';
const textarea = 'w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none';
const lbl = 'block text-xs font-medium mb-1.5 text-rv-tab-inactive uppercase tracking-wider';
// ── Step Editor ────────────────────────────────────────────────────────────

function StepEditor({ step, index, total, onChange, onRemove, onMoveUp, onMoveDown }: {
  step: Step; index: number; total: number;
  onChange: (s: Step) => void; onRemove: () => void;
  onMoveUp: () => void; onMoveDown: () => void;
}) {
  function upd<K extends keyof Step>(k: K, v: Step[K]) { onChange({ ...step, [k]: v }); }

  function addChecklist() { upd('checklist', [...step.checklist, { id: uid(), text: '', done: false }]); }
  function updateChecklist(id: string, text: string) { upd('checklist', step.checklist.map(c => c.id === id ? { ...c, text } : c)); }
  function removeChecklist(id: string) { upd('checklist', step.checklist.filter(c => c.id !== id)); }

  function addBranch() { upd('branches', [...step.branches, newBranch()]); }
  function updateBranch(id: string, b: Branch) { upd('branches', step.branches.map(br => br.id === id ? b : br)); }
  function removeBranch(id: string) { upd('branches', step.branches.filter(br => br.id !== id)); }

  const fileRef = useRef<HTMLInputElement>(null);
  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).map(f => ({ id: uid(), name: f.name, size: f.size, url: URL.createObjectURL(f) }));
    upd('files', [...step.files, ...files]);
  }

  return (
    <div className="border border-rv-gray rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-black text-white text-xs flex items-center justify-center flex-shrink-0 font-medium">{index + 1}</span>
        <input value={step.title} onChange={e => upd('title', e.target.value)} placeholder={`Step ${index + 1} title...`}
          className="flex-1 h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
        <button onClick={onMoveUp} disabled={index === 0} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 disabled:opacity-30"><ArrowUp size={13} strokeWidth={1.6} /></button>
        <button onClick={onMoveDown} disabled={index === total - 1} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 disabled:opacity-30"><ArrowDown size={13} strokeWidth={1.6} /></button>
        <button onClick={onRemove} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray hover:text-red-600 transition-all duration-250 text-rv-tab-inactive"><X size={13} strokeWidth={1.6} /></button>
      </div>

      <div>
        <label className={lbl}>Instructions</label>
        <textarea value={step.instructions} onChange={e => upd('instructions', e.target.value)} rows={3} placeholder="What should the VA do in this step..." className={textarea} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={lbl}>Prompt / Script</label>
          {step.prompt && <CopyButton text={step.prompt} />}
        </div>
        <textarea value={step.prompt} onChange={e => upd('prompt', e.target.value)} rows={2} placeholder="Copy-paste prompt or message template..." className={textarea + ' font-mono text-xs'} />
      </div>

      <div>
        <label className={lbl}>Notes</label>
        <textarea value={step.notes} onChange={e => upd('notes', e.target.value)} rows={2} placeholder="Additional notes..." className={textarea} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Due Date / Deadline</label>
          <input type="date" value={step.dueDate} onChange={e => upd('dueDate', e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Frequency</label>
          <input value={step.frequency} onChange={e => upd('frequency', e.target.value)} placeholder="e.g. Daily, Weekly..." className={inp} />
        </div>
      </div>

      {/* Checklist */}
      <div>
        <label className={lbl}>Checklist</label>
        <div className="space-y-1.5">
          {step.checklist.map(c => (
            <div key={c.id} className="flex items-center gap-2">
              <input value={c.text} onChange={e => updateChecklist(c.id, e.target.value)} placeholder="Checklist item..." className="flex-1 h-8 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
              <button onClick={() => removeChecklist(c.id)} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 text-rv-tab-inactive"><X size={12} strokeWidth={1.6} /></button>
            </div>
          ))}
          <button onClick={addChecklist} className="h-8 px-3 rounded-full text-xs bg-rv-gray hover:bg-black hover:text-white transition-all duration-250 flex items-center gap-1.5">
            <Plus size={12} strokeWidth={1.6} />Add item
          </button>
        </div>
      </div>

      {/* Files */}
      <div>
        <label className={lbl}>Step Files</label>
        <div className="flex flex-wrap gap-2">
          {step.files.map(f => (
            <div key={f.id} className="flex items-center gap-1.5 h-8 px-3 bg-rv-gray rounded-full text-xs">
              <Paperclip size={11} strokeWidth={1.6} />
              <a href={f.url} target="_blank" rel="noreferrer" className="hover:underline max-w-[120px] truncate">{f.name}</a>
              <button onClick={() => upd('files', step.files.filter(x => x.id !== f.id))} className="text-rv-tab-inactive hover:text-red-600 transition-colors"><X size={10} strokeWidth={2} /></button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} className="h-8 px-3 rounded-full text-xs bg-rv-gray hover:bg-black hover:text-white transition-all duration-250 flex items-center gap-1.5">
            <FileUp size={12} strokeWidth={1.6} />Attach file
          </button>
        </div>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
      </div>

      {/* Branches */}
      {step.branches.length > 0 && (
        <div className="space-y-2">
          <label className={lbl}>Conditional Branches</label>
          {step.branches.map(br => (
            <BranchEditor key={br.id} branch={br} onChange={b => updateBranch(br.id, b)} onRemove={() => removeBranch(br.id)} />
          ))}
        </div>
      )}
      <button onClick={addBranch} className="h-8 px-3 rounded-full text-xs border border-dashed border-rv-tab-inactive hover:border-black hover:bg-rv-gray transition-all duration-250 flex items-center gap-1.5 text-rv-tab-inactive hover:text-black">
        <GitBranch size={12} strokeWidth={1.6} />Add branch after this step
      </button>
    </div>
  );
}
// ── Branch Editor ─────────────────────────────────────────────────────────

function BranchEditor({ branch, onChange, onRemove }: {
  branch: Branch; onChange: (b: Branch) => void; onRemove: () => void;
}) {
  function upd<K extends keyof Branch>(k: K, v: Branch[K]) { onChange({ ...branch, [k]: v }); }
  const fileRef = useRef<HTMLInputElement>(null);
  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).map(f => ({ id: uid(), name: f.name, size: f.size, url: URL.createObjectURL(f) }));
    upd('files', [...branch.files, ...files]);
  }

  return (
    <div className="ml-4 pl-4 border-l-2 border-rv-gray space-y-2">
      <div className="flex items-center gap-2">
        <GitBranch size={13} strokeWidth={1.6} className="text-rv-tab-inactive flex-shrink-0" />
        <input value={branch.name} onChange={e => upd('name', e.target.value)} placeholder="Branch name (e.g. Paid inquiry)" className="flex-1 h-8 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
        <button onClick={onRemove} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray hover:text-red-600 transition-all duration-250 text-rv-tab-inactive"><X size={12} strokeWidth={1.6} /></button>
      </div>
      <input value={branch.condition} onChange={e => upd('condition', e.target.value)} placeholder="Condition / trigger (e.g. If influencer replies asking about rates)" className="w-full h-8 px-3 text-xs border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
      <textarea value={branch.instructions} onChange={e => upd('instructions', e.target.value)} rows={2} placeholder="Instructions for this path..." className={textarea + ' text-xs'} />
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-rv-tab-inactive">Prompt / Template</span>
          {branch.prompt && <CopyButton text={branch.prompt} />}
        </div>
        <textarea value={branch.prompt} onChange={e => upd('prompt', e.target.value)} rows={2} placeholder="Copy-paste prompt for this branch..." className={textarea + ' font-mono text-xs'} />
      </div>
      <textarea value={branch.notes} onChange={e => upd('notes', e.target.value)} rows={1} placeholder="Notes..." className={textarea + ' text-xs'} />
      <div className="flex flex-wrap gap-2">
        {branch.files.map(f => (
          <div key={f.id} className="flex items-center gap-1.5 h-7 px-2.5 bg-rv-gray rounded-full text-xs">
            <Paperclip size={10} strokeWidth={1.6} />
            <a href={f.url} target="_blank" rel="noreferrer" className="hover:underline max-w-[100px] truncate">{f.name}</a>
            <button onClick={() => upd('files', branch.files.filter(x => x.id !== f.id))} className="text-rv-tab-inactive hover:text-red-600 transition-colors"><X size={9} strokeWidth={2} /></button>
          </div>
        ))}
        <button onClick={() => fileRef.current?.click()} className="h-7 px-2.5 rounded-full text-xs bg-rv-gray hover:bg-black hover:text-white transition-all duration-250 flex items-center gap-1">
          <FileUp size={10} strokeWidth={1.6} />Attach
        </button>
      </div>
      <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
    </div>
  );
}
// ── Add/Edit Flow Modal ────────────────────────────────────────────────────

function FlowModal({ initial, onClose, onSave }: {
  initial: Workflow | null; onClose: () => void; onSave: (w: Workflow) => void;
}) {
  const isEdit = !!initial;
  const [wf, setWf] = useState<Workflow>(initial ? { ...initial } : newWorkflow());
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'platform' | 'details' | 'steps' | 'files'>('platform');
  const flowFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function upd<K extends keyof Workflow>(k: K, v: Workflow[K]) { setWf(w => ({ ...w, [k]: v })); }

  function addStep() { upd('steps', [...wf.steps, newStep()]); }
  function updateStep(id: string, s: Step) { upd('steps', wf.steps.map(x => x.id === id ? s : x)); }
  function removeStep(id: string) { upd('steps', wf.steps.filter(x => x.id !== id)); }
  function moveStep(idx: number, dir: -1 | 1) {
    const arr = [...wf.steps];
    const tmp = arr[idx]; arr[idx] = arr[idx + dir]; arr[idx + dir] = tmp;
    upd('steps', arr);
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !wf.tags.includes(t)) { upd('tags', [...wf.tags, t]); }
    setTagInput('');
  }

  function handleFlowFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).map(f => ({ id: uid(), name: f.name, size: f.size, url: URL.createObjectURL(f) }));
    upd('files', [...wf.files, ...files]);
  }

  async function handleSave() {
    if (!wf.title.trim()) return;
    setSaving(true);
    const updated = { ...wf, updatedAt: now(), activityLog: [isEdit ? 'Workflow updated.' : 'Workflow created.', ...wf.activityLog] };
    await new Promise(r => setTimeout(r, 300));
    onSave(updated);
    setSaving(false);
  }

  const tabs = [
    { id: 'platform', label: 'Platform' },
    { id: 'details', label: 'Details' },
    { id: 'steps', label: `Steps (${wf.steps.length})` },
    { id: 'files', label: `Files (${wf.files.length})` },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="max-w-screen-md mx-auto my-8 rounded-2xl bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-rv-gray">
          <h2 className="text-lg font-medium">{isEdit ? 'Edit Workflow' : 'Add Flow'}</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250"><X size={16} strokeWidth={1.6} /></button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-rv-gray px-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveSection(t.id as typeof activeSection)}
              className={`pb-3 pt-3 mr-6 text-sm transition-all duration-250 relative ${activeSection === t.id ? 'text-black font-medium' : 'text-rv-tab-inactive hover:text-black'}`}>
              {t.label}
              {activeSection === t.id && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-black rounded-full" />}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* ── Platform Tab ── */}
          {activeSection === 'platform' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Platform / Category</label>
                  <select value={wf.platform} onChange={e => upd('platform', e.target.value as Platform)} className={inp}>
                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Platform Name</label>
                  <input value={wf.platformName} onChange={e => upd('platformName', e.target.value)} placeholder="e.g. Brand Instagram" className={inp} />
                </div>
              </div>
              <div>
                <label className={lbl}>Login URL</label>
                <input type="url" value={wf.loginUrl} onChange={e => upd('loginUrl', e.target.value)} placeholder="https://..." className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Username / Login Email</label>
                  <input value={wf.loginEmail} onChange={e => upd('loginEmail', e.target.value)} placeholder="email@example.com" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Password</label>
                  <input type="password" value={wf.loginPassword} onChange={e => upd('loginPassword', e.target.value)} placeholder="••••••••" className={inp} />
                </div>
              </div>
              <div>
                <label className={lbl}>2FA / Backup Notes</label>
                <textarea value={wf.twoFaNotes} onChange={e => upd('twoFaNotes', e.target.value)} rows={2} placeholder="e.g. 2FA is on Google Authenticator..." className={textarea} />
              </div>
              <div>
                <label className={lbl}>Platform Notes</label>
                <textarea value={wf.platformNotes} onChange={e => upd('platformNotes', e.target.value)} rows={3} placeholder="Platform-specific instructions or context..." className={textarea} />
              </div>
            </>
          )}

          {/* ── Details Tab ── */}
          {activeSection === 'details' && (
            <>
              <div>
                <label className={lbl}>Workflow Title *</label>
                <input value={wf.title} onChange={e => upd('title', e.target.value)} placeholder="e.g. Influencer Outreach" className={inp} />
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea value={wf.description} onChange={e => upd('description', e.target.value)} rows={3} placeholder="What does this workflow accomplish?" className={textarea} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Priority</label>
                  <select value={wf.priority} onChange={e => upd('priority', e.target.value as Priority)} className={inp}>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <select value={wf.status} onChange={e => upd('status', e.target.value as Status)} className={inp}>
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Owner / Assigned VA</label>
                <input value={wf.owner} onChange={e => upd('owner', e.target.value)} placeholder="VA name or initials" className={inp} />
              </div>
              <div>
                <label className={lbl}>Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {wf.tags.map(t => (
                    <span key={t} className="h-7 pl-3 pr-1.5 bg-rv-gray rounded-full text-xs flex items-center gap-1.5">
                      {t}
                      <button onClick={() => upd('tags', wf.tags.filter(x => x !== t))} className="text-rv-tab-inactive hover:text-black"><X size={10} strokeWidth={2} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag + Enter" className={inp + ' flex-1'} />
                  <button onClick={addTag} className="h-9 px-4 rounded-full bg-rv-gray text-sm hover:bg-black hover:text-white transition-all duration-250">Add</button>
                </div>
              </div>
            </>
          )}

          {/* ── Steps Tab ── */}
          {activeSection === 'steps' && (
            <div className="space-y-3">
              {wf.steps.map((step, i) => (
                <StepEditor key={step.id} step={step} index={i} total={wf.steps.length}
                  onChange={s => updateStep(step.id, s)}
                  onRemove={() => removeStep(step.id)}
                  onMoveUp={() => moveStep(i, -1)}
                  onMoveDown={() => moveStep(i, 1)} />
              ))}
              <button onClick={addStep} className="w-full h-11 rounded-2xl border border-dashed border-rv-tab-inactive hover:border-black hover:bg-rv-gray text-sm transition-all duration-250 flex items-center justify-center gap-2 text-rv-tab-inactive hover:text-black">
                <Plus size={15} strokeWidth={1.6} />Add Step
              </button>
            </div>
          )}

          {/* ── Files Tab ── */}
          {activeSection === 'files' && (
            <div>
              <p className="text-xs text-rv-tab-inactive mb-3">Upload files that belong to this entire workflow — templates, SOPs, spreadsheets, brand assets, etc.</p>
              <div className="space-y-2">
                {wf.files.map(f => (
                  <div key={f.id} className="flex items-center gap-2 p-3 border border-rv-gray rounded-2xl">
                    <Paperclip size={14} strokeWidth={1.6} className="text-rv-tab-inactive flex-shrink-0" />
                    <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 text-sm hover:underline truncate">{f.name}</a>
                    <span className="text-xs text-rv-tab-inactive">{(f.size / 1024).toFixed(1)} KB</span>
                    <button onClick={() => upd('files', wf.files.filter(x => x.id !== f.id))} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray hover:text-red-600 transition-all duration-250 text-rv-tab-inactive"><X size={13} strokeWidth={1.6} /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => flowFileRef.current?.click()} className="mt-3 w-full h-24 rounded-2xl border-2 border-dashed border-rv-gray hover:border-black transition-all duration-250 flex flex-col items-center justify-center gap-2 text-rv-tab-inactive hover:text-black">
                <FileUp size={20} strokeWidth={1.4} />
                <span className="text-sm">Click to upload files</span>
                <span className="text-xs">Supports any file type</span>
              </button>
              <input ref={flowFileRef} type="file" multiple className="hidden" onChange={handleFlowFiles} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 h-11 rounded-full border border-rv-gray text-sm font-medium transition-all duration-250 hover:opacity-70">Cancel</button>
          <button onClick={handleSave} disabled={saving || !wf.title.trim()} className="flex-1 h-11 rounded-full bg-black text-white text-sm font-medium flex items-center justify-center gap-2 transition-all duration-250 active:scale-95 hover:opacity-70 disabled:opacity-50">
            {saving ? <Loader2 size={15} strokeWidth={1.6} className="animate-spin" /> : null}
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Flow'}
          </button>
        </div>
      </div>
    </div>
  );
}
// ── Flow Detail View ────────────────────────────────────────────────────────

function StepDetail({ step, index }: { step: Step; index: number }) {
  const [checkState, setCheckState] = useState<Record<string, boolean>>({});
  return (
    <Collapsible title={`Step ${index + 1}: ${step.title || 'Untitled Step'}`} badge={
      step.checklist.length > 0 ? <Badge cls="bg-rv-gray text-rv-tab-inactive">{step.checklist.length} items</Badge> : undefined
    }>
      <div className="space-y-3 pt-1">
        {step.instructions && (
          <div>
            <p className={lbl}>Instructions</p>
            <p className="text-sm whitespace-pre-wrap">{step.instructions}</p>
          </div>
        )}
        {step.prompt && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className={lbl}>Prompt / Script</p>
              <CopyButton text={step.prompt} />
            </div>
            <pre className="text-xs bg-rv-gray rounded-2xl p-3 whitespace-pre-wrap font-mono overflow-x-auto">{step.prompt}</pre>
          </div>
        )}
        {step.notes && (
          <div>
            <p className={lbl}>Notes</p>
            <p className="text-sm text-rv-tab-inactive whitespace-pre-wrap">{step.notes}</p>
          </div>
        )}
        {(step.dueDate || step.frequency) && (
          <div className="flex gap-4">
            {step.dueDate && <span className="text-xs text-rv-tab-inactive">📅 Due: {step.dueDate}</span>}
            {step.frequency && <span className="text-xs text-rv-tab-inactive">🔁 {step.frequency}</span>}
          </div>
        )}
        {step.checklist.length > 0 && (
          <div>
            <p className={lbl}>Checklist</p>
            <div className="space-y-1.5">
              {step.checklist.map(c => (
                <label key={c.id} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={!!checkState[c.id]} onChange={e => setCheckState(s => ({ ...s, [c.id]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-black" />
                  <span className={`text-sm ${checkState[c.id] ? 'line-through text-rv-tab-inactive' : ''}`}>{c.text}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {step.files.length > 0 && (
          <div>
            <p className={lbl}>Attached Files</p>
            <div className="flex flex-wrap gap-2">
              {step.files.map(f => (
                <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 h-7 px-3 bg-rv-gray rounded-full text-xs hover:bg-black hover:text-white transition-all duration-250">
                  <Paperclip size={11} strokeWidth={1.6} />{f.name}
                </a>
              ))}
            </div>
          </div>
        )}
        {step.branches.length > 0 && (
          <div>
            <p className={lbl}>Branches After This Step</p>
            <div className="space-y-2">
              {step.branches.map(br => (
                <div key={br.id} className="border border-rv-gray rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <GitBranch size={13} strokeWidth={1.6} className="text-rv-tab-inactive" />
                    <span className="text-sm font-medium">{br.name || 'Unnamed Branch'}</span>
                  </div>
                  {br.condition && <p className="text-xs text-rv-tab-inactive ml-5">If: {br.condition}</p>}
                  {br.instructions && <p className="text-sm ml-5">{br.instructions}</p>}
                  {br.prompt && (
                    <div className="ml-5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-rv-tab-inactive uppercase tracking-wider">Prompt</span>
                        <CopyButton text={br.prompt} />
                      </div>
                      <pre className="text-xs bg-rv-gray rounded-xl p-2 whitespace-pre-wrap font-mono">{br.prompt}</pre>
                    </div>
                  )}
                  {br.notes && <p className="text-xs text-rv-tab-inactive ml-5">{br.notes}</p>}
                  {br.files.length > 0 && (
                    <div className="ml-5 flex flex-wrap gap-1.5">
                      {br.files.map(f => (
                        <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 h-6 px-2.5 bg-rv-gray rounded-full text-xs hover:bg-black hover:text-white transition-all duration-250">
                          <Paperclip size={9} strokeWidth={1.6} />{f.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Collapsible>
  );
}

function FlowDetail({ workflow, onClose, onEdit }: { workflow: Workflow; onClose: () => void; onEdit: () => void }) {
  const status = statusInfo(workflow.status);
  const priority = priorityInfo(workflow.priority);
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="max-w-screen-md mx-auto my-8 rounded-2xl bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-rv-gray">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge cls="bg-rv-gray text-rv-tab-inactive">{platformLabel(workflow.platform)}</Badge>
              <Badge cls={status.cls}>{status.label}</Badge>
              <Badge cls={priority.cls}>{priority.label}</Badge>
            </div>
            <h2 className="text-xl font-medium">{workflow.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="h-9 px-4 rounded-full bg-rv-gray text-sm font-medium flex items-center gap-1.5 hover:bg-black hover:text-white transition-all duration-250">
              <Pencil size={13} strokeWidth={1.6} />Edit
            </button>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250"><X size={16} strokeWidth={1.6} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Overview */}
          {(workflow.description || workflow.owner || workflow.tags.length > 0) && (
            <div className="space-y-2">
              {workflow.description && <p className="text-sm text-rv-tab-inactive">{workflow.description}</p>}
              <div className="flex flex-wrap gap-2 text-xs text-rv-tab-inactive">
                {workflow.owner && <span>👤 {workflow.owner}</span>}
                <span>📅 Updated {fmtDate(workflow.updatedAt)}</span>
                <span>🔢 {workflow.steps.length} steps</span>
                {workflow.files.length > 0 && <span>📎 {workflow.files.length} files</span>}
              </div>
              {workflow.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {workflow.tags.map(t => <Badge key={t} cls="bg-rv-gray text-rv-tab-inactive">#{t}</Badge>)}
                </div>
              )}
            </div>
          )}

          {/* Platform Login */}
          <Collapsible title="Platform Login">
            <div className="space-y-3 pt-1">
              {workflow.loginUrl && (
                <div className="flex items-center gap-2">
                  <span className={lbl + ' m-0'}>Login URL:</span>
                  <a href={workflow.loginUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline truncate">{workflow.loginUrl}</a>
                </div>
              )}
              {workflow.loginEmail && (
                <div className="flex items-center gap-2">
                  <span className={lbl + ' m-0'}>Username:</span>
                  <span className="text-sm flex-1">{workflow.loginEmail}</span>
                  <CopyButton text={workflow.loginEmail} />
                </div>
              )}
              {workflow.loginPassword && (
                <div className="flex items-center gap-2">
                  <span className={lbl + ' m-0'}>Password:</span>
                  <span className="text-sm flex-1 font-mono">{showPwd ? workflow.loginPassword : '••••••••'}</span>
                  <button onClick={() => setShowPwd(s => !s)} className="text-xs text-rv-tab-inactive hover:text-black transition-colors">{showPwd ? 'Hide' : 'Show'}</button>
                  <CopyButton text={workflow.loginPassword} />
                </div>
              )}
              {workflow.twoFaNotes && (
                <div>
                  <p className={lbl}>2FA Notes</p>
                  <p className="text-sm">{workflow.twoFaNotes}</p>
                </div>
              )}
              {workflow.platformNotes && (
                <div>
                  <p className={lbl}>Platform Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{workflow.platformNotes}</p>
                </div>
              )}
            </div>
          </Collapsible>

          {/* Steps */}
          {workflow.steps.length > 0 && (
            <div className="space-y-2">
              <p className={lbl}>Workflow Steps</p>
              {workflow.steps.map((step, i) => <StepDetail key={step.id} step={step} index={i} />)}
            </div>
          )}

          {/* Files */}
          {workflow.files.length > 0 && (
            <Collapsible title={`Flow Files (${workflow.files.length})`} defaultOpen>
              <div className="space-y-2 pt-1">
                {workflow.files.map(f => (
                  <div key={f.id} className="flex items-center gap-2 p-3 border border-rv-gray rounded-2xl">
                    <Paperclip size={14} strokeWidth={1.6} className="text-rv-tab-inactive flex-shrink-0" />
                    <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 text-sm hover:underline truncate">{f.name}</a>
                    <span className="text-xs text-rv-tab-inactive">{(f.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            </Collapsible>
          )}

          {/* Activity Log */}
          {workflow.activityLog.length > 0 && (
            <Collapsible title="Activity Log">
              <div className="space-y-1 pt-1">
                {workflow.activityLog.map((entry, i) => (
                  <p key={i} className="text-xs text-rv-tab-inactive">{entry}</p>
                ))}
              </div>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}
// ── Flow Card ─────────────────────────────────────────────────────────────

function FlowCard({ workflow, onView, onEdit, onDuplicate, onArchive }: {
  workflow: Workflow;
  onView: () => void; onEdit: () => void; onDuplicate: () => void; onArchive: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = statusInfo(workflow.status);
  const priority = priorityInfo(workflow.priority);
  const totalFiles = workflow.files.length + workflow.steps.reduce((a, s) => a + s.files.length + s.branches.reduce((b, br) => b + br.files.length, 0), 0);
  const totalBranches = workflow.steps.reduce((a, s) => a + s.branches.length, 0);

  return (
    <div className="border border-rv-gray rounded-2xl p-4 hover:border-black transition-all duration-250 group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge cls="bg-rv-gray text-rv-tab-inactive">{platformLabel(workflow.platform)}</Badge>
            <Badge cls={status.cls}>{status.label}</Badge>
            <Badge cls={priority.cls}>{priority.label}</Badge>
          </div>
          <h3 className="text-base font-medium truncate">{workflow.title || 'Untitled Workflow'}</h3>
          {workflow.platformName && <p className="text-xs text-rv-tab-inactive">{workflow.platformName}</p>}
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(o => !o)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 flex-shrink-0">
            <MoreHorizontal size={15} strokeWidth={1.6} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-10 bg-white border border-rv-gray rounded-2xl shadow-lg py-1 min-w-[140px]" onMouseLeave={() => setMenuOpen(false)}>
              {[
                { icon: Eye, label: 'View', fn: () => { onView(); setMenuOpen(false); } },
                { icon: Pencil, label: 'Edit', fn: () => { onEdit(); setMenuOpen(false); } },
                { icon: Layers, label: 'Duplicate', fn: () => { onDuplicate(); setMenuOpen(false); } },
                { icon: Archive, label: 'Archive', fn: () => { onArchive(); setMenuOpen(false); } },
              ].map(({ icon: Icon, label, fn }) => (
                <button key={label} onClick={fn} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-rv-gray transition-all duration-250">
                  <Icon size={13} strokeWidth={1.6} />{label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {workflow.description && <p className="text-sm text-rv-tab-inactive line-clamp-2 mb-3">{workflow.description}</p>}

      {/* Tags */}
      {workflow.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {workflow.tags.slice(0, 4).map(t => <Badge key={t} cls="bg-rv-gray text-rv-tab-inactive">#{t}</Badge>)}
          {workflow.tags.length > 4 && <Badge cls="bg-rv-gray text-rv-tab-inactive">+{workflow.tags.length - 4}</Badge>}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-rv-tab-inactive">
          <span>{workflow.steps.length} steps</span>
          {totalBranches > 0 && <span>{totalBranches} branches</span>}
          {totalFiles > 0 && <span className="flex items-center gap-1"><Paperclip size={10} strokeWidth={1.6} />{totalFiles}</span>}
          {workflow.owner && <span>👤 {workflow.owner}</span>}
        </div>
        <span className="text-xs text-rv-tab-inactive">{fmtDate(workflow.updatedAt)}</span>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-rv-gray opacity-0 group-hover:opacity-100 transition-all duration-250">
        <button onClick={onView} className="flex-1 h-8 rounded-full bg-rv-gray text-xs font-medium hover:bg-black hover:text-white transition-all duration-250">View</button>
        <button onClick={onEdit} className="flex-1 h-8 rounded-full bg-rv-gray text-xs font-medium hover:bg-black hover:text-white transition-all duration-250">Edit</button>
        <button onClick={onDuplicate} className="flex-1 h-8 rounded-full bg-rv-gray text-xs font-medium hover:bg-black hover:text-white transition-all duration-250">Duplicate</button>
      </div>
    </div>
  );
}
// ── Main Page ─────────────────────────────────────────────────────────────

const EXAMPLE_WORKFLOW: Workflow = {
  id: 'example-1',
  platform: 'email_outreach',
  platformName: 'Gmail / Outreach',
  loginEmail: 'outreach@brand.com',
  loginPassword: '',
  loginUrl: 'https://mail.google.com',
  twoFaNotes: '',
  platformNotes: 'Use the Outreach Gmail. Reply within 24h of receiving messages.',
  title: 'Influencer Outreach',
  description: 'End-to-end flow for finding, emailing, and managing influencer partnerships.',
  priority: 'high',
  status: 'active',
  owner: 'VA',
  tags: ['influencer', 'outreach', 'email'],
  steps: [
    {
      id: 'ex-s1', title: 'Influencer Research', instructions: 'Find 20 influencers in the target niche with 10K-500K followers. Check engagement rate (aim for >3%). Use hashtag search and competitor tags.', prompt: '', notes: 'Avoid anyone with fake followers or under 2% engagement.', checklist: [{ id: 'c1', text: 'Search target hashtags', done: false }, { id: 'c2', text: 'Check engagement rate', done: false }, { id: 'c3', text: 'Verify audience demographics', done: false }], dueDate: '', frequency: 'Weekly', files: [],
      branches: [],
    },
    {
      id: 'ex-s2', title: 'Build Email List', instructions: 'Compile influencer contact info into the CSV template. Include name, handle, follower count, email, and engagement rate.', prompt: '', notes: 'Use Hunter.io or the bio link email if available.', checklist: [{ id: 'c4', text: 'Fill in CSV template', done: false }], dueDate: '', frequency: '', files: [],
      branches: [],
    },
    {
      id: 'ex-s3', title: 'Send Outreach Message', instructions: 'Send personalized outreach emails using the template below. Customize the [NAME] and [HANDLE] fields for each influencer.', prompt: `Hi [NAME],

I came across your page @[HANDLE] and love your content!

We'd love to explore a collaboration with CHAY SOLE. Would you be open to chatting about a gifting or paid partnership?

Let me know what works best for you!

Best,
[YOUR NAME]`, notes: 'Send max 20 emails per day. Follow up after 5 business days if no reply.', checklist: [], dueDate: '', frequency: 'Daily (batches of 20)', files: [],
      branches: [
        { id: 'ex-b1', name: 'Paid Inquiry', condition: 'Influencer replies asking about rates or paid deals', instructions: 'Forward to brand owner with influencer profile and their rate ask. Do not quote a price without approval.', prompt: 'Hi [NAME], thanks for getting back to us! Let me check with our team on budget and get back to you shortly.', notes: '', files: [], steps: [] },
        { id: 'ex-b2', name: 'Organic / Gifting Inquiry', condition: 'Influencer is interested in gifting only', instructions: 'Collect shipping address and sizing. Fill out the gifting form and mark Ready to Ship in the tracker.', prompt: 'Amazing! We would love to send you some pieces. Could you share your shipping address and sizing?', notes: '', files: [], steps: [] },
        { id: 'ex-b3', name: 'No Response', condition: 'No reply after 5 business days', instructions: 'Send one follow-up email using the template below. If still no reply after another 5 days, mark as Not a Fit.', prompt: `Hi [NAME], just following up on my previous message! We'd still love to connect if you're open to it. No worries if not — thanks for your time!`, notes: '', files: [], steps: [] },
        { id: 'ex-b4', name: 'Not a Fit', condition: 'Influencer declines or is not suitable', instructions: 'Mark as declined in the tracker. Do not reach out again.', prompt: '', notes: '', files: [], steps: [] },
      ],
    },
  ],
  files: [],
  createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  activityLog: ['Workflow created.', 'Added branching logic for outreach responses.', 'Status set to Active.'],
};

export default function VAWorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [EXAMPLE_WORKFLOW];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [viewingWorkflow, setViewingWorkflow] = useState<Workflow | null>(null);
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | Platform>('all');

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  }, [workflows]);

  function saveWorkflow(wf: Workflow) {
    setWorkflows(prev => {
      const exists = prev.find(x => x.id === wf.id);
      if (exists) return prev.map(x => x.id === wf.id ? wf : x);
      return [wf, ...prev];
    });
    setShowAddModal(false);
    setEditingWorkflow(null);
  }

  function duplicateWorkflow(wf: Workflow) {
    const dup: Workflow = { ...wf, id: uid(), title: wf.title + ' (Copy)', createdAt: now(), updatedAt: now(), activityLog: ['Workflow duplicated.'] };
    setWorkflows(prev => [dup, ...prev]);
  }

  function archiveWorkflow(id: string) {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: 'archived', updatedAt: now(), activityLog: ['Workflow archived.', ...w.activityLog] } : w));
  }

  // Filter
  const filtered = workflows.filter(w => {
    if (search && !w.title.toLowerCase().includes(search.toLowerCase()) && !w.tags.join(' ').toLowerCase().includes(search.toLowerCase()) && !w.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPlatform !== 'all' && w.platform !== filterPlatform) return false;
    if (filterStatus !== 'all' && w.status !== filterStatus) return false;
    if (filterPriority !== 'all' && w.priority !== filterPriority) return false;
    if (activeTab !== 'all' && w.platform !== activeTab) return false;
    return true;
  });

  const nonArchived = filtered.filter(w => w.status !== 'archived');
  const archived = filtered.filter(w => w.status === 'archived');
  const platformCounts: Record<string, number> = {};
  workflows.filter(w => w.status !== 'archived').forEach(w => { platformCounts[w.platform] = (platformCounts[w.platform] || 0) + 1; });

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium">VA Workflows</h1>
          <p className="text-sm text-rv-tab-inactive mt-0.5">Central workflow hub for your virtual assistant</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="h-11 px-4 rounded-full bg-black text-white text-sm font-medium flex items-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70">
          <Plus size={16} strokeWidth={1.6} />Add Flow
        </button>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-0 overflow-x-auto border-b border-rv-gray mb-6 -mx-0">
        {[{ id: 'all', label: 'All', count: workflows.filter(w => w.status !== 'archived').length }, ...PLATFORMS.map(p => ({ id: p.value, label: p.label, count: platformCounts[p.value] || 0 }))].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 pt-1 mr-5 text-sm transition-all duration-250 relative whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? 'text-black font-medium' : 'text-rv-tab-inactive hover:text-black'}`}>
            {tab.label}
            {tab.count > 0 && <span className="ml-1 text-xs text-rv-tab-inactive">({tab.count})</span>}
            {activeTab === tab.id && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-black rounded-full" />}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} strokeWidth={1.6} className="absolute left-3 top-1/2 -translate-y-1/2 text-rv-tab-inactive" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workflows, tags..." className="w-full h-9 pl-9 pr-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250 bg-white">
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250 bg-white">
          <option value="all">All Priorities</option>
          {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Grid */}
      {nonArchived.length === 0 && archived.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-rv-gray flex items-center justify-center mx-auto mb-3">
            <Layers size={20} strokeWidth={1.4} className="text-rv-tab-inactive" />
          </div>
          <p className="text-sm font-medium mb-1">No workflows yet</p>
          <p className="text-xs text-rv-tab-inactive mb-4">Create your first workflow to get started</p>
          <button onClick={() => setShowAddModal(true)} className="h-9 px-4 rounded-full bg-black text-white text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70">
            Add Flow
          </button>
        </div>
      )}

      {nonArchived.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {nonArchived.map(w => (
            <FlowCard key={w.id} workflow={w}
              onView={() => setViewingWorkflow(w)}
              onEdit={() => setEditingWorkflow(w)}
              onDuplicate={() => duplicateWorkflow(w)}
              onArchive={() => archiveWorkflow(w.id)} />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-medium text-rv-tab-inactive uppercase tracking-wider mb-3">Archived ({archived.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-60">
            {archived.map(w => (
              <FlowCard key={w.id} workflow={w}
                onView={() => setViewingWorkflow(w)}
                onEdit={() => setEditingWorkflow(w)}
                onDuplicate={() => duplicateWorkflow(w)}
                onArchive={() => archiveWorkflow(w.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <FlowModal initial={null} onClose={() => setShowAddModal(false)} onSave={saveWorkflow} />
      )}
      {editingWorkflow && (
        <FlowModal initial={editingWorkflow} onClose={() => setEditingWorkflow(null)} onSave={saveWorkflow} />
      )}
      {viewingWorkflow && (
        <FlowDetail workflow={viewingWorkflow} onClose={() => setViewingWorkflow(null)} onEdit={() => { setEditingWorkflow(viewingWorkflow); setViewingWorkflow(null); }} />
      )}
    </div>
  );
          }
