'use client';

import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadAsset, removeAsset } from '@/app/admin/(authed)/creatives/[id]/actions';
import type { Creative } from '@/lib/types';

export default function AssetUpload({ creative }: { creative: Creative }) {
  const fileRef = useRef<HTMLInputElement>(null);

  if (creative.asset_url) {
    return (
      <div className="space-y-3">
        <div className="bg-rv-gray aspect-video flex items-center justify-center overflow-hidden">
          {creative.asset_type === 'video' ? (
            <video src={creative.asset_url} controls className="w-full h-full object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creative.asset_url} alt={creative.title} className="w-full h-full object-contain" />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="h-9 px-4 rounded-full bg-rv-gray text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70"
          >
            Replace
          </button>
          <form action={() => removeAsset(creative.id, creative.asset_path!)}>
            <button
              type="submit"
              className="h-9 px-4 rounded-full bg-rv-gray text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70 flex items-center gap-1.5"
            >
              <X size={14} strokeWidth={1.6} />
              Remove
            </button>
          </form>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append('file', file);
            uploadAsset(creative.id, fd);
          }}
        />
      </div>
    );
  }

  return (
    <form>
      <label className="block w-full aspect-video bg-rv-gray flex flex-col items-center justify-center gap-2 cursor-pointer hover:opacity-70 transition-all duration-250">
        <Upload size={24} strokeWidth={1.6} className="text-rv-tab-inactive" />
        <span className="text-sm text-rv-tab-inactive">Click or drag to upload image / video</span>
        <input
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append('file', file);
            uploadAsset(creative.id, fd);
          }}
        />
      </label>
    </form>
  );
}
