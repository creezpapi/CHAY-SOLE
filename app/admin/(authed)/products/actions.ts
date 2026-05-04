'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { fetchAllProducts, isShopifyConfigured } from '@/lib/shopify/storefront';

export async function syncShopifyProducts() {
  // Verify caller is admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: adminRow } = await supabase
    .from('admins')
    .select('email')
    .eq('email', user.email!)
    .single();
  if (!adminRow) throw new Error('Not admin');

  const serviceClient = createServiceClient();
  const mocked = !isShopifyConfigured();
  const products = await fetchAllProducts();

  // Upsert products
  const productRows = products.map((p) => ({
    shopify_id: p.shopifyId,
    handle: p.handle,
    title: p.title,
    product_type: p.productType,
    vendor: p.vendor,
    available: p.available,
    image_url: p.imageUrl,
    online_store_url: p.onlineStoreUrl,
    raw: p.raw,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { data: upserted, error: upsertErr } = await serviceClient
    .from('shopify_products')
    .upsert(productRows, { onConflict: 'shopify_id' })
    .select('id, shopify_id');

  if (upsertErr) throw upsertErr;

  // Map shopify_id -> local UUID
  const idMap: Record<string, string> = {};
  for (const row of upserted || []) {
    idMap[row.shopify_id] = row.id;
  }

  // Wipe and re-insert variants
  const productLocalIds = Object.values(idMap);
  if (productLocalIds.length > 0) {
    await serviceClient.from('shopify_variants').delete().in('product_id', productLocalIds);

    const variantRows = products.flatMap((p) =>
      p.variants.map((v) => ({
        product_id: idMap[p.shopifyId],
        shopify_variant_id: v.shopifyVariantId,
        title: v.title,
        sku: v.sku,
        price: v.price,
        currency_code: v.currencyCode,
        available: v.available,
        position: v.position,
      }))
    );

    if (variantRows.length > 0) {
      await serviceClient.from('shopify_variants').insert(variantRows);
    }
  }

  // Prune products no longer in Shopify
  const returnedShopifyIds = products.map((p) => p.shopifyId);
  const { count: pruned } = await serviceClient
    .from('shopify_products')
    .delete()
    .not('shopify_id', 'in', '(' + returnedShopifyIds.map((id) => '"' + id + '"').join(',') + ')')
    .select('id', { count: 'exact', head: true });

  revalidatePath('/admin/products');

  return { ok: true, synced: products.length, pruned: pruned || 0, mocked };
}
