'use server';
import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function updateCreative(id: string, formData: FormData) {
  const title = (formData.get('title') as string)?.trim();
  const notes = (formData.get('notes') as string) || null;
  const status = formData.get('status') as 'ready_to_launch' | 'active' | 'archived';
  const platforms = formData.getAll('platforms') as string[];
  const ad_copy = (formData.get('ad_copy') as string) || null;
  const post_link = (formData.get('post_link') as string) || null;
  const ad_code = (formData.get('ad_code') as string) || null;
  const is_top_performer = formData.get('is_top_performer') === 'true';
  const drop_tag = (formData.get('drop_tag') as string) || null;

  if (!title) return;

  const supabase = createServiceClient();
  await supabase.from('creatives').update({
    title,
    notes,
    status,
    platforms,
    ad_copy,
    post_link,
    ad_code,
    is_top_performer,
    drop_tag,
  }).eq('id', id);

  revalidatePath('/admin/creatives/' + id);
  revalidatePath('/admin');
}

export async function getSignedUploadUrl(
  creativeId: string,
  filename: string
): Promise<{ signedUrl?: string; path?: string; error?: string }> {
  const serviceClient = createServiceClient();
  const ext = filename.split('.').pop() || 'bin';
  const path = creativeId + '/' + Date.now() + '.' + ext;

  const { data, error } = await serviceClient.storage
    .from('creatives')
    .createSignedUploadUrl(path);

  if (error || !data) {
    return { error: error?.message || 'Failed to create signed URL' };
  }

  return { signedUrl: data.signedUrl, path };
}

export async function saveAssetRecord(
  id: string,
  path: string,
  mimeType: string
) {
  const supabase = createServiceClient();
  const assetType = mimeType.startsWith('video/') ? 'video' : 'image';

  const { data: { publicUrl } } = supabase.storage
    .from('creatives')
    .getPublicUrl(path);

  await supabase.from('creatives').update({
    asset_type: assetType,
    asset_url: publicUrl,
    asset_path: path,
    thumb_url: assetType === 'image' ? publicUrl : null,
  }).eq('id', id);

  revalidatePath('/admin/creatives/' + id);
  revalidatePath('/admin');
}

export async function uploadAsset(id: string, formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || !file.size) return;

  const supabase = createServiceClient();

  const ext = file.name.split('.').pop() || 'bin';
  const path = id + '/' + Date.now() + '.' + ext;
  const assetType = file.type.startsWith('video/') ? 'video' : 'image';

  const { error } = await supabase.storage.from('creatives').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) return;

  const { data: { publicUrl } } = supabase.storage.from('creatives').getPublicUrl(path);

  await supabase.from('creatives').update({
    asset_type: assetType,
    asset_url: publicUrl,
    asset_path: path,
    thumb_url: assetType === 'image' ? publicUrl : null,
  }).eq('id', id);

  revalidatePath('/admin/creatives/' + id);
}

export async function removeAsset(id: string, assetPath: string) {
  const supabase = createServiceClient();

  await supabase.storage.from('creatives').remove([assetPath]);
  await supabase.from('creatives').update({
    asset_type: null,
    asset_url: null,
    asset_path: null,
    thumb_url: null,
  }).eq('id', id);

  revalidatePath('/admin/creatives/' + id);
  revalidatePath('/admin');
}

export async function addCarouselImage(
  creativeId: string,
  filename: string,
  mimeType: string,
  signedPath: string
) {
  const supabase = createServiceClient();

  const { data: { publicUrl } } = supabase.storage
    .from('creatives')
    .getPublicUrl(signedPath);

  const { data: creative } = await supabase
    .from('creatives')
    .select('carousel_images')
    .eq('id', creativeId)
    .single();

  const existing: string[] = creative?.carousel_images || [];
  await supabase.from('creatives').update({
    carousel_images: [...existing, publicUrl],
  }).eq('id', creativeId);

  revalidatePath('/admin/creatives/' + creativeId);
}

export async function removeCarouselImage(creativeId: string, imageUrl: string) {
  const supabase = createServiceClient();

  const urlParts = imageUrl.split('/creatives/');
  if (urlParts.length > 1) {
    const storagePath = urlParts[1].split('?')[0];
    await supabase.storage.from('creatives').remove([storagePath]);
  }

  const { data: creative } = await supabase
    .from('creatives')
    .select('carousel_images')
    .eq('id', creativeId)
    .single();

  const updated = (creative?.carousel_images || []).filter((u: string) => u !== imageUrl);
  await supabase.from('creatives').update({ carousel_images: updated }).eq('id', creativeId);

  revalidatePath('/admin/creatives/' + creativeId);
}

export async function tagProducts(
  creativeId: string,
  selections: {
    shopifyProductId: string | null;
    shopifyVariantId: string | null;
    isManual: boolean;
    snapshotTitle: string;
    snapshotImageUrl: string | null;
    snapshotHandle: string | null;
    snapshotSku: string | null;
    snapshotVariantTitle: string | null;
  }[]
) {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('creative_products')
    .select('snapshot_title')
    .eq('creative_id', creativeId);

  const existingTitles = new Set(
    (existing || []).map((e) => e.snapshot_title).filter(Boolean)
  );

  const toInsert = selections
    .filter((s) => !existingTitles.has(s.snapshotTitle))
    .map((s, i) => ({
      creative_id: creativeId,
      shopify_product_id: s.shopifyProductId,
      shopify_variant_id: s.shopifyVariantId,
      is_manual: s.isManual,
      snapshot_title: s.snapshotTitle,
      snapshot_image_url: s.snapshotImageUrl,
      snapshot_handle: s.snapshotHandle,
      snapshot_sku: s.snapshotSku,
      snapshot_variant_title: s.snapshotVariantTitle,
      position: (existing?.length || 0) + i,
    }));

  if (toInsert.length > 0) {
    await supabase.from('creative_products').insert(toInsert);
  }

  revalidatePath('/admin/creatives/' + creativeId);
}

export async function untagProduct(creativeProductId: string, creativeId: string) {
  const supabase = createServiceClient();
  await supabase.from('creative_products').delete().eq('id', creativeProductId);
  revalidatePath('/admin/creatives/' + creativeId);
}

export async function deleteCreativeAndRedirect(id: string, assetPath: string | null) {
  const supabase = createServiceClient();

  if (assetPath) {
    await supabase.storage.from('creatives').remove([assetPath]);
  }

  await supabase.from('creatives').delete().eq('id', id);
  revalidatePath('/admin');
  redirect('/admin');
}
