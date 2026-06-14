'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Revenue } from '@/lib/types'

export async function getRevenue(month: number, year: number): Promise<Revenue | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('revenues')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function upsertRevenue(month: number, year: number, amount: number, description?: string): Promise<Revenue> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('revenues')
    .upsert(
      { user_id: user.id, month, year, amount, description: description ?? null },
      { onConflict: 'user_id,month,year' }
    )
    .select()
    .single()

  if (error) throw error
  revalidatePath('/')
  return data
}

export async function getRevenueRange(months: { month: number; year: number }[]): Promise<Revenue[]> {
  const supabase = await createClient()
  const results: Revenue[] = []

  for (const { month, year } of months) {
    const { data } = await supabase
      .from('revenues')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .single()
    if (data) results.push(data)
  }

  return results
}
