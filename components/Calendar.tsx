
import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  endOfMonth, 
  endOfWeek, 
  isSameMonth, 
  addDays,
  eachDayOfInterval,
  isPast,
  isToday,
  addWeeks,
  isSameDay,
  isAfter,
  isBefore
} from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import parseISO from 'date-fns/parseISO';
import startOfDay from 'date-fns/startOfDay';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, LayoutGrid, List, 
  Calendar as CalIcon, MessageSquare, RefreshCw, 
  Clock, CheckCircle2, Circle, AlertCircle, BookOpen 
} from 'lucide-react';
import { CalendarData, ViewMode, DayData, Task, Commitment, Subject } from '../types';
import { DayDetailModal } from './DayDetailModal';

interface CalendarProps {
  data: CalendarData;
  subjects: Subject[];
  globalGoal: number;
  onUpdateDay: (dateKey: string, data: Partial<DayData>, recurringTasks?: Task[], recurringCommitments?: Commitment[]) => void;
  recurringTasks: Task[];
  recurringCommitments: Commitment[];
}

export const Calendar: React.FC<CalendarProps> = ({ data, subjects, globalGoal, onUpdateDay, recurringTasks, recurringCommitments }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const navigate = (direction: number) => {
    if (viewMode === 'month') {
      setCurrentDate(direction > 0 ? addMonths(currentDate, 1) : addMonths(currentDate, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(direction > 0 ? addWeeks(currentDate, 1) : addWeeks(currentDate, -1));
    } else if (viewMode === 'agenda') {
      const entries = (Object.entries(data) as [string, DayData][])
        .filter(([dateKey, dayData]) => {
          const weekday = parseISO(dateKey).getDay();
          const hasRecurringTask = (recurringTasks || []).some(t => t.recurrenceDay === weekday);
          const hasRecurringComm = (recurringCommitments || []).some(c => c.recurrenceDay === weekday);
          return (Array.isArray(dayData.commitments) && dayData.commitments.length > 0) || 
                 (Array.isArray(dayData.tasks) && dayData.tasks.length > 0) || 
                 hasRecurringTask || hasRecurringComm;
        })
        .map(([dateKey]) => parseISO(dateKey))
        .sort((a, b) => a.getTime() - b.getTime());

      if (entries.length === 0) return;
      const currentStart = startOfDay(currentDate);

      if (direction > 0) {
        const next = entries.find(d => isAfter(startOfDay(d), currentStart));
        if (next) setCurrentDate(next);
      } else {
        const prev = [...entries].reverse().find(d => isBefore(startOfDay(d), currentStart));
        if (prev) setCurrentDate(prev);
      }
    }
  };

  const getDayStatusColor = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const dayData = data[key];
    if (!dayData) return 'border-slate-400 dark:border-slate-800';
    if (dayData.studyMinutes >= globalGoal) return 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-50/10';
    if (isPast(date) && !isToday(date) && dayData.studyMinutes < globalGoal && dayData.studyMinutes > 0) return 'border-rose-600 bg-rose-50/40 dark:bg-rose-50/10';
    return 'border-slate-400 dark:border-slate-800';
  };

  const getSubjectColor = (name?: string) => {
    if (!name) return '#94a3b8';
    return subjects.find(s => s.name === name)?.color || '#94a3b8';
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border-2 border-slate-500 dark:border-slate-800 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-amber-500 hover:text-slate-900 transition-all border-2 border-slate-400 dark:border-slate-700 shadow-sm"><ChevronLeft size={20} /></button>
            <button onClick={() => navigate(1)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-amber-500 hover:text-slate-900 transition-all border-2 border-slate-400 dark:border-slate-700 shadow-sm"><ChevronRight size={20} /></button>
          </div>
          <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white capitalize tracking-tight">
            {viewMode === 'month' ? format(currentDate, 'MMMM yyyy', { locale: ptBR }) : viewMode === 'week' ? `Semana de ${format(startOfWeek(currentDate, { locale: ptBR }), 'd MMM', { locale: ptBR })}` : 'Minha Agenda'}
          </h3>
        </div>
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl w-full sm:w-auto border-2 border-slate-500 dark:border-slate-700 shadow-inner">
          {[{ id: 'month', icon: LayoutGrid, label: 'Mês' }, { id: 'week', icon: CalIcon, label: 'Semana' }, { id: 'agenda', icon: List, label: 'Agenda' }].map((mode) => (
            <button key={mode.id} onClick={() => { setViewMode(mode.id as any); if (mode.id === 'agenda') setCurrentDate(new Date()); }} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all ${viewMode === mode.id ? 'bg-white dark:bg-slate-700 text-amber-700 shadow-md border border-slate-500 dark:border-slate-600 scale-[1.02]' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}><mode.icon size={14} className="md:size-4" /> {mode.label}</button>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const days = eachDayOfInterval({ start: startDate, end: endOfWeek(endOfMonth(monthStart)) });

    return (
      <div className="w-full animate-fade-in overflow-hidden">
        <div className="grid grid-cols-7 mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
            <div key={idx} className="text-center text-[11px] font-black text-slate-950 dark:text-slate-500 uppercase py-2 tracking-widest">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = data[dateKey];
            const isCurrentMonth = isSameMonth(day, monthStart);
            const statusStyle = getDayStatusColor(day);
            const percent = globalGoal > 0 ? Math.min(100, ((dayData?.studyMinutes || 0) / globalGoal) * 100) : 0;
            const weekday = day.getDay();
            const hasRecurringTask = (recurringTasks || []).some(t => t.recurrenceDay === weekday);
            const hasRecurringComm = (recurringCommitments || []).some(c => c.recurrenceDay === weekday);

            return (
              <div key={day.toString()} onClick={() => setSelectedDate(day)} className={`min-h-[70px] md:min-h-[140px] p-2 md:p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col relative overflow-hidden shadow-md ${!isCurrentMonth ? 'bg-slate-200/40 text-slate-500 dark:text-slate-800 border-slate-400 dark:border-transparent opacity-60' : `bg-white dark:bg-slate-900 ${statusStyle}`} ${isToday(day) ? 'ring-4 ring-amber-500/20 !border-amber-600' : ''} hover:scale-[1.02] hover:shadow-xl z-10`}>
                <div className="flex justify-between items-start z-10">
                  <span className={`text-sm md:text-xl font-black ${isToday(day) ? 'text-amber-700' : 'text-slate-950 dark:text-slate-400'}`}>{format(day, 'd')}</span>
                  <div className="flex gap-1 items-center">
                    {(Array.isArray(dayData?.commitments) && dayData.commitments.some(c => c.isSyncedWithGoogle)) && <img src="https://www.google.com/favicon.ico" alt="GCal" className="w-3 h-3 md:w-4 md:h-4 opacity-80" />}
                    {((Array.isArray(dayData?.commitments) && dayData.commitments.length > 0) || hasRecurringComm) && <div className="w-2 h-2 rounded-full bg-athena-coral shadow-sm animate-pulse" />}
                    
                    <div className="flex -space-x-1">
                      {dayData?.tasks?.slice(0, 3).map((t, idx) => (
                        <div key={idx} className="w-2 h-2 rounded-full border border-white dark:border-slate-900" style={{ backgroundColor: getSubjectColor(t.subject) }} />
                      ))}
                      {(dayData?.tasks?.length || 0) > 3 && <div className="w-2 h-2 rounded-full bg-slate-300 flex items-center justify-center text-[5px] font-bold">+</div>}
                      {hasRecurringTask && !dayData?.tasks?.length && <div className="w-2 h-2 rounded-full bg-slate-400" />}
                    </div>
                  </div>
                </div>
                {isCurrentMonth && <div className="absolute bottom-0 left-0 w-full h-2 md:h-3 bg-slate-200 dark:bg-slate-800 z-0"><div className={`h-full transition-all duration-1000 shadow-inner ${percent === 100 ? 'bg-emerald-600' : 'bg-athena-coral'}`} style={{ width: `${percent}%` }} /></div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = eachDayOfInterval({ start: startOfWeek(currentDate, { locale: ptBR }), end: endOfWeek(currentDate, { locale: ptBR }) });
    return (
      <div className="w-full animate-fade-in grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayData = data[dateKey];
          const percent = globalGoal > 0 ? Math.min(100, ((dayData?.studyMinutes || 0) / globalGoal) * 100) : 0;
          const weekday = day.getDay();
          const hasRecurringTask = (recurringTasks || []).some(t => t.recurrenceDay === weekday);
          const hasRecurringComm = (recurringCommitments || []).some(c => c.recurrenceDay === weekday);

          return (
            <div key={dateKey} onClick={() => setSelectedDate(day)} className={`p-5 rounded-[2rem] border-2 bg-white dark:bg-slate-900 shadow-xl cursor-pointer transition-all hover:scale-105 relative ${isToday(day) ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-slate-500 dark:border-slate-800'}`}>
              <div className="text-center mb-4"><p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-widest">{format(day, 'EEE', { locale: ptBR })}</p><p className={`text-3xl font-black ${isToday(day) ? 'text-amber-600' : 'text-slate-950 dark:text-white'}`}>{format(day, 'd')}</p></div>
              <div className="space-y-3 min-h-[100px]">
                {((Array.isArray(dayData?.commitments) && dayData.commitments.length > 0) || hasRecurringComm) && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-900/50 rounded-xl flex items-center gap-2">
                    <MessageSquare size={12} className="text-amber-600 shrink-0" />
                    <p className="text-[9px] font-bold text-slate-800 dark:text-slate-300 truncate">{(dayData?.commitments?.length || 0) + (recurringCommitments || []).filter(c => c.recurrenceDay === weekday).length} Compromissos</p>
                  </div>
                )}
                {((Array.isArray(dayData?.tasks) && dayData.tasks.length > 0) || hasRecurringTask) && (
                  <div className="p-2 bg-athena-teal/5 dark:bg-athena-teal/10 border border-athena-teal/40 rounded-xl flex items-center gap-2">
                    <BookOpen size={12} className="text-athena-teal shrink-0" />
                    <p className="text-[9px] font-black text-athena-teal uppercase">{(dayData?.tasks?.length || 0) + (recurringTasks || []).filter(t => t.recurrenceDay === weekday).length} Estudos</p>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800"><div className="flex justify-between items-center mb-1"><span className="text-[8px] font-black text-slate-600 uppercase">Progresso</span><span className="text-[8px] font-black text-slate-950 dark:text-white">{Math.round(percent)}%</span></div><div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-athena-coral" style={{ width: `${percent}%` }} /></div></div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAgendaView = () => {
    const entries = (Object.entries(data) as [string, DayData][])
      .filter(([dateKey, dayData]) => {
          const weekday = parseISO(dateKey).getDay();
          const hasRecurringTask = (recurringTasks || []).some(t => t.recurrenceDay === weekday);
          const hasRecurringComm = (recurringCommitments || []).some(c => c.recurrenceDay === weekday);
          return (Array.isArray(dayData.commitments) && dayData.commitments.length > 0) || (Array.isArray(dayData.tasks) && dayData.tasks.length > 0) || hasRecurringTask || hasRecurringComm;
      })
      .sort((a, b) => a[0].localeCompare(b[0])); 

    if (entries.length === 0) return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-white/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-400 dark:border-slate-800">
        <List size={48} className="mb-4 opacity-20" /><p className="text-xs font-black uppercase tracking-[0.3em]">Nenhum compromisso agendado</p>
      </div>
    );

    const currentStart = startOfDay(currentDate);
    const visibleEntries = entries.filter(([dateKey]) => isSameDay(parseISO(dateKey), currentStart) || isAfter(parseISO(dateKey), currentStart)).slice(0, 5);

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {(visibleEntries.length > 0 ? visibleEntries : entries.slice(-1)).map(([dateKey, dayData]) => {
          const dayDate = parseISO(dateKey);
          const weekday = dayDate.getDay();
          const dailyRecurringTasks = (recurringTasks || []).filter(t => t.recurrenceDay === weekday);
          const dailyRecurringComms = (recurringCommitments || []).filter(c => c.recurrenceDay === weekday);
          
          const allTasks = [...(Array.isArray(dayData.tasks) ? dayData.tasks : []), ...dailyRecurringTasks];
          const allComms = [...(Array.isArray(dayData.commitments) ? dayData.commitments : []), ...dailyRecurringComms].sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div key={dateKey} onClick={() => setSelectedDate(dayDate)} className={`flex flex-col md:flex-row gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border-2 shadow-xl hover:border-amber-500 transition-all cursor-pointer group ${isToday(dayDate) ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-500 dark:border-slate-800'}`}>
              <div className="md:w-32 flex flex-col items-center justify-center border-b-2 md:border-b-0 md:border-r-2 border-slate-200 dark:border-slate-800 pb-4 md:pb-0 md:pr-6 shrink-0"><span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">{format(dayDate, 'EEE', { locale: ptBR })}</span><span className="text-4xl font-black text-slate-950 dark:text-white leading-none my-1">{format(dayDate, 'd')}</span><span className="text-[9px] font-black uppercase text-athena-teal tracking-tighter text-center">{format(dayDate, 'MMMM', { locale: ptBR })}</span></div>
              <div className="flex-1 space-y-6">
                {allComms.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2"><Clock size={14} /> Agenda de Compromissos</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {allComms.map((comm) => (
                        <div key={comm.id} className="p-4 bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 rounded-2xl shadow-sm flex items-center gap-3">
                           <div className="flex flex-col gap-1 items-center shrink-0">
                              <div className="font-black text-[10px] bg-amber-200 dark:bg-amber-900/50 px-2 py-1 rounded-md text-amber-900 dark:text-amber-100">
                                {comm.time}
                              </div>
                           </div>
                           <div className="min-w-0 flex-1">
                              {comm.subject && (
                                <span className="text-[7px] font-black px-1.5 py-0.5 rounded text-white uppercase block w-fit mb-1 shadow-sm" style={{ backgroundColor: getSubjectColor(comm.subject) }}>
                                  {comm.subject}
                                </span>
                              )}
                              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{comm.text}</p>
                           </div>
                           {comm.isRecurring && <RefreshCw size={10} className="text-athena-coral shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {allTasks.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase text-athena-teal tracking-widest flex items-center gap-2"><BookOpen size={14} /> Planejamento de Estudos</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allTasks.map((task, ti) => {
                        const subColor = getSubjectColor(task.subject);
                        return (
                          <div key={`${task.id}-${ti}`} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 rounded-xl">
                            <div className={task.completed ? 'text-emerald-500' : 'text-slate-400'}>{task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}</div>
                            <div className="min-w-0">
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded text-white uppercase block w-fit mb-0.5 shadow-sm" style={{ backgroundColor: subColor }}>{task.subject}</span>
                              <p className={`text-[11px] font-bold truncate ${task.completed ? 'text-slate-500 line-through' : 'text-slate-950 dark:text-white'}`}>{task.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderHeader()}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'agenda' && renderAgendaView()}
      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          dayData={data[format(selectedDate, 'yyyy-MM-dd')] || { commitments: [], tasks: [], studyMinutes: 0 }}
          subjects={subjects}
          onClose={() => setSelectedDate(null)}
          recurringTasks={recurringTasks || []}
          recurringCommitments={recurringCommitments || []}
          onSave={(updatedDay, updatedRecurringTasks, updatedRecurringComms) => {
            onUpdateDay(format(selectedDate, 'yyyy-MM-dd'), updatedDay, updatedRecurringTasks, updatedRecurringComms);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
};
