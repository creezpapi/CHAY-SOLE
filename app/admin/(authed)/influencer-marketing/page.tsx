'use client';

import { useState, useEffect } from 'react';
import { Plus, X, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import {
  getInfluencers, createInfluencer, updateInfluencer, deleteInfluencer,
  getInfluencerPosts, saveInfluencerPosts, markReadyToShip,
} from './actions';
import type { MarketingInfluencer, MarketingInfluencerPost } from '@/lib/types';
import { INFLUENCER_STATUSES } from '@/lib/types';

type PostEntry = { post_url: string; affiliate_code: string };

function getStatusLabel(val: string) {
  return INFLUENCER_STATUSES.find((s) => s.value === val)?.label || val;
}

function StatusPill({ status, onChange }: { status: string; onChange: (v: string) => void }) {
  const isOverdue = status === 'posts_overdue';
  const isLive = status === 'whitelisting_live';
  const cls = isOverdue
    ? 'bg-red-600 text-white'
    : isLive
    ? 'bg-black text-white'
    : 'bg-rv-gray text-black';

  return (
    <div className="relative">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        className={'h-9 pl-7 pr-3 rounded-full text-xs font-medium cursor-pointer transition-all duration-250 appearance-none border-0 ' + cls}
        style={{ backgroundImage: 'none' }}
      >
        {INFLUENCER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <span className={'absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ' +
        (isOverdue ? 'bg-white' : isLive ? 'bg-white' : 'bg-black')} />
    </div>
  );
}

function InfluencerModal({ influencer, onClose, onSaved }: {
  influencer: MarketingInfluencer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(influencer.name);
  const [shippingAddress, setShippingAddress] = useState(influencer.shipping_address || '');
  const [topSizing, setTopSizing] = useState(influencer.top_sizing || '');
  const [bottomSizing, setBottomSizing] = useState(influencer.bottom_sizing || '');
  const [productSelects, setProductSelects] = useState(influencer.product_selects || '');
  const [notes, setNotes] = useState(influencer.notes || '');
  const [instagram, setInstagram] = useState(influencer.instagram_url || '');
  const [tiktok, setTiktok] = useState(influencer.tiktok_url || '');
  const [youtube, setYoutube] = useState(influencer.youtube_url || '');
  const [partnershipNotes, setPartnershipNotes] = useState(influencer.partnership_notes || '');
  const [posts, setPosts] = useState<PostEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingShip, setMarkingShip] = useState(false);

  useEffect(() => {
    getInfluencerPosts(influencer.id).then((ps) => {
      setPosts((ps as MarketingInfluencerPost[]).map((p) => ({ post_url: p.post_url, affiliate_code: p.affiliate_code || '' })));
    });
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [influencer.id, onClose]);

  async function handleSave() {
    setLoading(true);
    await updateInfluencer(influencer.id, {
      name, shipping_address: shippingAddress || null, top_sizing: topSizing || null,
      bottom_sizing: bottomSizing || null, product_selects: productSelects || null,
      notes: notes || null, instagram_url: instagram || null, tiktok_url: tiktok || null,
      youtube_url: youtube || null, partnership_notes: partnershipNotes || null,
    });
    await saveInfluencerPosts(influencer.id, posts.filter((p) => p.post_url.trim()));
    setLoading(false);
    onSaved();
    onClose();
  }

  async function handleReadyToShip() {
    setMarkingShip(true);
    await markReadyToShip({
      id: influencer.id, name, shipping_address: shippingAddress || null,
      top_sizing: topSizing || null, bottom_sizing: bottomSizing || null,
      product_selects: productSelects || null, notes: notes || null,
    });
    setMarkingShip(false);
    onSaved();
    onClose();
  }

  const inp = 'w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250';
  const lbl = 'block text-xs font-medium mb-1.5 text-rv-tab-inactive uppercase tracking-wider';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="max-w-screen-md mx-auto my-12 rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium">{name}</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250">
            <X size={16} strokeWidth={1.6} />
          </button>
        </div>

        {/* Block 1: Type */}
        <div className="mb-6">
          <span className={'h-8 px-3 rounded-full text-xs font-medium flex items-center w-fit ' +
            (influencer.collab_type === 'paid' ? 'bg-black text-white' : 'bg-rv-gray text-black')}>
            {influencer.collab_type === 'paid' ? 'Paid Collab' : 'Organic Collab'}
          </span>
        </div>

        {/* Block 2: Shipping Info */}
        <div className="mb-6 space-y-3">
          <p className={lbl}>Shipping Info</p>
          <div><label className="block text-xs mb-1">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inp} /></div>
          <div><label className="block text-xs mb-1">Shipping Address</label>
            <textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs mb-1">Top Sizing</label><input type="text" value={topSizing} onChange={(e) => setTopSizing(e.target.value)} className={inp} /></div>
            <div><label className="block text-xs mb-1">Bottom Sizing</label><input type="text" value={bottomSizing} onChange={(e) => setBottomSizing(e.target.value)} className={inp} /></div>
          </div>
          <div><label className="block text-xs mb-1">Product Selects</label><input type="text" value={productSelects} onChange={(e) => setProductSelects(e.target.value)} className={inp} /></div>
          <div><label className="block text-xs mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none" /></div>
          <button onClick={handleReadyToShip} disabled={markingShip}
            className="h-11 px-6 rounded-full bg-black text-white text-sm font-medium flex items-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70 disabled:opacity-50">
            {markingShip ? <Loader2 size={14} strokeWidth={1.6} className="animate-spin" /> : null}
            Ready To Ship
          </button>
        </div>

        {/* Block 3: Links & Notes */}
        <div className="mb-6 space-y-3">
          <p className={lbl}>Links & Notes</p>
          <div><label className="block text-xs mb-1">Instagram</label><input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://..." className={inp} /></div>
          <div><label className="block text-xs mb-1">TikTok</label><input type="url" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://..." className={inp} /></div>
          <div><label className="block text-xs mb-1">YouTube</label><input type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://..." className={inp} /></div>

          {/* Post links */}
          <div>
            <label className="block text-xs mb-2 uppercase tracking-wider font-medium text-rv-tab-inactive">Your Posts</label>
            <div className="space-y-2">
              {posts.map((post, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="url" value={post.post_url} onChange={(e) => setPosts((p) => p.map((x, idx) => idx === i ? { ...x, post_url: e.target.value } : x))}
                    placeholder="Post URL" className={inp + ' flex-1'} />
                  <input type="text" value={post.affiliate_code} onChange={(e) => setPosts((p) => p.map((x, idx) => idx === i ? { ...x, affiliate_code: e.target.value } : x))}
                    placeholder="Ad code (optional)" className={inp + ' w-36 flex-shrink-0'} />
                  <button type="button" onClick={() => setPosts((p) => p.filter((_, idx) => idx !== i))}
                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 flex-shrink-0"><X size={14} strokeWidth={1.6} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setPosts((p) => [...p, { post_url: '', affiliate_code: '' }])}
              className="mt-2 h-11 rounded-full bg-rv-gray text-sm font-medium px-4 w-full flex items-center justify-center transition-all duration-250 hover:bg-black hover:text-white">
              Add post
            </button>
          </div>

          <div><label className="block text-xs mb-1">Partnership Notes</label>
            <textarea value={partnershipNotes} onChange={(e) => setPartnershipNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-rv-gray rounded-2xl focus:outline-none focus:border-black transition-all duration-250 resize-none" /></div>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 h-11 rounded-full border border-rv-gray text-sm font-medium transition-all duration-250 active:scale-95 hover:opacity-70">Cancel</button>
          <button type="button" onClick={handleSave} disabled={loading}
            className="flex-1 h-11 rounded-full bg-black text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70 disabled:opacity-50">
            {loading ? <Loader2 size={16} strokeWidth={1.6} className="animate-spin" /> : null}
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InfluencerMarketingPage() {
  const [activeTab, setActiveTab] = useState<'organic' | 'paid'>('organic');
  const [influencers, setInfluencers] = useState<MarketingInfluencer[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<MarketingInfluencer | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState<'organic' | 'paid' | null>(null);
  const [loading, setLoading] = useState(false);

  const organicCount = influencers.filter((i) => i.collab_type === 'organic').length;
  const paidCount = influencers.filter((i) => i.collab_type === 'paid').length;
  const filtered = influencers.filter((i) => i.collab_type === activeTab);

  async function load() {
    const data = await getInfluencers();
    setInfluencers(data as MarketingInfluencer[]);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!addName.trim() || !addType) return;
    setLoading(true);
    await createInfluencer(addName, addType);
    setAddName(''); setAddType(null); setShowAdd(false); setLoading(false);
    load();
  }

  async function handleStatusChange(id: string, status: string) {
    await updateInfluencer(id, { status });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium">Influencer Marketing</h1>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)}
            className="h-11 px-4 rounded-full bg-black text-white text-sm font-medium flex items-center gap-1.5 transition-all duration-250 active:scale-95 hover:opacity-70">
            <Plus size={16} strokeWidth={1.6} />Add Influencer
          </button>
        )}
      </div>

      {showAdd && (
        <div className="mb-6 p-4 border border-rv-gray rounded-2xl space-y-3">
          <p className="text-sm font-medium">Add influencer</p>
          <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)}
            placeholder="Influencer name..." className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
          <div className="flex gap-2">
            {(['organic', 'paid'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setAddType(t)}
                className={'h-9 px-4 rounded-full text-sm font-medium transition-all duration-250 active:scale-95 ' +
                  (addType === t ? 'bg-black text-white' : 'bg-rv-gray text-rv-tab-inactive hover:text-black')}>
                {t === 'organic' ? 'Organic Collab' : 'Paid Collab'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={loading || !addType}
              className="h-9 px-4 rounded-full bg-black text-white text-sm font-medium transition-all duration-250 active:scale-95 disabled:opacity-50">
              {loading ? 'Adding...' : 'Add'}
            </button>
            <button onClick={() => { setShowAdd(false); setAddName(''); setAddType(null); }}
              className="h-9 px-4 rounded-full border border-rv-gray text-sm transition-all duration-250">Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-8 border-b border-rv-gray mb-6">
        {([['organic', 'Organic Collab', organicCount], ['paid', 'Paid Collab', paidCount]] as const).map(([tab, label, count]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={'pb-3 text-sm transition-all duration-250 relative ' +
              (activeTab === tab ? 'text-black font-medium' : 'text-rv-tab-inactive hover:text-black')}>
            {label} ({count})
            {activeTab === tab && <span className="absolute bottom-0 inset-x-[25%] h-0.5 bg-black rounded-full" />}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-rv-tab-inactive text-sm">No {activeTab} collabs yet.</p>
      )}

      <ul>
        {filtered.map((inf) => (
          <li key={inf.id} className="flex items-center gap-3 py-4 border-b border-rv-gray">
            <button onClick={() => setSelectedInfluencer(inf)}
              className="flex-1 text-left flex items-center gap-3 hover:opacity-70 transition-all duration-250">
              <div className="w-9 h-9 rounded-full bg-rv-gray flex items-center justify-center flex-shrink-0 text-xs font-medium">
                {inf.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{inf.name}</span>
              <ChevronRight size={16} strokeWidth={1.6} className="text-rv-tab-inactive ml-auto" />
            </button>
            <StatusPill status={inf.status} onChange={(v) => handleStatusChange(inf.id, v)} />
            <button onClick={async () => { await deleteInfluencer(inf.id); load(); }}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-rv-gray transition-all duration-250 text-rv-tab-inactive hover:text-red-600">
              <X size={14} strokeWidth={1.6} />
            </button>
          </li>
        ))}
      </ul>

      {selectedInfluencer && (
        <InfluencerModal
          influencer={selectedInfluencer}
          onClose={() => setSelectedInfluencer(null)}
          onSaved={() => { load(); setSelectedInfluencer(null); }}
        />
      )}
    </div>
  );
}
