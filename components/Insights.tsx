
import React, { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Brain, Zap, Sparkles, 
  AlertCircle, Trophy, Target, Clock, Calendar, CheckCircle2
} from 'lucide-react';
import { CalendarData, SubjectProgress, DayData } from '../types';
import { subDays, isAfter, startOfDay, parseISO, diffInDays } from 'date-fns';

interface InsightsProps {
  calendarData: CalendarData;
  subjectProgress: SubjectProgress[];
}

export const Insights: React.FC<InsightsProps> = ({ calendarData, subjectProgress }) => {
  const insights = useMemo(() => {
    const today = startOfDay(new Date());
    const last7DaysLimit = subDays(today, 7);
    const previous7DaysLimit = subDays(today, 14);

    let currentWeekMins = 0;
    let prevWeekMins = 0;
    const subjectCounts: Record<string, number> = {};
    let lastStudyDate: Date | null = null;

    (Object.entries(calendarData) as [string, DayData][]).forEach(([dateStr, day]) => {
      const date = parseISO(dateStr);
      const studyMins = day.studyMinutes || 0;

      if (studyMins > 0) {
        if (!lastStudyDate || date > lastStudyDate) {
          lastStudyDate = date;
        }
      }

      if (isAfter(date, last7DaysLimit)) {
        currentWeekMins += studyMins;
        day.tasks.forEach(t => {
          subjectCounts[t.subject] = (subjectCounts[t.subject] || 0) + 1;
        });
      } else if (isAfter(date, previous7DaysLimit)) {
        prevWeekMins += studyMins;
      }
    });

    const results = [];

    // Trend Insight
    if (prevWeekMins > 0) {
      const diff = ((currentWeekMins - prevWeekMins) / prevWeekMins) * 100;
      if (diff > 5) {
        results.push({
          title: "Impulso Acadêmico",
          icon: TrendingUp,
          text: `Seu ritmo de estudos cresceu ${Math.round(diff)}% esta semana. Continue assim!`,
          color: "bg-emerald-500",
          lightColor: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-200"
        });
      } else if (diff < -15) {
        results.push({
          title: "Alerta de Queda",
          icon: TrendingDown,
          text: `Houve uma queda de ${Math.abs(Math.round(diff))}% no seu volume de estudos. O que houve?`,
          color: "bg-rose-500",
          lightColor: "bg-rose-50 dark:bg-rose-950/20 border-rose-400 dark:border-rose-200"
        });
      }
    }

    // Subject Focus Insight
    const sortedSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]);
    if (sortedSubjects.length > 0) {
      const top = sortedSubjects[0];
      if (top[1] > 3) {
        results.push({
          title: "Especialista em Foco",
          icon: Brain,
          text: `Você está focando bastante em ${top[0]}. Não esqueça de revisar outras áreas.`,
          color: "bg-athena-teal",
          lightColor: "bg-cyan-50 dark:bg-cyan-950/20 border-cyan-400 dark:border-cyan-200"
        });
      }
    }

    // Inactivity Alert
    if (lastStudyDate) {
        const gap = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
        if (gap >= 2) {
            results.push({
                title: "Estamos com Saudade",
                icon: AlertCircle,
                text: `Faz ${gap} dias que não registramos estudos. Vamos retomar hoje com 15 minutos?`,
                color: "bg-amber-500",
                lightColor: "bg-amber-50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-200"
            });
        }
    } else {
        results.push({
            title: "Comece sua Jornada",
            icon: Sparkles,
            text: "Ainda não detectamos estudos. Que tal planejar sua primeira matéria agora?",
            color: "bg-indigo-500",
            lightColor: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-400 dark:border-indigo-200"
        });
    }

    // Progress Completion
    const completed = subjectProgress.filter(p => p.status === 'Concluída').length;
    if (completed > 0) {
      results.push({
        title: "Pequenas Vitórias",
        icon: Trophy,
        text: `Você já finalizou ${completed} tópicos do seu plano de longo prazo. Parabéns!`,
        color: "bg-athena-coral",
        lightColor: "bg-orange-50 dark:bg-orange-950/20 border-orange-400 dark:border-orange-200"
      });
    }

    return results;
  }, [calendarData, subjectProgress]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-400 dark:border-slate-800 shadow-xl">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-950 dark:text-white tracking-tighter flex items-center gap-4">
            <Sparkles className="text-athena-gold" size={36} /> Central de Insights
          </h2>
          <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-500 tracking-[0.2em] mt-2">Inteligência de Dados Parthenon</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, idx) => (
          <div key={idx} className={`p-8 rounded-[2.5rem] border-2 shadow-lg transition-all hover:scale-[1.02] relative overflow-hidden flex flex-col gap-4 ${insight.lightColor}`}>
            <div className="flex items-center gap-4 relative z-10">
              <div className={`p-3 rounded-2xl text-white shadow-xl ${insight.color}`}>
                <insight.icon size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">{insight.title}</h3>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-300 leading-relaxed relative z-10">
              {insight.text}
            </p>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <insight.icon size={120} />
            </div>
          </div>
        ))}
      </div>

      {/* Estatísticas Rápidas de Resumo */}
      <div className="bg-slate-100 dark:bg-slate-800/40 p-10 rounded-[3rem] border-2 border-slate-400 dark:border-slate-700 shadow-inner grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-md text-athena-teal border border-slate-300">
                <Target size={24}/>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-500 mb-1">Total de Tópicos</p>
            <p className="text-3xl font-black text-slate-950 dark:text-white">{subjectProgress.length}</p>
        </div>
        <div className="text-center border-y md:border-y-0 md:border-x border-slate-400 dark:border-slate-700 py-6 md:py-0">
            <div className="mx-auto w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-md text-athena-coral border border-slate-300">
                <CheckCircle2 size={24}/>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-500 mb-1">Concluídos</p>
            <p className="text-3xl font-black text-slate-950 dark:text-white">{subjectProgress.filter(p => p.status === 'Concluída').length}</p>
        </div>
        <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-md text-amber-500 border border-slate-300">
                <Clock size={24}/>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-500 mb-1">Em Andamento</p>
            <p className="text-3xl font-black text-slate-950 dark:text-white">{subjectProgress.filter(p => p.status === 'Em andamento').length}</p>
        </div>
      </div>
    </div>
  );
};
