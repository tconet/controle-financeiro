import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Expense } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Agrupa lançamentos por fornecedor/despesa, somando valores e ordenando do maior para o menor total. */
export function groupByExpenseName(expenses: Expense[]) {
  const grouped = expenses.reduce<Record<string, { name: string; total: number; count: number }>>((acc, exp) => {
    const nameId = exp.expense_name_id ?? '__sem_nome__'
    const name = (exp.expense_names as { name: string } | null)?.name ?? '(sem despesa)'
    if (!acc[nameId]) acc[nameId] = { name, total: 0, count: 0 }
    acc[nameId].total += Number(exp.amount)
    acc[nameId].count += 1
    return acc
  }, {})

  return Object.entries(grouped).sort(([, a], [, b]) => b.total - a.total)
}

/** Percentual de `value` sobre `revenue`, formatado como string ("12.34%") ou "—" se revenue for 0. */
export function pctOf(value: number, revenue: number): string {
  if (!revenue) return '—'
  return `${((value / revenue) * 100).toFixed(2)}%`
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto',
  agendado: 'Agendado',
  pago: 'Pago',
}

export const STATUS_COLORS: Record<string, string> = {
  aberto: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  agendado: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  pago: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}
