
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, ClipboardList, FileUp, 
  Trash2, Copy, Check, Download, Loader2,
  X, Layers, Save, AlertTriangle, ShieldCheck,
  Edit2, MoreVertical, Search, ShieldAlert, UserMinus, LogOut,
  FileX, FolderX
} from 'lucide-react';
import { Group, GroupFile, GroupActivity, GroupMember } from '../types';

interface GroupManagerProps {
  userEmail: string;
  userId: string;
  userName?: string;
  onNotification?: (message: string, type: 'success' | 'info' | 'error') => void;
}

export const GroupManager: React.FC<GroupManagerProps> = ({ userEmail, userId, userName, onNotification }) => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  
  const [activities, setActivities] = useState<GroupActivity[]>([]);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [activeActivity, setActiveActivity] = useState<GroupActivity | null>(null);
  
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [files, setFiles] = useState<GroupFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [tempInstructions, setTempInstructions] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [createMode, setCreateMode] = useState(false);
  const [joinMode, setJoinMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  const [foundGroup, setFoundGroup] = useState<{ id: string, name: string } | null>(null);
  
  // Modais de Confirmação
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
  const [confirmLeaveGroup, setConfirmLeaveGroup] = useState(false);
  const [memberToKick, setMemberToKick] = useState<GroupMember | null>(null);
  const [fileToDelete, setFileToDelete] = useState<GroupFile | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<GroupActivity | null>(null);
  
  const [copied, setCopied] = useState(false);

  const activeGroup = useMemo(() => {
    if (!activeGroupId || groups.length === 0) return null;
    return groups.find(g => g.id === activeGroupId) || null;
  }, [groups, activeGroupId]);
  
  const isGroupOwner = useMemo(() => {
    if (!activeGroup || !userId) return false;
    return String(activeGroup.owner_id).toLowerCase() === String(userId).toLowerCase();
  }, [activeGroup, userId]);

  const notify = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (onNotification) onNotification(msg, type);
  };

  useEffect(() => {
    if (userId) fetchMyGroups();
  }, [userId]);

  useEffect(() => {
    if (activeGroupId) {
      fetchActivities(activeGroupId);
      fetchGroupMembers(activeGroupId);
    }
  }, [activeGroupId]);

  useEffect(() => {
    if (activeActivityId) {
      fetchActivityFiles(activeActivityId);
      const act = activities.find(a => a.id === activeActivityId);
      setActiveActivity(act || null);
      setTempInstructions(act?.instructions || '');
      setHasUnsavedChanges(false);
    }
  }, [activeActivityId, activities]);

  const fetchMyGroups = async () => {
    setLoading(true);
    try {
      const { data: membershipData } = await supabase.from('group_members').select('group_id').eq('user_id', userId);
      const memberIds = membershipData?.map(m => m.group_id) || [];
      
      let query = supabase.from('groups').select('*');
      if (memberIds.length > 0) {
        query = query.or(`owner_id.eq.${userId},id.in.(${memberIds.map(id => `"${id}"`).join(',')})`);
      } else {
        query = query.eq('owner_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setGroups(data || []);
      if (data?.length && !activeGroupId) setActiveGroupId(data[0].id);
    } catch (e) {
      notify('Falha ao sincronizar turmas.', 'error');
    } finally { setLoading(false); }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase.from('group_members_with_name').select('*').eq('group_id', groupId);
      if (error) throw error;
      setGroupMembers(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchActivities = async (groupId: string) => {
    try {
      const { data, error } = await supabase.from('group_activities').select('*').eq('group_id', groupId).order('created_at', { ascending: true });
      if (error) throw error;
      setActivities(data || []);
      if (data?.length && !activeActivityId) setActiveActivityId(data[0].id);
    } catch (e) { console.error(e); }
  };

  const fetchActivityFiles = async (activityId: string) => {
    try {
      const { data, error } = await supabase.from('group_files').select('*').eq('activity_id', activityId);
      if (error) throw error;
      setFiles(data || []);
    } catch (e) { console.error(e); }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;
    setActionLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const { data: newGroup, error } = await supabase.from('groups').insert({ 
        name: groupName, code, owner_id: userId, instructions: '' 
      }).select().single();
      if (error) throw error;
      if (newGroup) {
        await supabase.from('group_members').insert({ group_id: newGroup.id, user_id: userId });
        setGroups(prev => [...prev, newGroup]);
        setActiveGroupId(newGroup.id);
        setCreateMode(false);
        setGroupName('');
        notify('Turma criada!', 'success');
      }
    } catch (e) { notify('Erro ao criar.', 'error'); } 
    finally { setActionLoading(false); }
  };

  const discoverGroup = async () => {
    if (!groupCode.trim()) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('find_group_by_code', { p_code: groupCode.toUpperCase() });
      if (error) throw error;
      if (data?.length) setFoundGroup(data[0]);
      else notify('Código não encontrado.', 'error');
    } catch (e) { notify('Erro na busca.', 'error'); }
    finally { setActionLoading(false); }
  };

  const confirmJoin = async () => {
    if (!foundGroup) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('group_members').insert({ group_id: foundGroup.id, user_id: userId });
      if (error) throw error;
      setJoinMode(false);
      setFoundGroup(null);
      setGroupCode('');
      await fetchMyGroups();
      setActiveGroupId(foundGroup.id);
      notify('Você entrou na turma!', 'success');
    } catch (e) { notify('Falha ao entrar.', 'error'); }
    finally { setActionLoading(false); }
  };

  const removeMember = async (targetUserId: string, targetGroupId: string) => {
    setRemovingMemberId(targetUserId);
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc(
        'remove_group_member',
        {
          p_group_id: targetGroupId,
          p_user_id: targetUserId
        }
      );

      if (error) {
        console.error(error);
        alert("Erro ao remover aluno");
        return;
      }

      if (!data) {
        alert("Você não tem permissão para remover este aluno.");
        return;
      }

      // Sucesso real
      notify("Aluno removido com sucesso", "success");
      
      setGroupMembers(prev => prev.filter(m => m.user_id !== targetUserId));
      
      if (targetUserId === userId) {
        setGroups(prev => prev.filter(g => g.id !== targetGroupId));
        setActiveGroupId(null);
        setConfirmLeaveGroup(false);
      } else {
        setMemberToKick(null);
      }
    } catch (e: any) { 
      console.error("Erro inesperado:", e);
      alert("Erro crítico ao tentar remover aluno.");
    } finally { 
      setRemovingMemberId(null); 
      setActionLoading(false);
    }
  };

  const createActivity = async () => {
    const trimmed = newActivityName.trim();
    if (!trimmed || !activeGroupId) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.from('group_activities').insert({ 
        group_id: activeGroupId, name: trimmed, created_by_id: userId, instructions: '' 
      }).select().single();
      if (error) throw error;
      if (data) {
        setActivities(prev => [...prev, data]);
        setActiveActivityId(data.id);
        setNewActivityName('');
        notify('Tópico criado!', 'success');
      }
    } catch (e) { notify('Erro: Apenas o organizador pode criar tópicos.', 'error'); }
    finally { setActionLoading(false); }
  };

  const deleteActivity = async () => {
    if (!activityToDelete) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('group_activities').delete().eq('id', activityToDelete.id);
      if (error) throw error;
      
      setActivities(prev => prev.filter(a => a.id !== activityToDelete.id));
      if (activeActivityId === activityToDelete.id) {
        setActiveActivityId(null);
        setActiveActivity(null);
      }
      setActivityToDelete(null);
      notify('Tópico removido com sucesso!', 'success');
    } catch (e: any) {
      notify('Erro ao excluir tópico.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeGroupId || !activeActivityId) return;
    
    setUploadingFile(true);
    try {
      const groupId = activeGroupId;
      const activityId = activeActivityId;
      
      // Lógica solicitada: UUID + Extensão para Path Seguro
      const fileExt = file.name.split('.').pop();
      const safeFileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${groupId}/${activityId}/${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('group_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('group_files').getPublicUrl(filePath);
      
      const { data: authData } = await supabase.auth.getUser();

      // Guardando o nome original no banco para visualização do aluno
      const { data: dbData, error: dbError } = await supabase.from('group_files').insert({
        group_id: groupId, 
        activity_id: activityId, 
        name: file.name, // Nome Original
        url: urlData.publicUrl, 
        uploaded_by: authData?.user?.id || userId, 
        size: file.size
      }).select().single();
      
      if (dbError) {
        await supabase.storage.from('group_files').remove([filePath]);
        throw dbError;
      }
      
      setFiles(prev => [dbData, ...prev]);
      notify('Material compartilhado!', 'success');
    } catch (e: any) { 
      console.error("Falha no Upload:", e);
      notify(`Erro: ${e.message}`, 'error'); 
    } finally { 
      setUploadingFile(false); 
      if (e.target) e.target.value = '';
    }
  };

  const handleFileDelete = async () => {
    if (!fileToDelete) return;
    setActionLoading(true);
    try {
      // Extraindo o path do storage a partir da URL pública
      const urlParts = fileToDelete.url.split('group_files/public/');
      if (urlParts.length > 1) {
        const storagePath = urlParts[1].split('?')[0];
        await supabase.storage.from('group_files').remove([storagePath]);
      } else {
        // Fallback para estrutura antiga caso necessário
        const altParts = fileToDelete.url.split('group_files/');
        if (altParts.length > 1) {
           const storagePath = altParts[1].split('?')[0];
           await supabase.storage.from('group_files').remove([storagePath]);
        }
      }

      const { error, count } = await supabase.from('group_files').delete({ count: 'exact' }).eq('id', fileToDelete.id);
      if (error) throw error;
      
      if (count === 0) {
        throw new Error('Sem permissão para excluir este arquivo.');
      }

      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      setFileToDelete(null);
      notify('Arquivo excluído.', 'success');
    } catch (e: any) {
      notify(e.message || 'Erro ao excluir arquivo.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const saveInstructions = async () => {
    if (!activeActivity) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('group_activities').update({ instructions: tempInstructions }).eq('id', activeActivity.id);
      if (error) throw error;
      setActivities(prev => prev.map(a => a.id === activeActivity.id ? { ...a, instructions: tempInstructions } : a));
      setHasUnsavedChanges(false);
      notify('Instruções salvas!', 'success');
    } catch (e) { notify('Erro ao salvar instruções.', 'error'); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-500 shadow-xl">
      <Loader2 size={48} className="animate-spin text-athena-teal mb-4" />
      <p className="font-black uppercase text-[10px] tracking-widest text-slate-500">Acessando Turmas...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Modal Deletar Turma (Dono) */}
      {confirmDeleteGroup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border-2 border-rose-600 shadow-2xl text-center">
            <ShieldAlert size={48} className="mx-auto text-rose-600 mb-4" />
            <h3 className="text-2xl font-black uppercase mb-2">Excluir Turma?</h3>
            <p className="text-xs text-slate-500 mb-6 font-bold uppercase">Ação irreversível. Todos os materiais serão perdidos.</p>
            <div className="flex gap-4">
              <button disabled={actionLoading} onClick={async () => {
                setActionLoading(true);
                const { error } = await supabase.from('groups').delete().eq('id', activeGroupId);
                if (!error) {
                  setGroups(prev => prev.filter(g => g.id !== activeGroupId));
                  setActiveGroupId(null);
                  setConfirmDeleteGroup(false); 
                } else {
                  notify('Erro ao excluir turma.', 'error');
                }
                setActionLoading(false);
              }} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-xs">Excluir</button>
              <button onClick={() => setConfirmDeleteGroup(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black uppercase text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sair da Turma (Membro) */}
      {confirmLeaveGroup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border-2 border-amber-500 shadow-2xl text-center">
            <LogOut size={48} className="mx-auto text-amber-500 mb-4" />
            <h3 className="text-2xl font-black uppercase mb-2">Sair desta Turma?</h3>
            <p className="text-xs text-slate-500 mb-6 font-bold uppercase">Você perderá acesso imediato aos materiais e avisos.</p>
            <div className="flex gap-4">
              <button disabled={actionLoading} onClick={() => removeMember(userId, activeGroupId!)} className="flex-1 py-4 bg-amber-500 text-white rounded-xl font-black uppercase text-xs">Confirmar Saída</button>
              <button onClick={() => setConfirmLeaveGroup(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black uppercase text-xs">Permanecer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Remover Estudante (Dono) */}
      {memberToKick && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border-2 border-rose-600 shadow-2xl text-center">
            <UserMinus size={48} className="mx-auto text-rose-600 mb-4" />
            <h3 className="text-2xl font-black uppercase mb-2">Remover Estudante?</h3>
            <p className="text-xs text-slate-500 mb-6 font-bold uppercase">Deseja remover <b>{memberToKick.full_name || 'este estudante'}</b> da turma?</p>
            <div className="flex gap-4 mt-6">
              <button disabled={actionLoading} onClick={() => removeMember(memberToKick.user_id, memberToKick.group_id)} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-xs">Confirmar Remoção</button>
              <button onClick={() => setMemberToKick(null)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black uppercase text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Excluir Arquivo (Dono) */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border-2 border-rose-600 shadow-2xl text-center">
            <FileX size={48} className="mx-auto text-rose-600 mb-4" />
            <h3 className="text-2xl font-black uppercase mb-2">Excluir Material?</h3>
            <p className="text-xs text-slate-500 mb-6 font-bold uppercase">Deseja excluir <b>{fileToDelete.name}</b> permanentemente?</p>
            <div className="flex gap-4 mt-6">
              <button disabled={actionLoading} onClick={handleFileDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-xs">Excluir</button>
              <button onClick={() => setFileToDelete(null)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black uppercase text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Excluir Tópico (Dono) */}
      {activityToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border-2 border-rose-600 shadow-2xl text-center">
            <FolderX size={48} className="mx-auto text-rose-600 mb-4" />
            <h3 className="text-2xl font-black uppercase mb-2">Excluir Tópico?</h3>
            <p className="text-xs text-slate-500 mb-6 font-bold uppercase">Deseja excluir o tópico <b>{activityToDelete.name}</b>? Todos os materiais dentro dele também serão removidos do painel.</p>
            <div className="flex gap-4 mt-6">
              <button disabled={actionLoading} onClick={deleteActivity} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-xs">Excluir Tópico</button>
              <button onClick={() => setActivityToDelete(null)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black uppercase text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-500 dark:border-slate-800 shadow-xl flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="w-full lg:w-auto">

          <h2 className="text-3xl font-black flex items-center gap-3"><Users size={32} className="text-athena-teal"/> Central de Turmas</h2>
          <p className="text-[10px] font-black uppercase text-slate-500 mt-1">Colaboração e Gestão Acadêmica</p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto min-w-0">
          <button onClick={() => { setJoinMode(true); setCreateMode(false); }} className="flex-1 min-w-0 lg:flex-none px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-slate-800 border-2 border-athena-teal text-athena-teal rounded-xl font-black uppercase text-[10px] active:scale-95 transition-all">Matricular-se</button>
          <button onClick={() => { setCreateMode(true); setJoinMode(false); }} className="flex-1 min-w-0 lg:flex-none px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-athena-teal text-white rounded-xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">Criar Turma</button>
        </div>
      </div>

      {/* Interface de Criação / Busca */}
      {(createMode || joinMode) && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border-2 border-dashed border-athena-teal shadow-2xl animate-fade-in max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black uppercase tracking-tighter">{createMode ? 'Configurar Disciplina' : 'Entrar na Turma'}</h3>
            <button onClick={() => { setCreateMode(false); setJoinMode(false); setFoundGroup(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={24}/></button>
          </div>
          {createMode ? (
            <div className="space-y-6">
              <input type="text" className="w-full p-5 rounded-2xl border-2 border-slate-300 dark:bg-slate-800 font-bold outline-none focus:border-athena-teal" placeholder="Ex: Cálculo Diferencial" value={groupName} onChange={e => setGroupName(e.target.value)} />
              <button disabled={actionLoading} onClick={createGroup} className="w-full py-5 bg-athena-teal text-white rounded-2xl font-black uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="animate-spin" /> : 'Registrar Turma'}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {!foundGroup ? (
                <>
                  <input type="text" className="w-full p-8 rounded-3xl border-2 border-slate-300 dark:bg-slate-800 text-center text-4xl font-black uppercase tracking-widest outline-none focus:border-athena-teal shadow-inner" placeholder="CÓDIGO" value={groupCode} onChange={e => setGroupCode(e.target.value.toUpperCase())} />
                  <button disabled={actionLoading} onClick={discoverGroup} className="w-full py-5 bg-athena-teal text-white rounded-2xl font-black uppercase shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    {actionLoading ? <Loader2 className="animate-spin" /> : <><Search size={20}/> Localizar</>}
                  </button>
                </>
              ) : (
                <div className="text-center space-y-6">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border-2 border-amber-200">
                    <h4 className="text-3xl font-black">{foundGroup.name}</h4>
                  </div>
                  <button disabled={actionLoading} onClick={confirmJoin} className="w-full py-5 bg-athena-coral text-white rounded-2xl font-black uppercase shadow-lg active:scale-95">Matricular-se Agora</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navegação e Detalhes */}
      {groups.length > 0 && !createMode && !joinMode && (
        <div className="space-y-8">
          <div className="flex flex-wrap gap-3">
            {groups.map(g => (
              <button key={g.id} onClick={() => setActiveGroupId(g.id)} className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border-2 active:scale-95 ${activeGroupId === g.id ? 'bg-athena-teal text-white border-athena-teal shadow-xl scale-105' : 'bg-white dark:bg-slate-900 border-slate-400 dark:border-slate-800 text-slate-500 hover:border-athena-teal'}`}>
                {g.name}
              </button>
            ))}
          </div>

          {activeGroup && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border-2 border-slate-500 dark:border-slate-800 shadow-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 dark:border-slate-800 pb-8 mb-8">
                  <div>
                    <h3 className="text-4xl font-black tracking-tighter">{activeGroup.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      {isGroupOwner ? (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg uppercase flex items-center gap-1.5 border border-emerald-200 shadow-sm">
                          <ShieldCheck size={14}/> Organizador
                        </span>
                      ) : (
                        <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg uppercase border border-blue-200">
                          Estudante
                        </span>
                      )}
                      <button onClick={() => { navigator.clipboard.writeText(activeGroup.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg uppercase flex items-center gap-1.5 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 active:scale-95">
                        {copied ? <Check size={14} className="text-emerald-600"/> : <Copy size={14}/>} Código: {activeGroup.code}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {isGroupOwner ? (
                      <button onClick={() => setConfirmDeleteGroup(true)} className="p-4 text-rose-600 bg-rose-50 dark:bg-rose-950/20 rounded-2xl hover:bg-rose-100 active:scale-95 shadow-sm">
                        <Trash2 size={24}/>
                      </button>
                    ) : (
                      <button onClick={() => setConfirmLeaveGroup(true)} className="p-4 text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-2xl hover:bg-amber-100 active:scale-95 shadow-sm">
                        <LogOut size={24}/>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tópicos */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {activities.map(act => (
                    <div key={act.id} className="relative group/topic">
                      <button onClick={() => setActiveActivityId(act.id)} className={`w-full p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden active:scale-95 h-full ${activeActivityId === act.id ? 'bg-athena-coral border-athena-coral text-white shadow-xl scale-105' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-athena-coral'}`}>
                        <p className="text-[11px] font-black uppercase tracking-tight line-clamp-2 pr-4">{act.name}</p>
                        <div className={`absolute bottom-0 right-0 p-1 opacity-20 ${activeActivityId === act.id ? 'text-white' : 'text-slate-300'}`}><Plus size={24}/></div>
                      </button>
                      {isGroupOwner && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActivityToDelete(act); }} 
                          className="absolute top-2 right-2 bg-white/80 dark:bg-slate-800/80 text-rose-500 p-2 rounded-full shadow-md opacity-0 group-hover/topic:opacity-100 transition-all hover:scale-110 active:scale-90 z-20 border border-slate-200 dark:border-slate-700 backdrop-blur-sm"
                          title="Excluir Tópico"
                        >
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Membros */}
                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2 mb-6"><Layers size={16}/> Gestão de Membros ({groupMembers.length})</h4>
                  <div className="flex flex-wrap gap-3">
                    {groupMembers.map(m => (
                      <div key={m.user_id} className="px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase flex items-center gap-3 border-2 border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-athena-teal group">
                        <div className="w-2 h-2 rounded-full bg-athena-teal" />
                        {m.full_name || 'Estudante'}
                        {isGroupOwner && String(m.user_id) !== String(userId) && (
                          <button 
                            disabled={actionLoading}
                            onClick={() => setMemberToKick(m)} 
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Remover definitivamente"
                          >
                            <UserMinus size={14}/>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isGroupOwner && (
                    <div className="mt-10 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-200 dark:border-slate-700 flex gap-4">
                      <input type="text" className="flex-1 min-w-0 bg-transparent p-4 text-xs font-bold outline-none placeholder:text-slate-400" placeholder="Título do novo tópico..." value={newActivityName} onChange={e => setNewActivityName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createActivity()} />
                      <button disabled={actionLoading} onClick={createActivity} className="px-8 py-4 bg-athena-coral text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                        {actionLoading ? <Loader2 className="animate-spin" size={16}/> : <Plus size={18}/>}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalhes do Tópico Ativo */}
              {activeActivity && (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-500 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
                  <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50 dark:bg-slate-800/30">
                    <h3 className="text-3xl font-black uppercase tracking-tighter">{activeActivity.name}</h3>
                    {isGroupOwner && (
                      <button disabled={actionLoading} onClick={saveInstructions} className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl active:scale-95 ${hasUnsavedChanges ? 'bg-emerald-600 text-white scale-105' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}>
                        {actionLoading ? <Loader2 className="animate-spin" size={16}/> : <Save size={18}/>}
                        {hasUnsavedChanges ? 'Salvar' : 'Salvo'}
                      </button>
                    )}
                  </div>
                  <div className="p-8 md:p-12 space-y-12">
                    <section className="space-y-6">
                      <h4 className="text-[11px] font-black uppercase text-athena-teal tracking-[0.3em] flex items-center gap-3"><ClipboardList size={20}/> Orientações</h4>
                      <textarea className="w-full p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-200 dark:border-slate-800 font-bold text-sm min-h-[160px] outline-none focus:border-athena-teal transition-all leading-relaxed" placeholder="Adicione avisos ou orientações aos alunos..." value={tempInstructions} onChange={e => { setTempInstructions(e.target.value); setHasUnsavedChanges(true); }} readOnly={!isGroupOwner} />
                    </section>
                    
                    <section className="space-y-8">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[11px] font-black uppercase text-athena-coral tracking-[0.3em] flex items-center gap-3"><FileUp size={20}/> Materiais e Anexos</h4>
                        {isGroupOwner && (
                          <label className="cursor-pointer bg-athena-coral text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-3 shadow-xl hover:scale-105 transition-all active:scale-95">
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                            {uploadingFile ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>} Adicionar Arquivo
                          </label>
                        )}
                      </div>
                      
                      {files.length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
                           <FileUp size={48} className="mx-auto text-slate-200 mb-4" />
                           <p className="text-[10px] font-black uppercase text-slate-400">Nenhum material compartilhado.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {files.map(f => (
                            <div key={f.id} className="p-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2rem] relative shadow-sm hover:shadow-xl transition-all">
                              <p className="text-[12px] font-black truncate pr-6 mb-4">{f.name}</p>
                              <a href={f.url} target="_blank" rel="noreferrer" className="w-full py-3 bg-athena-teal text-white rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md">Download</a>
                              {isGroupOwner && (
                                <button onClick={() => setFileToDelete(f)} className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 p-2">
                                  <Trash2 size={16}/>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
