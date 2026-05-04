'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteManualProduct } from '@/app/admin/(authed)/products/actions';

type Props = { id: string; name: string };

export default function DeleteProductButton({ id, name }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteManualProduct(id);
      router.refresh();
    } catch {
      alert('Failed to delete product');
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="h-6 w-6 flex items-center justify-center rounded-full text-rv-tab-inactive hover:text-black hover:bg-rv-gray transition-all duration-250 disabled:opacity-50"
      title="Delete product"
    >
      {loading
        ? <Loader2 size={14} strokeWidth={1.6} className="animate-spin" />
        : <Trash2 size={14} strokeWidth={1.6} />
      }
    </button>
  );
}
