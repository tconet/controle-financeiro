'use client'

import { useState, useEffect, useTransition } from 'react'
import { Shortcut, Category, ExpenseName } from '@/lib/types'
import { getShortcuts, createShortcut, deleteShortcut } from '@/app/actions/shortcuts'
import { getCategories } from '@/app/actions/categories'
import { getExpenseNames } from '@/app/actions/expense-names'
import { ArrowLeft, Plus, Trash2, Loader2, Zap } from 'lucide-react'
import Link from 'next/link'

export default function AtalhosPage() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [expenseNames, setExpenseNames] = useState<ExpenseName[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [newName, setNewName] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newExpenseNameId, setNewExpenseNameId] = useState('')

  async function load() {
    const [s, c, e] = await Promise.all([getShortcuts(), getCategories(), getExpenseNames()])
    setShortcuts(s)
    setCategories(c)
    setExpenseNames(e)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    startTransition(async () => {
      await createShortcut({
        name: newName,
        category_id: newCategoryId || null,
        expense_name_id: newExpenseNameId || null,
      })
      setNewName('')
      setNewCategoryId('')
      setNewExpenseNameId('')
      load()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este atalho?')) return
    startTransition(async () => {
      await deleteShortcut(id)
      load()
    })
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cadastros" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Atalhos</h2>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Atalhos aparecem como botões no formulário de lançamento e pré-preenchem categoria e/ou despesa automaticamente.
      </p>

      {/* Form */}
      <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 mb-5 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Nome do atalho *</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: Estoque, Salário, Passagem..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pré-preencher Categoria</label>
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhuma</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pré-preencher Despesa</label>
            <select
              value={newExpenseNameId}
              onChange={(e) => setNewExpenseNameId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhuma</option>
              {expenseNames.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending || !newName.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Criar Atalho
        </button>
      </form>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : shortcuts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhum atalho cadastrado</p>
      ) : (
        <div className="flex flex-col gap-2">
          {shortcuts.map((s) => {
            const catName = (s.categories as { name: string } | null)?.name
            const expName = (s.expense_names as { name: string } | null)?.name
            return (
              <div key={s.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 group">
                <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg p-1.5">
                  <Zap size={14} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {catName ? `Categoria: ${catName}` : ''}
                    {catName && expName ? ' · ' : ''}
                    {expName ? `Despesa: ${expName}` : ''}
                    {!catName && !expName ? 'Sem pré-preenchimento' : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
