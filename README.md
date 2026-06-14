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
9. Em **Redirect URLs** (Additional redirect URLs), adicione também `http://localhost:3000` para desenvolvimento local

---

## 3. Variáveis de ambiente

Copie o arquivo de exemplo e preencha com os dados do seu projeto Supabase:

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

Onde encontrar esses valores: **Supabase → Project Settings → API**

---

## 4. Instalar dependências e rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 5. Deploy na Vercel

### Opção A — Via GitHub (recomendado)

1. Suba o projeto para um repositório GitHub
2. No [Vercel](https://vercel.com), clique **Add New Project** → importe o repositório
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique **Deploy**

### Opção B — Via CLI

```bash
npm install -g vercel
vercel
```

Siga o assistente e configure as variáveis de ambiente quando solicitado.

---

## 6. Primeiro acesso

1. Acesse o app → faça login com sua conta Google
2. Vá em **Cadastros → Categorias** e crie suas categorias (ex: Estoque, Impostos, Funcionários, Serviços, Franquia)
3. Vá em **Cadastros → Despesas** e cadastre seus fornecedores e tipos de despesa (ex: Fornecedor X, FGTS, Aluguel)
4. Vá em **Cadastros → Atalhos** e crie os atalhos de acesso rápido (ex: Estoque → categoria Estoque)
5. Comece a lançar despesas no **Dashboard** ou em **Lançamentos**

---

## Estrutura do projeto

```
src/
  app/
    (dashboard)/          # Páginas autenticadas
      page.tsx            # Dashboard
      lancamentos/        # Lista de lançamentos
      dre/                # DRE mensal com comparativo
      relatorios/         # Ranking e gráfico por fornecedor
      cadastros/          # Categorias, Despesas, Atalhos, Recorrências
      configuracoes/      # Tema e perfil
    actions/              # Server Actions (camada de dados)
    auth/callback/        # Callback OAuth
    login/                # Tela de login
  components/
    dashboard/            # Calendário, cards, filtros
    expenses/             # Formulário de lançamento
    cadastros/            # CRUD genérico
    layout/               # Sidebar, Header, Notificações
  lib/
    supabase/             # Clientes browser/server
    types.ts              # Tipos TypeScript
    utils.ts              # Utilitários
  middleware.ts           # Proteção de rotas
supabase/
  schema.sql              # Schema completo do banco
```

---

## Funcionalidades

- **Dashboard** — filtro por período, cards de status (Aberto/Agendado/Pago), resumo por categoria, calendário mensal com modal de ações
- **Calendário** — clique em qualquer dia para ver e quitar despesas com um clique
- **Atalhos** — botões configuráveis que pré-preenchem o formulário de lançamento
- **Recorrências** — despesas geradas automaticamente todo mês no mesmo dia
- **DRE** — demonstrativo mensal com drill-down por categoria e comparativo entre meses
- **Relatórios** — ranking de gastos por fornecedor com gráfico mensal
- **Notificações** — sino no header avisa sobre despesas em aberto vencendo em 24h
- **Dark mode** — alternância claro/escuro/sistema
- **Isolamento por conta** — cada login Google vê apenas seus próprios dados (RLS no banco)
