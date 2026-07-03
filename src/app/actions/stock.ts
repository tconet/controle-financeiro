'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { StockMonthlyInput } from '@/lib/types'

export async function getStockMonthlyInput(month: number, year: number): Promise<StockMonthlyInput | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stock_monthly_inputs')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function upsertStockMonthlyInput(
  month: number,
  year: number,
  values: { purchased_amount?: number; cmv_target_percent?: number }
): Promise<StockMonthlyInput> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // Preserva o valor já existente do campo que não estiver sendo atualizado agora
  const current = await getStockMonthlyInput(month, year)

  const { data, error } = await supabase
    .from('stock_monthly_inputs')
    .upsert(
      {
        user_id: user.id,
        month,
        year,
        purchased_amount: values.purchased_amount ?? current?.purchased_amount ?? 0,
        cmv_target_percent: values.cmv_target_percent ?? current?.cmv_target_percent ?? 0,
      },
      { onConflict: 'user_id,month,year' }
    )
    .select()
    .single()

  if (error) throw error
  revalidatePath('/')
  return data
}
