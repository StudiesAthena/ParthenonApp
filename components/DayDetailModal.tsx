
import React, { useState } from 'react';
import { format, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { X, Trash2, CheckCircle2, Circle, Clock, ChevronUp, ChevronDown, RefreshCw, AlertCircle, RotateCcw, BookOpen, CalendarCheck, Share2, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { DayData, Task, Commitment } from '../types';

interface DayDetailModalProps {
  date: Date;
  dayData: DayData;
  subjects: string[];
  onClose: () => void;
  recurringTasks: Task[];
  recurringCommitments: Commitment[];
  onSave: (dayData: DayData, recurringTasks: Task[], recurringCommitments: Commitment[]) => void;
}

const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const GCAL_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ date, dayData, subjects, onClose, recurringTasks, recurringCommitments, onSave }) => {
  const [localDayData, setLocalDayData] = useState<DayData>({ 
    ...dayData, 
    commitments: Array.isArray(dayData.commitments) ? dayData.commitments : [] 
  });
  const [localRecurringTasks, setLocalRecurringTasks] = useState<Task[]>([...recurringTasks]);
  const [localRecurringCommitments, setLocalRecurringCommitments] = useState<Commitment[]>([...recurringCommitments]);
  
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedRecurrenceDay, setSelectedRecurrenceDay] = useState(date.getDay());

  const [newCommitmentText, setNewCommitmentText] = useState('');
  const [newCommitmentTime, setNewCommitmentTime] = useState('12:00');
  const [commIsRecurring, setCommIsRecurring] = useState(false);
  const [commRecurrenceDay, setCommRecurrenceDay] = useState(date.getDay());
  
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'task' | 'commitment', isRecurring?: boolean } | null>(null);

  const dailyWeekday = date.getDay();
  
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

    if (isRecurring) {
      setLocalRecurringTasks(prev => [...prev, newTask]);
    } else {
      setLocalDayData(prev => ({ ...prev, tasks: [...(prev.tasks || []), newTask] }));
    }

    setNewTaskText('');
    setIsRecurring(false);
    setSelectedRecurrenceDay(date.getDay());
  };

  const addCommitment = () => {
    if (!newCommitmentText.trim()) return;
    const newComm: Commitment = {
      id: Math.random().toString(36).substr(2, 9),
      text: newCommitmentText.trim(),
      time: newCommitmentTime,
      isSyncedWithGoogle: false,
      isRecurring: commIsRecurring,
      recurrenceDay: commIsRecurring ? commRecurrenceDay : undefined
    };

    if (commIsRecurring) {
      setLocalRecurringCommitments(prev => [...prev, newComm].sort((a, b) => a.time.localeCompare(b.time)));
    } else {
      setLocalDayData(prev => ({
        ...prev,
        commitments: [...(prev.commitments || []), newComm].sort((a, b) => a.time.localeCompare(b.time))
      }));
    }
    
    setNewCommitmentText('');
    setCommIsRecurring(false);
  };

  const syncCommitmentToGoogle = (comm: Commitment) => {
    const dateStr = format(date, 'yyyyMMdd');
    const title = encodeURIComponent(`${comm.text}`);
    const [hours, minutes] = comm.time.split(':');
    const startTime = `${dateStr}T${hours}${minutes}00`;
    const endHours = (parseInt(hours) + 1).toString().padStart(2, '0');
    const endTime = `${dateStr}T${endHours}${minutes}00`;

    const description = encodeURIComponent(`Compromisso agendado pelo Parthenon Planner.\nHorário: ${comm.time}`);
    let gcalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${description}&sf=true&output=xml`;
    
    if (comm.isRecurring && comm.recurrenceDay !== undefined) {
      gcalUrl += `&recur=RRULE:FREQ=WEEKLY;BYDAY=${GCAL_DAYS[comm.recurrenceDay]}`;
    }
    window.open(gcalUrl, '_blank');
  };

  const syncTaskToGoogle = (task: Task) => {
    const dateStr = format(date, 'yyyyMMdd');
    const title = encodeURIComponent(`${task.subject.toUpperCase()}`);
    const startTime = `${dateStr}T080000`;
    const endTime = `${dateStr}T090000`;

    const description = encodeURIComponent(
      `📌 Assunto: ${task.text}\n` +
      `⏱️ Tempo Planejado: ${localDayData.studyMinutes || 0} minutos\n` +
      `Organizado via Parthenon Planner`
    );

    let gcalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${description}&sf=true&output=xml`;
    
    if (task.isRecurring && task.recurrenceDay !== undefined) {
      gcalUrl += `&recur=RRULE:FREQ=WEEKLY;BYDAY=${GCAL_DAYS[task.recurrenceDay]}`;
    }
    window.open(gcalUrl, '_blank');
  };

  const toggleTask = (id: string, recurring: boolean) => {
    if (recurring) {
      setLocalRecurringTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    } else {
      setLocalDayData(prev => ({
        ...prev,
        tasks: (prev.tasks || []).map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      }));
    }
  };

  const adjustMinutes = (amount: number) => {
    setLocalDayData(prev => ({ ...prev, studyMinutes: Math.max(0, (prev.studyMinutes || 0) + amount) }));
  };

  const activeDayTasks = [...(localDayData.tasks || []), ...localRecurringTasks.filter(t => t.recurrenceDay === dailyWeekday)];
  const activeDayCommitments = [...(localDayData.commitments || []), ...localRecurringCommitments.filter(c => c.recurrenceDay === dailyWeekday)].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl md:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-400 dark:border-slate-700 relative">
        
        {/* Modal de Confirmação de Exclusão */}
        {itemToDelete && (
          <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-[60] flex items-center justify-center p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-6 max-w-xs">
              <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><RotateCcw size={40} /></div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">Remover Item?</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Essa atividade será excluída permanentemente do seu Parthenon.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => {
                   if (itemToDelete.type === 'task') {
                     if (itemToDelete.isRecurring) setLocalRecurringTasks(prev => prev.filter(t => t.id !== itemToDelete.id));
                     else setLocalDayData(prev => ({ ...prev, tasks: (prev.tasks || []).filter(t => t.id !== itemToDelete.id) }));
                   } else {
                     if (itemToDelete.isRecurring) setLocalRecurringCommitments(prev => prev.filter(c => c.id !== itemToDelete.id));
                     else setLocalDayData(prev => ({ ...prev, commitments: (prev.commitments || []).filter(c => c.id !== itemToDelete.id) }));
                   }
                   setItemToDelete(null);
                }} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-rose-700 active:scale-95 transition-all">Sim, Remover Agora</button>
                <button onClick={() => setItemToDelete(null)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-6 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div><h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white capitalize">{format(date, "d 'de' MMMM", { locale: ptBR })}</h3><p className="text-[10px] md:text-[11px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest">Painel de Atividades</p></div>
          <button onClick={onClose} className="p-2 md:p-3 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-rose-500 rounded-xl border border-slate-400 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 no-scrollbar">
          
          {/* Seção de Estudos */}
          <section className="space-y-4">
            <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest block flex items-center gap-2"><BookOpen size={14} className="text-athena-teal" /> Planejamento de Estudos</h4>
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                <select className="p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-black uppercase outline-none focus:border-amber-500" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
                <input type="text" className="flex-1 p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 dark:bg-slate-900 outline-none text-[11px] font-bold" placeholder="Assunto (ex: Trigonometria)..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} />
              </div>
              <div className="flex flex-col gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <button onClick={() => setIsRecurring(!isRecurring)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all border-2 ${isRecurring ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-400 border-slate-300'}`}><CalendarCheck size={14} /> Repetir Semanal</button>
                  <button onClick={addTask} className="px-6 py-2 bg-amber-500 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all">Planejar</button>
                </div>
                {isRecurring && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-1">
                    <p className="text-[8px] font-black uppercase text-slate-500 mb-2">Escolha o dia para repetir:</p>
                    <div className="flex gap-1">{WEEKDAYS_SHORT.map((label, dayIdx) => <button key={dayIdx} onClick={() => setSelectedRecurrenceDay(dayIdx)} className={`w-8 h-8 rounded-full text-[10px] font-black flex items-center justify-center transition-all border-2 ${selectedRecurrenceDay === dayIdx ? 'bg-athena-teal text-white border-athena-teal shadow-md scale-105' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200'}`}>{label}</button>)}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {activeDayTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-4 rounded-xl shadow-sm border-2 bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-800 transition-all hover:border-athena-teal/50">
                  <button onClick={() => toggleTask(task.id, !!task.isRecurring)} className={`transition-all hover:scale-110 ${task.completed ? 'text-emerald-600' : 'text-slate-400'}`}>{task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}</button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5"><span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 uppercase border border-indigo-300">{task.subject}</span>{task.isRecurring && <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase border border-amber-300 flex items-center gap-1"><RefreshCw size={8}/> {WEEKDAYS_SHORT[task.recurrenceDay || 0]}</span>}</div>
                    <span className={`text-[12px] font-bold truncate block ${task.completed ? 'text-slate-400 line-through' : 'text-slate-950 dark:text-slate-100'}`}>{task.text}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => syncTaskToGoogle(task)} className="p-2.5 bg-athena-teal/10 text-athena-teal rounded-lg hover:bg-athena-teal hover:text-white transition-all shadow-sm" title="Sincronizar com Google"><CalendarIcon size={16}/></button>
                    <button onClick={() => setItemToDelete({ id: task.id, type: 'task', isRecurring: !!task.isRecurring })} className="p-2.5 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Excluir Planejamento"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Seção de Compromissos e Avisos */}
          <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest block flex items-center gap-2"><Clock size={14} className="text-athena-coral" /> Compromissos e Avisos</h4>
            
            <div className="space-y-3 p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border-2 border-amber-200 dark:border-amber-900 shadow-sm">
               <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <input type="time" className="p-3 w-32 rounded-xl border-2 border-amber-300 dark:border-amber-900 bg-white dark:bg-slate-900 text-xs font-black outline-none focus:border-amber-500" value={newCommitmentTime} onChange={(e) => setNewCommitmentTime(e.target.value)} />
                    <input type="text" className="flex-1 p-3 rounded-xl border-2 border-amber-300 dark:border-amber-900 bg-white dark:bg-slate-900 outline-none text-[11px] font-bold" placeholder="Descrição do compromisso..." value={newCommitmentText} onChange={(e) => setNewCommitmentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCommitment()} />
                    <button onClick={addCommitment} className="p-3 bg-athena-coral text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={20} /></button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-amber-200 dark:border-amber-800">
                    <button onClick={() => setCommIsRecurring(!commIsRecurring)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all border-2 ${commIsRecurring ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 border-amber-200'}`}><CalendarCheck size={12} /> Repetir Semanal</button>
                    {commIsRecurring && (
                      <div className="flex gap-1">
                        {WEEKDAYS_SHORT.map((label, dayIdx) => (
                          <button key={dayIdx} onClick={() => setCommRecurrenceDay(dayIdx)} className={`w-7 h-7 rounded-full text-[9px] font-black flex items-center justify-center transition-all border-2 ${commRecurrenceDay === dayIdx ? 'bg-athena-coral text-white border-athena-coral shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200'}`}>{label}</button>
                        ))}
                      </div>
                    )}
                  </div>
               </div>
            </div>

            <div className="space-y-2">
              {activeDayCommitments.map((comm) => (
                <div key={comm.id} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 border-2 border-slate-300 dark:border-slate-800 shadow-sm transition-all hover:border-amber-500/50">
                  <div className="flex flex-col items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 p-2 rounded-lg min-w-[50px] shadow-inner">
                    <Clock size={12} className="mb-0.5" />
                    <span className="text-[10px] font-black leading-none">{comm.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-slate-950 dark:text-slate-100 truncate">{comm.text}</p>
                    <div className="flex gap-2 mt-1">
                      {comm.isRecurring && <span className="text-[7px] font-black text-athena-coral uppercase flex items-center gap-1"><RefreshCw size={8} /> Repete {WEEKDAYS_SHORT[comm.recurrenceDay || 0]}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => syncCommitmentToGoogle(comm)} className="p-2.5 bg-athena-teal/10 text-athena-teal rounded-lg hover:bg-athena-teal hover:text-white transition-all shadow-sm" title="Sincronizar com Google"><Share2 size={16} /></button>
                    <button onClick={() => setItemToDelete({ id: comm.id, type: 'commitment', isRecurring: !!comm.isRecurring })} className="p-2.5 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Excluir Compromisso"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex items-center justify-between bg-amber-500 p-5 md:p-7 rounded-2xl md:rounded-3xl text-slate-900 shadow-xl border-b-4 border-amber-600">
            <div><span className="block text-4xl md:text-6xl font-black leading-none tracking-tighter">{localDayData.studyMinutes || 0}</span><span className="text-[10px] md:text-[12px] font-black uppercase mt-1 block opacity-95 tracking-widest">Minutos de Estudo Totais</span></div>
            <div className="flex gap-2"><button onClick={() => adjustMinutes(-5)} className="p-2.5 bg-black/10 rounded-xl hover:bg-black/20 transition-all"><ChevronDown size={22} /></button><button onClick={() => adjustMinutes(5)} className="p-2.5 bg-white text-amber-600 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"><ChevronUp size={22} /></button></div>
          </section>
        </div>

        <div className="p-4 md:p-6 border-t border-slate-300 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <button onClick={onClose} className="px-5 py-2 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 hover:text-slate-950 transition-colors">Descartar</button>
          <button onClick={() => onSave(localDayData, localRecurringTasks, localRecurringCommitments)} className="px-8 py-3 bg-athena-teal text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg border-b-4 border-slate-900/20 hover:opacity-95 active:scale-95 transition-all">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
};
