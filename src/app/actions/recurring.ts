'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { RecurringExpense } from '@/lib/types'

export async function getRecurringExpenses(): Promise<RecurringExpense[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select(`
      *,
      categories(id, name),
      expense_names(id, name)
    `)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function createRecurringExpense(input: {
  name: string
  category_id?: string | null
  expense_name_id?: string | null
  amount: number
  day_of_month: number
  description?: string | null
}): Promise<RecurringExpense> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('recurring_expenses')
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

export async function updateRecurringExpense(id: string, input: Partial<{
  name: string
  category_id: string | null
  expense_name_id: string | null
  amount: number
  day_of_month: number
  description: string | null
  is_active: boolean
}>): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('recurring_expenses')
    .update(input)
    .eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

/**
 * Gera automaticamente os lançamentos do mês corrente
 * para todas as recorrências ativas que ainda não foram geradas.
 */
export async function generateMonthlyRecurring(month: number, year: number): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: recurring } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (!recurring || recurring.length === 0) return 0

  const toGenerate = recurring.filter((r) => {
    if (r.last_generated_year === year && r.last_generated_month === month) return false
    return true
  })

  if (toGenerate.length === 0) return 0

  const daysInMonth = new Date(year, month, 0).getDate()

  const inserts = toGenerate.map((r) => ({
    user_id: user.id,
    category_id: r.category_id,
    expense_name_id: r.expense_name_id,
    amount: r.amount,
    due_date: `${year}-${String(month).padStart(2, '0')}-${String(Math.min(r.day_of_month, daysInMonth)).padStart(2, '0')}`,
    description: r.description,
    status: 'agendado',
    is_recurring: true,
    recurring_expense_id: r.id,
  }))

  const { error } = await supabase.from('expenses').insert(inserts)
  if (error) throw error

  // Marcar como gerado
  for (const r of toGenerate) {
    await supabase
      .from('recurring_expenses')
      .update({ last_generated_month: month, last_generated_year: year })
      .eq('id', r.id)
  }

  revalidatePath('/')
  return toGenerate.length
}
