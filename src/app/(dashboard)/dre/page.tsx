'use client'

import { useState, useEffect, useTransition } from 'react'
import { DREData } from '@/lib/types'
import { getDREData } from '@/app/actions/reports'
import { upsertRevenue } from '@/app/actions/revenues'
import { upsertStockMonthlyInput } from '@/app/actions/stock'
import { PeriodFilter } from '@/components/dashboard/PeriodFilter'
import { formatCurrency, MONTHS, groupByExpenseName, pctOf } from '@/lib/utils'
import { Pencil, Check, X, Package, Info, ChevronDown, ChevronRight, FileDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function DREPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [dreData, setDreData] = useState<DREData | null>(null)
  const [compareData, setCompareData] = useState<DREData | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareMonth, setCompareMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth())
  const [compareYear, setCompareYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [exportingPdf, setExportingPdf] = useState(false)

  // Detalhamento recolhido por padrão (para reduzir scroll)
  const [showInventoryDetails, setShowInventoryDetails] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  function toggleCategory(key: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Edição inline: Receita
  const [editRevenue, setEditRevenue] = useState(false)
  const [revenueInput, setRevenueInput] = useState('')

  // Edição inline: Estoque comprado (informado)
  const [editPurchased, setEditPurchased] = useState(false)
  const [purchasedInput, setPurchasedInput] = useState('')

  // Edição inline: Meta % de CMV
  const [editTarget, setEditTarget] = useState(false)
  const [targetInput, setTargetInput] = useState('')

  async function loadDRE() {
    setLoading(true)
    const data = await getDREData(month, year)
    setDreData(data)
    setRevenueInput(String(data.revenue || ''))
    setPurchasedInput(String(data.stockPurchased || ''))
    setTargetInput(String(data.cmvTargetPercent || ''))
    setLoading(false)
  }

  async function loadCompare() {
    const data = await getDREData(compareMonth, compareYear)
    setCompareData(data)
  }

  useEffect(() => { loadDRE() }, [month, year])
  useEffect(() => { if (compareMode) loadCompare() }, [compareMode, compareMonth, compareYear])

  function saveRevenue() {
    const amount = Number(revenueInput)
    if (isNaN(amount) || amount < 0) return
    startTransition(async () => {
      await upsertRevenue(month, year, amount)
      setEditRevenue(false)
      loadDRE()
    })
  }

  function savePurchased() {
    const amount = Number(purchasedInput)
    if (isNaN(amount) || amount < 0) return
    startTransition(async () => {
      await upsertStockMonthlyInput(month, year, { purchased_amount: amount })
      setEditPurchased(false)
      loadDRE()
    })
  }

  function saveTarget() {
    const percent = Number(targetInput)
    if (isNaN(percent) || percent < 0) return
    startTransition(async () => {
      await upsertStockMonthlyInput(month, year, { cmv_target_percent: percent })
      setEditTarget(false)
      loadDRE()
    })
  }

  async function exportPdf() {
    if (!dreData) return
    setExportingPdf(true)
    try {
      const { generateDrePdf } = await import('@/lib/pdf/generateDrePdf')
      generateDrePdf(dreData, month, year)
    } catch (err) {
      console.error('[DRE] Erro ao gerar PDF:', err)
      alert('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setExportingPdf(false)
    }
  }

  if (loading || !dreData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const compare = compareMode ? compareData : null
  const otherCategories = dreData.categories.filter((c) => !c.is_inventory)
  const inventoryCategory = dreData.categories.find((c) => c.is_inventory) ?? null

  return (
    <div className="max-w-7xl mx-auto space-y-4">
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

          <button
            onClick={exportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Linha superior: Receita Bruta + Resultado (3 formas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Receita Bruta */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-green-50 dark:bg-green-950/20 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">Receita Bruta</h3>
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Valor Total</span>
              {!editRevenue ? (
                <button onClick={() => setEditRevenue(true)} className="text-gray-400 hover:text-blue-500 transition-colors">
                  <Pencil size={13} />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={revenueInput}
                    onChange={(e) => setRevenueInput(e.target.value)}
                    className="w-28 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button onClick={saveRevenue} disabled={isPending} className="text-green-500 hover:text-green-600">
                    <Check size={15} />
                  </button>
                  <button onClick={() => setEditRevenue(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(dreData.revenue)}</p>
              <p className="text-xs text-gray-400">100%</p>
              {compareMode && compare && (
                <p className="text-xs text-green-600/60 dark:text-green-400/60 mt-0.5">{formatCurrency(compare.revenue)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Resultado - 3 formas */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Resultado do Estoque/CMV</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {([dreData.stockResults.cashFlow, dreData.stockResults.cmvPurchased, dreData.stockResults.cmvTarget]).map((r) => (
              <div key={r.label} className="px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{r.label}</span>
                <div className="text-right">
                  <span className={cn(
                    'text-sm font-semibold',
                    r.result >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {formatCurrency(r.result)}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">{r.percentOfRevenue.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-1.5 bg-gray-50/50 dark:bg-gray-800/20 text-xs text-gray-400 flex items-center gap-1.5">
            <Info size={12} />
            Outras despesas (exceto Estoque): {formatCurrency(dreData.otherExpensesTotal)}
          </div>
        </div>
      </div>

      {/* Grid de categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 items-start">
        {/* Card especial de Estoque */}
        {inventoryCategory ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-orange-50 dark:bg-orange-950/20 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Package size={14} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400">{inventoryCategory.category_name}</h3>
            </div>

            <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-800/50 flex items-center justify-between bg-gray-50/40 dark:bg-gray-800/10">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">(-) Estoque Pago (Fluxo de Caixa)</span>
              <div className="text-right">
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(dreData.stockPaid)}</span>
                <span className="ml-2 text-xs text-gray-400">{pctOf(dreData.stockPaid, dreData.revenue)}</span>
              </div>
            </div>

            <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">(-) Estoque Comprado (informado)</span>
                {!editPurchased ? (
                  <button onClick={() => setEditPurchased(true)} className="text-gray-400 hover:text-blue-500 transition-colors">
                    <Pencil size={12} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={purchasedInput}
                      onChange={(e) => setPurchasedInput(e.target.value)}
                      className="w-24 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button onClick={savePurchased} disabled={isPending} className="text-green-500 hover:text-green-600">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditPurchased(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(dreData.stockPurchased)}</span>
                <span className="ml-2 text-xs text-gray-400">{pctOf(dreData.stockPurchased, dreData.revenue)}</span>
              </div>
            </div>

            <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Meta % CMV</span>
                {!editTarget ? (
                  <button onClick={() => setEditTarget(true)} className="text-gray-400 hover:text-blue-500 transition-colors">
                    <Pencil size={12} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      className="w-20 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button onClick={saveTarget} disabled={isPending} className="text-green-500 hover:text-green-600">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditTarget(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(dreData.cmvTargetValue)}</span>
                <span className="ml-2 text-xs text-gray-400">{dreData.cmvTargetPercent.toFixed(2)}%</span>
              </div>
            </div>

            {/* Ver detalhes: fornecedores que compõem o Estoque Pago */}
            <button
              onClick={() => setShowInventoryDetails((v) => !v)}
              className="w-full px-4 py-2 flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
            >
              {showInventoryDetails ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              {showInventoryDetails ? 'Ocultar detalhes do estoque' : 'Ver detalhes do estoque'}
            </button>

            {showInventoryDetails && (
              <div className="border-t border-gray-100 dark:border-gray-800">
                {groupByExpenseName(inventoryCategory.expenses).length === 0 ? (
                  <p className="px-4 py-3 text-xs text-gray-400">Nenhum pagamento de estoque neste mês.</p>
                ) : (
                  groupByExpenseName(inventoryCategory.expenses).map(([nameId, group]) => (
                    <div key={nameId} className="px-4 py-1.5 border-b last:border-b-0 border-gray-50 dark:border-gray-800/50 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/10">
                      <span className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                        {group.name}{group.count > 1 ? ` (${group.count}×)` : ''}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(group.total)}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-4 text-sm text-gray-500 dark:text-gray-400">
            Nenhuma categoria marcada como Estoque. Configure em{' '}
            <Link href="/cadastros/categorias" className="text-blue-500 hover:underline">Cadastros → Categorias</Link>.
          </div>
        )}

        {/* Demais categorias */}
        {otherCategories.map((cat) => {
          const key = cat.category_id ?? 'sem-categoria'
          const compareCat = compare?.categories.find((c) => c.category_id === cat.category_id)
          const diff = compareCat ? cat.total - compareCat.total : null
          const isExpanded = expandedCategories.has(key)
          const details = groupByExpenseName(cat.expenses)

          return (
            <div key={key} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cat.category_name}</h3>
              </div>

              <div className="px-4 py-2 flex items-center justify-between bg-gray-50/40 dark:bg-gray-800/10">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">(=) Deduções</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(cat.total)}</span>
                  <span className="ml-2 text-xs text-gray-400">{pctOf(cat.total, dreData.revenue)}</span>
                  {compareMode && compare && diff !== null && (
                    <div className={cn(
                      'text-xs font-medium',
                      diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-gray-400'
                    )}>
                      {diff > 0 ? '+' : ''}{formatCurrency(diff)} vs {MONTHS[compareMonth - 1]}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => toggleCategory(key)}
                className="w-full px-4 py-2 flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors border-t border-gray-50 dark:border-gray-800/50"
              >
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                {isExpanded ? 'Ocultar detalhes' : `Ver detalhes (${details.length})`}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  {details.map(([nameId, group]) => (
                    <div key={nameId} className="px-4 py-1.5 border-b last:border-b-0 border-gray-50 dark:border-gray-800/50 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/10">
                      <span className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                        {group.name}{group.count > 1 ? ` (${group.count}×)` : ''}
                      </span>
                      <div className="text-right">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(group.total)}</span>
                        <span className="ml-2 text-xs text-gray-400">{pctOf(group.total, dreData.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
