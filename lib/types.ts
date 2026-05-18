export type Creative = {
id: string;
title: string;
notes: string | null;
status: 'ready_to_launch' | 'active' | 'archived';
asset_type: 'image' | 'video' | null;
asset_url: string | null;
asset_path: string | null;
thumb_url: string | null;
carousel_images: string[] | null;
platforms: string[];
ad_copy: string | null;
post_link: string | null;
ad_code: string | null;
is_top_performer: boolean;
drop_tag: string | null;
post_date: string | null;
created_at: string;
updated_at: string;
};

export type CreativeProduct = {
id: string;
creative_id: string;
shopify_product_id: string | null;
shopify_variant_id: string | null;
is_manual: boolean;
snapshot_title: string;
snapshot_image_url: string | null;
snapshot_handle: string | null;
snapshot_sku: string | null;
snapshot_variant_title: string | null;
position: number;
created_at: string;
};

export type ShopifyProduct = {
id: string;
shopify_id: string;
handle: string;
title: string;
product_type: string | null;
vendor: string | null;
available: boolean;
image_url: string | null;
online_store_url: string | null;
raw: Record<string, unknown> | null;
last_synced_at: string;
created_at: string;
updated_at: string;
};

export type ShopifyVariant = {
id: string;
product_id: string;
shopify_variant_id: string;
title: string;
sku: string | null;
price: string | null;
currency_code: string | null;
available: boolean;
position: number;
};

export type ManualProduct = {
id: string;
name: string;
product_link: string | null;
image_url: string | null;
image_path: string | null;
drop_tag: string | null;
drop_name: string | null;
drop_date: string | null;
description: string | null;
talking_points: string[];
admin_notes: string | null;
created_at: string;
updated_at: string;
};

export type ProductAffiliateLink = {
id: string;
product_id: string;
url: string;
code: string | null;
created_at: string;
};

export type TeamMember = {
id: string;
name: string;
created_at: string;
};

export type Task = {
id: string;
title: string;
assignee_id: string | null;
due_date: string | null;
completed: boolean;
created_at: string;
};

export type BrandCalendarEntry = {
id: string;
entry_date: string;
title: string;
notes: string | null;
created_at: string;
};

export type MarketingInfluencer = {
id: string;
name: string;
collab_type: 'organic' | 'paid';
status: string;
shipping_address: string | null;
top_sizing: string | null;
bottom_sizing: string | null;
product_selects: string | null;
notes: string | null;
instagram_url: string | null;
tiktok_url: string | null;
youtube_url: string | null;
partnership_notes: string | null;
created_at: string;
};

export type MarketingInfluencerPost = {
id: string;
marketing_influencer_id: string;
post_url: string;
affiliate_code: string | null;
created_at: string;
};

export type MarketingShipment = {
id: string;
marketing_influencer_id: string;
influencer_name_snapshot: string;
shipping_address_snapshot: string | null;
top_sizing_snapshot: string | null;
bottom_sizing_snapshot: string | null;
product_selects_snapshot: string | null;
notes_snapshot: string | null;
status: 'ready_to_ship' | 'shipped' | 'delivered';
tracking_url: string | null;
carrier: string | null;
shipped_at: string | null;
delivered_at: string | null;
created_at: string;
};

export const INFLUENCER_STATUSES = [
{ value: 'collab_type_confirmed', label: 'Collaboration Type Confirmed' },
{ value: 'contract_sent', label: 'Contract Sent (If paid)' },
{ value: 'selects_sizing_provided', label: 'Selects/Sizing Provided' },
{ value: 'shipping_address_provided', label: 'Shipping Address Provided' },
{ value: 'package_sent', label: 'Package Sent' },
{ value: 'tracking_sent', label: 'Tracking Sent' },
{ value: 'package_delivered', label: 'Package Delivered' },
{ value: 'posts_live', label: 'Posts Live' },
{ value: 'posts_overdue', label: 'Posts Overdue' },
{ value: 'whitelisting_codes_received', label: 'Whitelisting Codes Received' },
{ value: 'whitelisting_live', label: 'Whitelisting Live' },
] as const;

export type InfluencerStatus = typeof INFLUENCER_STATUSES[number]['value'];

export const PLATFORMS = [
{ key: 'google_pmax', label: 'Google Performance Max' },
{ key: 'tiktok_main', label: 'TikTok Main' },
{ key: 'tiktok_gmv', label: 'TikTok GMV Max' },
{ key: 'meta', label: 'Meta' },
{ key: 'meta_carousel', label: 'Meta Carousel' },
{ key: 'meta_enhance', label: 'Meta Enhance' },
{ key: 'pinterest', label: 'Pinterest' },
{ key: 'snapchat', label: 'Snapchat' },
{ key: 'youtube_demandgen', label: 'YouTube Demand Gen' },
{ key: 'instagram_feed', label: 'Instagram Feed' },
{ key: 'youtube_feed', label: 'YouTube Feed' },
{ key: 'youtube_shorts', label: 'YouTube Shorts' },
{ key: 'tiktok_feed', label: 'TikTok Feed' },
{ key: 'pinterest_board', label: 'Pinterest Board' },
] as const;

export type PlatformKey = typeof PLATFORMS[number]['key'];

export const DROP_TAGS = ['DROP 1', 'DROP 2', 'DROP 3', 'DROP 4', 'DROP 5'] as const;
export type DropTag = typeof DROP_TAGS[number];
