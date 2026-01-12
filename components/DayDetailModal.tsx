
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { X, Trash2, CheckCircle2, Circle, Clock, ChevronUp, ChevronDown, RefreshCw, AlertCircle, RotateCcw, BookOpen, CalendarCheck } from 'lucide-react';
import { DayData, Task } from '../types';

interface DayDetailModalProps {
  date: Date;
  dayData: DayData;
  subjects: string[];
  onClose: () => void;
  onSave: (data: DayData) => void;
}

const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEKDAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ date, dayData, subjects, onClose, onSave }) => {
  const [localData, setLocalData] = useState<DayData>({ ...dayData });
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedRecurrenceDay, setSelectedRecurrenceDay] = useState(date.getDay());
  
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const [confirmClearCommitments, setConfirmClearCommitments] = useState(false);

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text: String(newTaskText),
      completed: false,
      subject: String(selectedSubject),
      isRecurring: isRecurring,
      recurrenceDay: isRecurring ? selectedRecurrenceDay : undefined
    };
    setLocalData(prev => ({ ...prev, tasks: [...(prev.tasks || []), newTask] }));
    setNewTaskText('');
    setIsRecurring(false);
    setSelectedRecurrenceDay(date.getDay());
  };

  const toggleTask = (id: string) => {
    setLocalData(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const confirmDeleteTask = (id: string) => {
    setLocalData(prev => ({ ...prev, tasks: (prev.tasks || []).filter(t => t.id !== id) }));
    setTaskToDeleteId(null);
  };

  const adjustMinutes = (amount: number) => {
    setLocalData(prev => ({ ...prev, studyMinutes: Math.max(0, (prev.studyMinutes || 0) + amount) }));
  };

  const clearCommitments = () => {
    setLocalData(prev => ({ ...prev, commitments: '' }));
    setConfirmClearCommitments(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl md:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-400 dark:border-slate-700 relative">
        
        {confirmClearCommitments && (
          <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-[60] flex items-center justify-center p-8 animate-fade-in">
            <div className="text-center space-y-6 max-w-xs">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <RotateCcw size={32} />
              </div>
              <h4 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">Limpar Avisos?</h4>
              <p className="text-xs font-bold text-slate-500">Isso apagará todo o texto digitado nos compromissos deste dia.</p>
              <div className="flex flex-col gap-2">
                <button onClick={clearCommitments} className="w-full py-3 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px]">Sim, Limpar</button>
                <button onClick={() => setConfirmClearCommitments(false)} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-400 rounded-xl font-black uppercase tracking-widest text-[10px]">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-6 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white capitalize">
              {format(date, "d 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="text-[10px] md:text-[11px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest">Atividades do Dia</p>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-rose-500 rounded-xl transition-all border border-slate-400 dark:border-slate-700 hover:bg-slate-300">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 no-scrollbar">
          
          <section className="space-y-4">
            <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest block flex items-center gap-2">
              <BookOpen size={14} className="text-athena-teal" /> O que vou estudar hoje?
            </h4>
            
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                <select 
                  className="p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-black uppercase outline-none focus:border-amber-500 text-slate-950 dark:text-slate-200"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(String(e.target.value))}
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input
                  type="text"
                  className="flex-1 p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 dark:bg-slate-900 outline-none text-[11px] font-bold shadow-inner focus:border-amber-500 text-slate-950 dark:text-white"
                  placeholder="Conteúdo planejado..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <button 
                    onClick={() => setIsRecurring(!isRecurring)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all border-2 ${isRecurring ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-400 border-slate-300 dark:border-slate-700'}`}
                  >
                    <CalendarCheck size={14} className={isRecurring ? 'animate-bounce' : ''} />
                    Repetir Semanal
                  </button>
                  <button onClick={addTask} className="px-6 py-2 bg-amber-500 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-amber-400 active:scale-95 transition-all">
                    Planejar
                  </button>
                </div>

                {isRecurring && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-1 duration-200 shadow-inner">
                    <p className="text-[8px] font-black uppercase text-slate-500 mb-2">Escolha os dias da recorrência:</p>
                    <div className="flex gap-1 flex-1">
                      {WEEKDAYS_SHORT.map((label, dayIdx) => (
                        <button
                          key={dayIdx}
                          onClick={() => setSelectedRecurrenceDay(dayIdx)}
                          className={`w-8 h-8 rounded-full text-[10px] font-black flex items-center justify-center transition-all border-2
                            ${selectedRecurrenceDay === dayIdx 
                              ? 'bg-athena-teal text-white border-athena-teal shadow-md scale-110' 
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-athena-teal/50'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[7px] font-black text-athena-teal mt-2 uppercase text-center opacity-60">Repete toda {WEEKDAYS_FULL[selectedRecurrenceDay]}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {localData.tasks && localData.tasks.map((task) => (
                <div key={task.id} className={`flex items-center gap-3 p-4 rounded-xl shadow-sm group transition-all border-2
                  ${taskToDeleteId === task.id ? 'bg-rose-50 border-rose-500 dark:bg-rose-900/20' : 'bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-800'}`}>
                  
                  {taskToDeleteId === task.id ? (
                    <div className="flex-1 flex items-center justify-between gap-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase">
                        <AlertCircle size={16} /> Remover plano?
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => confirmDeleteTask(task.id)} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase">Sim</button>
                        <button onClick={() => setTaskToDeleteId(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[9px] font-black uppercase">Não</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => toggleTask(task.id)} className={`transition-all ${task.completed ? 'text-emerald-600' : 'text-slate-400 hover:text-amber-500'}`}>
                        {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                           <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-300 uppercase border border-indigo-300 dark:border-transparent">{String(task.subject || 'Geral')}</span>
                           {task.isRecurring && (
                             <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase border border-amber-300 flex items-center gap-1">
                               <RefreshCw size={8}/> {WEEKDAYS_SHORT[task.recurrenceDay || 0]}
                             </span>
                           )}
                        </div>
                        <span className={`text-[12px] font-bold truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-950 dark:text-slate-100'}`}>{String(task.text)}</span>
                      </div>
                      <button 
                        onClick={() => setTaskToDeleteId(task.id)} 
                        className="text-slate-400 hover:text-rose-600 transition-colors md:opacity-0 md:group-hover:opacity-100"
                        title="Remover plano"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="relative pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-end mb-2">
              <label className="text-[10px] md:text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest block">Compromissos e Avisos</label>
              {localData.commitments && (
                <button 
                  onClick={() => setConfirmClearCommitments(true)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  title="Limpar texto"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <textarea
              className="w-full p-4 rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-amber-50 dark:bg-amber-900/5 outline-none text-xs md:text-sm font-bold placeholder:text-slate-500 text-slate-950 dark:text-slate-200 min-h-[80px] md:min-h-[100px] shadow-inner focus:border-amber-500 transition-all"
              placeholder="Ex: Prova de Matemática às 14h..."
              value={String(localData.commitments || '')}
              onChange={(e) => setLocalData({ ...localData, commitments: String(e.target.value) })}
            />
          </section>

          <section className="flex items-center justify-between bg-amber-500 p-5 md:p-7 rounded-2xl md:rounded-3xl text-slate-900 shadow-xl border-b-4 border-amber-600">
            <div>
              <span className="block text-4xl md:text-6xl font-black leading-none drop-shadow-sm">{localData.studyMinutes || 0}</span>
              <span className="text-[10px] md:text-[12px] font-black uppercase mt-1 block opacity-95 tracking-widest">Minutos de Estudo Concluídos</span>
            </div>
            <div className="flex gap-2 md:gap-4">
              <button onClick={() => adjustMinutes(-5)} className="p-2.5 md:p-4 bg-black/10 rounded-xl hover:bg-black/20 transition-all border border-black/10 active:scale-90"><ChevronDown size={22} /></button>
              <button onClick={() => adjustMinutes(5)} className="p-2.5 md:p-4 bg-white text-amber-600 rounded-xl shadow-lg transition-all border border-white active:scale-90"><ChevronUp size={22} /></button>
            </div>
          </section>

        </div>

        <div className="p-4 md:p-6 border-t border-slate-300 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
          <button onClick={onClose} className="px-5 py-2 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 hover:text-slate-950">Descartar</button>
          <button onClick={() => onSave(localData)} className="px-8 py-3 bg-athena-teal text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-athena-teal/90 active:scale-95 transition-all border-b-4 border-slate-900/20">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
};
