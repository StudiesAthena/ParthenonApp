
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, ClipboardList, FileUp, 
  Trash2, Copy, Check, Download, Loader2,
  X, BookOpen, Layers, Save, RefreshCw, AlertTriangle, ChevronDown, Lock, ShieldCheck,
  WifiOff, ArrowUpDown, Edit2, MoreVertical, Info, Database, AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { Group, GroupFile, GroupActivity } from '../types';

interface GroupManagerProps {
  userEmail: string;
  onNotification?: (message: string, type: 'success' | 'info' | 'error') => void;
}

type SortOption = 'date' | 'name' | 'size';

export const GroupManager: React.FC<GroupManagerProps> = ({ userEmail, onNotification }) => {
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  
  const [activities, setActivities] = useState<GroupActivity[]>([]);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [activeActivity, setActiveActivity] = useState<GroupActivity | null>(null);
  
  const [tempInstructions, setTempInstructions] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [orientationsExpanded, setOrientationsExpanded] = useState(true);

  const [files, setFiles] = useState<GroupFile[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [copied, setCopied] = useState(false);

  const [createMode, setCreateMode] = useState(false);
  const [joinMode, setJoinMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  
  const [confirmDeleteTopicId, setConfirmDeleteTopicId] = useState<string | null>(null);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<GroupFile | null>(null);
  const [fileActionId, setFileActionId] = useState<string | null>(null);
  const [fileInfoId, setFileInfoId] = useState<string | null>(null);
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const normalizedUserEmail = userEmail.toLowerCase().trim();

  const handleNetworkError = (err: any) => {
    console.error('GroupManager Error Detail:', err);
    let msg = 'Erro inesperado no servidor.';
    
    if (err?.code === '42501') {
      msg = 'Acesso Negado: Você não tem permissão para realizar esta ação.';
    } else if (err?.message) {
      msg = err.message;
    }

    if (onNotification) onNotification(msg, 'error');
    return msg;
  };

  useEffect(() => {
    if (normalizedUserEmail) {
      fetchMyGroups();
    }
  }, [normalizedUserEmail]);

  useEffect(() => {
    if (activeGroupId) {
      fetchGroupDetails(activeGroupId);
    }
  }, [activeGroupId]);

  useEffect(() => {
    if (activeActivityId) {
      fetchActivityFiles(activeActivityId);
      const activity = activities.find(a => a.id === activeActivityId);
      setActiveActivity(activity || null);
      setTempInstructions(activity?.instructions || '');
      setHasUnsavedChanges(false);
    } else {
      setActiveActivity(null);
      setTempInstructions('');
      setFiles([]);
    }
  }, [activeActivityId, activities]);

  const fetchMyGroups = async () => {
    setLoading(true);
    try {
      const { data: membership, error: memError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_email', normalizedUserEmail);
      
      if (memError) throw memError;

      if (membership && membership.length > 0) {
        const ids = membership.map(m => m.group_id);
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .in('id', ids);
        
        if (groupsError) throw groupsError;
        setGroups(groupsData || []);
        if (groupsData?.length && !activeGroupId) setActiveGroupId(groupsData[0].id);
      } else {
        setGroups([]);
        setActiveGroupId(null);
      }
    } catch (err: any) {
      handleNetworkError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (id: string) => {
    try {
      const { data: group, error: gError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();
      if (gError) throw gError;
      setActiveGroup(group);
      fetchActivities(id);
    } catch (err) { handleNetworkError(err); }
  };

  const fetchActivities = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_activities')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setActivities(data || []);
      if (data && data.length > 0 && !activeActivityId) {
        setActiveActivityId(data[0].id);
      }
    } catch (err) { handleNetworkError(err); }
  };

  const fetchActivityFiles = async (activityId: string) => {
    setFilesLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_files')
        .select('*')
        .eq('activity_id', activityId);
      if (error) throw error;
      setFiles(data || []);
    } catch (err) { 
      handleNetworkError(err);
    } finally {
      setFilesLoading(false);
    }
  };

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return (Number(b.size) || 0) - (Number(a.size) || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [files, sortBy]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeGroupId || !activeActivityId) return;
    
    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${activeGroupId}/${activeActivityId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('group_files').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('group_files').getPublicUrl(filePath);
      
      const { data: fileRecord, error: dbError } = await supabase.from('group_files').insert({
        group_id: activeGroupId, 
        activity_id: activeActivityId, 
        name: file.name, 
        url: urlData.publicUrl, 
        uploaded_by: normalizedUserEmail,
        size: file.size
      }).select().single();
      
      if (dbError) throw dbError;
      
      setFiles(prev => [fileRecord, ...prev]);
      if (onNotification) onNotification('Arquivo enviado!', 'success');
    } catch (err: any) { 
      handleNetworkError(err); 
    } finally { 
      setUploadingFile(false); 
      if (e.target) e.target.value = ''; 
    }
  };

  const deleteFile = async (file: GroupFile) => {
    if (file.uploaded_by.toLowerCase().trim() !== normalizedUserEmail) {
        if (onNotification) onNotification("Apenas o autor pode excluir o arquivo.", "error");
        return;
    }

    setActionLoading(true);
    try {
      const { error: dbError } = await supabase
        .from('group_files')
        .delete()
        .eq('id', file.id);
      
      if (dbError) throw dbError;

      setFiles(prev => prev.filter(f => f.id !== file.id));
      if (onNotification) onNotification('Material removido!', 'info');
      setConfirmDeleteFile(null);
    } catch (err: any) {
      handleNetworkError(err);
    } finally {
      setActionLoading(false);
      setFileActionId(null);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;
    setActionLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const { data, error } = await supabase.from('groups').insert({ 
        name: groupName, 
        code, 
        created_by: normalizedUserEmail, 
        instructions: '' 
      }).select().single();
      
      if (error) throw error;
      
      await supabase.from('group_members').insert({ 
        group_id: data.id, 
        user_email: normalizedUserEmail 
      });
      
      setGroups([...groups, data]);
      setActiveGroupId(data.id);
      setCreateMode(false);
      setGroupName('');
      if (onNotification) onNotification('Turma criada com sucesso!', 'success');
    } catch (err: any) { handleNetworkError(err); } finally { setActionLoading(false); }
  };

  const joinGroup = async () => {
    if (!groupCode.trim()) return;
    setActionLoading(true);
    try {
      const { data: group, error: gError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('code', groupCode.toUpperCase().trim())
        .single();
      
      if (gError || !group) throw new Error('Código inválido ou turma inexistente.');

      const { error: mError } = await supabase.from('group_members').insert({ 
        group_id: group.id, 
        user_email: normalizedUserEmail 
      });
      
      if (mError) {
        if (mError.code === '23505') throw new Error('Você já faz parte desta turma.');
        throw mError;
      }

      await fetchMyGroups();
      setActiveGroupId(group.id);
      setJoinMode(false);
      setGroupCode('');
      if (onNotification) onNotification(`Você entrou em: ${group.name}`, 'success');
    } catch (err: any) { handleNetworkError(err); } finally { setActionLoading(false); }
  };

  const createActivity = async () => {
    const name = newActivityName.trim();
    if (!name || !activeGroupId) return;

    if (activeGroup?.created_by !== normalizedUserEmail) {
      if (onNotification) onNotification('Apenas o autor da turma pode criar tópicos.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_activities')
        .insert({ 
          group_id: activeGroupId, 
          name, 
          created_by: normalizedUserEmail, 
          instructions: ''
        })
        .select().single();
      if (error) throw error;
      setActivities(prev => [...prev, data]);
      setActiveActivityId(data.id);
      setNewActivityName('');
      if (onNotification) onNotification('Novo tópico adicionado!', 'success');
    } catch (err: any) { handleNetworkError(err); } finally { setActionLoading(false); }
  };

  const saveInstructions = async () => {
    if (!activeActivity) return;
    if (activeActivity.created_by !== normalizedUserEmail) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('group_activities')
        .update({ instructions: tempInstructions })
        .eq('id', activeActivity.id);
      if (error) throw error;
      setActivities(prev => prev.map(a => a.id === activeActivity.id ? { ...a, instructions: tempInstructions } : a));
      setHasUnsavedChanges(false);
      if (onNotification) onNotification('Instruções atualizadas!', 'success');
    } catch (err: any) { handleNetworkError(err); } finally { setActionLoading(false); }
  };

  const performDeleteActivity = async (id: string) => {
    const activityToDelete = activities.find(a => a.id === id);
    if (!activityToDelete || activityToDelete.created_by !== normalizedUserEmail) {
      if (onNotification) onNotification('Permissão negada para excluir este tópico.', 'error');
      setConfirmDeleteTopicId(null);
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.from('group_activities').delete().eq('id', id);
      if (error) throw error;
      
      setActivities(prev => prev.filter(a => a.id !== id));
      if (activeActivityId === id) {
        setActiveActivityId(null);
        setActiveActivity(null);
      }
      setConfirmDeleteTopicId(null);
      if (onNotification) onNotification('Tópico removido!', 'info');
    } catch (err: any) { 
      handleNetworkError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const copyCode = () => {
    if (activeGroup?.code) { 
      navigator.clipboard.writeText(String(activeGroup.code)); 
      setCopied(true); 
      setTimeout(() => setCopied(false), 2000); 
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const b = Number(bytes);
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return <div className="flex flex-col items-center justify-center py-20 text-athena-teal animate-pulse"><Loader2 size={40} className="animate-spin mb-4" /><p className="font-black uppercase tracking-widest text-[10px]">Autenticando Acessos...</p></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16 relative max-w-6xl mx-auto">
      
      {/* Modais de Gerenciamento */}
      {confirmDeleteTopicId && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[140] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] border-2 border-rose-600 shadow-2xl p-8 space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
              <Trash2 size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">Excluir Tópico?</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Apenas o autor deste tópico pode realizar esta ação.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => performDeleteActivity(confirmDeleteTopicId)} disabled={actionLoading} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-rose-700 transition-all text-[10px]">
                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Exclusão'}
              </button>
              <button onClick={() => setConfirmDeleteTopicId(null)} disabled={actionLoading} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-[10px]">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[320px] rounded-[1.5rem] border-2 border-rose-500 shadow-2xl p-6 space-y-5 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-1">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-tight">Remover Material?</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => deleteFile(confirmDeleteFile)} disabled={actionLoading} className="w-full py-3 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 text-[10px] hover:bg-rose-700 transition-all">
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14}/>} Confirmar
              </button>
              <button onClick={() => setConfirmDeleteFile(null)} disabled={actionLoading} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Seção Principal */}
      {groups.length === 0 && !createMode && !joinMode && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-400 p-8 rounded-[2rem] text-center space-y-4 animate-fade-in">
          <ShieldAlert className="mx-auto text-amber-600" size={48} />
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Plataforma Restrita</h3>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Para acessar materiais e atividades, você precisa do **Código da Turma** fornecido pelo seu orientador.
          </p>
          <div className="flex gap-4 justify-center pt-4">
             <button onClick={() => setJoinMode(true)} className="px-8 py-4 bg-amber-500 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">Digitar Código</button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border-2 border-slate-500 dark:border-slate-800 shadow-xl">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-athena-teal dark:text-white tracking-tighter flex items-center gap-4">
            <Users className="text-athena-teal" size={32} /> Minhas Turmas
          </h2>
          <p className="text-[9px] font-black uppercase text-slate-600 tracking-[0.2em] mt-2">Segurança por Código Ativa</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => { setJoinMode(true); setCreateMode(false); }} className="flex-1 md:flex-none px-6 py-4 bg-white dark:bg-slate-800 text-athena-teal border-2 border-athena-teal rounded-2xl text-[10px] font-black uppercase tracking-widest shadow hover:bg-slate-50 transition-all">Entrar em Turma</button>
          <button onClick={() => { setCreateMode(true); setJoinMode(false); }} className="flex-1 md:flex-none px-6 py-4 bg-athena-teal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-athena-teal/90 transition-all">Criar Turma</button>
        </div>
      </div>

      {(createMode || joinMode) && (
        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border-2 border-dashed border-athena-teal/40 shadow-2xl space-y-6 max-w-xl mx-auto relative animate-fade-in">
          <button onClick={() => { setCreateMode(false); setJoinMode(false); }} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-rose-500 transition-colors"><X size={24} /></button>
          <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase text-center tracking-tighter">{createMode ? 'Configurar Nova Turma' : 'Digitar Código da Turma'}</h3>
          <div className="space-y-4">
            {createMode ? (
              <input type="text" placeholder="Nome da Disciplina / Turma" className="w-full p-4 rounded-2xl border-2 border-slate-500 dark:bg-slate-800 font-bold text-sm outline-none focus:border-athena-teal text-slate-950 dark:text-white" value={groupName} onChange={e => setGroupName(e.target.value)} />
            ) : (
              <input type="text" placeholder="EX: A1B2C3" className="w-full p-5 rounded-[2rem] border-2 border-slate-500 dark:bg-slate-800 font-black uppercase text-center text-2xl tracking-[0.4em] outline-none focus:border-athena-teal text-athena-teal" value={groupCode} onChange={e => setGroupCode(e.target.value.toUpperCase())} />
            )}
            <button onClick={createMode ? createGroup : joinGroup} disabled={actionLoading} className="w-full py-5 bg-amber-500 text-slate-900 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 text-[11px] border-b-4 border-amber-600 active:scale-95 transition-all">
              {actionLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verificar Acesso'}
            </button>
          </div>
        </div>
      )}

      {groups.length > 0 && !createMode && !joinMode && (
        <div className="space-y-6">
          <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-500 dark:border-slate-800 shadow-lg">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 flex items-center gap-2"><Layers size={12} className="text-athena-teal"/> Minhas Conexões</h4>
            <div className="flex flex-wrap gap-3">
              {groups.map(g => (
                <button key={g.id} onClick={() => { setActiveGroupId(g.id); setActiveActivityId(null); }} className={`min-w-[160px] flex-1 text-left p-4 rounded-2xl border-2 transition-all ${activeGroupId === g.id ? 'bg-athena-teal border-athena-teal text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-950 border-slate-500 dark:border-slate-800 text-slate-950 dark:text-slate-400 hover:border-athena-teal/40'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-base md:text-lg truncate">{String(g.name)}</p>
                    {activeGroupId === g.id && <ChevronDown size={14} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {activeGroup && (
            <div className="animate-fade-in space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-500 dark:border-slate-800 p-6 md:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2"><BookOpen size={12} className="text-athena-coral"/> Tópicos Privados</h4>
                    <p className="text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tight">{activeGroup.name}</p>
                    {activeGroup.created_by === normalizedUserEmail && <span className="text-[8px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase border border-emerald-300">Você é o proprietário</span>}
                  </div>
                  {activeGroup.created_by === normalizedUserEmail && (
                    <button onClick={copyCode} className="text-[10px] font-black bg-amber-50 text-amber-700 px-5 py-2.5 rounded-xl border border-amber-300 flex items-center gap-2 shadow-sm hover:bg-amber-100 transition-all active:scale-95">
                      {copied ? <Check size={14}/> : <Copy size={14}/>} Código: {activeGroup.code}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {activities.map(act => (
                    <div key={act.id} className="flex flex-col gap-2">
                      <button onClick={() => setActiveActivityId(act.id)} className={`flex-1 text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${activeActivityId === act.id ? 'bg-athena-coral border-athena-coral text-white shadow-xl scale-[1.02]' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'}`}>
                        <Layers size={18} className={activeActivityId === act.id ? 'text-white' : 'text-athena-coral'} />
                        <span className="font-black text-sm truncate">{String(act.name)}</span>
                      </button>
                      {act.created_by === normalizedUserEmail && (
                        <button onClick={() => setConfirmDeleteTopicId(act.id)} className="py-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-200 text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95">
                           <Trash2 size={12}/> Remover Tópico
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {activeGroup.created_by === normalizedUserEmail && (
                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
                    <input type="text" placeholder="Novo tópico de estudo para a turma..." className="flex-1 text-sm font-bold p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-500 dark:border-slate-800 focus:border-athena-teal outline-none transition-all" value={newActivityName} onChange={e => setNewActivityName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createActivity()} />
                    <button onClick={createActivity} disabled={actionLoading} className="px-8 py-4 bg-athena-coral text-white rounded-2xl shadow-lg hover:bg-athena-coral/90 transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border-b-4 border-slate-900/20">
                      {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16}/> Criar Tópico</>}
                    </button>
                  </div>
                )}
              </div>

              {activeActivity ? (
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-500 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-fade-in">
                  <div className="p-6 md:p-10 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        {activeActivity.created_by === normalizedUserEmail ? <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[8px] font-black uppercase border border-emerald-300"><ShieldCheck size={12}/> Autor do Tópico</span> : <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-[8px] font-black uppercase border border-amber-300"><Lock size={12}/> Área de Aluno</span>}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white uppercase tracking-tight">{String(activeActivity.name)}</h3>
                    </div>
                  </div>

                  <div className="p-6 md:p-10 space-y-10">
                    <div className="space-y-4">
                      <div className="flex flex-wrap justify-between items-center border-b-2 border-slate-200 dark:border-slate-800 pb-4 gap-4">
                        <h4 className="text-sm font-black uppercase text-slate-950 dark:text-white tracking-widest flex items-center gap-3"><ClipboardList size={18} className="text-athena-teal" /> Orientações</h4>
                        <div className="flex items-center gap-3">
                          {activeActivity.created_by === normalizedUserEmail && (
                            <button onClick={saveInstructions} disabled={actionLoading} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg flex items-center gap-2 ${hasUnsavedChanges ? 'bg-emerald-600 text-white border-b-4 border-emerald-800' : 'bg-slate-200 text-slate-500'}`}>{actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar Alterações</button>
                          )}
                        </div>
                      </div>
                      <textarea className={`w-full p-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-500 dark:border-slate-800 rounded-[1.5rem] outline-none transition-all text-base font-medium leading-relaxed min-h-[150px] ${activeActivity.created_by === normalizedUserEmail ? 'focus:border-athena-teal shadow-inner' : 'cursor-default opacity-80 border-slate-200'}`} placeholder={activeActivity.created_by === normalizedUserEmail ? "Instruções, links ou avisos importantes..." : "Sem orientações adicionais."} value={tempInstructions} readOnly={activeActivity.created_by !== normalizedUserEmail} onChange={(e) => { if (activeActivity.created_by === normalizedUserEmail) { setTempInstructions(e.target.value); setHasUnsavedChanges(true); } }} />
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-200 dark:border-slate-800 pb-4 gap-6">
                        <h4 className="text-sm font-black uppercase text-slate-950 dark:text-white tracking-widest flex items-center gap-3"><FileUp size={18} className="text-athena-coral" /> Materiais da Turma</h4>
                        {activeGroup?.created_by === normalizedUserEmail && (
                           <label className={`cursor-pointer ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                             <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                             <span className="bg-athena-coral text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg flex items-center gap-2 border-b-4 border-slate-900/10 hover:opacity-90 active:scale-95 transition-all">
                               {uploadingFile ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Adicionar Material
                             </span>
                           </label>
                        )}
                      </div>
                      
                      {sortedFiles.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-slate-500 dark:border-slate-800 rounded-3xl opacity-40">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum material disponível neste tópico</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sortedFiles.map(file => (
                            <div key={file.id} className="p-5 bg-white dark:bg-slate-950 border-2 border-slate-500 dark:border-slate-800 rounded-2xl group hover:border-athena-coral transition-all shadow-md relative">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 min-w-0 pr-8">
                                  <p className="text-sm font-black text-slate-950 dark:text-white truncate" title={file.name}>{String(file.name)}</p>
                                  <p className="text-[8px] font-black text-slate-500 uppercase mt-1">Enviado por: {String(file.uploaded_by).split('@')[0]}</p>
                                </div>
                                {file.uploaded_by === normalizedUserEmail && (
                                   <button onClick={() => setFileActionId(fileActionId === file.id ? null : file.id)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 transition-all"><MoreVertical size={18} /></button>
                                )}
                              </div>

                              {fileActionId === file.id && (
                                <div className="absolute top-12 right-4 z-20 bg-white dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-800 rounded-2xl shadow-2xl p-2 min-w-[150px] animate-fade-in flex flex-col gap-1">
                                   <button onClick={() => { setConfirmDeleteFile(file); setFileActionId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors"><Trash2 size={14}/> Excluir permanentemente</button>
                                </div>
                              )}

                              <div className="mt-6 flex gap-2">
                                <a href={`${file.url}?download=`} download={file.name} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-athena-teal text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase hover:opacity-95 shadow-md active:scale-95 transition-all"><Download size={14} /> Baixar</a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center opacity-30 border-2 border-dashed border-slate-500 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center gap-4">
                  <BookOpen size={48} className="text-athena-teal opacity-20" />
                  <p className="text-[11px] font-black uppercase tracking-[0.4em]">Acesse um tópico para visualizar o conteúdo</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
