import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: products } = await supabase
      .from('manual_products')
      .select('id, name, product_link, image_url, image_path, created_at')
      .order('name');

  return NextResponse.json({ products: products || [] });
}
