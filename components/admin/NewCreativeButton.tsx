'use client';

import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { createCreative } from '@/app/admin/(authed)/actions';

export default function NewCreativeButton() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="h-9 px-4 rounded-full bg-black text-white text-sm font-medium flex items-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-80"
      >
        <Plus size={16} strokeWidth={1.6} />
        New creative
      </button>
    );
  }

  return (
    <form action={createCreative} className="flex items-center gap-2">
      <input
        ref={inputRef}
        name="title"
        type="text"
        required
        placeholder="Creative title..."
        className="h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250 w-48"
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
      />
      <button type="submit" className="h-9 px-4 rounded-full bg-black text-white text-sm font-medium transition-all duration-250 active:scale-95">
        Create
      </button>
      <button type="button" onClick={() => setOpen(false)} className="h-9 px-3 rounded-full text-sm text-rv-tab-inactive hover:text-black transition-all duration-250">
        Cancel
      </button>
    </form>
  );
}
