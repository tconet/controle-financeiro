// ============================================================
// Tipos do sistema de Controle Financeiro
// ============================================================

export type ExpenseStatus = 'aberto' | 'agendado' | 'pago'

export interface Category {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface ExpenseName {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Shortcut {
  id: string
  user_id: string
  name: string
  category_id: string | null
  expense_name_id: string | null
  sort_order: number
  created_at: string
  categories?: Category | null
  expense_names?: ExpenseName | null
}

export interface RecurringExpense {
  id: string
  user_id: string
  name: string
  category_id: string | null
  expense_name_id: string | null
  amount: number
  day_of_month: number
  description: string | null
  is_active: boolean
  last_generated_month: number | null
  last_generated_year: number | null
  created_at: string
  categories?: Category | null
  expense_names?: ExpenseName | null
}

export interface Expense {
  id: string
  user_id: string
  category_id: string | null
  expense_name_id: string | null
  amount: number
  due_date: string
  paid_date: string | null
  description: string | null
  status: ExpenseStatus
  recurring_expense_id: string | null
  is_recurring: boolean
  created_at: string
  categories?: Category | null
  expense_names?: ExpenseName | null
}

export interface Revenue {
  id: string
  user_id: string
  month: number
  year: number
  amount: number
  description: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// Tipos de visualização
// ============================================================

export interface DRECategory {
  category_id: string | null
  category_name: string
  total: number
  expenses: Expense[]
}

export interface DREData {
  month: number
  year: number
  revenue: number
  totalExpenses: number
  result: number
  categories: DRECategory[]
}

export interface StatusSummary {
  aberto: number
  agendado: number
  pago: number
}

export interface CalendarDay {
  date: string
  total: number
  expenses: Expense[]
}

export interface SupplierReport {
  expense_name_id: string | null
  expense_name: string
  total: number
  count: number
  monthly: { month: number; year: number; total: number }[]
}
