import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import NewCreativeButton from '@/components/admin/NewCreativeButton';
import StatusTabs from '@/components/admin/StatusTabs';
import ProductFilter from '@/components/admin/ProductFilter';
import PostingCalendar from '@/components/admin/PostingCalendar';
import { PLATFORMS } from '@/lib/types';

type Props = {
searchParams: Promise<{ status?: string; platform?: string; product?: string; view?: string }>;
};

export default async function CreativesDashboard({ searchParams }: Props) {
const { status, platform, product, view } = await searchParams;
const supabase = await createClient();
const showCalendar = view === 'calendar';

const [allRes, rtlRes, activeRes, archivedRes, whitelistingRes, topPerformersRes] = await Promise.all([
supabase.from('creatives').select('id', { count: 'exact', head: true }),
supabase.from('creatives').select('id', { count: 'exact', head: true }).eq('status', 'ready_to_launch'),
supabase.from('creatives').select('id', { count: 'exact', head: true }).eq('status', 'active'),
supabase.from('creatives').select('id', { count: 'exact', head: true }).eq('status', 'archived'),
supabase.from('creatives').select('id', { count: 'exact', head: true }).not('ad_code', 'is', null),
supabase.from('creatives').select('id', { count: 'exact', head: true }).eq('is_top_performer', true),
]);

const counts = {
all: allRes.count || 0,
ready_to_launch: rtlRes.count || 0,
active: activeRes.count || 0,
archived: archivedRes.count || 0,
whitelisting: whitelistingRes.count || 0,
top_performers: topPerformersRes.count || 0,
};

// Fetch calendar creatives (all with a post_date set)
const { data: calendarCreatives } = await supabase
.from('creatives')
.select('id, title, status, thumb_url, platforms, is_top_performer, post_date')
.not('post_date', 'is', null)
.order('post_date', { ascending: true });

let query = supabase
.from('creatives')
.select('id, title, status, thumb_url, platforms, is_top_performer, ad_code, post_date, created_at')
.order('created_at', { ascending: false });

if (status === 'whitelisting') {
query = query.not('ad_code', 'is', null);
} else if (status === 'top_performers') {
query = query.eq('is_top_performer', true);
} else if (status && status !== 'all') {
query = query.eq('status', status as 'ready_to_launch' | 'active' | 'archived');
}

if (platform) {
query = query.contains('platforms', [platform]);
}

const { data: allCreatives } = await query;

let filteredIds: string[] | null = null;
if (product) {
const { data: cp } = await supabase
.from('creative_products')
.select('creative_id')
.eq('shopify_product_id', product);
filteredIds = (cp || []).map((r) => r.creative_id);
}

const creatives = filteredIds
? (allCreatives || []).filter((c) => filteredIds!.includes(c.id))
: (allCreatives || []);

const productCountMap: Record<string, number> = {};
if (creatives.length > 0) {
const { data: productCounts } = await supabase
.from('creative_products')
.select('creative_id')
.in('creative_id', creatives.map((c) => c.id));
if (productCounts) {
for (const row of productCounts) {
productCountMap[row.creative_id] = (productCountMap[row.creative_id] || 0) + 1;
}
}
}

const { data: allProducts } = await supabase
.from('shopify_products')
.select('shopify_id, title')
.order('title');

// Count scheduled creatives
const scheduledCount = calendarCreatives?.length || 0;

return (
<div>
<div className="flex items-center justify-between mb-6">
<div className="flex items-baseline gap-3">
<h1 className="text-2xl font-medium">Creatives</h1>
<span className="text-sm text-rv-tab-inactive">{counts.all}</span>
</div>
<NewCreativeButton />
</div>

{/* View tabs: List | Calendar */}
<div className="flex gap-6 border-b border-rv-gray mb-5">
<Link href="/admin" className={`pb-3 text-sm transition-all duration-250 relative ${!showCalendar ? 'text-black font-medium' : 'text-rv-tab-inactive hover:text-black'}`}>
All Creatives
{!showCalendar && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-black rounded-full" />}
</Link>
<Link href="/admin?view=calendar" className={`pb-3 text-sm transition-all duration-250 relative flex items-center gap-1.5 ${showCalendar ? 'text-black font-medium' : 'text-rv-tab-inactive hover:text-black'}`}>
Posting Calendar
{scheduledCount > 0 && <span className="h-5 px-1.5 rounded-full bg-rv-gray text-rv-tab-inactive text-xs flex items-center">{scheduledCount}</span>}
{showCalendar && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-black rounded-full" />}
</Link>
</div>

{showCalendar ? (
<PostingCalendar creatives={calendarCreatives || []} />
) : (
<>
<StatusTabs counts={counts} activeStatus={status || 'all'} activePlatform={platform} activeProduct={product} />
<div className="flex items-center gap-3 mt-4 mb-2">
<span className="text-xs text-rv-tab-inactive flex-shrink-0">Filter by product:</span>
<div className="flex-1 max-w-xs">
<ProductFilter products={allProducts || []} activeProduct={product} />
</div>
{(platform || product || (status && status !== 'all')) && (
<Link href="/admin" className="text-xs text-rv-tab-inactive hover:text-black transition-colors flex-shrink-0">
Clear all
</Link>
)}
</div>
<div className="mt-2">
{creatives.length === 0 ? (
<div className="py-16 text-center text-rv-tab-inactive text-sm">
No creatives match these filters.
</div>
) : (
<ul>
{creatives.map((creative) => (
<li key={creative.id}>
<Link
href={'/admin/creatives/' + creative.id}
className="flex items-center gap-4 py-4 border-b border-rv-gray hover:opacity-70 transition-all duration-250 group"
>
<div className="w-16 h-16 bg-rv-gray flex-shrink-0 overflow-hidden rounded">
{creative.thumb_url ? (
<img src={creative.thumb_url} alt="" className="w-full h-full object-cover" />
) : (
<div className="w-full h-full bg-rv-gray" />
)}
</div>
<div className="flex-1 min-w-0">
<div className="flex items-center gap-2">
<p className="font-medium text-sm truncate">{creative.title}</p>
{creative.is_top_performer && (
<span className="flex-shrink-0 h-4 px-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex items-center">Top</span>
)}
{creative.ad_code && (
<span className="flex-shrink-0 h-4 px-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center">WL</span>
)}
{creative.post_date && (
<span className="flex-shrink-0 h-4 px-1.5 rounded-full bg-rv-gray text-rv-tab-inactive text-xs font-medium flex items-center">
📅 {new Date(creative.post_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
</span>
)}
</div>
<p className="text-xs text-rv-tab-inactive mt-0.5">
{productCountMap[creative.id] || 0} products{' · '}
{creative.status === 'ready_to_launch' ? 'Ready to Launch' : creative.status}
</p>
{creative.platforms && creative.platforms.length > 0 && (
<div className="flex gap-1 mt-1 flex-wrap">
{creative.platforms.map((pk: string) => {
const pl = PLATFORMS.find((p) => p.key === pk);
return (
<span key={pk} className="h-5 px-2 rounded-full bg-rv-gray text-rv-tab-inactive text-xs flex items-center">
{pl?.label || pk}
</span>
);
})}
</div>
)}
</div>
<ChevronRight size={16} strokeWidth={1.6} className="text-rv-tab-inactive flex-shrink-0" />
</Link>
</li>
))}
</ul>
)}
</div>
</>
)}
</div>
);
}
