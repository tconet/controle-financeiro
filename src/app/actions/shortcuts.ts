'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Shortcut } from '@/lib/types'

export async function getShortcuts(): Promise<Shortcut[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shortcuts')
    .select(`
      *,
      categories(id, name),
      expense_names(id, name)
    `)
    .order('sort_order')

  if (error) throw error
  return data ?? []
}

export async function createShortcut(input: {
  name: string
  category_id?: string | null
  expense_name_id?: string | null
}): Promise<Shortcut> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('shortcuts')
    .insert({ ...input, user_id: user.id })
    .select(`
      *,
      categories(id, name),
      expense_names(id, name)
    `)
    .single()

  if (error) throw error
  revalidatePath('/')
  return data
}

export async function deleteShortcut(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('shortcuts').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function updateShortcut(id: string, input: {
  name?: string
  category_id?: string | null
  expense_name_id?: string | null
}): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shortcuts')
    .update(input)
    .eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function seedDefaultShortcuts(
  categoryEstoqueId: string,
  categoryFuncionariosId: string,
  expensePassagemId: string,
  expenseSalarioId: string
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { count } = await supabase
    .from('shortcuts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (count && count > 0) return // já tem atalhos

  await supabase.from('shortcuts').insert([
    { user_id: user.id, name: 'Estoque', category_id: categoryEstoqueId, expense_name_id: null, sort_order: 0 },
    { user_id: user.id, name: 'Passagem Funcionário', category_id: categoryFuncionariosId, expense_name_id: expensePassagemId, sort_order: 1 },
    { user_id: user.id, name: 'Salário', category_id: categoryFuncionariosId, expense_name_id: expenseSalarioId, sort_order: 2 },
  ])
}
