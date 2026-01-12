
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Plus, ClipboardList, FileUp, 
  Trash2, Copy, Check, Download, Loader2,
  X, BookOpen, Layers, Save, RefreshCw, AlertTriangle, ChevronDown, Lock, ShieldCheck,
  Maximize2, Minimize2, Share2, WifiOff, ArrowUpDown, Edit2, MoreVertical, Info
} from 'lucide-react';
import { Group, GroupFile, GroupActivity } from '../types';

const SUPABASE_URL = 'https://wajmeqsfcgruhuxasuux.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CvIBWIOhrKX3kGNKNwzlFg_7fUZzOUk';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [fileActionId, setFileActionId] = useState<string | null>(null);
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const handleNetworkError = (err: any) => {
    const isNetwork = err?.message?.includes('fetch') || !navigator.onLine;
    const msg = isNetwork ? 'Erro de conexão com o servidor.' : (err?.message || 'Erro inesperado.');
    if (onNotification) onNotification(msg, isNetwork ? 'info' : 'error');
    console.error('GroupManager Error:', err);
    return msg;
  };

  useEffect(() => {
    fetchMyGroups();
  }, [userEmail]);

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
    setErrorState(null);
    try {
      const { data: membership, error: memError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_email', userEmail);
      if (memError) throw memError;

      if (membership && membership.length > 0) {
        const ids = membership.map(m => m.group_id);
        const { data: groupsData, error: groupsError } = await supabase.from('groups').select('*').in('id', ids);
        if (groupsError) throw groupsError;
        setGroups(groupsData || []);
        if (groupsData?.length && !activeGroupId) setActiveGroupId(groupsData[0].id);
      } else {
        setGroups([]);
        setActiveGroupId(null);
      }
    } catch (err: any) {
      setErrorState(handleNetworkError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (id: string) => {
    try {
      const { data: group, error: gError } = await supabase.from('groups').select('*').eq('id', id).single();
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
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
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

      if (uploadError) {
        throw new Error(`Erro Storage: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage.from('group_files').getPublicUrl(filePath);
      
      const { data: fileRecord, error: dbError } = await supabase.from('group_files').insert({
        group_id: activeGroupId, 
        activity_id: activeActivityId, 
        name: file.name, 
        url: urlData.publicUrl, 
        uploaded_by: userEmail,
        size: file.size
      }).select().single();
      
      if (dbError) throw dbError;
      
      setFiles(prev => [fileRecord, ...prev]);
      if (onNotification) onNotification('Novo material adicionado!', 'success');
    } catch (err: any) { 
      handleNetworkError(err); 
    } finally { 
      setUploadingFile(false); 
      if (e.target) e.target.value = ''; 
    }
  };

  const deleteFile = async (file: GroupFile) => {
    if (file.uploaded_by !== userEmail) {
        alert("Apenas quem enviou o arquivo pode removê-lo.");
        return;
    }

    if (!confirm(`Deseja remover o arquivo "${file.name}"?`)) return;

    setActionLoading(true);
    try {
      const path = file.url.split('/group_files/')[1];
      if (path) {
        await supabase.storage.from('group_files').remove([path]);
      }
      const { error } = await supabase.from('group_files').delete().eq('id', file.id);
      if (error) throw error;
      setFiles(prev => prev.filter(f => f.id !== file.id));
      if (onNotification) onNotification('Arquivo removido!', 'info');
    } catch (err) {
      handleNetworkError(err);
    } finally {
      setActionLoading(false);
      setFileActionId(null);
    }
  };

  const renameFile = async () => {
    if (!newFileName.trim() || !renameFileId) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('group_files').update({ name: newFileName.trim() }).eq('id', renameFileId);
      if (error) throw error;
      setFiles(prev => prev.map(f => f.id === renameFileId ? { ...f, name: newFileName.trim() } : f));
      setRenameFileId(null);
      setNewFileName('');
      if (onNotification) onNotification('Arquivo renomeado!', 'success');
    } catch (err) {
      handleNetworkError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      alert('O nome da turma não pode estar vazio.');
      return;
    }
    setActionLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const { data, error } = await supabase.from('groups').insert({ name: groupName, code, created_by: userEmail, instructions: '' }).select().single();
      if (error) throw error;
      await supabase.from('group_members').insert({ group_id: data.id, user_email: userEmail });
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
      const { data: group, error: gError } = await supabase.from('groups').select('*').eq('code', groupCode.toUpperCase().trim()).single();
      if (gError || !group) throw new Error('Turma não encontrada.');
      const { error: mError } = await supabase.from('group_members').insert({ group_id: group.id, user_email: userEmail });
      if (mError) throw mError;
      await fetchMyGroups();
      setActiveGroupId(group.id);
      setJoinMode(false);
      setGroupCode('');
      if (onNotification) onNotification('Bem-vindo à turma!', 'success');
    } catch (err: any) { handleNetworkError(err); } finally { setActionLoading(false); }
  };

  const createActivity = async () => {
    const name = newActivityName.trim();
    if (!name || !activeGroupId) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_activities')
        .insert({ 
          group_id: activeGroupId, 
          name, 
          created_by: userEmail, 
          instructions: ''
        })
        .select().single();
      if (error) throw error;
      setActivities(prev => [...prev, data]);
      setActiveActivityId(data.id);
      setNewActivityName('');
      if (onNotification) onNotification('Tópico criado!', 'success');
    } catch (err: any) { handleNetworkError(err); } finally { setActionLoading(false); }
  };

  const saveInstructions = async () => {
    if (!activeActivity) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('group_activities')
        .update({ instructions: tempInstructions })
        .eq('id', activeActivity.id);
      if (error) throw error;
      setActivities(prev => prev.map(a => a.id === activeActivity.id ? { ...a, instructions: tempInstructions } : a));
      setHasUnsavedChanges(false);
      if (onNotification) onNotification('Instruções salvas!', 'success');
    } catch (err: any) { handleNetworkError(err); } finally { setActionLoading(false); }
  };

  const shareTopic = () => {
    if (!activeActivity) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?group=${activeGroupId}&activity=${activeActivityId}`;
    navigator.clipboard.writeText(shareUrl);
    if (onNotification) onNotification('Link copiado!', 'info');
  };

  const performDeleteActivity = async (id: string) => {
    const activityToDelete = activities.find(a => a.id === id);
    if (!activityToDelete || activityToDelete.created_by !== userEmail) {
      alert('Erro: Apenas o autor deste tópico pode removê-lo.');
      setConfirmDeleteId(null);
      return;
    }

    setActionLoading(true);
    try {
      const { data: dbFiles } = await supabase
        .from('group_files')
        .select('url')
        .eq('activity_id', id);
      
      if (dbFiles && dbFiles.length > 0) {
        const paths = dbFiles.map(f => {
          const parts = f.url.split('/group_files/');
          return parts[parts.length - 1];
        });
        
        if (paths.length > 0) {
          await supabase.storage.from('group_files').remove(paths);
        }
      }

      await supabase.from('group_files').delete().eq('activity_id', id);
      const { error } = await supabase.from('group_activities').delete().eq('id', id);
      
      if (error) throw error;
      
      setActivities(prev => prev.filter(a => a.id !== id));
      if (activeActivityId === id) {
        setActiveActivityId(null);
        setActiveActivity(null);
      }
      setConfirmDeleteId(null);
      if (onNotification) onNotification('Tópico removido.', 'info');
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
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return <div className="flex flex-col items-center justify-center py-20 text-athena-teal animate-pulse"><Loader2 size={40} className="animate-spin mb-4" /><p className="font-black uppercase tracking-widest text-[10px]">Sincronizando...</p></div>;
  }

  if (errorState && groups.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-rose-300 dark:border-rose-900/40">
            <WifiOff size={48} className="text-rose-400 mb-4" />
            <p className="font-black uppercase tracking-widest text-xs text-rose-500">{errorState}</p>
            <button onClick={fetchMyGroups} className="mt-6 px-6 py-3 bg-athena-teal text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-2">
                <RefreshCw size={14} /> Tentar Reconectar
            </button>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16 relative max-w-6xl mx-auto">
      
      {/* Modal de Renomear Arquivo */}
      {renameFileId && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 border-2 border-athena-teal shadow-2xl space-y-6 animate-fade-in">
            <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">Renomear Arquivo</h3>
            <input 
              type="text" 
              className="w-full p-4 rounded-xl border-2 border-slate-300 dark:bg-slate-800 dark:border-slate-700 outline-none focus:border-athena-teal font-bold"
              placeholder="Novo nome do arquivo..."
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={renameFile} disabled={actionLoading} className="flex-1 py-3 bg-athena-teal text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:opacity-90 transition-all">
                {actionLoading ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'Salvar'}
              </button>
              <button onClick={() => setRenameFileId(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] border-4 border-rose-600 shadow-2xl p-8 space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-1">
              <Trash2 size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tighter">Excluir Tópico?</h3>
              <p className="text-[10px] font-bold text-slate-600 mt-2 leading-relaxed">Esta ação é irreversível e apagará todos os materiais associados.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => performDeleteActivity(confirmDeleteId)}
                disabled={actionLoading}
                className="w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-rose-700 transition-all text-[10px]"
              >
                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : 'Sim, Excluir'}
              </button>
              <button 
                onClick={() => setConfirmDeleteId(null)}
                disabled={actionLoading}
                className="w-full py-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-400 rounded-xl font-black uppercase tracking-widest hover:bg-slate-300 transition-all text-[10px]"
              >
                Não, Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border-2 border-slate-300 dark:border-slate-800 shadow-xl">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-950 dark:text-white tracking-tighter flex items-center gap-4">
            <Users className="text-athena-teal" size={32} /> Minhas Turmas
          </h2>
          <p className="text-[9px] font-black uppercase text-slate-600 tracking-[0.2em] mt-2">Portal de Colaboração Acadêmica</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => { setJoinMode(true); setCreateMode(false); }} className="flex-1 md:flex-none px-5 py-3.5 bg-white dark:bg-slate-800 text-athena-teal border-2 border-athena-teal rounded-2xl text-[10px] font-black uppercase tracking-widest shadow hover:bg-slate-100 transition-all">Acessar</button>
          <button onClick={() => { setCreateMode(true); setJoinMode(false); }} className="flex-1 md:flex-none px-5 py-3.5 bg-athena-teal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-athena-teal/90 transition-all">Criar</button>
        </div>
      </div>

      {(createMode || joinMode) && (
        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border-2 border-dashed border-athena-teal/40 shadow-2xl space-y-6 max-w-xl mx-auto relative animate-fade-in">
          <button onClick={() => { setCreateMode(false); setJoinMode(false); }} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-rose-500 transition-colors"><X size={24} /></button>
          <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase text-center tracking-tighter">{createMode ? 'Nova Turma' : 'Digitar Código'}</h3>
          <div className="space-y-4">
            {createMode ? (
              <input type="text" placeholder="Nome da Turma" className="w-full p-3.5 rounded-xl border-2 border-slate-300 dark:bg-slate-800 font-bold text-sm outline-none focus:border-athena-teal text-slate-950 dark:text-white" value={groupName} onChange={e => setGroupName(e.target.value)} />
            ) : (
              <input type="text" placeholder="CÓDIGO" className="w-full p-4 rounded-2xl border-2 border-slate-300 dark:bg-slate-800 font-black uppercase text-center text-2xl tracking-[0.4em] outline-none focus:border-athena-teal text-athena-teal" value={groupCode} onChange={e => setGroupCode(e.target.value.toUpperCase())} />
            )}
            <button onClick={createMode ? createGroup : joinGroup} disabled={actionLoading} className="w-full py-4 bg-amber-500 text-slate-900 rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 text-[11px]">
              {actionLoading ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {groups.length > 0 && !createMode && !joinMode && (
        <div className="space-y-6 flex flex-col">
          <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-300 dark:border-slate-800 shadow-lg">
            <h4 className="text-lg font-black uppercase text-slate-600 dark:text-slate-500 tracking-[0.2em] mb-4 ml-2 flex items-center gap-3"><Users size={14} className="text-athena-teal"/> Turmas</h4>
            <div className="flex flex-wrap gap-3">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => { setActiveGroupId(g.id); setActiveActivityId(null); }}
                  className={`min-w-[150px] flex-1 text-left p-4 rounded-2xl border-2 transition-all group relative overflow-hidden
                    ${activeGroupId === g.id ? 'bg-athena-teal border-athena-teal text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-950 dark:text-slate-400 hover:border-athena-teal/40'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-lg md:text-xl truncate">{String(g.name)}</p>
                    {activeGroupId === g.id && <ChevronDown size={14} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {activeGroup && (
            <div className="animate-fade-in space-y-6 flex flex-col">
              <div className="w-full bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-300 dark:border-slate-800 p-6 md:p-8 shadow-xl flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-6">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-500 tracking-[0.2em] flex items-center gap-2"><BookOpen size={12} className="text-athena-coral"/> Tópicos Disponíveis</h4>
                    <p className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight">{activeGroup.name}</p>
                  </div>
                  <button onClick={copyCode} className="text-[10px] font-black bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-300 flex items-center gap-2 shadow-sm hover:bg-amber-100 transition-all">
                    {copied ? <Check size={12}/> : <Copy size={12}/>} {activeGroup.code}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
                  {activities.length === 0 ? (
                    <div className="col-span-full py-10 text-center opacity-30">
                       <p className="text-[10px] font-black uppercase tracking-widest">Nenhum tópico criado</p>
                    </div>
                  ) : (
                    activities.map(act => (
                      <div key={act.id} className="flex flex-col items-stretch gap-2 animate-fade-in">
                        <button
                          onClick={() => setActiveActivityId(act.id)}
                          className={`flex-1 text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 min-h-[50px]
                            ${activeActivityId === act.id ? 'bg-athena-coral border-athena-coral text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-100'}`}
                        >
                          <Layers size={18} className={activeActivityId === act.id ? 'text-white' : 'text-athena-coral'} />
                          <span className="font-black text-base leading-tight truncate">{String(act.name)}</span>
                        </button>
                        
                        {act.created_by === userEmail && (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmDeleteId(act.id);
                            }}
                            className="w-full py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-300 text-[8px] font-black uppercase tracking-widest"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row gap-3">
                    <input 
                      type="text" 
                      placeholder="Nome do Novo Tópico..." 
                      className="flex-1 text-base font-bold p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl outline-none border border-slate-300 dark:border-slate-800 shadow-inner focus:border-athena-teal"
                      value={newActivityName}
                      onChange={e => setNewActivityName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createActivity()}
                    />
                    <div className="flex gap-2">
                      <button onClick={createActivity} disabled={actionLoading} className="flex-1 sm:flex-none px-6 py-4 bg-athena-coral text-white rounded-2xl shadow-lg hover:bg-athena-coral/90 transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16}/> Novo Tópico</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full">
                {activeActivity ? (
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-fade-in">
                    <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          {activeActivity.created_by === userEmail ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[8px] font-black uppercase border border-emerald-300">
                              <ShieldCheck size={10}/> Autor
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-[8px] font-black uppercase border border-amber-300">
                              <Lock size={10}/> Leitura
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight">
                          {String(activeActivity.name)}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                         {hasUnsavedChanges && activeActivity.created_by === userEmail && (
                           <div className="flex items-center gap-2 text-[10px] font-black text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-300 animate-pulse">
                             <RefreshCw size={12}/> Pendente
                           </div>
                         )}
                         {uploadingFile && (
                            <div className="flex items-center gap-2 text-[10px] font-black text-athena-teal bg-athena-teal/5 px-4 py-2 rounded-xl border border-athena-teal/30 animate-pulse">
                              <Loader2 size={12} className="animate-spin" /> Enviando...
                            </div>
                         )}
                      </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                      <div className="space-y-4">
                        <div className="flex flex-wrap justify-between items-center border-b-2 border-slate-200 dark:border-slate-800 pb-3 gap-2">
                          <h4 className="text-base font-black uppercase text-slate-950 dark:text-white tracking-widest flex items-center gap-3"><ClipboardList size={16} className="text-athena-teal" /> Orientações</h4>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setOrientationsExpanded(!orientationsExpanded)}
                              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 hover:text-athena-teal transition-all border border-slate-300 dark:border-slate-700 flex items-center gap-2 text-[9px] font-black uppercase"
                            >
                              {orientationsExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                              {orientationsExpanded ? "Recolher" : "Expandir"}
                            </button>
                            <button 
                              onClick={shareTopic}
                              className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-700 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-200 dark:border-indigo-900/50 flex items-center gap-2 text-[9px] font-black uppercase"
                            >
                              <Share2 size={14} /> Compartilhar
                            </button>
                            {activeActivity.created_by === userEmail && (
                              <button 
                                onClick={saveInstructions} 
                                disabled={actionLoading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg
                                  ${hasUnsavedChanges ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'}`}
                              >
                                {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={14} />} Salvar
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className={`transition-all duration-300 overflow-hidden ${orientationsExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                          <textarea
                            className={`w-full p-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-2xl outline-none transition-all text-base md:text-lg font-medium leading-relaxed shadow-inner min-h-[250px]
                              ${activeActivity.created_by === userEmail ? 'focus:border-athena-teal' : 'cursor-default opacity-80'}`}
                            value={tempInstructions}
                            readOnly={activeActivity.created_by !== userEmail}
                            onChange={(e) => {
                              if (activeActivity.created_by === userEmail) {
                                setTempInstructions(e.target.value);
                                setHasUnsavedChanges(true);
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-200 dark:border-slate-800 pb-3 gap-4">
                          <h4 className="text-base font-black uppercase text-slate-950 dark:text-white tracking-widest flex items-center gap-3"><FileUp size={16} className="text-athena-coral" /> Materiais</h4>
                          
                          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700">
                                <ArrowUpDown size={12} className="text-slate-500" />
                                <select 
                                    className="bg-transparent text-[9px] font-black uppercase outline-none text-slate-700 dark:text-slate-300"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                >
                                    <option value="date">Data</option>
                                    <option value="name">Nome</option>
                                    <option value="size">Tamanho</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => fetchActivityFiles(activeActivity.id)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-all border border-slate-300"><RefreshCw size={14} className={filesLoading ? 'animate-spin' : ''}/></button>
                                {activeActivity.created_by === userEmail && (
                                <label className={`cursor-pointer transition-all relative ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                                    <span className={`bg-athena-coral text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg flex items-center gap-2 hover:bg-athena-coral/90 transition-all border border-athena-coral`}>
                                    {uploadingFile ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} 
                                    Upload
                                    </span>
                                </label>
                                )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sortedFiles.length === 0 ? (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 opacity-30 border-4 border-dashed border-slate-300 dark:border-slate-800 rounded-[2rem]">
                              <FileUp size={32} className="mb-3" />
                              <p className="text-[9px] font-black uppercase tracking-widest">Aguardando materiais</p>
                            </div>
                          ) : (
                            sortedFiles.map(file => (
                              <div key={file.id} className="flex flex-col p-4 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl group hover:border-athena-coral transition-all shadow-md hover:shadow-xl relative overflow-hidden">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-950 dark:text-white leading-tight truncate pr-6" title={file.name}>{String(file.name)}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Por: {String(file.uploaded_by).split('@')[0]}</p>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <p className="text-[8px] font-black text-slate-500 uppercase">{formatFileSize(file.size)}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="absolute top-2 right-2">
                                    <button 
                                        onClick={() => setFileActionId(fileActionId === file.id ? null : file.id)}
                                        className="p-1 text-slate-400 hover:text-athena-teal transition-all"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                  </div>
                                </div>

                                {/* Menu de Ações do Arquivo */}
                                {fileActionId === file.id && (
                                    <div className="absolute top-10 right-2 z-10 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 min-w-[120px] animate-fade-in">
                                        <button 
                                            onClick={() => { setRenameFileId(file.id); setNewFileName(file.name); setFileActionId(null); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-[9px] font-black uppercase text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <Edit2 size={12}/> Renomear
                                        </button>
                                        {file.uploaded_by === userEmail && (
                                            <button 
                                                onClick={() => deleteFile(file)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-[9px] font-black uppercase text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                                            >
                                                <Trash2 size={12}/> Excluir
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setFileActionId(null)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-[9px] font-black uppercase text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <X size={12}/> Fechar
                                        </button>
                                    </div>
                                )}

                                <div className="mt-4 flex gap-2">
                                    <a href={`${file.url}?download=`} download={file.name} target="_blank" rel="noreferrer" className="flex-1 py-2.5 bg-athena-teal text-white rounded-lg flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-sm">
                                        <Download size={12} /> Baixar
                                    </a>
                                    <button 
                                        onClick={() => alert(`Enviado em: ${new Date(file.created_at).toLocaleString('pt-BR')}\nPor: ${file.uploaded_by}\nTamanho: ${formatFileSize(file.size)}`)}
                                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-all"
                                        title="Informações"
                                    >
                                        <Info size={14} />
                                    </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/60 dark:bg-slate-900/40 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-slate-800">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">Selecione um tópico para visualizar</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
