import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/lancamentos': 'Lançamentos',
  '/dre': 'DRE',
  '/relatorios': 'Relatórios',
  '/cadastros': 'Cadastros',
  '/configuracoes': 'Configurações',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userMeta = user.user_metadata
  const userEmail = user.email ?? ''
  const userAvatar = userMeta?.avatar_url ?? userMeta?.picture ?? ''

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-56 overflow-hidden">
        <Header
          title="Controle Financeiro"
          userEmail={userEmail}
          userAvatar={userAvatar}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
