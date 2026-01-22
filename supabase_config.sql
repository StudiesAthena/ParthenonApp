
/* 
  PARTHENON PLANNER - SUPABASE SETUP COMPLETO
  Copie e cole este script no seu SQL Editor do Supabase.
*/

-- 1. TABELA DE ESTADO DO USUÁRIO (Onde o calendário e compromissos são salvos)
CREATE TABLE IF NOT EXISTS user_states (
  email TEXT PRIMARY KEY,
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SISTEMA DE TURMAS E GRUPOS
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  instructions TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_email)
);

CREATE TABLE IF NOT EXISTS group_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instructions TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES group_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HABILITAR SEGURANÇA (RLS)
ALTER TABLE user_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_files ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACESSO

-- User States (Dados do Aluno)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Privacidade Total: user_states" ON user_states;
    CREATE POLICY "Privacidade Total: user_states" ON user_states FOR ALL USING (auth.jwt() ->> 'email' = email);
END $$;

-- Grupos (Turmas)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Visibilidade de Grupos" ON groups;
    CREATE POLICY "Visibilidade de Grupos" ON groups FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Gestão de Grupos (Dono)" ON groups;
    CREATE POLICY "Gestão de Grupos (Dono)" ON groups FOR ALL USING (auth.jwt() ->> 'email' = created_by);
END $$;

-- Membros
DO $$ BEGIN
    DROP POLICY IF EXISTS "Auto-gerenciamento de Membros" ON group_members;
    CREATE POLICY "Auto-gerenciamento de Membros" ON group_members FOR ALL USING (user_email = auth.jwt() ->> 'email');
END $$;

-- Atividades (Tópicos)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Ver Tópicos" ON group_activities;
    CREATE POLICY "Ver Tópicos" ON group_activities FOR SELECT USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = group_activities.group_id AND user_email = auth.jwt() ->> 'email'));
    
    DROP POLICY IF EXISTS "Gestão de Tópicos" ON group_activities;
    CREATE POLICY "Gestão de Tópicos" ON group_activities FOR ALL USING (auth.jwt() ->> 'email' = created_by);
END $$;

-- Arquivos (Materiais)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Ver Arquivos da Turma" ON group_files;
    CREATE POLICY "Ver Arquivos da Turma" ON group_files FOR SELECT USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = group_files.group_id AND user_email = auth.jwt() ->> 'email'));
    
    DROP POLICY IF EXISTS "Upload de Arquivos" ON group_files;
    CREATE POLICY "Upload de Arquivos" ON group_files FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM group_members WHERE group_id = group_files.group_id AND user_email = auth.jwt() ->> 'email'));
    
    DROP POLICY IF EXISTS "Exclusão de Arquivos" ON group_files;
    CREATE POLICY "Exclusão de Arquivos" ON group_files FOR DELETE USING (auth.jwt() ->> 'email' = uploaded_by);
END $$;
