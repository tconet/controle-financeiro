'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sun, Moon, Monitor, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userAvatar, setUserAvatar] = useState('')
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? '')
        setUserName(data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? '')
        setUserAvatar(data.user.user_metadata?.avatar_url ?? data.user.user_metadata?.picture ?? '')
      }
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ]

  if (!mounted) return null

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configurações</h2>

      {/* Perfil */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Conta</h3>
        <div className="flex items-center gap-4">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-lg">
              {(userName || userEmail)[0]?.toUpperCase()}
            </div>
          )}
          <div>
            {userName && <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>}
            <p className="text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            <LogOut size={16} />
            Sair da conta
          </button>
        </div>
      </div>

      {/* Tema */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Tema</h3>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'flex flex-col items-center gap-2 py-4 rounded-xl border text-sm font-medium transition-all',
                theme === value
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                  : 'border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sobre</h3>
        <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
          <p>Controle Financeiro · v1.0.0</p>
          <p>Dados armazenados no Supabase (PostgreSQL)</p>
          <p>Isolamento total por conta Google</p>
        </div>
      </div>
    </div>
  )
}
