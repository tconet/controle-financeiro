'use client'

import { useState, useEffect, useTransition } from 'react'
import { RecurringExpense, Category, ExpenseName } from '@/lib/types'
import { getRecurringExpenses, createRecurringExpense, updateRecurringExpense, deleteRecurringExpense } from '@/app/actions/recurring'
import { getCategories } from '@/app/actions/categories'
import { getExpenseNames } from '@/app/actions/expense-names'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Plus, Trash2, Loader2, RefreshCw, Pencil } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function RecorrenciasPage() {
  const [recurring, setRecurring] = useState<RecurringExpense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [expenseNames, setExpenseNames] = useState<ExpenseName[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    name: '',
    category_id: '',
    expense_name_id: '',
    amount: '',
    day_of_month: '1',
    description: '',
  })

  async function load() {
    const [r, c, e] = await Promise.all([getRecurringExpenses(), getCategories(), getExpenseNames()])
    setRecurring(r)
    setCategories(c)
    setExpenseNames(e)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleCreate(ev: React.FormEvent) {
    ev.preventDefault()
    startTransition(async () => {
      await createRecurringExpense({
        name: form.name,
        category_id: form.category_id || null,
        expense_name_id: form.expense_name_id || null,
        amount: Number(form.amount),
        day_of_month: Number(form.day_of_month),
        description: form.description || null,
      })
      setForm({ name: '', category_id: '', expense_name_id: '', amount: '', day_of_month: '1', description: '' })
      setShowForm(false)
      load()
    })
  }

  function handleToggle(id: string, is_active: boolean) {
    startTransition(async () => {
      await updateRecurringExpense(id, { is_active: !is_active })
      load()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir esta recorrência? Os lançamentos já gerados não serão removidos.')) return
    startTransition(async () => {
      await deleteRecurringExpense(id)
      load()
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/cadastros" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recorrências</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={14} /> Nova Recorrência
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Lançamentos recorrentes são criados automaticamente no início de cada mês, com status <strong>Agendado</strong>.
      </p>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 mb-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Nome *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Aluguel, Contador..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0,00"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Dia do mês *</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.day_of_month}
                onChange={(e) => setForm({ ...form, day_of_month: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Categoria</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Nenhuma</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Despesa</label>
              <select
                value={form.expense_name_id}
                onChange={(e) => setForm({ ...form, expense_name_id: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">Nenhuma</option>
                {expenseNames.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Descrição</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Observações opcionais..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Salvar
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : recurring.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">Nenhuma recorrência cadastrada</p>
      ) : (
        <div className="flex flex-col gap-2">
          {recurring.map((r) => {
            const catName = (r.categories as { name: string } | null)?.name ?? '—'
            const expName = (r.expense_names as { name: string } | null)?.name ?? '—'
            return (
              <div
                key={r.id}
                className={cn(
                  'flex items-center gap-4 bg-white dark:bg-gray-900 border rounded-xl px-5 py-4 group transition-colors',
                  r.is_active
                    ? 'border-gray-100 dark:border-gray-800'
                    : 'border-gray-100 dark:border-gray-800 opacity-50'
                )}
              >
                <div className={cn(
                  'rounded-xl p-2.5',
                  r.is_active ? 'bg-blue-50 dark:bg-blue-950/40' : 'bg-gray-50 dark:bg-gray-800'
                )}>
                  <RefreshCw size={16} className={r.is_active ? 'text-blue-500' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{r.name}</p>
                    <span className="text-xs text-gray-400">dia {r.day_of_month}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {catName !== '—' ? catName : ''}{catName !== '—' && expName !== '—' ? ' · ' : ''}{expName !== '—' ? expName : ''}
                    {catName === '—' && expName === '—' ? 'Sem categoria/despesa' : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(r.amount)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(r.id, r.is_active)}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                      r.is_active ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                      r.is_active ? 'translate-x-4.5' : 'translate-x-0.5'
                    )} />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
