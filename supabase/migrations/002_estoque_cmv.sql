-- ============================================================
-- MIGRAÇÃO: Estoque/CMV no DRE (3 formas de resultado)
-- Execute este arquivo no SQL Editor do Supabase (uma vez).
-- Este arquivo é seguro para reexecutar (idempotente).
-- ============================================================

-- 1. Marca qual categoria representa o Estoque/CMV no DRE (apenas uma por usuário)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_inventory BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Dados mensais de Estoque/CMV: valor comprado no mês e meta % de CMV
CREATE TABLE IF NOT EXISTS stock_monthly_inputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  purchased_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  cmv_target_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_stock_inputs_user_month ON stock_monthly_inputs(user_id, year, month);

ALTER TABLE stock_monthly_inputs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_monthly_inputs' AND policyname = 'stock_inputs_select') THEN
    CREATE POLICY "stock_inputs_select" ON stock_monthly_inputs FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_monthly_inputs' AND policyname = 'stock_inputs_insert') THEN
    CREATE POLICY "stock_inputs_insert" ON stock_monthly_inputs FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_monthly_inputs' AND policyname = 'stock_inputs_update') THEN
    CREATE POLICY "stock_inputs_update" ON stock_monthly_inputs FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_monthly_inputs' AND policyname = 'stock_inputs_delete') THEN
    CREATE POLICY "stock_inputs_delete" ON stock_monthly_inputs FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Função update_updated_at já existe no schema original; reaproveita aqui.
DROP TRIGGER IF EXISTS stock_monthly_inputs_updated_at ON stock_monthly_inputs;
CREATE TRIGGER stock_monthly_inputs_updated_at
  BEFORE UPDATE ON stock_monthly_inputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
