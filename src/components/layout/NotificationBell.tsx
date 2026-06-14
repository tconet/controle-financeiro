'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Calendar, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Expense } from '@/lib/types'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Expense[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    const supabase = createClient()
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const todayStr = now.toISOString().split('T')[0]
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data } = await supabase
      .from('expenses')
      .select(`*, categories(id, name), expense_names(id, name)`)
      .eq('status', 'aberto')
      .gte('due_date', todayStr)
      .lte('due_date', tomorrowStr)
      .order('due_date')

    setNotifications(data ?? [])
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <span className="font-medium text-sm text-gray-900 dark:text-white">
                  Vencimentos em aberto
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Nenhum vencimento em aberto nas próximas 24h
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {(n.expense_names as { name: string } | null)?.name ?? 'Sem despesa'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {(n.categories as { name: string } | null)?.name ?? 'Sem categoria'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(n.amount)}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                          <Calendar size={10} />
                          {formatDate(n.due_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
