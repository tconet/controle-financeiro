'use client'

import { Expense, Category } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface CategorySummaryProps {
  expenses: Expense[]
}

export function CategorySummary({ expenses }: CategorySummaryProps) {
  // Agrupar por categoria (apenas pagos + agendados para dar visão total)
  const categoryMap = new Map<string, { name: string; total: number; count: number }>()

  for (const exp of expenses) {
    const key = exp.category_id ?? 'sem-categoria'
    const name = (exp.categories as { name: string } | null)?.name ?? 'Sem Categoria'
    const existing = categoryMap.get(key)
    if (existing) {
      existing.total += Number(exp.amount)
      existing.count += 1
    } else {
      categoryMap.set(key, { name, total: Number(exp.amount), count: 1 })
    }
  }

  const categories = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total)
  const grandTotal = categories.reduce((s, c) => s + c.total, 0)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
        Despesas por Categoria
      </h3>
      {categories.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">Nenhum lançamento neste período</p>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map(({ name, total, count }) => {
            const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0
            return (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(total)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {pct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {count} lanç.
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
