-- ============================================================
-- SCHEMA - Controle Financeiro Restaurante
-- Execute este arquivo no SQL Editor do seu projeto Supabase
-- ============================================================

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELAS
-- ============================================================

-- Categorias (ex: Estoque, Impostos, Funcionários, Serviços)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name)
);

-- Marca qual categoria representa o Estoque/CMV no DRE (apenas uma por usuário)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_inventory BOOLEAN NOT NULL DEFAULT FALSE;

-- Despesas/Fornecedores (nomes livres: Fornecedor X, FGTS, Aluguel, etc.)
CREATE TABLE IF NOT EXISTS expense_names (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name)
);

-- Atalhos para preenchimento rápido de lançamentos
CREATE TABLE IF NOT EXISTS shortcuts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  expense_name_id UUID REFERENCES expense_names(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Pré-preenchimento opcional do status do lançamento ao usar o atalho
ALTER TABLE shortcuts ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('aberto', 'agendado', 'pago'));

-- Lançamentos recorrentes (despesas que se repetem mensalmente)
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  expense_name_id UUID REFERENCES expense_names(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  last_generated_month INTEGER,
  last_generated_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Lançamentos de despesas
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  expense_name_id UUID REFERENCES expense_names(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('aberto', 'agendado', 'pago')),
  recurring_expense_id UUID REFERENCES recurring_expenses(id) ON DELETE SET NULL,
  is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Receitas mensais
CREATE TABLE IF NOT EXISTS revenues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, month, year)
);

-- Dados mensais de Estoque/CMV para o DRE (valor comprado no mês e meta % de CMV)
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

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_due ON expenses(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_revenues_user_month ON revenues(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_expenses(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_stock_inputs_user_month ON stock_monthly_inputs(user_id, year, month);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuário só vê seus próprios dados
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_monthly_inputs ENABLE ROW LEVEL SECURITY;

-- Policies para categories
CREATE POLICY "categories_select" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Policies para expense_names
CREATE POLICY "expense_names_select" ON expense_names FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "expense_names_insert" ON expense_names FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expense_names_update" ON expense_names FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "expense_names_delete" ON expense_names FOR DELETE USING (auth.uid() = user_id);

-- Policies para shortcuts
CREATE POLICY "shortcuts_select" ON shortcuts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shortcuts_insert" ON shortcuts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shortcuts_update" ON shortcuts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "shortcuts_delete" ON shortcuts FOR DELETE USING (auth.uid() = user_id);

-- Policies para recurring_expenses
CREATE POLICY "recurring_select" ON recurring_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurring_insert" ON recurring_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_update" ON recurring_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recurring_delete" ON recurring_expenses FOR DELETE USING (auth.uid() = user_id);

-- Policies para expenses
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- Policies para revenues
CREATE POLICY "revenues_select" ON revenues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "revenues_insert" ON revenues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "revenues_update" ON revenues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "revenues_delete" ON revenues FOR DELETE USING (auth.uid() = user_id);

-- Policies para stock_monthly_inputs
CREATE POLICY "stock_inputs_select" ON stock_monthly_inputs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stock_inputs_insert" ON stock_monthly_inputs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stock_inputs_update" ON stock_monthly_inputs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "stock_inputs_delete" ON stock_monthly_inputs FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER revenues_updated_at
  BEFORE UPDATE ON revenues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER stock_monthly_inputs_updated_at
  BEFORE UPDATE ON stock_monthly_inputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
