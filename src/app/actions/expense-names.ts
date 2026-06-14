'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ExpenseName } from '@/lib/types'

export async function getExpenseNames(): Promise<ExpenseName[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expense_names')
    .select('*')
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function createExpenseName(name: string): Promise<ExpenseName> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('expense_names')
    .insert({ name: name.trim(), user_id: user.id })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/')
  return data
}

export async function deleteExpenseName(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('expense_names').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function updateExpenseName(id: string, name: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('expense_names')
    .update({ name: name.trim() })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/')
}
