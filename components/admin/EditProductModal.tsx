'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Pencil, Upload, Loader2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ManualProduct, ProductAffiliateLink } from '@/lib/types';
import {
  updateManualProduct,
  saveProductAffiliateLinks,
  getProductAffiliateLinks,
  getSignedProductImageUploadUrl,
  saveProductImageRecord,
} from '@/app/admin/(authed)/products/actions';

const DROP_TAGS = ['DROP 1', 'DROP 2', 'DROP 3', 'DROP 4', 'DROP 5'];
type AffiliateLink = { url: string; code: string };
type Props = { product: ManualProduct; onClose: () => void };

export default function EditProductModal({ product, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product.name);
  const [productLink, setProductLink] = useState(product.product_link || '');
  const [dropTag, setDropTag] = useState(product.drop_tag || '');
  const [dropName, setDropName] = useState(product.drop_name || '');
  const [dropDate, setDropDate] = useState(product.drop_date || '');
  const [description, setDescription] = useState(product.description || '');
  const [talkingPoints, setTalkingPoints] = useState<string[]>(product.talking_points?.length ? product.talking_points : ['']);
  const [adminNotes, setAdminNotes] = useState(product.admin_notes || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product.image_url || null);

  useEffect(() => {
    getProductAffiliateLinks(product.id).then((links) => {
      setAffiliateLinks(links.map((l: ProductAffiliateLink) => ({ url: l.url, code: l.code || '' })));
      setLoadingLinks(false);
    }).catch(() => setLoadingLinks(false));
  }, [product.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!name.trim()) { setError('Name required'); return; }
    setLoading(true); setError(null);
    try {
      await updateManualProduct(product.id, {
        name: name.trim(), product_link: productLink.trim() || null,
        drop_tag: dropTag || null, drop_name: dropName.trim() || null,
        drop_date: dropDate || null, description: description.trim() || null,
        talking_points: talkingPoints.filter((p) => p.trim()), admin_notes: adminNotes.trim() || null,
      });
      await saveProductAffiliateLinks(product.id, affiliateLinks.filter((l) => l.url.trim()));
      if (imageFile) {
        const { signedUrl, path } = await getSignedProductImageUploadUrl(product.id, imageFile.name);
        const res = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': imageFile.type }, body: imageFile });
        if (!res.ok) throw new Error('Image upload failed');
        await saveProductImageRecord(product.id, path);
      }
      router.refresh(); setEditing(false);
    } catch (err) { setError((err as Error).message || 'Error saving'); }
    setLoading(false);
  }

  const inp = 'w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250';
  const lbl = 'block text-xs font-medium mb-1.5 text-rv-tab-inactive';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="max-w-screen-md mx-auto my-12 rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium">{editing ? 'Edit product' : product.name}</h2>
          <div className="flex items-center gap-2">
            {!editing && (
              <button onClick={() => setEditing(true)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 active:scale-95">
                <Pencil size={16} strokeWidth={1.6} />
              </button>
            )}
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250">
              <X size={16} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div><label className={lbl}>Product name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inp} disabled={loading} /></div>
            <div>
              <label className={lbl}>Drop tag</label>
              <div className="flex flex-wrap gap-2">
                {['', ...DROP_TAGS].map((tag) => (
                  <button key={tag || 'none'} type="button" onClick={() => setDropTag(tag)} disabled={loading}
                    className={'h-8 px-3 rounded-full text-xs font-medium transition-all duration-250 active:scale-95 ' +
                      (dropTag === tag ? (tag ? 'bg-amber-400 text-black' : 'bg-black text-white') : 'bg-rv-gray text-rv-tab-inactive hover:text-black')}>
                    {tag || 'None'}
                  </button>
                ))}
              </div>
            </div>
            <div><label className={lbl}>Drop name</label><input type="text" value={dropName} onChange={(e) => setDropName(e.target.value)} placeholder="e.g. Summer Collection" className={inp} disabled={loading} /></div>
            <div><label className={lbl}>Drop date</label><input type="date" value={dropDate} onChange={(e) => setDropDate(e.target.value)} className={inp} disabled={loading} /></div>
            <div><label className={lbl}>Product link</label><input type="url" value={productLink} onChange={(e) => setProductLink(e.target.value)} placeholder="https://..." className={inp} disabled={loading} /></div>
            <div>
              <label className={lbl}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none" disabled={loading} />
            </div>
            <div>
              <label className={lbl}>Key talking points</label>
              <div className="space-y-2">
                {talkingPoints.map((pt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" value={pt} onChange={(e) => setTalkingPoints((p) => p.map((x, idx) => idx === i ? e.target.value : x))}
                      placeholder="e.g. 100% organic cotton" className={inp + ' flex-1'} disabled={loading} />
                    {talkingPoints.length > 1 && (
                      <button type="button" onClick={() => setTalkingPoints((p) => p.filter((_, idx) => idx !== i))}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 flex-shrink-0"><X size={14} strokeWidth={1.6} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setTalkingPoints((p) => [...p, ''])} disabled={loading}
                className="mt-2 text-xs text-rv-tab-inactive hover:text-black transition-all duration-250">+ Add point</button>
            </div>
            <div>
              <label className={lbl}>Affiliate links</label>
              {loadingLinks ? <p className="text-xs text-rv-tab-inactive">Loading...</p> : (
                <div className="space-y-2">
                  {affiliateLinks.map((link, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="url" value={link.url} onChange={(e) => setAffiliateLinks((p) => p.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l))}
                        placeholder="URL" className={inp + ' flex-1'} disabled={loading} />
                      <input type="text" value={link.code} onChange={(e) => setAffiliateLinks((p) => p.map((l, idx) => idx === i ? { ...l, code: e.target.value } : l))}
                        placeholder="Code" className={inp + ' w-32 flex-shrink-0'} disabled={loading} />
                      <button type="button" onClick={() => setAffiliateLinks((p) => p.filter((_, idx) => idx !== i))}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 flex-shrink-0"><X size={14} strokeWidth={1.6} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setAffiliateLinks((p) => [...p, { url: '', code: '' }])} disabled={loading}
                    className="text-xs text-rv-tab-inactive hover:text-black transition-all duration-250">+ Add affiliate link</button>
                </div>
              )}
            </div>
            <div>
              <label className={lbl}>Notes (admin only)</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2}
                className="w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none" disabled={loading} />
            </div>
            <div>
              <label className={lbl}>Product image</label>
              {preview ? (
                <div className="relative w-full aspect-[4/3] bg-rv-gray rounded-2xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-all duration-250">
                    <Upload size={24} strokeWidth={1.6} className="text-white" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={loading}
                  className="w-full h-24 border border-dashed border-rv-gray rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-black transition-all duration-250">
                  <Upload size={20} strokeWidth={1.6} className="text-rv-tab-inactive" />
                  <span className="text-xs text-rv-tab-inactive">Click to upload</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setEditing(false)} disabled={loading}
                className="flex-1 h-11 rounded-full border border-rv-gray text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70">Cancel</button>
              <button type="button" onClick={handleSave} disabled={loading}
                className="flex-1 h-11 rounded-full bg-black text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70 disabled:opacity-50">
                {loading ? <Loader2 size={16} strokeWidth={1.6} className="animate-spin" /> : null}
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {product.image_url && (
              <div className="w-full aspect-[4/3] bg-rv-gray overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              </div>
            )}
            {(product.drop_tag || product.drop_name || product.drop_date) && (
              <div className="flex flex-wrap gap-2">
                {product.drop_tag && <span className="h-8 px-3 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex items-center">{product.drop_tag}</span>}
                {product.drop_name && <span className="h-8 px-3 rounded-full bg-rv-gray text-xs font-medium flex items-center">{product.drop_name}</span>}
                {product.drop_date && <span className="h-8 px-3 rounded-full bg-rv-gray text-xs flex items-center text-rv-tab-inactive">{new Date(product.drop_date).toLocaleDateString()}</span>}
              </div>
            )}
            {product.description && <p className="text-sm text-rv-tab-inactive leading-relaxed">{product.description}</p>}
            {product.talking_points?.filter(Boolean).length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rv-tab-inactive mb-2">Key talking points</p>
                <ul className="space-y-1">
                  {product.talking_points.filter(Boolean).map((pt, i) => (
                    <li key={i} className="text-sm flex gap-2"><span className="text-rv-tab-inactive mt-0.5">·</span><span>{pt}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {!loadingLinks && affiliateLinks.filter((l) => l.url).length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rv-tab-inactive mb-2">Affiliate links</p>
                <div className="space-y-1.5">
                  {affiliateLinks.filter((l) => l.url).map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <a href={link.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm underline flex items-center gap-1 hover:opacity-70 transition-all duration-250 truncate">
                        {link.url}<ExternalLink size={12} strokeWidth={1.6} className="flex-shrink-0" />
                      </a>
                      {link.code && <span className="h-6 px-2 rounded-full bg-rv-gray text-xs font-mono flex-shrink-0">{link.code}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {product.product_link && (
              <a href={product.product_link} target="_blank" rel="noopener noreferrer"
                className="h-11 rounded-full border border-rv-gray text-sm font-medium flex items-center justify-center gap-2 hover:border-black transition-all duration-250">
                View product<ExternalLink size={14} strokeWidth={1.6} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
