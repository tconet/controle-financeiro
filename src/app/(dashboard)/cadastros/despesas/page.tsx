'use client'

import { useState, useEffect } from 'react'
import { ExpenseName } from '@/lib/types'
import { getExpenseNames, createExpenseName, updateExpenseName, deleteExpenseName } from '@/app/actions/expense-names'
import { CrudList } from '@/components/cadastros/CrudList'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DespesasPage() {
  const [expenseNames, setExpenseNames] = useState<ExpenseName[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const data = await getExpenseNames()
    setExpenseNames(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cadastros" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Despesas / Fornecedores</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <CrudList
          items={expenseNames}
          onCreate={async (name) => { await createExpenseName(name); load() }}
          onUpdate={async (id, name) => { await updateExpenseName(id, name); load() }}
          onDelete={async (id) => { await deleteExpenseName(id); load() }}
          placeholder="Ex: Fornecedor ABC, FGTS, Aluguel, Taxa de Franquia..."
          emptyMessage="Nenhuma despesa/fornecedor cadastrado"
          searchable
        />
      )}
    </div>
  )
}
