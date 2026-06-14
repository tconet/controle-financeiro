'use client'

import { useState, useEffect } from 'react'
import { SupplierReport } from '@/lib/types'
import { getSupplierReport } from '@/app/actions/reports'
import { formatCurrency, MONTHS } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export default function RelatoriosPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [suppliers, setSuppliers] = useState<SupplierReport[]>([])
  const [loading, setLoading] = useState(true)
  const [topN, setTopN] = useState(10)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getSupplierReport({ year })
      setSuppliers(data)
      setLoading(false)
    }
    load()
  }, [year])

  // Preparar dados do gráfico de barras mensal
  const top = suppliers.slice(0, topN)
  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1)

  const chartData = allMonths.map((m) => {
    const entry: Record<string, string | number> = { name: MONTHS[m - 1].slice(0, 3) }
    top.forEach((s) => {
      const monthly = s.monthly.find((mo) => mo.month === m && mo.year === year)
      entry[s.expense_name] = monthly?.total ?? 0
    })
    return entry
  })

  const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  ]

  const totalGeral = suppliers.reduce((s, r) => s + r.total, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Ano</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 w-24 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Exibir top</label>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
          >
            {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          Total pago em {year}: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totalGeral)}</span>
        </span>
      </div>

      {/* Ranking */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Ranking por Fornecedor/Despesa</h3>
        </div>
        {suppliers.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Nenhum pagamento registrado em {year}</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {suppliers.slice(0, topN).map((s, idx) => {
              const pct = totalGeral > 0 ? (s.total / totalGeral) * 100 : 0
              return (
                <div key={s.expense_name_id ?? s.expense_name} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5">#{idx + 1}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{s.expense_name}</span>
                      <span className="text-xs text-gray-400">{s.count} pagamento{s.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(s.total)}</span>
                      <span className="text-xs text-gray-400 ml-2">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Gráfico mensal */}
      {top.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-5">
            Evolução Mensal {year}
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {top.map((s, idx) => (
                <Bar
                  key={s.expense_name}
                  dataKey={s.expense_name}
                  stackId="a"
                  fill={COLORS[idx % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
