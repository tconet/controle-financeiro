'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Plus, Check, X, Loader2, Search } from 'lucide-react'

interface Item {
  id: string
  name: string
}

interface CrudListProps {
  items: Item[]
  onCreate: (name: string) => Promise<void>
  onUpdate: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  placeholder?: string
  emptyMessage?: string
  searchable?: boolean
}

export function CrudList({
  items,
  onCreate,
  onUpdate,
  onDelete,
  placeholder = 'Nome...',
  emptyMessage = 'Nenhum item cadastrado',
  searchable = false,
}: CrudListProps) {
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const filtered = searchable && search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase().trim()))
    : items

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return

    // Validação client-side de duplicata
    const duplicate = items.find(
      (i) => i.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (duplicate) {
      setError(`Já existe um item com o nome "${duplicate.name}".`)
      return
    }

    setError('')
    startTransition(async () => {
      try {
        await onCreate(trimmed)
        setNewName('')
      } catch (err: unknown) {
        // Tratar erro de unique constraint do banco (código 23505)
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate') || message.includes('unique') || message.includes('23505')) {
          setError(`Já existe um item com o nome "${trimmed}".`)
        } else {
          setError(message || 'Erro ao criar item.')
        }
      }
    })
  }

  function startEdit(item: Item) {
    setEditId(item.id)
    setEditName(item.name)
    setError('')
  }

  function handleUpdate(id: string) {
    const trimmed = editName.trim()
    if (!trimmed) return

    const duplicate = items.find(
      (i) => i.id !== id && i.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (duplicate) {
      setError(`Já existe um item com o nome "${duplicate.name}".`)
      return
    }

    setError('')
    startTransition(async () => {
      try {
        await onUpdate(id, trimmed)
        setEditId(null)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate') || message.includes('unique') || message.includes('23505')) {
          setError(`Já existe um item com o nome "${trimmed}".`)
        } else {
          setError(message || 'Erro ao atualizar.')
        }
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este item? Lançamentos relacionados não serão afetados.')) return
    startTransition(async () => {
      await onDelete(id)
    })
  }

  return (
    <div>
      {/* Form de criação */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setError('') }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isPending || !newName.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Adicionar
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-500 mb-3 px-1">{error}</p>
      )}

      {/* Campo de busca */}
      {searchable && items.length > 0 && (
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Contador */}
      {searchable && search && (
        <p className="text-xs text-gray-400 mb-2 px-1">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{search}"
        </p>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {search ? `Nenhum resultado para "${search}"` : emptyMessage}
          </p>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl group hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
            >
              {editId === item.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => { setEditName(e.target.value); setError('') }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(item.id)
                      if (e.key === 'Escape') setEditId(null)
                    }}
                    className="flex-1 text-sm px-2 py-1 border border-blue-400 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                    autoFocus
                  />
                  <button onClick={() => handleUpdate(item.id)} disabled={isPending} className="text-green-500 hover:text-green-600">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-900 dark:text-white">{item.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
