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

// Team Members
export async function getTeamMembers() {
  await requireAdmin();
  const sc = createServiceClient();
  const { data } = await sc.from('team_members').select('*').order('name');
  return data || [];
}

export async function createTeamMember(name: string) {
  await requireAdmin();
  const sc = createServiceClient();
  const { error } = await sc.from('team_members').insert({ name: name.trim() });
  if (error) throw error;
  revalidatePath('/admin/tasks');
}

export async function deleteTeamMember(id: string) {
  await requireAdmin();
  const sc = createServiceClient();
  await sc.from('team_members').delete().eq('id', id);
  revalidatePath('/admin/tasks');
}

// Tasks
export async function getTasks() {
  await requireAdmin();
  const sc = createServiceClient();
  const { data } = await sc.from('tasks').select('*, team_members(id, name)').order('created_at', { ascending: false });
  return data || [];
}

export async function createTask(title: string, assigneeId: string | null, dueDate: string | null) {
  await requireAdmin();
  const sc = createServiceClient();
  const { error } = await sc.from('tasks').insert({
    title: title.trim(),
    assignee_id: assigneeId || null,
    due_date: dueDate || null,
  });
  if (error) throw error;
  revalidatePath('/admin/tasks');
}

export async function updateTask(id: string, updates: { title?: string; assignee_id?: string | null; due_date?: string | null; completed?: boolean }) {
  await requireAdmin();
  const sc = createServiceClient();
  const { error } = await sc.from('tasks').update(updates).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/tasks');
}

export async function deleteTask(id: string) {
  await requireAdmin();
  const sc = createServiceClient();
  await sc.from('tasks').delete().eq('id', id);
  revalidatePath('/admin/tasks');
}

// Brand Calendar
export async function getCalendarEntries(year: number, month: number) {
  await requireAdmin();
  const sc = createServiceClient();
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  const { data } = await sc.from('brand_calendar_entries').select('*').gte('entry_date', start).lte('entry_date', end).order('entry_date');
  return data || [];
}

export async function createCalendarEntry(date: string, title: string, notes: string | null) {
  await requireAdmin();
  const sc = createServiceClient();
  const { error } = await sc.from('brand_calendar_entries').insert({ entry_date: date, title: title.trim(), notes: notes?.trim() || null });
  if (error) throw error;
  revalidatePath('/admin/tasks');
}

export async function updateCalendarEntry(id: string, title: string, notes: string | null) {
  await requireAdmin();
  const sc = createServiceClient();
  const { error } = await sc.from('brand_calendar_entries').update({ title: title.trim(), notes: notes?.trim() || null }).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/tasks');
}

export async function deleteCalendarEntry(id: string) {
  await requireAdmin();
  const sc = createServiceClient();
  await sc.from('brand_calendar_entries').delete().eq('id', id);
  revalidatePath('/admin/tasks');
}
