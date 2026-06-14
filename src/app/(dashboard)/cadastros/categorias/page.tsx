'use client'

import { useState, useEffect } from 'react'
import { Category } from '@/lib/types'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/app/actions/categories'
import { CrudList } from '@/components/cadastros/CrudList'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const data = await getCategories()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

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
        <CrudList
          items={categories}
          onCreate={async (name) => { await createCategory(name); load() }}
          onUpdate={async (id, name) => { await updateCategory(id, name); load() }}
          onDelete={async (id) => { await deleteCategory(id); load() }}
          placeholder="Ex: Estoque, Impostos, Serviços..."
          emptyMessage="Nenhuma categoria cadastrada"
        />
      )}
    </div>
  )
}
