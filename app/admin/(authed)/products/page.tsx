import { createClient } from '@/lib/supabase/server';
import type { ManualProduct } from '@/lib/types';
import AddProductModal from '@/components/admin/AddProductModal';
import DeleteProductButton from '@/components/admin/DeleteProductButton';
import { ExternalLink } from 'lucide-react';

const DROP_ORDER = ['DROP 5', 'DROP 4', 'DROP 3', 'DROP 2', 'DROP 1'];

export default async function ProductLibraryPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('manual_products')
    .select('id, name, product_link, image_url, image_path, drop_tag, created_at, updated_at')
    .order('created_at', { ascending: false });

  const items = (products || []) as (ManualProduct & { drop_tag?: string | null })[];

  // Group products by drop tag; untagged go to 'No Drop'
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    const key = item.drop_tag || 'No Drop';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  // Build display order: highest drops first, then 'No Drop' at end
  const taggedGroups = DROP_ORDER.filter((d) => grouped[d] && grouped[d].length > 0);
  const sections = [
    ...taggedGroups,
    ...(grouped['No Drop']?.length ? ['No Drop'] : []),
  ];

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
        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-rv-tab-inactive mb-3 pb-2 border-b border-rv-gray">
                {section}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5">
                {grouped[section].map((product) => (
                  <div key={product.id} className="bg-rv-gray group relative">
                    <div className="aspect-[4/5] bg-white">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-rv-gray flex items-center justify-center">
                          <span className="text-xs text-rv-tab-inactive">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{product.name}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {product.product_link && (
                            <a
                              href={product.product_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-6 w-6 flex items-center justify-center text-rv-tab-inactive hover:text-black transition-all duration-250"
                            >
                              <ExternalLink size={14} strokeWidth={1.6} />
                            </a>
                          )}
                          <DeleteProductButton id={product.id} name={product.name} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
