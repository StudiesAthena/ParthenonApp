
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  format, 
  eachDayOfInterval, 
  addDays,
  isSameWeek,
  isSameMonth,
  isSameYear
} from 'date-fns';
// Fix: Import parseISO and startOfDay directly to resolve export errors in the environment
import parseISO from 'date-fns/parseISO';
import startOfDay from 'date-fns/startOfDay';
import { ptBR } from 'date-fns/locale/pt-BR';
import { CalendarData, DayData } from '../types';
import { Clock, CalendarDays, Zap, TrendingUp } from 'lucide-react';

interface ReportsProps {
  calendar: CalendarData;
  subjects: string[];
}

export const Reports: React.FC<ReportsProps> = ({ calendar }) => {
  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const stats = useMemo(() => {
    const now = startOfDay(new Date());
    const metrics = {
      week: { total: 0, days: 0 },
      month: { total: 0, days: 0 },
      year: { total: 0, days: 0 },
      streak: 0,
    };

    // Filtramos e ordenamos as das que possuem estudo para o cálculo da sequência (streak)
    // Fix: cast Object.entries to explicitly typed array to avoid 'unknown' type error in studyMinutes access
    const studyDates = (Object.entries(calendar) as [string, DayData][])
      .filter(([_, data]) => (data.studyMinutes || 0) > 0)
      .map(([dateStr, data]) => ({
        date: parseISO(dateStr),
        mins: data.studyMinutes
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Cálculo das métricas por período (Semana, Mês, Ano)
    studyDates.forEach(({ date, mins }) => {
      // Semana começando na Segunda-feira (weekStartsOn: 1)
      if (isSameWeek(date, now, { weekStartsOn: 1 })) {
        metrics.week.total += mins;
        metrics.week.days += 1;
      }
      if (isSameMonth(date, now)) {
        metrics.month.total += mins;
        metrics.month.days += 1;
      }
      if (isSameYear(date, now)) {
        metrics.year.total += mins;
        metrics.year.days += 1;
      }
    });

    // Cálculo da sequência (streak)
    let currentStreak = 0;
    let maxStreak = 0;
    
    for (let i = 0; i < studyDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = startOfDay(studyDates[i - 1].date);
        const currDate = startOfDay(studyDates[i].date);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    }
    metrics.streak = maxStreak;

    return metrics;
  }, [calendar]);

  const last7Days = useMemo(() => {
    const end = new Date();
    const start = addDays(end, -6);
    return eachDayOfInterval({ start, end }).map(date => {
      const key = format(date, 'yyyy-MM-dd');
      return {
        name: format(date, 'EEE', { locale: ptBR }),
        minutos: calendar[key]?.studyMinutes || 0
      };
    });
  }, [calendar]);

  const MetricCard = ({ title, value, unit, icon: Icon, colorClass, textColor }: any) => (
    <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border-2 border-slate-500 dark:border-slate-800 shadow-md flex items-center gap-5">
      <div className={`p-3.5 rounded-2xl ${colorClass} text-white shadow-lg`}>
        <Icon size={26} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest">{title}</p>
        <p className={`text-xl md:text-2xl font-black ${textColor || 'text-slate-950 dark:text-white'}`}>
          {value} <span className="text-xs font-black text-slate-600">{unit}</span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Sequência Máxima" value={stats.streak} unit="dias" icon={Zap} colorClass="bg-amber-500" textColor="text-amber-600" />
        <MetricCard title="Total na Semana" value={formatDuration(stats.week.total)} unit="" icon={Clock} colorClass="bg-[#0E6E85]" textColor="text-[#0E6E85]" />
        <MetricCard title="Total no Mês" value={stats.month.days} unit="dias" icon={CalendarDays} colorClass="bg-emerald-600" textColor="text-emerald-700" />
        <MetricCard title="Média Diária (Mês)" value={stats.month.days ? Math.round(stats.month.total / stats.month.days) : 0} unit="min" icon={TrendingUp} colorClass="bg-[#FF7E67]" textColor="text-[#FF7E67]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 border-slate-500 dark:border-slate-800 shadow-md">
          <h3 className="text-[11px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
            <TrendingUp size={16} className="text-[#0E6E85]" /> Evolução (Últimos 7 dias)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: 800}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1.5rem', border: '2px solid #94a3b8', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                <Bar dataKey="minutos" fill="#F59E0B" radius={[12, 12, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border-2 border-slate-500 dark:border-slate-800 space-y-5 shadow-md">
          <h3 className="text-[11px] font-black text-slate-950 dark:text-slate-400 uppercase tracking-widest mb-4">Resumo Geral</h3>
          
          <div className="p-5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-400 dark:border-slate-700">
            <p className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Acumulado do Ano</p>
            <p className="text-xl font-black text-athena-teal dark:text-white mt-1">{formatDuration(stats.year.total)} <span className="text-xs font-bold text-slate-600">/ {stats.year.days} dias</span></p>
          </div>

          <div className="p-5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-400 dark:border-slate-700">
            <p className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Performance Mensal</p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{formatDuration(stats.month.total)} <span className="text-xs font-bold text-slate-600">/ {stats.month.days} dias</span></p>
          </div>

          <div className="p-5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-400 dark:border-slate-700">
            <p className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Ritmo da Semana</p>
            <p className="text-xl font-black text-[#FF7E67] dark:text-[#FF7E67] mt-1">{formatDuration(stats.week.total)} <span className="text-xs font-bold text-slate-600">/ {stats.week.days} dias</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
