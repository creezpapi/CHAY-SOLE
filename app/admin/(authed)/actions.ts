'use server';
import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createCreative(formData: FormData) {
  const title = (formData.get('title') as string)?.trim();
  if (!title) return;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('creatives')
    .insert({ title, status: 'ready_to_launch' })
    .select('id')
    .single();
  if (error || !data) return;
  revalidatePath('/admin');
  redirect('/admin/creatives/' + data.id);
}

export async function deleteCreative(id: string) {
  const supabase = createServiceClient();
  await supabase.from('creatives').delete().eq('id', id);
  revalidatePath('/admin');
  redirect('/admin');
}
