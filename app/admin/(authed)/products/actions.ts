'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient, createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: adminRow } = await supabase
    .from('admins')
    .select('email')
    .eq('email', user.email!)
    .single();
  if (!adminRow) throw new Error('Not admin');
  return user;
}

export async function getSignedProductImageUploadUrl(productId: string, filename: string) {
  await requireAdmin();
  const serviceClient = createServiceClient();
  const ext = filename.split('.').pop() ?? 'jpg';
  const path = `${productId}/image.${ext}`;
  const { data, error } = await serviceClient.storage
    .from('products')
    .createSignedUploadUrl(path);
  if (error) throw error;
  return { signedUrl: data.signedUrl, path };
}

export async function saveProductImageRecord(id: string, path: string) {
  await requireAdmin();
  const serviceClient = createServiceClient();
  const { data: { publicUrl } } = serviceClient.storage
    .from('products')
    .getPublicUrl(path);
  const { error } = await serviceClient
    .from('manual_products')
    .update({ image_url: publicUrl, image_path: path, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/products');
  return { publicUrl };
}

export async function createManualProduct(
  name: string,
  productLink: string,
  dropTag?: string,
  dropName?: string,
  dropDate?: string,
  description?: string,
  talkingPoints?: string[],
  adminNotes?: string,
) {
  await requireAdmin();
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from('manual_products')
    .insert({
      name: name.trim(),
      product_link: productLink.trim() || null,
      drop_tag: dropTag || null,
      drop_name: dropName?.trim() || null,
      drop_date: dropDate || null,
      description: description?.trim() || null,
      talking_points: talkingPoints || [],
      admin_notes: adminNotes?.trim() || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  revalidatePath('/admin/products');
  return { id: data.id };
}

export async function updateManualProduct(
  id: string,
  updates: {
    name?: string;
    product_link?: string | null;
    drop_tag?: string | null;
    drop_name?: string | null;
    drop_date?: string | null;
    description?: string | null;
    talking_points?: string[];
    admin_notes?: string | null;
  }
) {
  await requireAdmin();
  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from('manual_products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/products');
  return { ok: true };
}

export async function saveProductAffiliateLinks(
  productId: string,
  links: { url: string; code?: string }[]
) {
  await requireAdmin();
  const serviceClient = createServiceClient();
  // Delete existing and reinsert
  await serviceClient.from('product_affiliate_links').delete().eq('product_id', productId);
  if (links.length > 0) {
    const { error } = await serviceClient.from('product_affiliate_links').insert(
      links.map((l) => ({ product_id: productId, url: l.url.trim(), code: l.code?.trim() || null }))
    );
    if (error) throw error;
  }
  revalidatePath('/admin/products');
  return { ok: true };
}

export async function getProductAffiliateLinks(productId: string) {
  await requireAdmin();
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from('product_affiliate_links')
    .select('*')
    .eq('product_id', productId)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

export async function deleteManualProduct(id: string) {
  await requireAdmin();
  const serviceClient = createServiceClient();
  const { data: product } = await serviceClient
    .from('manual_products')
    .select('image_path')
    .eq('id', id)
    .single();
  if (product?.image_path) {
    await serviceClient.storage.from('products').remove([product.image_path]);
  }
  const { error } = await serviceClient
    .from('manual_products')
    .delete()
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/products');
  return { ok: true };
}
