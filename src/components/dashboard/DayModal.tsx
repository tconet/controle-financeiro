'use client'

import { useState, useTransition } from 'react'
import { Expense, ExpenseStatus } from '@/lib/types'
import { updateExpenseStatus, updateMultipleExpenseStatus } from '@/app/actions/expenses'
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DayModalProps {
  date: string
  expenses: Expense[]
  onClose: () => void
  onUpdate: () => void
}

export function DayModal({ date, expenses, onClose, onUpdate }: DayModalProps) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const agendados = expenses.filter((e) => e.status === 'agendado')
  const abertos = expenses.filter((e) => e.status === 'aberto')
  const pagos = expenses.filter((e) => e.status === 'pago')

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleMarkPaid(id: string) {
    startTransition(async () => {
      await updateExpenseStatus(id, 'pago')
      onUpdate()
    })
  }

  function handleMarkScheduled(id: string) {
    startTransition(async () => {
      await updateExpenseStatus(id, 'agendado')
      onUpdate()
    })
  }

  function handleMarkAllPaid() {
    const ids = agendados.map((e) => e.id)
    if (ids.length === 0) return
    startTransition(async () => {
      await updateMultipleExpenseStatus(ids, 'pago')
      onUpdate()
    })
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {formatDate(date)}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {expenses.length} lançamento{expenses.length !== 1 ? 's' : ''} · {formatCurrency(total)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Marcar todos agendados como pago */}
        {agendados.length > 1 && (
          <div className="px-6 py-3 border-b border-gray-50 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-950/20">
            <button
              onClick={handleMarkAllPaid}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-400 hover:text-yellow-800 disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              ✓ Marcar todos os {agendados.length} agendados como Pago
            </button>
          </div>
        )}

        {/* Lista */}
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
          {expenses.map((exp) => {
            const catName = (exp.categories as { name: string } | null)?.name ?? '—'
            const expName = (exp.expense_names as { name: string } | null)?.name ?? '—'

            return (
              <div key={exp.id} className="px-6 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[exp.status])}>
                      {STATUS_LABELS[exp.status]}
                    </span>
                    <span className="text-xs text-gray-400">{catName}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{expName}</p>
                  {exp.description && (
                    <p className="text-xs text-gray-400 truncate">{exp.description}</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(Number(exp.amount))}
                  </p>

                  {/* Ações rápidas */}
                  <div className="flex gap-1.5 mt-1 justify-end">
                    {exp.status === 'aberto' && (
                      <>
                        <button
                          onClick={() => handleMarkScheduled(exp.id)}
                          disabled={isPending}
                          className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 disabled:opacity-50 transition-colors"
                        >
                          Agendar
                        </button>
                        <button
                          onClick={() => handleMarkPaid(exp.id)}
                          disabled={isPending}
                          className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors"
                        >
                          Pagar
                        </button>
                      </>
                    )}
                    {exp.status === 'agendado' && (
                      <button
                        onClick={() => handleMarkPaid(exp.id)}
                        disabled={isPending}
                        className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors"
                      >
                        Pagar
                      </button>
                    )}
                    {exp.status === 'pago' && (
                      <span className="text-xs text-green-500">✓ Pago</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
