'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Sun, Moon, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NotificationBell } from './NotificationBell'

interface HeaderProps {
  title: string
  userEmail?: string
  userAvatar?: string
}

export function Header({ title, userEmail, userAvatar }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => setMounted(true), [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <h1 className="font-semibold text-gray-900 dark:text-white text-base">{title}</h1>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Alternar tema"
        >
          {mounted && (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />)}
        </button>

        {userAvatar && (
          <img
            src={userAvatar}
            alt={userEmail ?? ''}
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
          />
        )}

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover: