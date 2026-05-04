'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2 } from 'lucide-react';
import { getSignedUploadUrl, saveAssetRecord, removeAsset } from '@/app/admin/(authed)/creatives/[id]/actions';
import type { Creative } from '@/lib/types';

export default function AssetUpload({ creative }: { creative: Creative }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);

  async function handleFile(file: File) {
    setUploadProgress('Preparing upload…');
    setLocalPreview(URL.createObjectURL(file));
    setIsVideo(file.type.startsWith('video/'));

    // Get signed upload URL from server (bypasses Vercel 4.5MB body limit)
    const result = await getSignedUploadUrl(creative.id, file.name);
    if (result.error || !result.signedUrl || !result.path) {
      setUploadProgress('Upload failed: could not get upload URL');
      setLocalPreview(null);
      return;
    }

    setUploadProgress('Uploading…');

    // Upload directly from browser to Supabase Storage (no Vercel size limit)
    const res = await fetch(result.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!res.ok) {
      setUploadProgress('Upload failed. Please try again.');
      setLocalPreview(null);
      return;
    }

    setUploadProgress('Saving…');

    // Tell server to record the asset in the DB
    startTransition(async () => {
      await saveAssetRecord(creative.id, result.path!, file.type);
      setUploadProgress(null);
      setLocalPreview(null);
      router.refresh();
    });
  }

  const displayUrl = localPreview ?? creative.asset_url;
  const displayIsVideo = localPreview ? isVideo : creative.asset_type === 'video';

  if (displayUrl) {
    return (
      <div className="space-y-3">
        <div className="bg-rv-gray aspect-video flex items-center justify-center overflow-hidden relative">
          {displayIsVideo ? (
            <video src={displayUrl} controls className="w-full h-full object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt={creative.title} className="w-full h-full object-contain" />
          )}
          {(isPending || uploadProgress) && (
            <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} strokeWidth={1.6} className="animate-spin text-black" />
              <span className="text-sm text-black">{uploadProgress || 'Saving…'}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isPending || !!uploadProgress}
            className="h-9 px-4 rounded-full bg-rv-gray text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70 disabled:opacity-40"
          >
            Replace
          </button>
          <button
            type="button"
            disabled={isPending || !!uploadProgress}
            onClick={() => {
              startTransition(async () => {
                await removeAsset(creative.id, creative.asset_path!);
                router.refresh();
              });
            }}
            className="h-9 px-4 rounded-full bg-rv-gray text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70 flex items-center gap-1.5 disabled:opacity-40"
          >
            <X size={14} strokeWidth={1.6} />
            Remove
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            handleFile(file);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <label
        className={`block w-full aspect-video bg-rv-gray flex flex-col items-center justify-center gap-2 cursor-pointer hover:opacity-70 transition-all duration-250${
          uploadProgress ? ' opacity-60 pointer-events-none' : ''
        }`}
      >
        {uploadProgress ? (
          <>
            <Loader2 size={24} strokeWidth={1.6} className="text-rv-tab-inactive animate-spin" />
            <span className="text-sm text-rv-tab-inactive">{uploadProgress}</span>
          </>
        ) : (
          <>
            <Upload size={24} strokeWidth={1.6} className="text-rv-tab-inactive" />
            <span className="text-sm text-rv-tab-inactive">Click or drag to upload image / video</span>
            <span className="text-xs text-rv-tab-inactive">Full resolution preserved</span>
          </>
        )}
        <input
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            handleFile(file);
          }}
        />
      </label>
    </div>
  );
}
