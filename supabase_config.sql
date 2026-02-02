
/* 
  PARTHENON PLANNER - FUNÇÃO RPC PARA REMOÇÃO DE MEMBROS
*/

-- Criação da função RPC para remover membros de grupos com validação de dono
CREATE OR REPLACE FUNCTION public.remove_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Permite executar a deleção independentemente da RLS direta, validada pela lógica abaixo
AS $$
BEGIN
  -- Lógica de permissão:
  -- 1. O usuário que chama a função é o dono do grupo (pode remover qualquer um)
  -- 2. O usuário que chama a função é o próprio membro que quer sair (auto-remoção)
  IF EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = p_group_id AND owner_id = auth.uid()
  ) OR (p_user_id = auth.uid()) THEN
    
    DELETE FROM public.group_members 
    WHERE group_id = p_group_id AND user_id = p_user_id;
    
    RETURN TRUE;
  ELSE
    -- Se não for dono nem o próprio usuário, nega a ação
    RETURN FALSE;
  END IF;
END;
$$;

-- Garante que usuários autenticados possam chamar a função
GRANT EXECUTE ON FUNCTION public.remove_group_member(UUID, UUID) TO authenticated;

/* 
  POLÍTICAS DE ARQUIVOS (REFORÇO)
*/
ALTER TABLE public.group_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "files_delete" ON public.group_files;
CREATE POLICY "files_delete" ON public.group_files FOR DELETE TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = public.group_files.group_id 
    AND g.owner_id = auth.uid()
  )
);
