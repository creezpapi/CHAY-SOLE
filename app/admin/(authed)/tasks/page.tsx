'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Pencil, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getTasks, createTask, updateTask, deleteTask,
  getTeamMembers, createTeamMember,
  getCalendarEntries, createCalendarEntry, updateCalendarEntry, deleteCalendarEntry,
} from './actions';
import type { Task, TeamMember, BrandCalendarEntry } from '@/lib/types';

type CalEntry = BrandCalendarEntry;

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function TasksPage() {
  const today = new Date();
  const [tasks, setTasks] = useState<(Task & { team_members?: TeamMember | null })[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [calEntries, setCalEntries] = useState<CalEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayEntries, setDayEntries] = useState<CalEntry[]>([]);

  // New task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [showMemberForm, setShowMemberForm] = useState(false);

  // Edit task
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Calendar entry form
  const [calEntryTitle, setCalEntryTitle] = useState('');
  const [calEntryNotes, setCalEntryNotes] = useState('');
  const [editEntryId, setEditEntryId] = useState<string | null>(null);

  async function load() {
    const [t, m] = await Promise.all([getTasks(), getTeamMembers()]);
    setTasks(t as typeof tasks);
    setMembers(m as TeamMember[]);
  }

  async function loadCal() {
    const entries = await getCalendarEntries(calYear, calMonth);
    setCalEntries(entries as CalEntry[]);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { loadCal(); }, [calYear, calMonth]);

  function selectDay(day: number) {
    setSelectedDay(day);
    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setDayEntries(calEntries.filter((e) => e.entry_date === dateStr));
    setCalEntryTitle('');
    setCalEntryNotes('');
    setEditEntryId(null);
  }

  async function handleAddTask() {
    if (!newTitle.trim()) return;
    await createTask(newTitle, newAssignee || null, newDue || null);
    setNewTitle(''); setNewAssignee(''); setNewDue(''); setShowTaskForm(false);
    load();
  }

  async function handleToggle(task: Task & { team_members?: TeamMember | null }) {
    await updateTask(task.id, { completed: !task.completed });
    load();
  }

  async function handleEditTask(id: string) {
    if (!editTitle.trim()) return;
    await updateTask(id, { title: editTitle });
    setEditTaskId(null);
    load();
  }

  async function handleDeleteTask(id: string) {
    await deleteTask(id);
    load();
  }

  async function handleAddMember() {
    if (!newMemberName.trim()) return;
    await createTeamMember(newMemberName);
    setNewMemberName(''); setShowMemberForm(false);
    load();
  }

  async function handleAddCalEntry() {
    if (!calEntryTitle.trim() || !selectedDay) return;
    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    if (editEntryId) {
      await updateCalendarEntry(editEntryId, calEntryTitle, calEntryNotes || null);
    } else {
      await createCalendarEntry(dateStr, calEntryTitle, calEntryNotes || null);
    }
    setCalEntryTitle(''); setCalEntryNotes(''); setEditEntryId(null);
    await loadCal();
    selectDay(selectedDay);
  }

  async function handleDeleteEntry(id: string) {
    await deleteCalendarEntry(id);
    await loadCal();
    if (selectedDay) selectDay(selectedDay);
  }

  // Calendar grid
  const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const entryDateSet = new Set(calEntries.map((e) => parseInt(e.entry_date.split('-')[2])));

  const inp = 'w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250';

  return (
    <div className="space-y-10">
      {/* Tasks Block */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-medium">Tasks</h1>
          <button onClick={() => setShowTaskForm(true)}
            className="h-11 px-4 rounded-full bg-black text-white text-sm font-medium flex items-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70">
            <Plus size={16} strokeWidth={1.6} />Add task
          </button>
        </div>

        {showTaskForm && (
          <div className="mb-4 p-4 border border-rv-gray rounded-2xl space-y-3">
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..." className={inp} />
            <div className="flex gap-2">
              <select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}
                className={inp + ' flex-1 bg-white'}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} className={inp + ' flex-1'} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddTask} className="h-9 px-4 rounded-full bg-black text-white text-sm font-medium transition-all duration-250 active:scale-95">Save</button>
              <button onClick={() => setShowTaskForm(false)} className="h-9 px-4 rounded-full border border-rv-gray text-sm transition-all duration-250">Cancel</button>
            </div>
          </div>
        )}

        {/* Team members */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-rv-tab-inactive">Team:</span>
          {members.map((m) => (
            <span key={m.id} className="h-9 px-3 rounded-full bg-rv-gray text-xs flex items-center gap-1.5">
              {m.name}
            </span>
          ))}
          {showMemberForm ? (
            <div className="flex gap-2 items-center">
              <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Member name" className="h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250 w-36" />
              <button onClick={handleAddMember} className="h-9 px-3 rounded-full bg-black text-white text-xs font-medium transition-all duration-250 active:scale-95">Add</button>
              <button onClick={() => setShowMemberForm(false)} className="h-9 px-3 rounded-full border border-rv-gray text-xs transition-all duration-250">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowMemberForm(true)} className="h-9 px-3 rounded-full border border-rv-gray text-xs text-rv-tab-inactive hover:text-black transition-all duration-250">+ Add member</button>
          )}
        </div>

        <div className="space-y-0">
          {tasks.length === 0 && <p className="py-8 text-center text-rv-tab-inactive text-sm">No tasks yet.</p>}
          {tasks.map((task) => (
            <div key={task.id}
              className={'flex items-center gap-3 py-3 border-b border-rv-gray ' + (task.completed ? 'opacity-60' : '')}>
              <button onClick={() => handleToggle(task)}
                className={'h-8 w-8 flex items-center justify-center rounded border transition-all duration-250 active:scale-95 flex-shrink-0 ' +
                  (task.completed ? 'bg-black border-black text-white' : 'border-rv-gray hover:border-black')}>
                {task.completed && <Check size={14} strokeWidth={1.6} />}
              </button>
              <div className="flex-1 min-w-0">
                {editTaskId === task.id ? (
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEditTask(task.id); if (e.key === 'Escape') setEditTaskId(null); }}
                    className="h-7 px-2 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black w-full" autoFocus />
                ) : (
                  <p className={'text-sm ' + (task.completed ? 'line-through text-rv-tab-inactive' : '')}>{task.title}</p>
                )}
              </div>
              {task.team_members && (
                <span className="h-9 px-3 rounded-full bg-rv-gray text-xs flex items-center flex-shrink-0">{task.team_members.name}</span>
              )}
              {task.due_date && (
                <span className="text-xs text-rv-tab-inactive flex-shrink-0">{new Date(task.due_date + 'T00:00:00').toLocaleDateString()}</span>
              )}
              <button onClick={() => { setEditTaskId(task.id); setEditTitle(task.title); }}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 flex-shrink-0">
                <Pencil size={14} strokeWidth={1.6} />
              </button>
              <button onClick={() => handleDeleteTask(task.id)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 flex-shrink-0 text-rv-tab-inactive hover:text-red-600">
                <X size={14} strokeWidth={1.6} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Calendar Block */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-medium">Brand Calendar</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => { if (calMonth === 1) { setCalYear((y) => y-1); setCalMonth(12); } else setCalMonth((m) => m-1); }}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250">
              <ChevronLeft size={16} strokeWidth={1.6} />
            </button>
            <span className="text-sm font-medium w-32 text-center">{MONTHS[calMonth-1]} {calYear}</span>
            <button onClick={() => { if (calMonth === 12) { setCalYear((y) => y+1); setCalMonth(1); } else setCalMonth((m) => m+1); }}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250">
              <ChevronRight size={16} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-rv-gray rounded-2xl overflow-hidden mb-4">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
            <div key={d} className="bg-white text-center text-xs text-rv-tab-inactive py-2 font-medium">{d}</div>
          ))}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={'empty-' + i} className="bg-white min-h-[40px]" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const hasEntry = entryDateSet.has(day);
            const isToday = calYear === today.getFullYear() && calMonth === today.getMonth()+1 && day === today.getDate();
            const isSelected = selectedDay === day;
            return (
              <button key={day} onClick={() => selectDay(day)}
                className={'bg-white min-h-[40px] p-1 flex flex-col items-center relative transition-all duration-250 hover:bg-rv-gray ' +
                  (isSelected ? 'ring-2 ring-black ring-inset' : '')}>
                <span className={'text-xs w-6 h-6 flex items-center justify-center rounded-full ' +
                  (isToday ? 'bg-black text-white' : '')}>
                  {day}
                </span>
                {hasEntry && <span className="w-1 h-1 rounded-full bg-black mt-0.5" />}
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <div className="border border-rv-gray rounded-2xl p-4">
            <h3 className="text-sm font-medium mb-3">
              {MONTHS[calMonth-1]} {selectedDay}, {calYear}
            </h3>
            {dayEntries.length > 0 && (
              <div className="space-y-2 mb-4">
                {dayEntries.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{entry.title}</p>
                      {entry.notes && <p className="text-xs text-rv-tab-inactive mt-0.5">{entry.notes}</p>}
                    </div>
                    <button onClick={() => { setEditEntryId(entry.id); setCalEntryTitle(entry.title); setCalEntryNotes(entry.notes || ''); }}
                      className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 flex-shrink-0">
                      <Pencil size={12} strokeWidth={1.6} />
                    </button>
                    <button onClick={() => handleDeleteEntry(entry.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 flex-shrink-0 text-rv-tab-inactive hover:text-red-600">
                      <Trash2 size={12} strokeWidth={1.6} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <input type="text" value={calEntryTitle} onChange={(e) => setCalEntryTitle(e.target.value)}
                placeholder="Entry title..." className={inp} />
              <textarea value={calEntryNotes} onChange={(e) => setCalEntryNotes(e.target.value)}
                placeholder="Notes (optional)" rows={2}
                className="w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none" />
              <div className="flex gap-2">
                <button onClick={handleAddCalEntry}
                  className="h-9 px-4 rounded-full bg-black text-white text-sm font-medium transition-all duration-250 active:scale-95">
                  {editEntryId ? 'Update' : 'Add entry'}
                </button>
                {editEntryId && (
                  <button onClick={() => { setEditEntryId(null); setCalEntryTitle(''); setCalEntryNotes(''); }}
                    className="h-9 px-4 rounded-full border border-rv-gray text-sm transition-all duration-250">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
