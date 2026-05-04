'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

type Props = {
  productTypes: string[];
  initialQ: string;
  initialType: string;
  initialAvailable: string;
};

export default function ProductLibraryFilters({ productTypes, initialQ, initialType, initialAvailable }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState(initialType);
  const [available, setAvailable] = useState(initialAvailable);

  function applyFilters(newQ: string, newType: string, newAvailable: string) {
    const params = new URLSearchParams();
    if (newQ) params.set('q', newQ);
    if (newType) params.set('type', newType);
    if (newAvailable) params.set('available', newAvailable);
    const qs = params.toString();
    router.push(pathname + (qs ? '?' + qs : ''));
  }

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-48">
        <Search size={14} strokeWidth={1.6} className="absolute left-3 top-1/2 -translate-y-1/2 text-rv-tab-inactive" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(q, type, available); }}
          placeholder="Search title, handle, SKU..."
          className="w-full h-9 pl-8 pr-4 text-sm border border-rv-gray rounded-full focus:outline-none focus:border-black transition-all duration-250"
        />
      </div>
      <select
        value={type}
        onChange={(e) => { setType(e.target.value); applyFilters(q, e.target.value, available); }}
        className="h-9 px-4 text-sm border border-rv-gray rounded-full bg-white focus:outline-none focus:border-black transition-all duration-250"
      >
        <option value="">All types</option>
        {productTypes.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select
        value={available}
        onChange={(e) => { setAvailable(e.target.value); applyFilters(q, type, e.target.value); }}
        className="h-9 px-4 text-sm border border-rv-gray rounded-full bg-white focus:outline-none focus:border-black transition-all duration-250"
      >
        <option value="">All availability</option>
        <option value="true">Available</option>
        <option value="false">Unavailable</option>
      </select>
    </div>
  );
}
