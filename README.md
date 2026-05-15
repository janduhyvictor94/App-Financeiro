# 💰 FinançasPRO

Aplicativo pessoal de gestão financeira — Next.js + Supabase + Vercel + PWA.

---

## ✅ Funcionalidades

- **Dashboard** — métricas do mês, gráficos (barras + pizza), saldo por conta, alertas
- **Movimentações** — receitas, despesas, transferências com categoria e conta bancária
- **Áudio** — fale sobre um gasto ou reunião, a IA cadastra automaticamente
- **Contas Bancárias** — saldo real calculado por movimentações
- **Compromissos** — pontuais e recorrentes, com alertas por dias antes
- **Categorias** — crie, personalize cor e ícone
- **Relatório** — por período e conta, exportável em CSV e TXT
- **PWA** — instale na tela inicial do celular como app nativo
- **Notificações** — alertas do navegador para compromissos próximos
- **Login seguro** — Google OAuth ou magic link por e-mail (sem senha)

---

## 🚀 Deploy passo a passo

### 1. Criar conta no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **New Project**
3. Escolha nome, senha do banco, e região (escolha `South America (São Paulo)`)
4. Aguarde o projeto ser criado (~1 min)

### 2. Configurar o banco de dados

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `supabase-schema.sql` e cole
4. Clique em **Run**
5. Você verá as tabelas criadas em **Table Editor**

### 3. Configurar autenticação

**Google OAuth (recomendado):**
1. Supabase → Authentication → Providers → Google → Enable
2. Crie um projeto no [Google Console](https://console.cloud.google.com)
3. APIs & Services → Credentials → Create OAuth 2.0 Client
4. Authorized redirect URIs: `https://SEU_PROJETO.supabase.co/auth/v1/callback`
5. Copie Client ID e Secret no Supabase

**Magic Link (mais simples — funciona por padrão):**
- Já funciona sem configuração extra. O usuário recebe um link por e-mail.
- Em Supabase → Authentication → Settings, configure o Site URL para sua URL do Vercel depois do deploy.

### 4. Pegar as chaves do Supabase

Supabase → Project Settings → API:
- `Project URL` → NEXT_PUBLIC_SUPABASE_URL
- `anon public` → NEXT_PUBLIC_SUPABASE_ANON_KEY

### 5. Pegar a chave da Anthropic (para áudio IA)

1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create Key
3. Copie a chave → ANTHROPIC_API_KEY

### 6. Deploy no Vercel

1. Suba o código para um repositório GitHub (público ou privado)
2. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
3. **New Project** → importe o repositório
4. Em **Environment Variables**, adicione:

```
NEXT_PUBLIC_SUPABASE_URL     = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
ANTHROPIC_API_KEY             = sk-ant-...
NEXT_PUBLIC_APP_URL           = https://seu-app.vercel.app
```

5. Clique em **Deploy**
6. Após o deploy, copie a URL gerada (ex: `https://financas-pro.vercel.app`)

### 7. Atualizar URL no Supabase

1. Supabase → Authentication → URL Configuration
2. **Site URL**: cole a URL do Vercel
3. **Redirect URLs**: adicione `https://seu-app.vercel.app/**`

---

## 📱 Instalar como app no celular

**Android (Chrome):**
1. Abra o app no Chrome
2. Menu (⋮) → "Adicionar à tela inicial"
3. O app aparece na home como um ícone próprio

**iPhone (Safari):**
1. Abra no Safari
2. Compartilhar (□↑) → "Adicionar à tela de início"

---

## 💻 Rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo de variáveis
cp .env.example .env.local
# Edite .env.local com suas chaves

# 3. Rodar
npm run dev
# Acesse http://localhost:3000
```

---

## 📂 Estrutura do projeto

```
financas-pro/
├── pages/
│   ├── index.js          # Redirect
│   ├── login.js          # Tela de login
│   ├── dashboard.js      # Dashboard principal
│   ├── movimentacoes.js  # Lançar receitas/despesas
│   ├── audio.js          # Cadastro por voz
│   ├── contas.js         # Contas bancárias
│   ├── compromissos.js   # Agenda e alertas
│   ├── categorias.js     # Gerenciar categorias
│   ├── relatorio.js      # Relatórios e exportação
│   └── api/
│       └── interpret-audio.js  # Claude AI interpreta áudio
├── components/
│   ├── Layout.js         # Sidebar + bottom nav mobile
│   ├── Toast.js          # Notificações visuais
│   └── withAuth.js       # Proteção de rotas
├── lib/
│   ├── supabase.js       # Cliente e helpers do banco
│   └── utils.js          # Funções de cálculo e formato
├── styles/
│   └── globals.css       # Estilos globais responsivos
├── public/
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service worker
├── supabase-schema.sql   # SQL para criar o banco
└── .env.example          # Template de variáveis
```

---

## 🔒 Segurança

- Cada usuário vê **apenas seus próprios dados** (Row Level Security no Supabase)
- A chave da Anthropic fica no servidor (nunca exposta no browser)
- Login sem senha via magic link ou Google

---

## 💡 Sobre notificações no celular

As notificações funcionam quando o **navegador está aberto** (ou em segundo plano no Android). Para notificações mesmo com o app completamente fechado, seria necessário um serviço de push como Firebase Cloud Messaging — isso pode ser adicionado como evolução futura.
