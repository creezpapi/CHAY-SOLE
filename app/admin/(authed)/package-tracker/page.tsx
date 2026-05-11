'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import type { MarketingShipment } from '@/lib/types';

async function getShipments() {
  const { createClient } = await import('@/lib/supabase/client');
  const sc = createClient();
  const { data } = await sc.from('marketing_shipments').select('*').order('created_at', { ascending: false });
  return (data || []) as MarketingShipment[];
}

async function shipPackage(id: string, trackingUrl: string, carrier: string) {
  const { createClient } = await import('@/lib/supabase/client');
  const sc = createClient();
  const { data: shipment } = await sc.from('marketing_shipments').select('marketing_influencer_id').eq('id', id).single();
  await sc.from('marketing_shipments').update({
    status: 'shipped', tracking_url: trackingUrl, carrier: carrier || null,
    shipped_at: new Date().toISOString(),
  }).eq('id', id);
  if (shipment?.marketing_influencer_id) {
    await sc.from('marketing_influencers').update({ status: 'package_sent' }).eq('id', shipment.marketing_influencer_id);
  }
}

async function deliverPackage(id: string) {
  const { createClient } = await import('@/lib/supabase/client');
  const sc = createClient();
  const { data: shipment } = await sc.from('marketing_shipments').select('marketing_influencer_id').eq('id', id).single();
  await sc.from('marketing_shipments').update({
    status: 'delivered', delivered_at: new Date().toISOString(),
  }).eq('id', id);
  if (shipment?.marketing_influencer_id) {
    await sc.from('marketing_influencers').update({ status: 'package_delivered' }).eq('id', shipment.marketing_influencer_id);
  }
}

function ShipmentRow({ shipment, onShipped }: { shipment: MarketingShipment; onShipped: () => void }) {
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState('');
  const [carrier, setCarrier] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleShip() {
    if (!trackingUrl.trim()) return;
    setLoading(true);
    await shipPackage(shipment.id, trackingUrl, carrier);
    setLoading(false);
    onShipped();
  }

  return (
    <div className="py-4 border-b border-rv-gray">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{shipment.influencer_name_snapshot}</p>
          {shipment.shipping_address_snapshot && (
            <p className="text-xs text-rv-tab-inactive mt-0.5 truncate">{shipment.shipping_address_snapshot}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {shipment.top_sizing_snapshot && (
              <span className="h-6 px-2 rounded-full bg-rv-gray text-xs flex items-center">Top: {shipment.top_sizing_snapshot}</span>
            )}
            {shipment.bottom_sizing_snapshot && (
              <span className="h-6 px-2 rounded-full bg-rv-gray text-xs flex items-center">Bottom: {shipment.bottom_sizing_snapshot}</span>
            )}
            {shipment.product_selects_snapshot && (
              <span className="h-6 px-2 rounded-full bg-rv-gray text-xs flex items-center truncate max-w-[200px]">{shipment.product_selects_snapshot}</span>
            )}
          </div>
          {shipment.notes_snapshot && <p className="text-xs text-rv-tab-inactive mt-1">{shipment.notes_snapshot}</p>}
        </div>
        {shipment.status === 'ready_to_ship' && !showTrackingForm && (
          <button onClick={() => setShowTrackingForm(true)}
            className="h-9 px-4 rounded-full bg-black text-white text-xs font-medium flex-shrink-0 transition-all duration-250 active:scale-95 hover:opacity-70">
            Shipped
          </button>
        )}
        {shipment.status === 'shipped' && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {shipment.tracking_url && (
              <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer"
                className="h-9 px-3 rounded-full border border-rv-gray text-xs font-medium flex items-center gap-1.5 hover:border-black transition-all duration-250">
                Track<ExternalLink size={12} strokeWidth={1.6} />
              </a>
            )}
            <button onClick={async () => { await deliverPackage(shipment.id); onShipped(); }}
              className="h-9 px-4 rounded-full bg-black text-white text-xs font-medium flex-shrink-0 transition-all duration-250 active:scale-95 hover:opacity-70">
              Delivered
            </button>
          </div>
        )}
      </div>
      {showTrackingForm && shipment.status === 'ready_to_ship' && (
        <div className="mt-3 space-y-2">
          <input type="url" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder="Tracking URL (required)" className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
          <input type="text" value={carrier} onChange={(e) => setCarrier(e.target.value)}
            placeholder="Carrier (optional, e.g. UPS)" className="w-full h-9 px-3 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250" />
          <div className="flex gap-2">
            <button onClick={handleShip} disabled={loading || !trackingUrl.trim()}
              className="h-9 px-4 rounded-full bg-black text-white text-sm font-medium transition-all duration-250 active:scale-95 disabled:opacity-50 flex items-center gap-1.5">
              {loading ? <Loader2 size={14} strokeWidth={1.6} className="animate-spin" /> : null}
              Confirm shipped
            </button>
            <button onClick={() => setShowTrackingForm(false)}
              className="h-9 px-4 rounded-full border border-rv-gray text-sm transition-all duration-250">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PackageTrackerPage() {
  const [shipments, setShipments] = useState<MarketingShipment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getShipments();
    setShipments(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const readyToShip = shipments.filter((s) => s.status === 'ready_to_ship');
  const shipped = shipments.filter((s) => s.status === 'shipped');
  const delivered = shipments.filter((s) => s.status === 'delivered');

  if (loading) return <div className="py-20 text-center text-rv-tab-inactive text-sm">Loading...</div>;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-medium">Package Tracker</h1>

      {/* Ready To Ship */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-rv-tab-inactive mb-3 pb-2 border-b border-rv-gray">
          Ready To Ship ({readyToShip.length})
        </h2>
        {readyToShip.length === 0 ? (
          <p className="py-6 text-center text-rv-tab-inactive text-sm">No packages ready to ship.</p>
        ) : (
          readyToShip.map((s) => <ShipmentRow key={s.id} shipment={s} onShipped={load} />)
        )}
      </div>

      {/* Shipped */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-rv-tab-inactive mb-3 pb-2 border-b border-rv-gray">
          Shipped ({shipped.length})
        </h2>
        {shipped.length === 0 ? (
          <p className="py-6 text-center text-rv-tab-inactive text-sm">No packages in transit.</p>
        ) : (
          shipped.map((s) => <ShipmentRow key={s.id} shipment={s} onShipped={load} />)
        )}
      </div>

      {/* Delivered */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-rv-tab-inactive mb-3 pb-2 border-b border-rv-gray">
          Delivered ({delivered.length})
        </h2>
        {delivered.length === 0 ? (
          <p className="py-6 text-center text-rv-tab-inactive text-sm">No deliveries yet.</p>
        ) : (
          <ul className="space-y-0">
            {delivered.map((s) => (
              <li key={s.id} className="py-3 border-b border-rv-gray">
                <p className="font-medium text-sm">{s.influencer_name_snapshot}</p>
                {s.delivered_at && (
                  <p className="text-xs text-rv-tab-inactive mt-0.5">
                    Delivered {new Date(s.delivered_at).toLocaleDateString()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
