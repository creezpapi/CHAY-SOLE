'use client';

import { useState, useRef } from 'react';
import { Plus, X, Upload, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  createManualProduct,
  getSignedProductImageUploadUrl,
  saveProductImageRecord,
} from '@/app/admin/(authed)/products/actions';

const DROP_TAGS = ['DROP 1', 'DROP 2', 'DROP 3', 'DROP 4', 'DROP 5'];

type AffiliateLink = { url: string; code: string };

export default function AddProductModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [productLink, setProductLink] = useState('');
  const [dropTag, setDropTag] = useState('');
  const [dropName, setDropName] = useState('');
  const [dropDate, setDropDate] = useState('');
  const [description, setDescription] = useState('');
  const [talkingPoints, setTalkingPoints] = useState<string[]>(['']);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function reset() {
    setName(''); setProductLink(''); setDropTag(''); setDropName(''); setDropDate('');
    setDescription(''); setTalkingPoints(['']); setAffiliateLinks([]); setAdminNotes('');
    setImageFile(null); setPreview(null); setError(null); setLoading(false);
  }

  function handleClose() { reset(); setOpen(false); }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function updateTalkingPoint(i: number, val: string) {
    setTalkingPoints((prev) => prev.map((p, idx) => idx === i ? val : p));
  }

  function removeTalkingPoint(i: number) {
    setTalkingPoints((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addAffiliateLink() {
    setAffiliateLinks((prev) => [...prev, { url: '', code: '' }]);
  }

  function updateAffiliateLink(i: number, field: 'url' | 'code', val: string) {
    setAffiliateLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  }

  function removeAffiliateLink(i: number) {
    setAffiliateLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Product name is required'); return; }
    setLoading(true); setError(null);
    try {
      const cleanPoints = talkingPoints.filter((p) => p.trim());
      const cleanLinks = affiliateLinks.filter((l) => l.url.trim());
      const { id } = await createManualProduct(
        name, productLink, dropTag || undefined, dropName || undefined,
        dropDate || undefined, description || undefined, cleanPoints,
        adminNotes || undefined,
      );

      if (imageFile) {
        const { signedUrl, path } = await getSignedProductImageUploadUrl(id, imageFile.name);
        const res = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': imageFile.type }, body: imageFile });
        if (!res.ok) throw new Error('Image upload failed');
        await saveProductImageRecord(id, path);
      }

      if (cleanLinks.length > 0) {
        const { saveProductAffiliateLinks } = await import('@/app/admin/(authed)/products/actions');
        await saveProductAffiliateLinks(id, cleanLinks);
      }

      router.refresh();
      handleClose();
    } catch (err) {
      setError((err as Error).message || 'Something went wrong');
    }
    setLoading(false);
  }

  const inputCls = 'w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250';
  const labelCls = 'block text-xs font-medium mb-1.5';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-9 px-4 rounded-full bg-black text-white text-sm font-medium flex items-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70"
      >
        <Plus size={16} strokeWidth={1.6} />
        Add product
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="max-w-screen-md mx-auto my-12 rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-medium">Add product</h2>
              <button onClick={handleClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250">
                <X size={16} strokeWidth={1.6} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className={labelCls}>Product name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Classic Denim Jacket" className={inputCls} disabled={loading} />
              </div>

              {/* Drop Tag */}
              <div>
                <label className={labelCls}>Drop tag</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setDropTag('')} disabled={loading}
                    className={'h-8 px-3 rounded-full text-xs font-medium transition-all duration-250 active:scale-95 ' +
                      (!dropTag ? 'bg-black text-white' : 'bg-rv-gray text-rv-tab-inactive hover:text-black')}>
                    None
                  </button>
                  {DROP_TAGS.map((tag) => (
                    <button key={tag} type="button" onClick={() => setDropTag(dropTag === tag ? '' : tag)} disabled={loading}
                      className={'h-8 px-3 rounded-full text-xs font-medium transition-all duration-250 active:scale-95 ' +
                        (dropTag === tag ? 'bg-amber-400 text-black' : 'bg-rv-gray text-rv-tab-inactive hover:text-black')}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop Name */}
              <div>
                <label className={labelCls}>Drop name (optional)</label>
                <input type="text" value={dropName} onChange={(e) => setDropName(e.target.value)}
                  placeholder="e.g. Summer Collection" className={inputCls} disabled={loading} />
              </div>

              {/* Drop Date */}
              <div>
                <label className={labelCls}>Drop date (optional)</label>
                <input type="date" value={dropDate} onChange={(e) => setDropDate(e.target.value)}
                  className={inputCls} disabled={loading} />
              </div>

              {/* Product Link */}
              <div>
                <label className={labelCls}>Product link (optional)</label>
                <input type="url" value={productLink} onChange={(e) => setProductLink(e.target.value)}
                  placeholder="https://..." className={inputCls} disabled={loading} />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description (shown in modal)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3} placeholder="Describe the product..."
                  className="w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none"
                  disabled={loading} />
              </div>

              {/* Talking Points */}
              <div>
                <label className={labelCls}>Key talking points</label>
                <div className="space-y-2">
                  {talkingPoints.map((point, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="text" value={point} onChange={(e) => updateTalkingPoint(i, e.target.value)}
                        placeholder="e.g. 100% organic cotton" className={inputCls + ' flex-1'} disabled={loading} />
                      {talkingPoints.length > 1 && (
                        <button type="button" onClick={() => removeTalkingPoint(i)}
                          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 flex-shrink-0">
                          <X size={14} strokeWidth={1.6} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setTalkingPoints((p) => [...p, ''])} disabled={loading}
                  className="mt-2 text-xs text-rv-tab-inactive hover:text-black transition-all duration-250">
                  + Add point
                </button>
              </div>

              {/* Affiliate Links */}
              <div>
                <label className={labelCls}>Affiliate links</label>
                <div className="space-y-2">
                  {affiliateLinks.map((link, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="url" value={link.url} onChange={(e) => updateAffiliateLink(i, 'url', e.target.value)}
                        placeholder="URL" className={inputCls + ' flex-1'} disabled={loading} />
                      <input type="text" value={link.code} onChange={(e) => updateAffiliateLink(i, 'code', e.target.value)}
                        placeholder="Code (optional)" className={inputCls + ' w-36 flex-shrink-0'} disabled={loading} />
                      <button type="button" onClick={() => removeAffiliateLink(i)}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 flex-shrink-0">
                        <X size={14} strokeWidth={1.6} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addAffiliateLink} disabled={loading}
                  className="mt-2 text-xs text-rv-tab-inactive hover:text-black transition-all duration-250">
                  + Add affiliate link
                </button>
              </div>

              {/* Admin Notes */}
              <div>
                <label className={labelCls}>Notes (admin only)</label>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2} placeholder="Optional"
                  className="w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none"
                  disabled={loading} />
              </div>

              {/* Image */}
              <div>
                <label className={labelCls}>Product image (optional)</label>
                {preview ? (
                  <div className="relative w-full aspect-[4/3] bg-rv-gray rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImageFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                      className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-rv-gray transition-all duration-250">
                      <X size={14} strokeWidth={1.6} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full h-24 border border-dashed border-rv-gray rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-black transition-all duration-250"
                    disabled={loading}>
                    <Upload size={20} strokeWidth={1.6} className="text-rv-tab-inactive" />
                    <span className="text-xs text-rv-tab-inactive">Click to upload image</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={handleClose} disabled={loading}
                  className="flex-1 h-11 rounded-full border border-rv-gray text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !name.trim()}
                  className="flex-1 h-11 rounded-full bg-black text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70 disabled:opacity-50">
                  {loading ? <Loader2 size={16} strokeWidth={1.6} className="animate-spin" /> : null}
                  {loading ? 'Saving...' : 'Add product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
