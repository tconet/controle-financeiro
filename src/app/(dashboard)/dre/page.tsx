'use client'

import { useState, useEffect, useTransition } from 'react'
import { DREData, Expense } from '@/lib/types'
import { getDREData } from '@/app/actions/reports'
import { getRevenue, upsertRevenue } from '@/app/actions/revenues'
import { PeriodFilter } from '@/components/dashboard/PeriodFilter'
import { formatCurrency, MONTHS } from '@/lib/utils'
import { ChevronDown, ChevronRight, Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompareMonth {
  month: number
  year: number
  data: DREData | null
}

export default function DREPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [dreData, setDreData] = useState<DREData | null>(null)
  const [compareData, setCompareData] = useState<DREData | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareMonth, setCompareMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth())
  const [compareYear, setCompareYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [editRevenue, setEditRevenue] = useState(false)
  const [revenueInput, setRevenueInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  async function loadDRE() {
    setLoading(true)
    const data = await getDREData(month, year)
    setDreData(data)
    setRevenueInput(String(data.revenue || ''))
    setLoading(false)
  }

  async function loadCompare() {
    const data = await getDREData(compareMonth, compareYear)
    setCompareData(data)
  }

  useEffect(() => { loadDRE() }, [month, year])
  useEffect(() => { if (compareMode) loadCompare() }, [compareMode, compareMonth, compareYear])

  function toggleCategory(key: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function saveRevenue() {
    const amount = Number(revenueInput)
    if (isNaN(amount) || amount < 0) return
    startTransition(async () => {
      await upsertRevenue(month, year, amount)
      setEditRevenue(false)
      loadDRE()
    })
  }

  if (loading || !dreData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const compare = compareMode ? compareData : null

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodFilter month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Comparar com
          </label>
          {compareMode && (
            <div className="flex gap-2">
              <select
                value={compareMonth}
                onChange={(e) => setCompareMonth(Number(e.target.value))}
                className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                value={compareYear}
                onChange={(e) => setCompareYear(Number(e.target.value))}
                className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 w-20 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* DRE Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Cabeçalho */}
        <div className="grid border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-6 py-3"
          style={{ gridTemplateColumns: compareMode ? '1fr 160px 160px' : '1fr 160px' }}>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Descrição</span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
            {MONTHS[month - 1]} {year}
          </span>
          {compareMode && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
              {MONTHS[compareMonth - 1]} {compareYear}
            </span>
          )}
        </div>

        {/* Receita */}
        <div className="grid border-b border-gray-100 dark:border-gray-800 px-6 py-4 bg-green-50/50 dark:bg-green-950/10 items-center"
          style={{ gridTemplateColumns: compareMode ? '1fr 160px 160px' : '1fr 160px' }}>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900 dark:text-white">Receita</span>
            {!editRevenue ? (
              <button
                onClick={() => setEditRevenue(true)}
                className="text-gray-400 hover:text-blue-500 transition-colors"
              >
                <Pencil size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={revenueInput}
                  onChange={(e) => setRevenueInput(e.target.value)}
                  className="w-32 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button onClick={saveRevenue} disabled={isPending} className="text-green-500 hover:text-green-600">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditRevenue(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <span className="text-right font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(dreData.revenue)}
          </span>
          {compareMode && compare && (
            <span className="text-right font-semibold text-green-600/60 dark:text-green-400/60">
              {formatCurrency(compare.revenue)}
            </span>
          )}
        </div>

        {/* Categorias de despesa */}
        {dreData.categories.map((cat) => {
          const key = cat.category_id ?? 'sem-categoria'
          const isExpanded = expandedCategories.has(key)
          const compareCat = compare?.categories.find((c) => c.category_id === cat.category_id)
          const diff = compareCat ? cat.total - compareCat.total : null

          return (
            <div key={key}>
              <button
                onClick={() => toggleCategory(key)}
                className="w-full grid hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors px-6 py-3.5 border-b border-gray-50 dark:border-gray-800/50 items-center"
                style={{ gridTemplateColumns: compareMode ? '1fr 160px 160px' : '1fr 160px' }}
              >
                <div className="flex items-center gap-2 text-left">
                  {isExpanded ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.category_name}</span>
                  <span className="text-xs text-gray-400">{cat.expenses.length} lanç.</span>
                </div>

                <span className="text-right text-sm font-semibold text-red-600 dark:text-red-400">
                  ({formatCurrency(cat.total)})
                </span>
                {compareMode && compare && (
                  <div className="text-right">
                    <span className="text-sm font-semibold text-red-600/60 dark:text-red-400/60">
                      ({formatCurrency(compareCat?.total ?? 0)})
                    </span>
                    {diff !== null && (
                      <span className={cn(
                        'ml-2 text-xs font-medium',
                        diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-gray-400'
                      )}>
                        {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* Drill-down agrupado por despesa/fornecedor */}
              {isExpanded && (() => {
                // Agrupar por expense_name_id
                const grouped = cat.expenses.reduce<Record<string, { name: string; total: number; count: number }>>((acc, exp) => {
                  const nameId = exp.expense_name_id ?? '__sem_nome__'
                  const name = (exp.expense_names as { name: string } | null)?.name ?? '(sem despesa)'
                  if (!acc[nameId]) acc[nameId] = { name, total: 0, count: 0 }
                  acc[nameId].total += Number(exp.amount)
                  acc[nameId].count += 1
                  return acc
                }, {})

                return Object.entries(grouped)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([nameId, group]) => (
                    <div
                      key={nameId}
                      className="grid px-6 py-2.5 border-b border-gray-50 dark:border-gray-800/30 bg-gray-50/30 dark:bg-gray-800/10"
                      style={{ gridTemplateColumns: compareMode ? '1fr 160px 160px' : '1fr 160px' }}
                    >
                      <div className="flex items-center gap-2 pl-6">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{group.name}</span>
                        {group.count > 1 && (
                          <span className="text-xs text-gray-400">({group.count}×)</span>
                        )}
                      </div>
                      <span className="text-right text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(group.total)}
                      </span>
                      {compareMode && <div />}
                    </div>
                  ))
              })()}
            </div>
          )
        })}

        {/* Total Despesas */}
        <div className="grid border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/30"
          style={{ gridTemplateColumns: compareMode ? '1fr 160px 160px' : '1fr 160px' }}>
          <span className="font-semibold text-gray-700 dark:text-gray-300">Total de Despesas</span>
          <span className="text-right font-semibold text-red-600 dark:text-red-400">
            ({formatCurrency(dreData.totalExpenses)})
          </span>
          {compareMode && compare && (
            <span className="text-right font-semibold text-red-600/60 dark:text-red-400/60">
              ({formatCurrency(compare.totalExpenses)})
            </span>
          )}
        </div>

        {/* Resultado */}
        <div className="grid px-6 py-5 border-t-2 border-gray-300 dark:border-gray-600"
          style={{ gridTemplateColumns: compareMode ? '1fr 160px 160px' : '1fr 160px' }}>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Resultado</span>
          <span className={cn(
            'text-right text-lg font-bold',
            dreData.result >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {formatCurrency(dreData.result)}
          </span>
          {compareMode && compare && (
            <span className={cn(
              'text-right text-lg font-bold opacity-60',
              compare.result >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {formatCurrency(compare.result)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
