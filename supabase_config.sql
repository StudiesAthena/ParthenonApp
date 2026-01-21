
/* 
  PARTHENON PLANNER - SUPABASE SETUP
  Copie e cole este script no seu SQL Editor do Supabase.
*/

-- 1. CORREÇÃO DA TABELA GROUP_FILES (Evita erro de coluna existente)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_files' AND column_name='size') THEN
    ALTER TABLE group_files ADD COLUMN size bigint;
  END IF;
END $$;

-- 2. POLÍTICAS DE SEGURANÇA (RLS)
-- Certifique-se de que o RLS está ativo em todas as tabelas
ALTER TABLE user_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_files ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar duplicidade
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Privacidade Total: user_states" ON user_states;
    DROP POLICY IF EXISTS "Visibilidade de Grupos" ON groups;
    DROP POLICY IF EXISTS "Criação de Grupos" ON groups;
    DROP POLICY IF EXISTS "Gestão de Grupos (Dono)" ON groups;
    DROP POLICY IF EXISTS "Auto-gerenciamento de Membros" ON group_members;
    DROP POLICY IF EXISTS "Ver Tópicos" ON group_activities;
    DROP POLICY IF EXISTS "Gestão de Tópicos" ON group_activities;
    DROP POLICY IF EXISTS "Ver Arquivos da Turma" ON group_files;
    DROP POLICY IF EXISTS "Upload de Arquivos" ON group_files;
    DROP POLICY IF EXISTS "Exclusão de Arquivos" ON group_files;
END $$;

-- Aplica políticas atualizadas
CREATE POLICY "Privacidade Total: user_states" ON user_states FOR ALL USING (auth.jwt() ->> 'email' = email);
CREATE POLICY "Visibilidade de Grupos" ON groups FOR SELECT USING (true);
CREATE POLICY "Criação de Grupos" ON groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Gestão de Grupos (Dono)" ON groups FOR ALL USING (auth.jwt() ->> 'email' = created_by);
CREATE POLICY "Auto-gerenciamento de Membros" ON group_members FOR ALL USING (user_email = auth.jwt() ->> 'email');
CREATE POLICY "Ver Tópicos" ON group_activities FOR SELECT USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = group_activities.group_id AND user_email = auth.jwt() ->> 'email'));
CREATE POLICY "Gestão de Tópicos" ON group_activities FOR ALL USING (auth.jwt() ->> 'email' = created_by);
CREATE POLICY "Ver Arquivos da Turma" ON group_files FOR SELECT USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = group_files.group_id AND user_email = auth.jwt() ->> 'email'));
CREATE POLICY "Upload de Arquivos" ON group_files FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM group_members WHERE group_id = group_files.group_id AND user_email = auth.jwt() ->> 'email'));
CREATE POLICY "Exclusão de Arquivos" ON group_files FOR DELETE USING (auth.jwt() ->> 'email' = uploaded_by);

/* 
   --------------------------------------------------------------------------
   TEMPLATE DE E-MAIL DE CONFIRMAÇÃO (SUPABASE DASHBOARD)
   Caminho: Authentication > Email Templates > Confirm signup
   --------------------------------------------------------------------------

   ASSUNTO: 🏛️ Parthenon Planner: Confirme seu acesso acadêmico

   BODY (HTML):
*/

-- (O código HTML abaixo deve ser copiado manualmente para o campo 'Body' do template no Supabase)
/*
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; color: #1e293b; }
    .wrapper { padding: 40px 20px; text-align: center; }
    .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { background: #0E6E85; padding: 50px 30px; }
    .logo-text { color: #ffffff; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px; text-transform: uppercase; }
    .logo-span { color: #FF7E67; }
    .content { padding: 40px; }
    .title { font-size: 20px; font-weight: 800; color: #0E6E85; margin-bottom: 20px; text-transform: uppercase; }
    .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px; font-weight: 500; }
    .btn { background: #FF7E67; color: #ffffff !important; padding: 18px 35px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(255,126,103,0.3); }
    .footer { padding: 30px; font-size: 11px; color: #94a3b8; font-weight: 700; background: #f8fafc; text-transform: uppercase; letter-spacing: 2px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="logo-text">Parthenon<span class="logo-span">Planner</span></h1>
      </div>
      <div class="content">
        <h2 class="title">Bem-vindo à Jornada!</h2>
        <p class="text">Para ativar seu painel de estudos e começar a organizar sua vida acadêmica, precisamos apenas de uma confirmação.</p>
        <a href="{{ .ConfirmationURL }}" class="btn">Confirmar minha conta</a>
        <p style="margin-top: 40px; font-size: 12px; color: #cbd5e1;">Se você não solicitou este acesso, ignore este e-mail.</p>
      </div>
      <div class="footer">
        Parthenon • Disciplina é Liberdade
      </div>
    </div>
  </div>
</body>
</html>
*/
