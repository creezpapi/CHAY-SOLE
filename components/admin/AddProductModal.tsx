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

export default function AddProductModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [productLink, setProductLink] = useState('');
  const [dropTag, setDropTag] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function reset() {
    setName('');
    setProductLink('');
    setDropTag('');
    setImageFile(null);
    setPreview(null);
    setError(null);
    setLoading(false);
  }

  function handleClose() {
    reset();
    setOpen(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Product name is required'); return; }
    setLoading(true);
    setError(null);
    try {
      const { id } = await createManualProduct(name, productLink, dropTag);

      if (imageFile) {
        const { signedUrl, path } = await getSignedProductImageUploadUrl(id, imageFile.name);
        const res: Response = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile,
        });
        if (!res.ok) throw new Error('Image upload failed');
        await saveProductImageRecord(id, path);
      }

      router.refresh();
      handleClose();
    } catch (err) {
      setError((err as Error).message || 'Something went wrong');
    }
    setLoading(false);
  }

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white p-6 shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-medium">Add product</h2>
              <button
                onClick={handleClose}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250"
              >
                <X size={16} strokeWidth={1.6} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5">Product name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Classic Denim Jacket"
                  className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">Product link (optional)</label>
                <input
                  type="url"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2">Drop tag</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDropTag('')}
                    disabled={loading}
                    className={'h-8 px-3 rounded-full text-xs font-medium transition-all duration-250 active:scale-95 ' +
                      (!dropTag ? 'bg-black text-white' : 'bg-rv-gray text-rv-tab-inactive hover:text-black')}
                  >
                    None
                  </button>
                  {DROP_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setDropTag(dropTag === tag ? '' : tag)}
                      disabled={loading}
                      className={'h-8 px-3 rounded-full text-xs font-medium transition-all duration-250 active:scale-95 ' +
                        (dropTag === tag ? 'bg-amber-400 text-black' : 'bg-rv-gray text-rv-tab-inactive hover:text-black')}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">Product image (optional)</label>
                {preview ? (
                  <div className="relative w-full aspect-[4/3] bg-rv-gray rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                      className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-rv-gray transition-all duration-250"
                    >
                      <X size={14} strokeWidth={1.6} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-24 border border-dashed border-rv-gray rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-black transition-all duration-250"
                    disabled={loading}
                  >
                    <Upload size={20} strokeWidth={1.6} className="text-rv-tab-inactive" />
                    <span className="text-xs text-rv-tab-inactive">Click to upload image</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-9 rounded-full border border-rv-gray text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 h-9 rounded-full bg-black text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70 disabled:opacity-50"
                >
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
