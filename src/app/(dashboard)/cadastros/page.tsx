'use client'

import Link from 'next/link'
import { Tag, List, Zap, RefreshCw, ChevronRight } from 'lucide-react'

const items = [
  {
    href: '/cadastros/categorias',
    icon: Tag,
    title: 'Categorias',
    description: 'Estoque, Impostos, Funcionários, Serviços…',
  },
  {
    href: '/cadastros/despesas',
    icon: List,
    title: 'Despesas / Fornecedores',
    description: 'Fornecedor X, FGTS, Aluguel, Taxa de Franquia…',
  },
  {
    href: '/cadastros/atalhos',
    icon: Zap,
    title: 'Atalhos',
    description: 'Botões de preenchimento rápido no formulário',
  },
  {
    href: '/cadastros/recorrencias',
    icon: RefreshCw,
    title: 'Recorrências',
    description: 'Despesas geradas automaticamente todo mês',
  },
]

export default function CadastrosPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Cadastros</h2>
      <div className="flex flex-col gap-3">
        {items.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-sm transition-all group"
          >
            <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl p-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/60 transition-colors">
              <Icon size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
