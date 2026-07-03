'use client'

import { useState, useEffect, useTransition } from 'react'
import { Category } from '@/lib/types'
import { getCategories, createCategory, updateCategory, deleteCategory, setInventoryCategory } from '@/app/actions/categories'
import { CrudList } from '@/components/cadastros/CrudList'
import { ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  async function load() {
    const data = await getCategories()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const inventoryCategory = categories.find((c) => c.is_inventory) ?? null

  function handleInventoryChange(id: string) {
    startTransition(async () => {
      await setInventoryCategory(id || null)
      load()
    })
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cadastros" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Categorias</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-5 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Categoria de Estoque (CMV)</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Escolha qual categoria representa o Estoque. O DRE vai usar essa categoria para calcular os
              resultados por fluxo de caixa, CMV comprado e meta de CMV.
            </p>
            <select
              value={inventoryCategory?.id ?? ''}
              onChange={(e) => handleInventoryChange(e.target.value)}
              disabled={isPending}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Nenhuma selecionada</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <CrudList
            items={categories}
            onCreate={async (name) => { await createCategory(name); load() }}
            onUpdate={async (id, name) => { await updateCategory(id, name); load() }}
            onDelete={async (id) => { await deleteCategory(id); load() }}
            placeholder="Ex: Estoque, Impostos, Serviços..."
            emptyMessage="Nenhuma categoria cadastrada"
          />
        </>
      )}
    </div>
  )
}
