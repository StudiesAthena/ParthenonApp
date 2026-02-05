
/* 
  PARTHENON PLANNER - REFORÇO DA FUNÇÃO RPC PARA REMOÇÃO DE MEMBROS
*/

-- Garantir que a função utilize SECURITY DEFINER para ignorar RLS e realizar a deleção
CREATE OR REPLACE FUNCTION public.remove_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    is_owner BOOLEAN;
BEGIN
    -- Verificar se o chamador (auth.uid()) é o dono do grupo
    SELECT EXISTS (
        SELECT 1 FROM public.groups 
        WHERE id = p_group_id AND owner_id = auth.uid()
    ) INTO is_owner;

    -- Lógica de permissão:
    -- 1. O usuário é o dono (pode remover qualquer um)
    -- 2. O usuário é o próprio membro (está saindo voluntariamente)
    IF is_owner OR (p_user_id = auth.uid()) THEN
        
        DELETE FROM public.group_members 
        WHERE group_id = p_group_id AND user_id = p_user_id;
        
        -- Verificar se algo foi realmente deletado
        IF FOUND THEN
            RETURN TRUE;
        ELSE
            -- Se não deletou nada, o registro pode não existir
            RETURN FALSE;
        END IF;
    ELSE
        -- Sem permissão
        RETURN FALSE;
    END IF;
END;
$$;

-- Garante que usuários autenticados possam chamar a função
GRANT EXECUTE ON FUNCTION public.remove_group_member(UUID, UUID) TO authenticated;
