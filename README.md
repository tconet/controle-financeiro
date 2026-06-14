# Controle Financeiro — Restaurante

Sistema de controle de despesas com DRE mensal, calendário de vencimentos e lançamentos recorrentes.

**Stack:** Next.js 15 · TypeScript · Supabase · Tailwind CSS · Vercel

---

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (free tier)
- Conta no [Vercel](https://vercel.com) (free tier)

---

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Escolha um nome (ex: `controle-financeiro`) e uma senha para o banco
3. Após criado, vá em **SQL Editor** e cole o conteúdo de `supabase/schema.sql`
4. Execute o script — ele cria todas as tabelas, índices e políticas RLS

---

## 2. Configurar autenticação Google

1. No painel Supabase, vá em **Authentication → Providers → Google**
2. Ative o provider Google
3. Acesse o [Google Cloud Console](https://console.cloud.google.com)
4. Crie um projeto → **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
5. Tipo: **Web application**
6. Em **Authorized redirect URIs**, adicione:
   ```
   https://SEU-PROJETO.supabase.co/auth/v1/callback
   ```
7. Copie o **Client ID** e **Client Secret** e cole no Supabase → Authentication → Providers → Google
8. Em **Site URL** no Supabase, coloque a URL do seu app (ex: `https://seu-app.vercel.app`)
9. Em **Redirect URLs** (Additional redirect URLs), adicione também `http://localhost:3000` para de