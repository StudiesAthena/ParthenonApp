
import React, { useState } from 'react';
import { format, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  X, Trash2, CheckCircle2, Circle, Clock, ChevronUp, ChevronDown,
  RefreshCw, RotateCcw, BookOpen, Share2, Plus,
  Edit2, Check, CalendarDays
} from 'lucide-react';
import { DayData, Task, Commitment, Subject, CalendarData } from '../types';

interface DayDetailModalProps {
  date: Date;
  dayData: DayData;
  subjects: Subject[];
  onClose: () => void;
  recurringTasks: Task[];
  recurringCommitments: Commitment[];
  onSave: (dayData: DayData, recurringTasks: Task[], recurringCommitments: Commitment[], bulkUpdates?: { date: string, data: Partial<DayData> }[]) => void;
}

const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const GCAL_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  date,
  dayData,
  subjects,
  onClose,
  recurringTasks,
  recurringCommitments,
  onSave
}) => {
  const [localDayData, setLocalDayData] = useState<DayData>({
    ...dayData,
    tasks: Array.isArray(dayData.tasks) ? dayData.tasks : [],
    commitments: Array.isArray(dayData.commitments) ? dayData.commitments : []
  });
  const [localRecurringTasks, setLocalRecurringTasks] = useState<Task[]>(Array.isArray(recurringTasks) ? [...recurringTasks] : []);
  const [localRecurringCommitments, setLocalRecurringCommitments] = useState<Commitment[]>(Array.isArray(recurringCommitments) ? [...recurringCommitments] : []);
  
  // Track direct bulk additions to prevent async state lag
  const [pendingBulkActions, setPendingBulkActions] = useState<{ type: 'task' | 'commitment', item: any }[]>([]);

  // States for new items
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.name || '');
  const [taskRecType, setTaskRecType] = useState<'none' | 'weekly' | 'daily'>('none');
  const [selectedRecurrenceDay, setSelectedRecurrenceDay] = useState(date.getDay());

  const [newCommitmentText, setNewCommitmentText] = useState('');
  const [newCommitmentTime, setNewCommitmentTime] = useState('12:00');
  const [selectedCommSubject, setSelectedCommSubject] = useState<string>('');
  const [commRecType, setCommRecType] = useState<'none' | 'weekly' | 'daily'>('none');
  const [commRecurrenceDay, setCommRecurrenceDay] = useState(date.getDay());

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editTaskSubject, setEditTaskSubject] = useState('');

  const [editingCommId, setEditingCommId] = useState<string | null>(null);
  const [editCommText, setEditCommText] = useState('');
  const [editCommTime, setEditCommTime] = useState('');
  const [editCommSubject, setEditCommSubject] = useState('');

  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'task' | 'commitment', isRecurring?: boolean } | null>(null);

  const dailyWeekday = date.getDay();

  const handleSaveAll = () => {
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start: date, end });
    const bulkUpdates: { date: string, data: Partial<DayData> }[] = [];

    // Process daily repetitions for newly added items
    pendingBulkActions.forEach(action => {
      days.forEach(day => {
        if (isSameDay(day, date)) return; // Skip current (saved in localDayData)
        
        const dateKey = format(day, 'yyyy-MM-dd');
        const newItem = { ...action.item, id: Math.random().toString(36).substr(2, 9) };
        
        bulkUpdates.push({
          date: dateKey,
          data: action.type === 'task' ? { tasks: [newItem] } : { commitments: [newItem] }
        });
      });
    });

    onSave(localDayData, localRecurringTasks, localRecurringCommitments, bulkUpdates);
  };

  const addTask = () => {
    const text = newTaskText.trim();
    if (!text) return;

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text: text,
      completed: false,
      subject: selectedSubject,
      recurrenceType: taskRecType,
      isRecurring: taskRecType === 'weekly',
      recurrenceDay: taskRecType === 'weekly' ? selectedRecurrenceDay : undefined
    };

    if (taskRecType === 'weekly') {
      setLocalRecurringTasks(prev => [...prev, newTask]);
    } else if (taskRecType === 'daily') {
      setLocalDayData(prev => ({ ...prev, tasks: [...(prev.tasks || []), newTask] }));
      setPendingBulkActions(prev => [...prev, { type: 'task', item: newTask }]);
    } else {
      setLocalDayData(prev => ({ ...prev, tasks: [...(prev.tasks || []), newTask] }));
    }

    setNewTaskText('');
    setTaskRecType('none');
  };

  const addCommitment = () => {
    const text = newCommitmentText.trim();
    if (!text) return;

    const newComm: Commitment = {
      id: Math.random().toString(36).substr(2, 9),
      text: text,
      time: newCommitmentTime,
      subject: selectedCommSubject || undefined,
      recurrenceType: commRecType,
      isRecurring: commRecType === 'weekly',
      recurrenceDay: commRecType === 'weekly' ? commRecurrenceDay : undefined
    };

    if (commRecType === 'weekly') {
      setLocalRecurringCommitments(prev => [...prev, newComm].sort((a, b) => a.time.localeCompare(b.time)));
    } else if (commRecType === 'daily') {
      setLocalDayData(prev => ({ ...prev, commitments: [...(prev.commitments || []), newComm].sort((a, b) => a.time.localeCompare(b.time)) }));
      setPendingBulkActions(prev => [...prev, { type: 'commitment', item: newComm }]);
    } else {
      setLocalDayData(prev => ({ ...prev, commitments: [...(prev.commitments || []), newComm].sort((a, b) => a.time.localeCompare(b.time)) }));
    }

    setNewCommitmentText('');
    setCommRecType('none');
  };

  const startTaskEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskText(task.text);
    setEditTaskSubject(task.subject);
  };

  const saveTaskEdit = (id: string, recurring: boolean) => {
    if (!editTaskText.trim()) return;
    if (recurring) {
      setLocalRecurringTasks(prev => prev.map(t => t.id === id ? { ...t, text: editTaskText, subject: editTaskSubject } : t));
    } else {
      setLocalDayData(prev => ({
        ...prev,
        tasks: (prev.tasks || []).map(t => t.id === id ? { ...t, text: editTaskText, subject: editTaskSubject } : t)
      }));
    }
    setEditingTaskId(null);
  };

  const startCommEdit = (comm: Commitment) => {
    setEditingCommId(comm.id);
    setEditCommText(comm.text);
    setEditCommTime(comm.time);
    setEditCommSubject(comm.subject || '');
  };

  const saveCommEdit = (id: string, recurring: boolean) => {
    if (!editCommText.trim()) return;
    if (recurring) {
      setLocalRecurringCommitments(prev => prev.map(c => c.id === id ? { ...c, text: editCommText, time: editCommTime, subject: editCommSubject || undefined } : c).sort((a, b) => a.time.localeCompare(b.time)));
    } else {
      setLocalDayData(prev => ({
        ...prev,
        commitments: (prev.commitments || []).map(c => c.id === id ? { ...c, text: editCommText, time: editCommTime, subject: editCommSubject || undefined } : c).sort((a, b) => a.time.localeCompare(b.time))
      }));
    }
    setEditingCommId(null);
  };

  const syncToGoogle = (title: string, time: string, desc: string, isTask: boolean, isRec?: boolean, recDay?: number, recType?: 'none' | 'weekly' | 'daily') => {
    const dateStr = format(date, 'yyyyMMdd');
    const [h, m] = time.split(':');
    const startTime = `${dateStr}T${h}${m}00`;
    const eh = (parseInt(h) + 1).toString().padStart(2, '0');
    const endTime = `${dateStr}T${eh}${m}00`;

    let url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(desc)}&sf=true&output=xml`;
    
    if (isRec && recType) {
      if (recType === 'weekly' && recDay !== undefined) {
        url += `&recur=RRULE:FREQ=WEEKLY;BYDAY=${GCAL_DAYS[recDay]}`;
      } else if (recType === 'daily') {
        url += `&recur=RRULE:FREQ=DAILY`;
      }
    }
    window.open(url, '_blank');
  };

  const getSubjectColor = (name?: string) => {
    return subjects.find(s => s.name === name)?.color || '#94a3b8';
  };

  const activeDayTasks = [
    ...(localDayData.tasks || []),
    ...localRecurringTasks.filter(t => t.recurrenceDay === dailyWeekday)
  ];

  const activeDayCommitments = [
    ...(localDayData.commitments || []),
    ...localRecurringCommitments.filter(c => c.recurrenceDay === dailyWeekday)
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 landscape:p-0 bg-slate-900/90 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl md:rounded-[2.5rem] landscape:rounded-none landscape:h-[100dvh] landscape:max-w-none shadow-2xl flex flex-col max-h-[90vh] landscape:max-h-[100dvh] overflow-hidden border border-slate-400 dark:border-slate-700 relative">

        {itemToDelete && (
          <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-[60] flex items-center justify-center p-8">
            <div className="text-center space-y-6">
              <RotateCcw size={48} className="mx-auto text-rose-600 animate-spin-slow" />
              <h4 className="text-2xl font-black uppercase text-black dark:text-white">Remover Item?</h4>
              <p className="text-slate-500 dark:text-slate-400">Tem certeza que deseja remover este item?</p>
              <div className="flex gap-3">
                <button onClick={() => {
                  if (itemToDelete.type === 'task') {
                    if (itemToDelete.isRecurring) setLocalRecurringTasks(prev => prev.filter(t => t.id !== itemToDelete.id));
                    else setLocalDayData(prev => ({ ...prev, tasks: (prev.tasks || []).filter(t => t.id !== itemToDelete.id) }));
                  } else {
                    if (itemToDelete.isRecurring) setLocalRecurringCommitments(prev => prev.filter(c => c.id !== itemToDelete.id));
                    else setLocalDayData(prev => ({ ...prev, commitments: (prev.commitments || []).filter(c => c.id !== itemToDelete.id) }));
                  }
                  setItemToDelete(null);
                }} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-xs">Excluir</button>
                <button onClick={() => setItemToDelete(null)} className="flex-1 py-4 bg-slate-300 border border-slate-400 text-black rounded-xl font-black uppercase text-xs hover:bg-slate-400 transition-colors">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-6 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-black">{format(date, "d 'de' MMMM", { locale: ptBR })}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 landscape:p-3 space-y-8 landscape:space-y-4 no-scrollbar">

          {/* Seção Estudos */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-athena-teal tracking-widest flex items-center gap-2"><BookOpen size={14} /> Planejamento de Estudos</h4>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex gap-2">
                <select className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 text-[10px] font-black text-slate-950 dark:text-white" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                  {subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <input
                  type="text"
                  className="flex-1 min-w-0 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 text-xs font-bold text-slate-950 dark:text-white"
                  placeholder="Assunto do estudo..."
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                />
                <button onClick={addTask} className="shrink-0 p-2 bg-athena-teal text-white rounded-lg"><Plus size={20} /></button>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                   {[
                     { id: 'none', label: 'Não Repetir', icon: X },
                     { id: 'weekly', label: 'Semanal', icon: RefreshCw },
                     { id: 'daily', label: 'Todo dia (fim do mês)', icon: CalendarDays }
                   ].map(type => (
                     <button 
                       key={type.id} 
                       onClick={() => setTaskRecType(type.id as any)} 
                       className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border-2 transition-all ${taskRecType === type.id ? 'bg-athena-teal border-athena-teal text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}
                     >
                       <type.icon size={12}/> {type.label}
                     </button>
                   ))}
                </div>
                {taskRecType === 'weekly' && (
                  <div className="flex gap-1 items-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase mr-2">Dia:</span>
                    {WEEKDAYS_SHORT.map((l, i) => <button key={i} onClick={() => setSelectedRecurrenceDay(i)} className={`w-6 h-6 rounded-full text-[8px] font-black border transition-all ${selectedRecurrenceDay === i ? 'bg-amber-500 text-white border-amber-500 scale-110 shadow-md' : 'bg-white text-slate-400'}`}>{l}</button>)}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {activeDayTasks.map(task => (
                <div key={task.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3 group">
                  {editingTaskId === task.id ? (
                    <div className="flex-1 flex gap-2 items-center">
                      <select className="p-1 text-[8px] font-black uppercase rounded bg-white dark:bg-slate-700 border border-slate-300 text-slate-950 dark:text-white" value={editTaskSubject} onChange={e => setEditTaskSubject(e.target.value)}>
                        {subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                      <input type="text" className="flex-1 p-1 text-xs font-bold border-b border-athena-teal bg-white dark:bg-slate-800 text-slate-950 dark:text-white outline-none" value={editTaskText} onChange={e => setEditTaskText(e.target.value)} autoFocus />
                      <button onClick={() => saveTaskEdit(task.id, !!task.isRecurring)} className="p-1 text-emerald-600"><Check size={16} /></button>
                      <button onClick={() => setEditingTaskId(null)} className="p-1 text-rose-600"><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => {
                        if (task.isRecurring) setLocalRecurringTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                        else setLocalDayData(prev => ({ ...prev, tasks: (prev.tasks || []).map(t => t.id === task.id ? { ...t, completed: !t.completed } : t) }));
                      }} className={task.completed ? 'text-emerald-500' : 'text-slate-300'}>
                        {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className="text-[7px] font-black text-white px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: getSubjectColor(task.subject) }}>{task.subject}</span>
                        <p className={`text-xs font-bold truncate ${task.completed ? 'line-through text-slate-400' : ''}`}>{task.text}</p>
                        {task.isRecurring && <span className="text-[7px] font-black text-amber-600 uppercase flex items-center gap-1 mt-0.5"><RefreshCw size={8}/> Repete Semanalmente</span>}
                        {task.recurrenceType === 'daily' && <span className="text-[7px] font-black text-athena-teal uppercase flex items-center gap-1 mt-0.5"><CalendarDays size={8}/> Repetido diariamente</span>}
                      </div>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startTaskEdit(task)} className="text-slate-400 p-1 hover:text-athena-teal"><Edit2 size={14} /></button>
                        <button 
                          onClick={() => syncToGoogle(
                            `[${task.subject}] ${task.text}`, 
                            "09:00", 
                            `Planejamento de estudos Parthenon Planner: ${task.subject}`, 
                            true, 
                            task.recurrenceType === 'weekly' || task.recurrenceType === 'daily', 
                            task.recurrenceDay, 
                            task.recurrenceType
                          )} 
                          className="text-athena-teal p-1 hover:scale-110"
                        >
                          <Share2 size={14} />
                        </button>
                        <button onClick={() => setItemToDelete({ id: task.id, type: 'task', isRecurring: !!task.isRecurring })} className="text-rose-400 p-1 hover:text-rose-600"><Trash2 size={14} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Seção Compromissos */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-athena-coral tracking-widest flex items-center gap-2"><Clock size={14} /> Agenda de Compromissos</h4>
            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-800 space-y-4">
              <div className="flex items-center gap-2 overflow-hidden">
                <input type="time" className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 text-xs font-black text-slate-950 dark:text-white" value={newCommitmentTime} onChange={e => setNewCommitmentTime(e.target.value)} />
                <input type="text" className="flex-1 min-w-0 p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 text-xs font-bold text-slate-950 dark:text-white" placeholder="Descrição..." value={newCommitmentText} onChange={e => setNewCommitmentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCommitment()} />
                <button onClick={addCommitment} className="p-2 bg-athena-coral text-white rounded-lg flex-shrink-0"><Plus size={20} /></button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                   {[
                     { id: 'none', label: 'Não Repetir', icon: X },
                     { id: 'weekly', label: 'Semanal', icon: RefreshCw },
                     { id: 'daily', label: 'Todo dia (fim do mês)', icon: CalendarDays }
                   ].map(type => (
                     <button 
                       key={type.id} 
                       onClick={() => setCommRecType(type.id as any)} 
                       className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border-2 transition-all ${commRecType === type.id ? 'bg-athena-coral border-athena-coral text-white shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}
                     >
                       <type.icon size={12}/> {type.label}
                     </button>
                   ))}
                </div>
                {commRecType === 'weekly' && (
                  <div className="flex gap-1 items-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase mr-2">Dia:</span>
                    {WEEKDAYS_SHORT.map((l, i) => <button key={i} onClick={() => setCommRecurrenceDay(i)} className={`w-6 h-6 rounded-full text-[8px] font-black border transition-all ${commRecurrenceDay === i ? 'bg-athena-coral text-white border-athena-coral scale-110 shadow-md' : 'bg-white text-slate-400'}`}>{l}</button>)}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {activeDayCommitments.map(comm => (
                <div key={comm.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3 group">
                  {editingCommId === comm.id ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input type="time" className="p-1.5 text-[10px] font-black rounded border border-slate-300 bg-white dark:bg-slate-700 text-slate-950 dark:text-white focus:border-athena-coral outline-none" value={editCommTime} onChange={e => setEditCommTime(e.target.value)} />
                        <select className="p-1.5 text-[8px] font-black uppercase rounded bg-white dark:bg-slate-700 border border-slate-300 text-slate-950 dark:text-white focus:border-athena-coral outline-none" value={editCommSubject} onChange={e => setEditCommSubject(e.target.value)}>
                          <option value="">Sem Matéria</option>
                          {subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input type="text" className="flex-1 p-1.5 text-xs font-bold border-b-2 border-athena-coral bg-white dark:bg-slate-700 text-slate-950 dark:text-white outline-none" value={editCommText} onChange={e => setEditCommText(e.target.value)} />
                        <button onClick={() => saveCommEdit(comm.id, !!comm.isRecurring)} className="p-1 text-emerald-600"><Check size={18} /></button>
                        <button onClick={() => setEditingCommId(null)} className="p-1 text-rose-600"><X size={18} /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded shrink-0">{comm.time}</span>
                      <div className="flex-1 min-w-0">
                        {comm.subject && <span className="text-[7px] font-black text-white px-1.5 py-0.5 rounded uppercase block w-fit mb-0.5" style={{ backgroundColor: getSubjectColor(comm.subject) }}>{comm.subject}</span>}
                        <p className="text-xs font-bold truncate text-slate-950 dark:text-white">{comm.text}</p>
                        {comm.isRecurring && <span className="text-[7px] font-black text-athena-coral uppercase flex items-center gap-1 mt-0.5"><RefreshCw size={8}/> Repete Semanalmente</span>}
                        {comm.recurrenceType === 'daily' && <span className="text-[7px] font-black text-amber-600 uppercase flex items-center gap-1 mt-0.5"><CalendarDays size={8}/> Repetido diariamente</span>}
                      </div>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startCommEdit(comm)} className="text-slate-400 p-1 hover:text-athena-teal"><Edit2 size={14} /></button>
                        <button 
                          onClick={() => syncToGoogle(
                            comm.subject ? `[${comm.subject}] ${comm.text}` : comm.text, 
                            comm.time, 
                            `Agendado via Parthenon Planner: ${comm.subject || 'Geral'}`, 
                            false, 
                            comm.recurrenceType === 'weekly' || comm.recurrenceType === 'daily', 
                            comm.recurrenceDay, 
                            comm.recurrenceType
                          )} 
                          className="text-athena-teal p-1 hover:scale-110"
                        >
                          <Share2 size={14} />
                        </button>
                        <button onClick={() => setItemToDelete({ id: comm.id, type: 'commitment', isRecurring: !!comm.isRecurring })} className="text-rose-400 p-1 hover:text-rose-600"><Trash2 size={14} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Minutos Estudo */}
          <section className="bg-amber-500 p-6 rounded-3xl text-slate-950 flex justify-between items-center shadow-xl">
            <div><span className="text-4xl font-black">{localDayData.studyMinutes || 0}</span><p className="text-[10px] font-black uppercase">Minutos de Estudo</p></div>
            <div className="flex gap-2">
              <button onClick={() => setLocalDayData(p => ({ ...p, studyMinutes: Math.max(0, (p.studyMinutes || 0) - 5) }))} className="p-2 bg-black/10 rounded-xl hover:bg-black/20 transition-colors"><ChevronDown /></button>
              <button onClick={() => setLocalDayData(p => ({ ...p, studyMinutes: (p.studyMinutes || 0) + 5 }))} className="p-2 bg-white rounded-xl hover:bg-slate-100 transition-colors"><ChevronUp /></button>
            </div>
          </section>
        </div>

        <div className="p-4 md:p-6 border-t border-slate-300 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
         <button onClick={onClose} className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">Fechar</button>
          <button onClick={handleSaveAll} className="px-6 py-2 bg-athena-teal text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-athena-teal/90 active:scale-95 transition-all">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
};
