'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Expense, Category, ExpenseName, Shortcut, ExpenseStatus } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { deleteExpense, updateExpenseStatus } from '@/app/actions/expenses'
import { InlineExpenseForm } from '@/components/expenses/InlineExpenseForm'
import { PeriodFilter } from '@/components/dashboard/PeriodFilter'
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Pencil, Trash2, RefreshCw, X } from 'lucide-react'

export default function LancamentosPage() {
  const now = new Date()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'todos'>('todos')
  const [categoryFilter, setCategoryFilter] = useState<string>('todos')
  const [expenseNameFilter, setExpenseNameFilter] = useState<string>('todos')
  const today = now.toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState<string>(today)
  const [dateTo, setDateTo] = useState<string>(today)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [expenseNames, setExpenseNames] = useState<ExpenseName[]>([])
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [initialShortcut, setInitialShortcut] = useState<Shortcut | null>(null)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)

  // Quando muda o mês/ano, limpar filtro de data
  function handlePeriodChange(m: number, y: number) {
    setMonth(m)
    setYear(y)
    setDateFrom('')
    setDateTo('')
  }

  const loadData = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const [expRes, catRes, expNameRes, shortRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('*, categories(id, name), expense_names(id, name)')
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('expense_names').select('*').order('name'),
      supabase.from('shortcuts').select('*, categories(id, name), expense_names(id, name)').order('sort_order'),
    ])

    setExpenses(expRes.data ?? [])
    setCategories(catRes.data ?? [])
    setExpenseNames(expNameRes.data ?? [])
    setShortcuts(shortRes.data ?? [])
    setLoading(false)
  }, [month, year])

  useEffect(() => { loadData() }, [loadData])

  // Aplicar atalho vindo do dashboard via query param
  useEffect(() => {
    const shortcutId = searchParams.get('shortcut')
    if (!shortcutId || shortcuts.length === 0) return
    const found = shortcuts.find((s) => s.id === shortcutId)
    if (found) {
      setInitialShortcut(found)
      // Limpar o param da URL sem recarregar a página
      router.replace('/lancamentos', { scroll: false })
    }
  }, [searchParams, shortcuts, router])

  const hasDateFilter = !!(dateFrom || dateTo)

  const filtered = expenses.filter((e) => {
    if (statusFilter !== 'todos' && e.status !== statusFilter) return false
    if (categoryFilter !== 'todos' && e.category_id !== categoryFilter) return false
    if (expenseNameFilter !== 'todos' && e.expense_name_id !== expenseNameFilter) return false
    if (dateFrom && e.due_date < dateFrom) return false
    if (dateTo && e.due_date > dateTo) return false
    return true
  })

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0)

  async function handleDelete(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    await deleteExpense(id)
    loadData()
  }

  async function handleStatusChange(id: string, status: ExpenseStatus) {
    await updateExpenseStatus(id, status)
    loadData()
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-6rem)]">
      {/* Header: filtro de período */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <PeriodFilter month={month} year={year} onChange={handlePeriodChange} />
      </div>

      {/* Layout split */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* ===== Painel esquerdo: lista ===== */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {/* Filtros */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 flex flex-wrap gap-2 items-center flex-shrink-0">
            {/* Status */}
            <div className="flex gap-1.5">
              {(['todos', 'aberto', 'agendado', 'pago'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-lg transition-colors',
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  {s === 'todos' ? 'Todos' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Categoria */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todas as categorias</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* Despesa */}
            <select
              value={expenseNameFilter}
              onChange={(e) => setExpenseNameFilter(e.target.value)}
              className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todas as despesas</option>
              {expenseNames.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>

            {/* Separador */}
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

            {/* Filtro de data */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">De</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={cn(
                  'text-xs border rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  hasDateFilter
                    ? 'border-blue-400 dark:border-blue-600'
                    : 'border-gray-200 dark:border-gray-700'
                )}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={cn(
                  'text-xs border rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  hasDateFilter
                    ? 'border-blue-400 dark:border-blue-600'
                    : 'border-gray-200 dark:border-gray-700'
                )}
              />
              {hasDateFilter && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo('') }}
                  title="Limpar filtro de data"
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Totalizador */}
            <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
              {filtered.length} {filtered.length !== 1 ? 'lançamentos' : 'lançamento'} ·{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Tabela scrollável */}
          <div className="flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center flex-1">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                <ReceiptIcon className="mb-3 opacity-30" size={36} />
                <p className="text-sm">Nenhum lançamento encontrado</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/70 backdrop-blur">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Venc.</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Despesa</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Categoria</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Valor</th>
                      <th className="px-3 py-2.5 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filtered.map((exp) => {
                      const catName = (exp.categories as { name: string } | null)?.name ?? '—'
                      const expName = (exp.expense_names as { name: string } | null)?.name ?? '—'
                      const isEditing = editExpense?.id === exp.id
                      return (
                        <tr
                          key={exp.id}
                          className={cn(
                            'hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group',
                            isEditing && 'bg-blue-50/50 dark:bg-blue-950/20'
                          )}
                        >
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {formatDate(exp.due_date)}
                              {exp.is_recurring && (
                                <RefreshCw size={10} className="text-blue-400 shrink-0" title="Recorrente" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-[160px]">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{expName}</p>
                            {exp.description && (
                              <p className="text-xs text-gray-400 truncate">{exp.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden lg:table-cell truncate max-w-[120px]">{catName}</td>
                          <td className="px-4 py-3">
                            <select
                              value={exp.status}
                              onChange={(e) => handleStatusChange(exp.id, e.target.value as ExpenseStatus)}
                              className={cn(
                                'text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500',
                                STATUS_COLORS[exp.status]
                              )}
                            >
                              <option value="aberto">Aberto</option>
                              <option value="agendado">Agendado</option>
                              <option value="pago">Pago</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            {formatCurrency(Number(exp.amount))}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                              <button
                                onClick={() => setEditExpense(isEditing ? null : exp)}
                                title="Editar"
                                className={cn(
                                  'p-1.5 rounded-lg transition-colors',
                                  isEditing
                                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                    : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                                )}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(exp.id)}
                                title="Excluir"
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ===== Painel direito: formulário sempre visível ===== */}
        <div className="w-72 shrink-0 overflow-y-auto">
          <InlineExpenseForm
            shortcuts={shortcuts}
            editExpense={editExpense}
            initialShortcut={initialShortcut}
            onInitialShortcutApplied={() => setInitialShortcut(null)}
            onSuccess={loadData}
            onCancelEdit={() => setEditExpense(null)}
          />
        </div>
      </div>
    </div>
  )
}

function ReceiptIcon({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M14 8H8" />
      <path d="M16 12H8" />
      <path d="M13 16H8" />
    </svg>
  )
}
