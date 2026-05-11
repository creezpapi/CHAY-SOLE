'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient, createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: adminRow } = await supabase.from('admins').select('email').eq('email', user.email!).single();
  if (!adminRow) throw new Error('Not admin');
  return user;
}

export async function getInfluencers(collabType?: 'organic' | 'paid') {
  await requireAdmin();
  const sc = createServiceClient();
  let query = sc.from('marketing_influencers').select('*').order('created_at', { ascending: false });
  if (collabType) query = query.eq('collab_type', collabType);
  const { data } = await query;
  return data || [];
}

export async function createInfluencer(name: string, collabType: 'organic' | 'paid') {
  await requireAdmin();
  const sc = createServiceClient();
  const { data, error } = await sc.from('marketing_influencers').insert({ name: name.trim(), collab_type: collabType }).select('id').single();
  if (error) throw error;
  revalidatePath('/admin/influencer-marketing');
  return { id: data.id };
}

export async function updateInfluencer(
  id: string,
  updates: {
    name?: string; collab_type?: string; status?: string;
    shipping_address?: string | null; top_sizing?: string | null; bottom_sizing?: string | null;
    product_selects?: string | null; notes?: string | null;
    instagram_url?: string | null; tiktok_url?: string | null; youtube_url?: string | null;
    partnership_notes?: string | null;
  }
) {
  await requireAdmin();
  const sc = createServiceClient();
  const { error } = await sc.from('marketing_influencers').update(updates).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/influencer-marketing');
}

export async function deleteInfluencer(id: string) {
  await requireAdmin();
  const sc = createServiceClient();
  await sc.from('marketing_influencers').delete().eq('id', id);
  revalidatePath('/admin/influencer-marketing');
}

// Posts
export async function getInfluencerPosts(influencerId: string) {
  await requireAdmin();
  const sc = createServiceClient();
  const { data } = await sc.from('marketing_influencer_posts').select('*').eq('marketing_influencer_id', influencerId).order('created_at');
  return data || [];
}

export async function saveInfluencerPosts(influencerId: string, posts: { post_url: string; affiliate_code?: string }[]) {
  await requireAdmin();
  const sc = createServiceClient();
  await sc.from('marketing_influencer_posts').delete().eq('marketing_influencer_id', influencerId);
  if (posts.length > 0) {
    await sc.from('marketing_influencer_posts').insert(
      posts.map((p) => ({ marketing_influencer_id: influencerId, post_url: p.post_url.trim(), affiliate_code: p.affiliate_code?.trim() || null }))
    );
  }
  revalidatePath('/admin/influencer-marketing');
}

// Ready to ship — creates a shipment snapshot
export async function markReadyToShip(influencer: {
  id: string; name: string; shipping_address: string | null;
  top_sizing: string | null; bottom_sizing: string | null;
  product_selects: string | null; notes: string | null;
}) {
  await requireAdmin();
  const sc = createServiceClient();
  const { error } = await sc.from('marketing_shipments').insert({
    marketing_influencer_id: influencer.id,
    influencer_name_snapshot: influencer.name,
    shipping_address_snapshot: influencer.shipping_address,
    top_sizing_snapshot: influencer.top_sizing,
    bottom_sizing_snapshot: influencer.bottom_sizing,
    product_selects_snapshot: influencer.product_selects,
    notes_snapshot: influencer.notes,
    status: 'ready_to_ship',
  });
  if (error) throw error;
  // Update influencer status
  await sc.from('marketing_influencers').update({ status: 'shipping_address_provided' }).eq('id', influencer.id);
  revalidatePath('/admin/influencer-marketing');
  revalidatePath('/admin/package-tracker');
}
