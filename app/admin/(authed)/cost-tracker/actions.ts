'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient, createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: adminRow } = await supabase.from('admins').select('email').eq('email', user.email!).single();
  if (!adminRow) throw new Error('Not admin');
  return user;
}

export async function getExpenses(year: number, month: number) {
  await requireAdmin();
  const sc = createServiceClient();
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  const { data, error } = await sc
    .from('expenses')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllExpenseMonths() {
  await requireAdmin();
  const sc = createServiceClient();
  const { data, error } = await sc
    .from('expenses')
    .select('date')
    .order('date', { ascending: false });
  if (error) throw error;
  if (!data || data.length === 0) return [];
  const months = new Set<string>();
  data.forEach((row) => {
    const d = new Date(row.date);
    months.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  });
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

export async function createExpense(formData: {
  date: string;
  description: string;
  category: string;
  amount: number;
  vendor?: string;
  notes?: string;
}) {
  await requireAdmin();
  const sc = createServiceClient();
  const { error } = await sc.from('expenses').insert({
    date: formData.date,
    description: formData.description.trim(),
    category: formData.category,
    amount: formData.amount,
    vendor: formData.vendor?.trim() || null,
    notes: formData.notes?.trim() || null,
  });
  if (error) throw error;
  revalidatePath('/admin/cost-tracker');
}

export async function updateExpense(id: string, updates: {
  date?: string;
  description?: string;
  category?: string;
  amount?: number;
  vendor?: string | null;
  notes?: string | null;
  receipt_path?: string | null;
  receipt_url?: string | null;
}) {
  await requireAdmin();
  const sc = createServiceClient();
  const { error } = await sc.from('expenses').update(updates).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/cost-tracker');
}

export async function deleteExpense(id: string) {
  await requireAdmin();
  const sc = createServiceClient();
  // Delete associated receipt if exists
  const { data: expense } = await sc.from('expenses').select('receipt_path').eq('id', id).single();
  if (expense?.receipt_path) {
    await sc.storage.from('receipts').remove([expense.receipt_path]);
  }
  await sc.from('expenses').delete().eq('id', id);
  revalidatePath('/admin/cost-tracker');
}

export async function uploadReceipt(id: string, fileBuffer: number[], fileName: string, mimeType: string) {
  await requireAdmin();
  const sc = createServiceClient();
  const ext = fileName.split('.').pop() || 'bin';
  const path = `${id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(fileBuffer);
  const { error: upErr } = await sc.storage.from('receipts').upload(path, buffer, {
    contentType: mimeType,
    upsert: true,
  });
  if (upErr) throw upErr;
  const { data: urlData } = sc.storage.from('receipts').getPublicUrl(path);
  // Note: bucket is private, use signed URL
  const { data: signedData } = await sc.storage.from('receipts').createSignedUrl(path, 60 * 60 * 24 * 365);
  const url = signedData?.signedUrl || urlData.publicUrl;
  const { error: updErr } = await sc.from('expenses').update({ receipt_path: path, receipt_url: url }).eq('id', id);
  if (updErr) throw updErr;
  revalidatePath('/admin/cost-tracker');
  return { path, url };
}

export async function getReceiptSignedUrl(path: string) {
  await requireAdmin();
  const sc = createServiceClient();
  const { data } = await sc.storage.from('receipts').createSignedUrl(path, 60 * 60);
  return data?.signedUrl || null;
}
