'use client'

import { useState } from 'react'
import { Expense } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { DayModal } from './DayModal'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface ExpenseCalendarProps {
  month: number
  year: number
  expenses: Expense[]
  onUpdate: () => void
}

export function ExpenseCalendar({ month, year, expenses, onUpdate }: ExpenseCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  // Agrupar despesas por dia
  const expensesByDay = new Map<string, Expense[]>()
  for (const exp of expenses) {
    const day = exp.due_date
    if (!expensesByDay.has(day)) expensesByDay.set(day, [])
    expensesByDay.get(day)!.push(exp)
  }

  const cells = Array.from({ length: firstDay }).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Calendário de Vencimentos</h3>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-xs font-medium text-gray-400 text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Células */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />

          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayExpenses = expensesByDay.get(dateStr) ?? []
          const total = dayExpenses.reduce((s, e) => s + Number(e.amount), 0)
          const isToday = dateStr === today
          const hasExpenses = dayExpenses.length > 0
          const allPaid = hasExpenses && dayExpenses.every((e) => e.status === 'pago')
          const hasOpen = dayExpenses.some((e) => e.status === 'aberto')
          const hasScheduled = dayExpenses.some((e) => e.status === 'agendado')

          return (
            <button
              key={dateStr}
              onClick={() => hasExpenses ? setSelectedDate(dateStr) : null}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all',
                hasExpenses ? 'cursor-pointer hover:scale-105' : 'cursor-default',
                isToday && !hasExpenses && 'ring-2 ring-blue-400 dark:ring-blue-600',
                hasExpenses && allPaid && 'bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900/40',
                hasExpenses && !allPaid && hasOpen && 'bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40',
                hasExpenses && !allPaid && !hasOpen && hasScheduled && 'bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-100 dark:border-yellow-900/40',
                isToday && 'ring-2 ring-blue-500'
              )}
            >
              <span className={cn(
                'font-medium',
                isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              )}>
                {day}
              </span>
              {hasExpenses && (
                <span className={cn(
                  'text-[9px] font-semibold mt-0.5 leading-tight',
                  allPaid ? 'text-green-600 dark:text-green-400' :
                  hasOpen ? 'text-red-600 dark:text-red-400' :
                  'text-yellow-600 dark:text-yellow-400'
                )}>
                  {formatCurrency(total).replace('R$ ', 'R$')}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
        {[
          { color: 'bg-yellow-100 dark:bg-yellow-900/40', label: 'Agendado' },
          { color: 'bg-red-100 dark:bg-red-900/40', label: 'Em aberto' },
          { color: 'bg-green-100 dark:bg-green-900/40', label: 'Pago' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Modal do dia */}
      {selectedDate && (
        <DayModal
          date={selectedDate}
          expenses={expensesByDay.get(selectedDate) ?? []}
          onClose={() => setSelectedDate(null)}
          onUpdate={() => {
            setSelectedDate(null)
            onUpdate()
          }}
        />
      )}
    </div>
  )
}
