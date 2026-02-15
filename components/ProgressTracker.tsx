
import React, { useState } from 'react';
import { SubjectProgress, Subject } from '../types';
import { Plus, Trash2, Calendar, Layout, CheckCircle2, PauseCircle, PlayCircle, Tag, AlertTriangle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface ProgressTrackerProps {
  progressList: SubjectProgress[];
  subjects: Subject[];
  onUpdate: (list: SubjectProgress[]) => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ progressList, subjects, onUpdate }) => {
  if (!subjects || !progressList) {
  return <div className="p-6 text-white">Carregando progresso...</div>;
}
  const [showForm, setShowForm] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SubjectProgress>>({
    subjectName: subjects?.[0]?.name ?? '',
    status: 'Em andamento',
    notes_progresso: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    topics: []
  });

  const getSubjectColor = (name: string) => {
    return subjects.find(s => s.name === name)?.color || '#94a3b8';
  };

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      setFormData(prev => ({ ...prev, topics: [...(prev.topics || []), newTopic.trim()] }));
      setNewTopic('');
    }
  };

  const handleAdd = () => {
    if (!formData.subjectName || !formData.startDate) return;
    const newItem: SubjectProgress = {
      id: Math.random().toString(36).substr(2, 9),
      subjectName: formData.subjectName as string,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status as any,
      notes_progresso: formData.notes_progresso || '',
      topics: formData.topics || []
    };
    onUpdate([...progressList, newItem]);
    setShowForm(false);
    setFormData({ subjectName: subjects[0]?.name || '', status: 'Em andamento', notes_progresso: '', startDate: format(new Date(), 'yyyy-MM-dd'), topics: [] });
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onUpdate(progressList.filter(p => p.id !== itemToDelete));
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Modal de Confirmação de Exclusão */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border-2 border-rose-600 shadow-2xl text-center">
            <AlertTriangle size={48} className="mx-auto text-rose-600 mb-4" />
            <h3 className="text-2xl font-black uppercase mb-2 text-slate-950 dark:text-white">Remover Registro?</h3>
            <p className="text-xs text-slate-500 mb-6 font-bold uppercase">Essa ação excluirá permanentemente o histórico deste tópico de estudo.</p>
            <div className="flex gap-4">
              <button onClick={confirmDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Excluir</button>
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-4 bg-slate-400 border border-slate-500 text-black rounded-xl font-black uppercase text-xs hover:bg-slate-500 transition-colors shadow-md">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">Status de Aprendizado</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-amber-400 active:scale-95 transition-all"
        >
          {showForm ? 'Fechar Painel' : 'Nova Jornada'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-[2.5rem] border-2 border-slate-500 dark:border-slate-800 shadow-2xl space-y-6 animate-fade-in max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div>
              <label className="text-[9px] md:text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-2 block">Selecione a Matéria</label>
              <select 
                className="w-full p-3 md:p-4 rounded-xl border-2 border-slate-400 dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500 text-slate-950 dark:text-white font-bold text-sm"
                value={formData.subjectName}
                onChange={e => setFormData({...formData, subjectName: e.target.value})}
              >
                {subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] md:text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-2 block">Estado Atual</label>
              <select 
                className="w-full p-3 md:p-4 rounded-xl border-2 border-slate-400 dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500 text-slate-950 dark:text-white font-bold text-sm"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="Em andamento">Em andamento</option>
                <option value="Pausada">Pausada</option>
                <option value="Concluída">Concluída</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
             <div>
               <label className="text-[9px] md:text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-2 block">Data de Início (Obrigatória)</label>
               <input type="date" className="w-full p-3 md:p-4 rounded-xl border-2 border-slate-400 dark:bg-slate-800 dark:border-slate-700 font-bold text-slate-950 dark:text-white text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
             </div>
             <div>
               <label className="text-[9px] md:text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-2 block">Data de Conclusão</label>
               <input type="date" className="w-full p-3 md:p-4 rounded-xl border-2 border-slate-400 dark:bg-slate-800 dark:border-slate-700 font-bold text-slate-950 dark:text-white text-sm" value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
             </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-6 rounded-2xl border-2 border-slate-400 dark:border-slate-700">
            <label className="text-[9px] md:text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-3 block">Adicionar Tópicos/Assuntos</label>
            <div className="flex gap-2 md:gap-3 mb-4">
              <input 
                type="text" 
                className="flex-1 p-3 md:p-4 rounded-xl border-2 border-slate-400 dark:bg-slate-900 dark:border-slate-800 font-bold outline-none focus:border-amber-500 text-sm"
                placeholder="Ex: Funções Afins, Revolução Russa..." 
                value={newTopic} 
                onChange={e => setNewTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTopic()}
              />
              <button onClick={handleAddTopic} className="p-3 md:p-4 bg-indigo-600 text-white rounded-xl shadow-md active:scale-95"><Plus size={24}/></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.topics?.map((t, i) => (
                <span key={i} className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg text-[10px] font-black text-slate-950 dark:text-white border-2 border-slate-300 dark:border-slate-600 shadow-sm uppercase tracking-tight">{t}</span>
              ))}
            </div>
          </div>

          <button onClick={handleAdd} className="w-full py-4 md:py-5 bg-amber-500 text-slate-900 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-amber-400 transition-all border-b-4 border-amber-600 text-xs md:text-sm">Confirmar Registro</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {progressList.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border-2 border-slate-500 dark:border-slate-800 shadow-md hover:shadow-2xl transition-all group relative">
            <div className="flex justify-between items-start mb-5">
              <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-sm
                ${item.status === 'Concluída' ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : item.status === 'Pausada' ? 'bg-amber-100 text-amber-800 border-amber-400' : 'bg-indigo-100 text-indigo-800 border-indigo-400'}`}>
                {item.status === 'Concluída' ? <CheckCircle2 size={14}/> : item.status === 'Pausada' ? <PauseCircle size={14}/> : <PlayCircle size={14}/>}
                {item.status}
              </span>
              <button onClick={() => setItemToDelete(item.id)} className="text-slate-400 hover:text-rose-600 transition-colors md:opacity-0 md:group-hover:opacity-100"><Trash2 size={20} /></button>
            </div>
            
            <h4 className="text-2xl font-black text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-black/10 shadow-sm" style={{ backgroundColor: getSubjectColor(item.subjectName) }} />
              {item.subjectName}
            </h4>

            <div className="space-y-6">
              <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-400 dark:border-slate-800">
                <div className="flex-1">
                  <p className="text-[9px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mb-1">Início</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2"><Calendar size={14} className="text-indigo-600"/> {item.startDate}</p>
                </div>
                {item.endDate && (
                  <div className="flex-1 border-l border-slate-300 dark:border-slate-700 pl-4">
                    <p className="text-[9px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mb-1">Conclusão</p>
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2"><CheckCircle2 size={14}/> {item.endDate}</p>
                  </div>
                )}
              </div>

              {item.topics.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-950 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Tag size={12} className="text-[#FF7E67]"/> Conteúdos Dominados
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.topics.map((t, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-[10px] font-black text-slate-950 dark:text-slate-200 border border-slate-400 dark:border-slate-700 uppercase tracking-tight shadow-sm">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
