'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import Modal from '../common/Modal';
import { tagProducts } from '@/app/admin/(authed)/creatives/[id]/actions';

type Variant = {
  id: string;
  shopify_variant_id: string;
  title: string;
  sku: string | null;
  price: string | null;
  available: boolean;
  position: number;
};

type Product = {
  id: string;
  shopify_id: string;
  handle: string;
  title: string;
  product_type: string | null;
  available: boolean;
  image_url: string | null;
  online_store_url: string | null;
  shopify_variants?: Variant[];
};

type Selection = {
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  isManual: boolean;
  snapshotTitle: string;
  snapshotImageUrl: string | null;
  snapshotHandle: string | null;
  snapshotSku: string | null;
  snapshotVariantTitle: string | null;
};

type Props = {
  creativeId: string;
  alreadyTaggedIds: string[];
  onClose: () => void;
};

export default function ProductPickerModal({ creativeId, alreadyTaggedIds, onClose }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ title: '', sku: '', handle: '', image_url: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setFiltered(data.products || []);
        const types = Array.from(new Set((data.products || []).map((p: Product) => p.product_type).filter(Boolean))).sort() as string[];
        setProductTypes(types);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let result = products;
    if (q) {
      const lower = q.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(lower) || p.handle.toLowerCase().includes(lower));
    }
    if (typeFilter) result = result.filter((p) => p.product_type === typeFilter);
    if (availFilter === 'true') result = result.filter((p) => p.available);
    if (availFilter === 'false') result = result.filter((p) => !p.available);
    setFiltered(result);
  }, [q, typeFilter, availFilter, products]);

  function selectProduct(product: Product, variant?: Variant) {
    const key = product.id + (variant ? '-' + variant.id : '');
    if (selections[key]) {
      const next = { ...selections };
      delete next[key];
      setSelections(next);
    } else {
      setSelections({
        ...selections,
        [key]: {
          shopifyProductId: product.id,
          shopifyVariantId: variant?.id || null,
          isManual: false,
          snapshotTitle: product.title,
          snapshotImageUrl: product.image_url,
          snapshotHandle: product.handle,
          snapshotSku: variant?.sku || null,
          snapshotVariantTitle: variant?.title || null,
        },
      });
    }
  }

  function addManual() {
    if (!manualForm.title.trim()) return;
    const key = 'manual-' + Date.now();
    setSelections({
      ...selections,
      [key]: {
        shopifyProductId: null,
        shopifyVariantId: null,
        isManual: true,
        snapshotTitle: manualForm.title,
        snapshotImageUrl: manualForm.image_url || null,
        snapshotHandle: manualForm.handle || null,
        snapshotSku: manualForm.sku || null,
        snapshotVariantTitle: null,
      },
    });
    setManualForm({ title: '', sku: '', handle: '', image_url: '' });
    setManualOpen(false);
  }

  async function handleAttach() {
    setLoading(true);
    await tagProducts(creativeId, Object.values(selections));
    setLoading(false);
    onClose();
  }

  const selCount = Object.keys(selections).length;

  return (
    <Modal onClose={onClose} wide>
      <h2 className="text-lg font-medium mb-4">Add products</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} strokeWidth={1.6} className="absolute left-3 top-1/2 -translate-y-1/2 text-rv-tab-inactive" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="w-full h-9 pl-8 pr-4 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 px-4 text-sm border border-rv-gray rounded-full bg-white"
        >
          <option value="">All types</option>
          {productTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={availFilter}
          onChange={(e) => setAvailFilter(e.target.value)}
          className="h-9 px-4 text-sm border border-rv-gray rounded-full bg-white"
        >
          <option value="">All</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
      </div>

      <div className="overflow-y-auto max-h-96 border border-rv-gray rounded-2xl divide-y divide-rv-gray">
        {filtered.map((product) => {
          const isAlreadyTagged = alreadyTaggedIds.includes(product.id);
          const isSelected = Object.values(selections).some((s) => s.shopifyProductId === product.id);
          const hasVariants = (product.shopify_variants || []).length > 1;

          return (
            <div key={product.id} className={'p-4 ' + (isAlreadyTagged ? 'opacity-50' : '')}>
              <div
                className={'flex items-center gap-3 cursor-pointer ' + (isAlreadyTagged ? 'pointer-events-none' : 'hover:opacity-70 transition-all duration-250')}
                onClick={() => !isAlreadyTagged && !hasVariants && selectProduct(product)}
              >
                <div className="w-10 h-10 bg-rv-gray flex-shrink-0">
                  {product.image_url && <img src={product.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{product.title}</p>
                  <p className="text-xs text-rv-tab-inactive">{product.handle}</p>
                  {isAlreadyTagged && <p className="text-xs text-rv-tab-inactive">already tagged</p>}
                </div>
                {!isAlreadyTagged && !hasVariants && (
                  <div className={'h-5 w-5 rounded-full border-2 flex items-center justify-center ' + (isSelected ? 'border-black bg-black' : 'border-rv-gray')}>
                    {isSelected && <Check size={12} strokeWidth={2} className="text-white" />}
                  </div>
                )}
              </div>
              {hasVariants && !isAlreadyTagged && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-13">
                  {(product.shopify_variants || []).map((v) => {
                    const vKey = product.id + '-' + v.id;
                    const isVSelected = !!selections[vKey];
                    return (
                      <button
                        key={v.id}
                        onClick={() => selectProduct(product, v)}
                        className={'h-7 px-3 rounded-full text-xs border transition-all duration-250 ' + (isVSelected ? 'bg-black text-white border-black' : 'border-rv-gray hover:border-black')}
                      >
                        {v.title}
                        {v.sku && <span className="opacity-60 ml-1">{v.sku}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual entry */}
      <div className="mt-4">
        {!manualOpen ? (
          <button
            onClick={() => setManualOpen(true)}
            className="text-sm text-rv-tab-inactive hover:text-black transition-all duration-250 flex items-center gap-1"
          >
            <Plus size={14} strokeWidth={1.6} /> Add manual entry
          </button>
        ) : (
          <div className="border border-rv-gray rounded-2xl p-4 space-y-3">
            <p className="text-sm font-medium">Manual entry</p>
            <input type="text" placeholder="Title (required)" value={manualForm.title} onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
              className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
            <input type="text" placeholder="SKU" value={manualForm.sku} onChange={(e) => setManualForm({ ...manualForm, sku: e.target.value })}
              className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
            <input type="text" placeholder="Handle" value={manualForm.handle} onChange={(e) => setManualForm({ ...manualForm, handle: e.target.value })}
              className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
            <input type="url" placeholder="Image URL" value={manualForm.image_url} onChange={(e) => setManualForm({ ...manualForm, image_url: e.target.value })}
              className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
            <div className="flex gap-2">
              <button onClick={addManual} className="h-9 px-4 rounded-full bg-rv-gray text-sm font-medium transition-all duration-250 active:scale-95">Add</button>
              <button onClick={() => setManualOpen(false)} className="h-9 px-4 rounded-full text-sm text-rv-tab-inactive hover:text-black transition-all duration-250">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between pt-4 border-t border-rv-gray">
        <span className="text-sm text-rv-tab-inactive">{selCount} selected</span>
        <div className="flex gap-3">
          <button onClick={onClose} className="h-9 px-4 rounded-full text-sm text-rv-tab-inactive hover:text-black transition-all duration-250">Cancel</button>
          <button
            onClick={handleAttach}
            disabled={selCount === 0 || loading}
            className="h-9 px-6 rounded-full bg-black text-white text-sm font-medium transition-all duration-250 active:scale-95 disabled:opacity-40"
          >
            {loading ? 'Attaching...' : 'Attach ' + (selCount > 0 ? selCount : '')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
