'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PeriodFilter } from '@/components/dashboard/PeriodFilter'
import { StatusCards } from '@/components/dashboard/StatusCards'
import { CategorySummary } from '@/components/dashboard/CategorySummary'
import { ExpenseCalendar } from '@/components/dashboard/ExpenseCalendar'
import { Expense, Shortcut, Revenue } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { generateMonthlyRecurring } from '@/app/actions/recurring'
import { formatCurrency } from '@/lib/utils'
import { Plus, DollarSign } from 'lucide-react'

export default function DashboardPage() {
  const now = new Date()
  const router = useRouter()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [revenue, setRevenue] = useState<Revenue | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const [expRes, shortRes, revRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('*, categories(id, name), expense_names(id, name)')
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date'),
      supabase
        .from('shortcuts')
        .select('*, categories(id, name), expense_names(id, name)')
        .order('sort_order'),
      supabase.from('revenues').select('*').eq('month', month).eq('year', year).single(),
    ])

    setExpenses(expRes.data ?? [])
    setShortcuts(shortRes.data ?? [])
    setRevenue(revRes.data ?? null)
    setLoading(false)
  }, [month, year])

  useEffect(() => {
    loadData()
    // Gerar recorrências do mês corrente silenciosamente
    generateMonthlyRecurring(now.getMonth() + 1, now.getFullYear()).catch(() => {})
  }, [loadData])

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const revenueAmount = revenue?.amount ?? 0
  const result = revenueAmount - totalExpenses

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <PeriodFilter month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />
        <button
          onClick={() => router.push('/lancamentos')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Novo Lançamento
        </button>
      </div>

      {/* Resultado + atalhos */}
      <div className="grid grid-cols-4 gap-4">
        {/* Card Resultado */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Resultado</span>
          </div>
          <p className={`text-xl font-bold ${result >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(result)}
          </p>
          <div className="mt-2 text-xs text-gray-400 space-y-0.5">
            <div className="flex justify-between">
              <span>Receita</span>
              <span className="text-green-600 dark:text-green-400">{formatCurrency(revenueAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Despesas</span>
              <span className="text-red-500">{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Atalhos */}
        <div className="col-span-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Atalhos rápidos</p>
          <div className="flex flex-wrap gap-2">
            {shortcuts.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push('/lancamentos')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-100 dark:hover:border-blue-900 transition-all"
              >
                <Plus size={14} />
                {s.name}
              </button>
            ))}
            {shortcuts.length === 0 && (
              <p className="text-sm text-gray-400">Nenhum atalho cadastrado. Crie em Cadastros → Atalhos.</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <StatusCards expenses={expenses} />

      {/* Calendário + Categorias lado a lado */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <ExpenseCalendar
            month={month}
            year={year}
            expenses={expenses}
            onUpdate={loadData}
          />
        </div>
        <div>
          <CategorySummary expenses={expenses} />
        </div>
      </div>

    </div>
  )
}
