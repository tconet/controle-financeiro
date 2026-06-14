import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
