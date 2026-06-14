'use server'

import { createClient } from '@/lib/supabase/server'
import { DREData, DRECategory, SupplierReport } from '@/lib/types'

export async function getDREData(month: number, year: number): Promise<DREData> {
  const supabase = await createClient()
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const [expensesRes, revenueRes] = await Promise.all([
    supabase
      .from('expenses')
      .select(`*, categories(id, name), expense_names(id, name)`)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .eq('status', 'pago'),
    supabase
      .from('revenues')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .single(),
  ])

  const expenses = expensesRes.data ?? []
  const revenue = revenueRes.data?.amount ?? 0

  // Agrupar por categoria
  const categoryMap = new Map<string, DRECategory>()

  for (const exp of expenses) {
    const key = exp.category_id ?? 'sem-categoria'
    const name = (exp.categories as { name: string } | null)?.name ?? 'Sem Categoria'

    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        category_id: exp.category_id,
        category_name: name,
        total: 0,
        expenses: [],
      })
    }

    const cat = categoryMap.get(key)!
    cat.total += Number(exp.amount)
    cat.expenses.push(exp)
  }

  const categories = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total)
  const totalExpenses = categories.reduce((sum, c) => sum + c.total, 0)

  return {
    month,
    year,
    revenue,
    totalExpenses,
    result: revenue - totalExpenses,
    categories,
  }
}

export async function getSupplierReport(filters?: {
  months?: number
  year?: number
}): Promise<SupplierReport[]> {
  const supabase = await createClient()

  let query = supabase
    .from('expenses')
    .select(`*, expense_names(id, name)`)
    .eq('status', 'pago')
    .order('due_date')

  if (filters?.year) {
    const startDate = `${filters.year}-01-01`
    const endDate = `${filters.year}-12-31`
    query = query.gte('due_date', startDate).lte('due_date', endDate)
  }

  const { data: expenses } = await query

  if (!expenses) return []

  const supplierMap = new Map<string, SupplierReport>()

  for (const exp of expenses) {
    const key = exp.expense_name_id ?? 'sem-despesa'
    const name = (exp.expense_names as { name: string } | null)?.name ?? 'Sem Despesa'
    const dueDate = new Date(exp.due_date)
    const month = dueDate.getMonth() + 1
    const year = dueDate.getFullYear()

    if (!supplierMap.has(key)) {
      supplierMap.set(key, {
        expense_name_id: exp.expense_name_id,
        expense_name: name,
        total: 0,
        count: 0,
        monthly: [],
      })
    }

    const supplier = supplierMap.get(key)!
    supplier.total += Number(exp.amount)
    supplier.count += 1

    const monthEntry = supplier.monthly.find((m) => m.month === month && m.year === year)
    if (monthEntry) {
      monthEntry.total += Number(exp.amount)
    } else {
      supplier.monthly.push({ month, year, total: Number(exp.amount) })
    }
  }

  return Array.from(supplierMap.values()).sort((a, b) => b.total - a.total)
}
