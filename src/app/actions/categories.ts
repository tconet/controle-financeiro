'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Category } from '@/lib/types'

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function createCategory(name: string): Promise<Category> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim(), user_id: user.id })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/')
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function updateCategory(id: string, name: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

/**
 * Marca `id` como a categoria de Estoque/CMV usada no DRE, desmarcando
 * qualquer outra categoria que estivesse marcada. Passe `null` para
 * apenas remover a marcação atual.
 */
export async function setInventoryCategory(id: string | null): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { error: clearError } = await supabase
    .from('categories')
    .update({ is_inventory: false })
    .eq('user_id', user.id)
    .eq('is_inventory', true)
  if (clearError) throw clearError

  if (id) {
    const { error } = await supabase
      .from('categories')
      .update({ is_inventory: true })
      .eq('id', id)
    if (error) throw error
  }

  revalidatePath('/')
}
