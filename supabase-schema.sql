-- =============================================
-- FinançasPRO — Supabase Schema
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---- CATEGORIAS ----
CREATE TABLE categorias (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT '📌',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- CONTAS BANCÁRIAS ----
CREATE TABLE contas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'corrente',
  saldo_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  cor TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT '🏦',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- MOVIMENTAÇÕES ----
CREATE TABLE movimentacoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita','despesa','transferencia')),
  categoria TEXT NOT NULL DEFAULT 'Outros',
  conta_id UUID REFERENCES contas(id) ON DELETE SET NULL,
  conta_nome TEXT,
  data DATE NOT NULL,
  observacao TEXT,
  via_audio BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- COMPROMISSOS ----
CREATE TABLE compromissos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'outro',
  data DATE NOT NULL,
  hora TIME,
  valor NUMERIC(12,2),
  conta_nome TEXT,
  recorrencia TEXT NOT NULL DEFAULT 'pontual',
  dias_alerta INTEGER NOT NULL DEFAULT 1,
  observacao TEXT,
  via_audio BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (cada usuário vê apenas seus dados)
-- =============================================

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compromissos ENABLE ROW LEVEL SECURITY;

-- Categorias RLS
CREATE POLICY "categorias_own" ON categorias FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Contas RLS
CREATE POLICY "contas_own" ON contas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Movimentações RLS
CREATE POLICY "movimentacoes_own" ON movimentacoes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Compromissos RLS
CREATE POLICY "compromissos_own" ON compromissos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNÇÃO: seed de categorias padrão ao criar conta
-- =============================================
CREATE OR REPLACE FUNCTION seed_categorias_padrao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categorias (user_id, nome, cor, icon) VALUES
    (NEW.id, 'Alimentação',  '#f59e0b', '🍔'),
    (NEW.id, 'Moradia',      '#6366f1', '🏠'),
    (NEW.id, 'Transporte',   '#10b981', '🚗'),
    (NEW.id, 'Saúde',        '#f43f5e', '💊'),
    (NEW.id, 'Lazer',        '#8b5cf6', '🎮'),
    (NEW.id, 'Salário',      '#10b981', '💰'),
    (NEW.id, 'Contas',       '#f97316', '⚡'),
    (NEW.id, 'Educação',     '#0ea5e9', '📚'),
    (NEW.id, 'Outros',       '#8892b0', '📌');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_user_seed_categorias
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION seed_categorias_padrao();

-- =============================================
-- ÍNDICES para performance
-- =============================================
CREATE INDEX idx_movs_user_data ON movimentacoes(user_id, data DESC);
CREATE INDEX idx_movs_user_conta ON movimentacoes(user_id, conta_id);
CREATE INDEX idx_comps_user_data ON compromissos(user_id, data ASC);
