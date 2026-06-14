'use client'

import { useState, useEffect, useTransition } from 'react'
import { Category, ExpenseName, Shortcut, ExpenseStatus, Expense } from '@/lib/types'
import { createExpense, updateExpense } from '@/app/actions/expenses'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpenseFormProps {
  shortcuts?: Shortcut[]
  onClose: () => void
  onSuccess: () => void
  prefill?: {
    category_id?: string | null
    expense_name_id?: string | null
    status?: ExpenseStatus
  }
  editExpense?: Expense
}

export function ExpenseForm({
  shortcuts = [],
  onClose,
  onSuccess,
  prefill,
  editExpense,
}: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState<Category[]>([])
  const [expenseNames, setExpenseNames] = useState<ExpenseName[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState<string>('')

  const [categoryId, setCategoryId] = useState<string>(editExpense?.category_id ?? prefill?.category_id ?? '')
  const [expenseNameId, setExpenseNameId] = useState<string>(editExpense?.expense_name_id ?? prefill?.expense_name_id ?? '')
  const [amount, setAmount] = useState<string>(editExpense ? String(editExpense.amount) : '')
  const [dueDate, setDueDate] = useState<string>(editExpense?.due_date ?? new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState<string>(editExpense?.description ?? '')
  const [status, setStatus] = useState<ExpenseStatus>(editExpense?.status ?? prefill?.status ?? 'agendado')
  const [isRecurring, setIsRecurring] = useState<boolean>(editExpense?.is_recurring ?? false)
  const [error, setError] = useState<string>('')

  // Buscar categorias e despesas sempre frescos ao abrir o form
  useEffect(() => {
    async function loadOptions() {
      try {
        const supabase = createClient()
        const [catRes, expRes] = await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('expense_names').select('*').order('name'),
        ])
        if (catRes.error) throw new Error(`Categorias: ${catRes.error.message}`)
        if (expRes.error) throw new Error(`Despesas: ${expRes.error.message}`)
        setCategories(catRes.data ?? [])
        setExpenseNames(expRes.data ?? [])
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar dados'
        console.error('[ExpenseForm] loadOptions:', msg)
        setLoadError(msg)
      } finally {
        setLoadingData(false)
      }
    }
    loadOptions()
  }, [])

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
    if (!dueDate) {
      setError('Informe a data de vencimento.')
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
        } else {
          await createExpense(payload)
        }
        onSuccess()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar lançamento.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {editExpense ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Shortcuts */}
        {!editExpense && shortcuts.length > 0 && (
          <div className="px-6 pt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Atalhos</p>
            <div className="flex flex-wrap gap-2">
              {shortcuts.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => applyShortcut(s)}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : loadError ? (
          <div className="p-6 space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Erro ao carregar dados</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">{loadError}</p>
            <p className="text-xs text-gray-400">Verifique o console do navegador (F12) para mais detalhes.</p>
            <button
              onClick={onClose}
              className="w-full py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {/* Categoria */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecionar categoria...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Despesa */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Despesa / Fornecedor
              </label>
              <select
                value={expenseNameId}
                onChange={(e) => setExpenseNameId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecionar despesa...</option>
                {expenseNames.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            {/* Valor e Data lado a lado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Vencimento *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Status
              </label>
              <div className="flex gap-2">
                {(['aberto', 'agendado', 'pago'] as ExpenseStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      'flex-1 py-2 text-xs font-medium rounded-lg border transition-colors capitalize',
                      status === s
                        ? s === 'aberto'
                          ? 'bg-red-500 text-white border-red-500'
                          : s === 'agendado'
                          ? 'bg-yellow-500 text-white border-yellow-500'
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
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Descrição (opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Observações sobre este lançamento..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Recorrente */}
            {!editExpense && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Repetir mensalmente (mesmo dia e valor)
                </span>
              </label>
            )}

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {editExpense ? 'Salvar' : 'Lançar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
