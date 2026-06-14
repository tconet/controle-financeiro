'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Expense, ExpenseStatus } from '@/lib/types'

export interface CreateExpenseInput {
  category_id?: string | null
  expense_name_id?: string | null
  amount: number
  due_date: string
  description?: string | null
  status?: ExpenseStatus
  is_recurring?: boolean
  recurring_expense_id?: string | null
}

export async function getExpenses(month: number, year: number): Promise<Expense[]> {
  const supabase = await createClient()
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      categories(id, name),
      expense_names(id, name)
    `)
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getAllExpenses(filters?: {
  month?: number
  year?: number
  status?: ExpenseStatus
  category_id?: string
}): Promise<Expense[]> {
  const supabase = await createClient()
  let query = supabase
    .from('expenses')
    .select(`
      *,
      categories(id, name),
      expense_names(id, name)
    `)
    .order('due_date', { ascending: false })

  if (filters?.month && filters?.year) {
    const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`
    const endDate = new Date(filters.year, filters.month, 0).toISOString().split('T')[0]
    query = query.gte('due_date', startDate).lte('due_date', endDate)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...input,
      user_id: user.id,
      status: input.status ?? 'agendado',
    })
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

export async function updateExpense(id: string, input: Partial<CreateExpenseInput> & { paid_date?: string | null }): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .update(input)
    .eq('id', id)

  if (error) throw error
  revalidatePath('/')
}

export async function updateExpenseStatus(id: string, status: ExpenseStatus): Promise<void> {
  const supabase = await createClient()
  const updates: { status: ExpenseStatus; paid_date?: string | null } = { status }

  if (status === 'pago') {
    updates.paid_date = new Date().toISOString().split('T')[0]
  } else {
    updates.paid_date = null
  }

  const { error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)

  if (error) throw error
  revalidatePath('/')
}

export async function updateMultipleExpenseStatus(ids: string[], status: ExpenseStatus): Promise<void> {
  const supabase = await createClient()
  const updates: { status: ExpenseStatus; paid_date?: string | null } = { status }

  if (status === 'pago') {
    updates.paid_date = new Date().toISOString().split('T')[0]
  } else {
    updates.paid_date = null
  }

  const { error } = await supabase
    .from('expenses')
    .update(updates)
    .in('id', ids)

  if (error) throw error
  revalidatePath('/')
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function getNotifications(): Promise<Expense[]> {
  const supabase = await createClient()
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const todayStr = now.toISOString().split('T')[0]
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      categories(id, name),
      expense_names(id, name)
    `)
    .eq('status', 'aberto')
    .gte('due_date', todayStr)
    .lte('due_date', tomorrowStr)
    .order('due_date')

  if (error) throw error
  return data ?? []
}
