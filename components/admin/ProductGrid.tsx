'use client';

import { useState } from 'react';
import type { ManualProduct } from '@/lib/types';
import DeleteProductButton from '@/components/admin/DeleteProductButton';
import EditProductModal from '@/components/admin/EditProductModal';
import { ExternalLink } from 'lucide-react';

type Section = { label: string; products: ManualProduct[] };

export default function ProductGrid({ sections }: { sections: Section[] }) {
  const [selected, setSelected] = useState<ManualProduct | null>(null);

  return (
    <>
      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.label}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-rv-tab-inactive mb-3 pb-2 border-b border-rv-gray">
              {section.label}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5">
              {section.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-rv-gray group relative cursor-pointer"
                  onClick={() => setSelected(product)}
                >
                  <div className="aspect-[4/5] bg-white">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-all duration-250"
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
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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

      {selected && (
        <EditProductModal
          product={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
