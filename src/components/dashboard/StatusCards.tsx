'use client'

import { Expense } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'

interface StatusCardsProps {
  expenses: Expense[]
}

export function StatusCards({ expenses }: StatusCardsProps) {
  const aberto = expenses.filter((e) => e.status === 'aberto').reduce((s, e) => s + Number(e.amount), 0)
  const agendado = expenses.filter((e) => e.status === 'agendado').reduce((s, e) => s + Number(e.amount), 0)
  const pago = expenses.filter((e) => e.status === 'pago').reduce((s, e) => s + Number(e.amount), 0)

  const cards = [
    {
      label: 'Em Aberto',
      value: aberto,
      count: expenses.filter((e) => e.status === 'aberto').length,
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-100 dark:border-red-900/40',
    },
    {
      label: 'Agendado',
      value: agendado,
      count: expenses.filter((e) => e.status === 'agendado').length,
      icon: Clock,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-950/40',
      border: 'border-yellow-100 dark:border-yellow-900/40',
    },
    {
      label: 'Pago',
      value: pago,
      count: expenses.filter((e) => e.status === 'pago').length,
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950/40',
      border: 'border-green-100 dark:border-green-900/40',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map(({ label, value, count, icon: Icon, color, bg, border }) => (
        <div
          key={label}
          className={`${bg} ${border} border rounded-2xl p-5`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
            <Icon size={20} className={color} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(value)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {count} lançamento{count !== 1 ? 's' : ''}
          </p>
        </div>
      ))}
    </div>
  )
}
