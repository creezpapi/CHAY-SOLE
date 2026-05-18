'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { PLATFORMS } from '@/lib/types';
import type { Creative } from '@/lib/types';

type CalendarCreative = Pick<Creative, 'id' | 'title' | 'status' | 'thumb_url' | 'platforms' | 'is_top_performer' | 'post_date'>;

const STATUS_COLORS: Record<string, string> = {
ready_to_launch: 'bg-blue-50 border-blue-200 text-blue-800',
active: 'bg-green-50 border-green-200 text-green-800',
archived: 'bg-rv-gray border-rv-gray text-rv-tab-inactive',
};

const STATUS_DOT: Record<string, string> = {
ready_to_launch: 'bg-blue-500',
active: 'bg-green-500',
archived: 'bg-rv-tab-inactive',
};

function statusLabel(s: string) {
if (s === 'ready_to_launch') return 'Ready to Launch';
return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function PostingCalendar({ creatives }: { creatives: CalendarCreative[] }) {
const today = new Date();
const [year, setYear] = useState(today.getFullYear());
const [month, setMonth] = useState(today.getMonth()); // 0-indexed
const [selectedDate, setSelectedDate] = useState<string | null>(null);

function prevMonth() {
if (month === 0) { setMonth(11); setYear(y => y - 1); }
else setMonth(m => m - 1);
}
function nextMonth() {
if (month === 11) { setMonth(0); setYear(y => y + 1); }
else setMonth(m => m + 1);
}
function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDate(null); }

// Build calendar grid
const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
const daysInMonth = new Date(year, month + 1, 0).getDate();
const monthStr = String(month + 1).padStart(2, '0');

// Map post_date -> creatives
const byDate: Record<string, CalendarCreative[]> = {};
creatives.forEach(c => {
if (c.post_date) {
const d = c.post_date.slice(0, 10); // YYYY-MM-DD
if (!byDate[d]) byDate[d] = [];
byDate[d].push(c);
}
});

// Get creatives for a specific calendar date
function dateKey(day: number) {
return `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
}

const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const selectedCreatives = selectedDate ? (byDate[selectedDate] || []) : [];

// Sorted upcoming: creatives with a post_date on/after today
const upcoming = [...creatives]
.filter(c => c.post_date && c.post_date >= todayKey)
.sort((a, b) => (a.post_date! < b.post_date! ? -1 : 1));

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Calculate padding cells
const paddingCells = Array.from({ length: firstDay });
const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

return (
<div className="space-y-6">
{/* Calendar header */}
<div className="flex items-center gap-3">
<button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250">
<ChevronLeft size={16} strokeWidth={1.6} />
</button>
<h2 className="text-base font-medium min-w-[160px] text-center">{MONTH_NAMES[month]} {year}</h2>
<button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250">
<ChevronRight size={16} strokeWidth={1.6} />
</button>
<button onClick={goToday} className="ml-2 h-8 px-3 rounded-full bg-rv-gray text-xs font-medium hover:bg-black hover:text-white transition-all duration-250">Today</button>
<span className="ml-auto text-xs text-rv-tab-inactive">{Object.values(byDate).reduce((a, b) => a + b.length, 0)} scheduled</span>
</div>

{/* Day headers */}
<div className="grid grid-cols-7 gap-px">
{DAY_NAMES.map(d => (
<div key={d} className="text-center text-xs font-medium text-rv-tab-inactive py-2">{d}</div>
))}
</div>

{/* Calendar grid */}
<div className="grid grid-cols-7 gap-px border border-rv-gray rounded-2xl overflow-hidden bg-rv-gray">
{paddingCells.map((_, i) => (
<div key={'pad-' + i} className="bg-white min-h-[80px] p-2" />
))}
{dayCells.map(day => {
const dk = dateKey(day);
const items = byDate[dk] || [];
const isToday = dk === todayKey;
const isSelected = dk === selectedDate;

return (
<div key={dk} onClick={() => setSelectedDate(isSelected ? null : dk)}
className={`bg-white min-h-[80px] p-2 cursor-pointer transition-all duration-250 ${isSelected ? 'ring-2 ring-inset ring-black' : 'hover:bg-rv-gray'}`}>
<div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-black text-white' : 'text-rv-tab-inactive'}`}>
{day}
</div>
<div className="space-y-1">
{items.slice(0, 3).map(c => (
<div key={c.id} className="flex items-center gap-1 group">
<div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[c.status] || 'bg-rv-tab-inactive'}`} />
<span className="text-xs truncate leading-tight group-hover:underline">{c.title}</span>
</div>
))}
{items.length > 3 && (
<span className="text-xs text-rv-tab-inactive">+{items.length - 3} more</span>
)}
</div>
</div>
);
})}
</div>

{/* Selected date panel */}
{selectedDate && (
<div className="border border-rv-gray rounded-2xl p-4">
<div className="flex items-center justify-between mb-4">
<h3 className="text-sm font-medium">
{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
</h3>
<button onClick={() => setSelectedDate(null)} className="text-xs text-rv-tab-inactive hover:text-black transition-colors">Dismiss</button>
</div>
{selectedCreatives.length === 0 ? (
<p className="text-sm text-rv-tab-inactive">No creatives scheduled for this day.</p>
) : (
<div className="space-y-3">
{selectedCreatives.map(c => (
<Link key={c.id} href={'/admin/creatives/' + c.id}
className="flex items-center gap-3 p-3 border border-rv-gray rounded-2xl hover:border-black transition-all duration-250 group">
<div className="w-10 h-10 bg-rv-gray rounded overflow-hidden flex-shrink-0">
{c.thumb_url ? <img src={c.thumb_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-rv-gray" />}
</div>
<div className="flex-1 min-w-0">
<p className="text-sm font-medium truncate group-hover:underline">{c.title}</p>
<div className="flex items-center gap-2 mt-0.5">
<span className={`inline-flex items-center h-5 px-2 rounded-full text-xs font-medium border ${STATUS_COLORS[c.status] || 'bg-rv-gray'}`}>
{statusLabel(c.status)}
</span>
{c.is_top_performer && (
<span className="h-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex items-center">Top</span>
)}
</div>
{c.platforms.length > 0 && (
<div className="flex gap-1 mt-1 flex-wrap">
{c.platforms.slice(0, 3).map(pk => {
const pl = PLATFORMS.find(p => p.key === pk);
return <span key={pk} className="h-4 px-1.5 rounded-full bg-rv-gray text-rv-tab-inactive text-xs flex items-center">{pl?.label || pk}</span>;
})}
{c.platforms.length > 3 && <span className="h-4 px-1.5 rounded-full bg-rv-gray text-rv-tab-inactive text-xs flex items-center">+{c.platforms.length - 3}</span>}
</div>
)}
</div>
<ChevronRight size={14} strokeWidth={1.6} className="text-rv-tab-inactive flex-shrink-0" />
</Link>
))}
</div>
)}
</div>
)}

{/* Upcoming schedule list */}
<div>
<h3 className="text-xs font-medium text-rv-tab-inactive uppercase tracking-wider mb-3">Upcoming Schedule</h3>
{upcoming.length === 0 ? (
<div className="py-10 text-center">
<Calendar size={24} strokeWidth={1.4} className="mx-auto text-rv-tab-inactive mb-2" />
<p className="text-sm text-rv-tab-inactive">No creatives scheduled yet.</p>
<p className="text-xs text-rv-tab-inactive mt-1">Set a Post Date in any creative to see it here.</p>
</div>
) : (
<div className="space-y-2">
{upcoming.map(c => {
const dateObj = new Date(c.post_date! + 'T12:00:00');
const isUpcomingToday = c.post_date === todayKey;
const isPast = c.post_date! < todayKey;
return (
<Link key={c.id} href={'/admin/creatives/' + c.id}
className="flex items-center gap-3 py-3 border-b border-rv-gray hover:opacity-70 transition-all duration-250 group">
<div className={`flex-shrink-0 w-14 text-center ${isUpcomingToday ? 'text-black' : isPast ? 'text-rv-tab-inactive' : 'text-black'}`}>
<p className="text-xs text-rv-tab-inactive">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</p>
<p className={`text-xl font-medium leading-none ${isUpcomingToday ? 'text-black' : ''}`}>{dateObj.getDate()}</p>
<p className="text-xs text-rv-tab-inactive">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</p>
</div>
{c.thumb_url ? (
<img src={c.thumb_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
) : (
<div className="w-10 h-10 rounded bg-rv-gray flex-shrink-0" />
)}
<div className="flex-1 min-w-0">
<p className="text-sm font-medium truncate group-hover:underline">{c.title}</p>
<div className="flex items-center gap-2 mt-0.5">
<span className={`inline-flex items-center h-5 px-2 rounded-full text-xs font-medium border ${STATUS_COLORS[c.status] || 'bg-rv-gray'}`}>
{statusLabel(c.status)}
</span>
{isUpcomingToday && <span className="text-xs font-medium text-black">Today</span>}
</div>
</div>
<ChevronRight size={14} strokeWidth={1.6} className="text-rv-tab-inactive flex-shrink-0" />
</Link>
);
})}
</div>
)}
</div>
</div>
);
}
