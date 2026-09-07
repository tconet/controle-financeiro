-- ============================================================
-- MIGRAÇÃO: Pré-preenchimento de Status nos Atalhos
-- Execute este arquivo no SQL Editor do Supabase (uma vez).
-- Este arquivo é seguro para reexecutar (idempotente).
-- ============================================================

-- Permite que um atalho também pré-preencha o Status do lançamento
-- (Aberto, Agendado ou Pago) além de Categoria e Despesa.
ALTER TABLE shortcuts ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('aberto', 'agendado', 'pago'));
