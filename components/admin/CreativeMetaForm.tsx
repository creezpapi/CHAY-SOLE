'use client';

import { useRef, useState } from 'react';
import { updateCreative } from '@/app/admin/(authed)/creatives/[id]/actions';
import type { Creative } from '@/lib/types';

export default function CreativeMetaForm({ creative }: { creative: Creative }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    await updateCreative(creative.id, formData);
    setSaving(false);
  }

  return (
    <div>
      <h2 className="text-base font-medium mb-4">Details</h2>
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={creative.title}
            className="w-full h-11 px-4 border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={creative.notes || ''}
            className="w-full px-4 py-3 border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 text-sm resize-none"
            placeholder="Optional notes..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            defaultValue={creative.status}
            className="w-full h-11 px-4 border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250 text-sm bg-white"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="h-9 px-6 rounded-full bg-black text-white text-sm font-medium transition-all duration-250 active:scale-95 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
