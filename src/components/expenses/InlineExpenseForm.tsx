'use client'

import { useState, useEffect, useTransition } from 'react'
import { Category, ExpenseName, Shortcut, ExpenseStatus, Expense } from '@/lib/types'
import { createExpense, updateExpense } from '@/app/actions/expenses'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineExpenseFormProps {
  shortcuts?: Shortcut[]
  editExpense?: Expense | null
  onSuccess: () => void
  onCancelEdit?: () => void
}

const EMPTY = {
  categoryId: '',
  expenseNameId: '',
  amount: '',
  dueDate: new Date().toISOString().split('T')[0],
  description: '',
  status: 'agendado' as ExpenseStatus,
  isRecurring: false,
}

export function InlineExpenseForm({
  shortcuts = [],
  editExpense,
  onSuccess,
  onCancelEdit,
}: InlineExpenseFormProps) {
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState<Category[]>([])
  const [expenseNames, setExpenseNames] = useState<ExpenseName[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [categoryId, setCategoryId] = useState(EMPTY.categoryId)
  const [expenseNameId, setExpenseNameId] = useState(EMPTY.expenseNameId)
  const [amount, setAmount] = useState(EMPTY.amount)
  const [dueDate, setDueDate] = useState(EMPTY.dueDate)
  const [description, setDescription] = useState(EMPTY.description)
  const [status, setStatus] = useState<ExpenseStatus>(EMPTY.status)
  const [isRecurring, setIsRecurring] = useState(EMPTY.isRecurring)

  // Carregar categorias e despesas frescos
  useEffect(() => {
    async function loadOptions() {
      try {
        const supabase = createClient()
        const [catRes, expRes] = await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('expense_names').select('*').order('name'),
        ])
        setCategories(catRes.data ?? [])
        setExpenseNames(expRes.data ?? [])
      } finally {
        setLoadingData(false)
      }
    }
    loadOptions()
  }, [])

  // Quando muda o editExpense, preencher o form
  useEffect(() => {
    if (editExpense) {
      setCategoryId(editExpense.category_id ?? '')
      setExpenseNameId(editExpense.expense_name_id ?? '')
      setAmount(String(editExpense.amount))
      setDueDate(editExpense.due_date)
      setDescription(editExpense.description ?? '')
      setStatus(editExpense.status)
      setIsRecurring(editExpense.is_recurring)
    } else {
      resetForm()
    }
  }, [editExpense])

  function resetForm() {
    setCategoryId(EMPTY.categoryId)
    setExpenseNameId(EMPTY.expenseNameId)
    setAmount(EMPTY.amount)
    setDueDate(new Date().toISOString().split('T')[0])
    setDescription(EMPTY.description)
    setStatus(EMPTY.status)
    setIsRecurring(EMPTY.isRecurring)
    setError('')
  }

  function applyShortcut(shortcut: Shortcut) {
    if (shortcut.category_id) setCategoryId(shortcut.category_id)
    if (shortcut.expense_name_id) setExpenseNameId(shortcut.expense_name_id)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Informe um valor válido.')
      return
    }

    startTransition(async () => {
      try {
        const payload = {
          category_id: categoryId || null,
          expense_name_id: expenseNameId || null,
          amount: Number(amount),
          due_date: dueDate,
          description: description || null,
          status,
          is_recurring: isRecurring,
        }

        if (editExpense) {
          await updateExpense(editExpense.id, payload)
          onCancelEdit?.()
        } else {
          await createExpense(payload)
          // Mostrar feedback de sucesso e resetar (sem fechar o painel)
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
          resetForm()
        }
        onSuccess()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar.')
      }
    })
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={20} className="animate-spin text-blue-500" />
      </div>
    )
  }

  const isEditing = !!editExpense

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
      {/* Header do painel */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          {isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}
        </h3>
        {isEditing && (
          <button
            onClick={() => { resetForm(); onCancelEdit?.() }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5 overflow-y-auto">
        {/* Atalhos */}
        {!isEditing && shortcuts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Atalhos</p>
            <div className="flex flex-wrap gap-1.5">
              {shortcuts.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => applyShortcut(s)}
                  className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categoria */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Categoria</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecionar...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Despesa */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Despesa / Fornecedor</label>
          <select
            value={expenseNameId}
            onChange={(e) => setExpenseNameId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecionar...</option>
            {expenseNames.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

        {/* Valor */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor (R$) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Vencimento */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Vencimento *</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
          <div className="flex gap-1.5">
            {(['aberto', 'agendado', 'pago'] as ExpenseStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  'flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  status === s
                    ? s === 'aberto' ? 'bg-red-500 text-white border-red-500'
                      : s === 'agendado' ? 'bg-yellow-500 text-white border-yellow-500'
                      : 'bg-green-500 text-white border-green-500'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                {s === 'aberto' ? 'Aberto' : s === 'agendado' ? 'Agendado' : 'Pago'}
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descrição (opcional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Observações..."
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Recorrente */}
        {!isEditing && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">Repetir mensalmente</span>
          </label>
        )}

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2',
            saved
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
          )}
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {saved && <CheckCircle2 size={14} />}
          {saved ? 'Lançado!' : isEditing ? 'Salvar Alterações' : 'Lançar'}
        </button>

        {!isEditing && (
          <button
            type="button"
            onClick={resetForm}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            Limpar campos
          </button>
        )}
      </form>
    </div>
  )
}
