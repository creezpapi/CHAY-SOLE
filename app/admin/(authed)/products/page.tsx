import { createClient } from '@/lib/supabase/server';
import type { ManualProduct } from '@/lib/types';
import AddProductModal from '@/components/admin/AddProductModal';
import ProductGrid from '@/components/admin/ProductGrid';

const DROP_ORDER = ['DROP 5', 'DROP 4', 'DROP 3', 'DROP 2', 'DROP 1'];

export default async function ProductLibraryPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('manual_products')
    .select('id, name, product_link, image_url, image_path, drop_tag, drop_name, drop_date, description, talking_points, admin_notes, created_at, updated_at')
    .order('created_at', { ascending: false });

  const items = (products || []) as ManualProduct[];

  const grouped: Record<string, ManualProduct[]> = {};
  for (const item of items) {
    const key = item.drop_tag || 'No Drop';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  const taggedGroups = DROP_ORDER.filter((d) => grouped[d] && grouped[d].length > 0);
  const sections = [...taggedGroups, ...(grouped['No Drop']?.length ? ['No Drop'] : [])];
  const sectionData = sections.map((s) => ({ label: s, products: grouped[s] }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-medium">CHAY SOLE DROPS</h1>
          <span className="text-sm text-rv-tab-inactive">{items.length} product{items.length !== 1 ? 's' : ''}</span>
        </div>
        <AddProductModal />
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center text-rv-tab-inactive text-sm">
          No drops yet. Click &ldquo;Add product&rdquo; to get started.
        </div>
      ) : (
        <ProductGrid sections={sectionData} />
      )}
    </div>
  );
}
