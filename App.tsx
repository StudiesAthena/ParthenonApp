
import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from './components/Calendar';
import { SideNotes } from './components/SideNotes';
import { SubjectManager } from './components/SubjectManager';
import { Reports } from './components/Reports';
import { ProgressTracker } from './components/ProgressTracker';
import { GroupManager } from './components/GroupManager';
import { Auth } from './components/Auth';
import { AppState, DayData, CalendarData, Task } from './types';
import { 
  BarChart3, LayoutDashboard, Target, Sun, Moon, 
  Palette, Bird, ChevronUp, ChevronDown, Database, 
  CloudUpload, LogOut, User, AlertCircle, Users, CheckCircle, WifiOff, RefreshCw
} from 'lucide-react';
import { createClient, Session } from '@supabase/supabase-js';
import { format } from 'date-fns';

const SUPABASE_URL = 'https://wajmeqsfcgruhuxasuux.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CvIBWIOhrKX3kGNKNwzlFg_7fUZzOUk';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STORAGE_KEY = 'parthenon_state_v13';
const THEME_KEY = 'parthenon_theme_v13';

const DEFAULT_SUBJECTS = ['Português', 'Matemática', 'História', 'Geografia', 'Biologia', 'Física', 'Química', 'Inglês'];

const DEFAULT_STATE: AppState = {
  calendar: {},
  subjects: DEFAULT_SUBJECTS,
  generalNotes: '',
  subjectProgress: [],
  recurringTasks: [],
  globalDailyGoal: 120,
  userEmail: ''
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'reports' | 'progress' | 'groups'>('calendar');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
  });

  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  const skipNextPush = useRef(false);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleFetchError = (err: any) => {
    const isNetworkError = err?.message?.includes('fetch') || !navigator.onLine;
    const msg = isNetworkError 
      ? 'Falha de conexão: Verifique sua internet.' 
      : (err?.message || 'Erro ao sincronizar dados.');
    setSyncError(msg);
    if (isNetworkError) {
      showNotification(msg, 'info');
    } else {
      showNotification(msg, 'error');
    }
    console.error('Fetch Error:', err);
  };

  useEffect(() => {
    const handleAuth = async (currentSession: Session | null) => {
      setSession(currentSession);
      if (currentSession?.user?.email) {
        const email = String(currentSession.user.email);
        setState(prev => ({ ...prev, userEmail: email }));
        await pullFromCloud(email);
        setIsInitialized(true);
      } else {
        setState(DEFAULT_STATE);
        setIsInitialized(false);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => handleAuth(session))
      .catch(err => {
        handleFetchError(err);
        setIsInitialized(true);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuth(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !isInitialized) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    const timer = setTimeout(() => {
      pushToCloud();
    }, 3000);
    return () => clearTimeout(timer);
  }, [state, session, isInitialized]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const pushToCloud = async () => {
    if (!session?.user?.email) return;
    if (!navigator.onLine) {
        setSyncError('Você está offline. Salvaremos assim que voltar.');
        return;
    }
    setSyncing(true);
    setSyncError(null);
    try {
      const { error } = await supabase
        .from('user_states')
        .upsert({ 
          email: session.user.email.toLowerCase().trim(), 
          data: state,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });

      if (error) throw error;
      setLastSync(new Date().toLocaleTimeString());
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setSyncing(false);
    }
  };

  const pullFromCloud = async (userEmail: string) => {
    setSyncing(true);
    setSyncError(null);
    try {
      const { data, error } = await supabase
        .from('user_states')
        .select('data')
        .eq('email', userEmail.toLowerCase().trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') return; 
        throw error;
      }

      if (data?.data) {
        const cloudData = data.data;
        const cleanCalendar: CalendarData = {};
        if (cloudData.calendar && typeof cloudData.calendar === 'object') {
          Object.keys(cloudData.calendar).forEach(dateKey => {
            const rawDay = cloudData.calendar[dateKey];
            cleanCalendar[dateKey] = {
              commitments: typeof rawDay.commitments === 'string' ? rawDay.commitments : '',
              studyMinutes: typeof rawDay.studyMinutes === 'number' ? rawDay.studyMinutes : 0,
              tasks: Array.isArray(rawDay.tasks) ? rawDay.tasks.map((t: any) => ({
                id: String(t.id || Math.random()),
                text: typeof t.text === 'string' ? t.text : '',
                completed: !!t.completed,
                subject: typeof t.subject === 'string' ? t.subject : 'Geral',
                isRecurring: !!t.isRecurring,
                recurrenceDay: t.recurrenceDay
              })) : []
            };
          });
        }

        const hydratedState: AppState = {
          calendar: cleanCalendar,
          subjects: Array.isArray(cloudData.subjects) ? cloudData.subjects.map((s: any) => String(s)) : DEFAULT_SUBJECTS,
          generalNotes: typeof cloudData.generalNotes === 'string' ? cloudData.generalNotes : '',
          subjectProgress: Array.isArray(cloudData.subjectProgress) ? cloudData.subjectProgress : [],
          recurringTasks: Array.isArray(cloudData.recurringTasks) ? cloudData.recurringTasks : [],
          globalDailyGoal: typeof cloudData.globalDailyGoal === 'number' ? cloudData.globalDailyGoal : 120,
          userEmail: String(userEmail)
        };
        
        skipNextPush.current = true;
        setState(hydratedState);
        setLastSync(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    setSyncing(true);
    try {
        await pushToCloud();
    } catch (e) {}
    await supabase.auth.signOut();
  };

  const updateGlobalGoal = (newGoal: number) => {
    setState(prev => ({ ...prev, globalDailyGoal: Math.max(0, newGoal) }));
  };

  const updateCalendarDay = (dateKey: string, data: Partial<DayData>) => {
    setState(prev => {
      const existingDay = prev.calendar[dateKey] || { commitments: '', tasks: [], studyMinutes: 0 };
      return {
        ...prev,
        calendar: {
          ...prev.calendar,
          [dateKey]: {
            ...existingDay,
            ...data,
            commitments: typeof data.commitments !== 'undefined' ? String(data.commitments) : existingDay.commitments
          }
        }
      };
    });
  };

  if (!session) {
    return <Auth theme={theme} toggleTheme={toggleTheme} />;
  }

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayData = state.calendar[todayKey];
  const progressPercent = state.globalDailyGoal 
    ? Math.min(100, ((todayData?.studyMinutes || 0) / state.globalDailyGoal) * 100) 
    : 0;

  const SidebarWidgets = () => (
    <div className="space-y-6 md:space-y-8 p-3 md:p-0 bg-white dark:bg-slate-900 md:bg-transparent">
      <section className="bg-slate-100 dark:bg-slate-800/40 p-4 rounded-2xl border-2 border-slate-400 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-900 flex items-center justify-center">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest">Estudante Logado</p>
            <p className="text-[10px] font-bold text-slate-950 dark:text-white truncate">{String(session.user.email || '')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
           <button 
            onClick={() => pushToCloud()}
            disabled={syncing}
            className="py-2.5 bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-700 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1 hover:bg-slate-100 transition-all text-slate-800 dark:text-slate-300 disabled:opacity-50"
          >
            <CloudUpload size={12} className="text-amber-600" /> {syncing ? '...' : 'Salvar'}
          </button>
          <button 
            onClick={handleLogout}
            className="py-2.5 bg-rose-100 dark:bg-rose-900/20 border border-rose-300 dark:border-rose-900/50 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1 hover:bg-rose-200 transition-all text-rose-700 dark:text-rose-400"
          >
            <LogOut size={12} /> Sair
          </button>
        </div>

        {syncError && (
          <div className="flex flex-col gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-900/40">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <WifiOff size={14} className="shrink-0" />
              <span className="text-[8px] font-black uppercase tracking-tight">{String(syncError)}</span>
            </div>
            <button onClick={() => pullFromCloud(session.user.email!)} className="text-[7px] font-black uppercase text-rose-800 dark:text-rose-300 underline text-left flex items-center gap-1">
                <RefreshCw size={8} /> Tentar novamente
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-300 dark:border-slate-700">
          <Database size={10} className={syncing ? 'animate-pulse text-amber-500' : 'text-slate-400'} />
          <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {syncing ? 'Sincronizando...' : (lastSync ? `Salvo às ${lastSync}` : 'Sincronizado')}
          </span>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 border-amber-600/40 shadow-sm">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-900 dark:text-amber-500 mb-3 flex items-center gap-2">
          <Target size={14} /> Meta Diária Parthenon
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-3xl font-black text-slate-950 dark:text-white leading-none">{state.globalDailyGoal}m</span>
          <div className="flex flex-col gap-1">
            <button onClick={() => updateGlobalGoal(state.globalDailyGoal + 5)} className="p-1.5 bg-amber-500 text-slate-900 rounded-md hover:scale-105 active:scale-95 transition-all shadow-md"><ChevronUp size={16}/></button>
            <button onClick={() => updateGlobalGoal(state.globalDailyGoal - 5)} className="p-1.5 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white rounded-md hover:scale-105 active:scale-95 transition-all border border-slate-400 dark:border-slate-600"><ChevronDown size={16}/></button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-950 dark:text-slate-400 mb-2">Bloco de Notas</h2>
        <SideNotes 
          value={String(state.generalNotes || '')} 
          onChange={(v) => setState(p => ({ ...p, generalNotes: String(v) }))} 
        />
      </section>

      <section>
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-950 dark:text-slate-400 mb-2 flex items-center gap-2">
          <Palette size={14} className="text-athena-coral" /> Matérias Ativas
        </h2>
        <SubjectManager subjects={state.subjects || []} onUpdate={(s) => setState(p => ({ ...p, subjects: s }))} />
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 text-slate-950 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300 pointer-events-none">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border-2 font-black uppercase text-[10px] tracking-widest
            ${notification.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 
              notification.type === 'error' ? 'bg-rose-600 text-white border-rose-400' :
              'bg-athena-teal text-white border-athena-teal/50'}`}>
            <CheckCircle size={18} />
            {notification.message}
          </div>
        </div>
      )}

      <aside className="w-full md:w-64 lg:w-80 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-400 dark:border-slate-800 flex flex-col md:sticky top-0 md:h-screen z-30 shadow-xl overflow-y-auto no-scrollbar">
        <div className="p-4 md:p-8 border-b border-slate-400 dark:border-slate-800 flex items-center justify-between bg-slate-100 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-athena-coral rounded-xl text-white shadow-lg flex items-center justify-center">
              <Bird size={24} />
            </div>
            <h1 className="text-lg font-black tracking-tighter text-athena-teal dark:text-white uppercase leading-none">Parthenon<br/><span className="text-athena-coral text-sm">Planner</span></h1>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-300 border-2 border-slate-400 dark:border-slate-700 shadow-sm transition-colors">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <nav className="p-2 md:p-6 grid grid-cols-2 md:flex md:flex-col gap-1.5 md:gap-2">
          {[
            { id: 'calendar', label: 'Dashboard', icon: LayoutDashboard, color: '#F59E0B' },
            { id: 'reports', label: 'Relatórios', icon: BarChart3, color: '#059669' },
            { id: 'progress', label: 'Progresso', icon: Target, color: '#FF7E67' },
            { id: 'groups', label: 'Turmas', icon: Users, color: '#0E6E85' }
          ].map((tab) => {
             const isActive = activeTab === tab.id;
             return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-center md:justify-start gap-1.5 md:gap-3 px-1.5 md:px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-sm font-black uppercase tracking-widest transition-all shadow-md border-2
                  ${isActive 
                    ? `text-white border-transparent shadow-lg scale-[1.02] md:scale-105` 
                    : 'bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-400 border-slate-400 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                style={isActive ? { backgroundColor: tab.color } : {}}
              >
                <tab.icon size={14} className="md:size-6" /> <span className="truncate">{tab.label}</span>
              </button>
             );
          })}
        </nav>

        <div className="hidden md:block flex-1 p-8 space-y-10">
          <SidebarWidgets />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'calendar' && (
              <div className="mb-6 p-5 md:p-10 bg-white dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-800 rounded-3xl md:rounded-[3rem] shadow-2xl">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <span className="text-[11px] md:text-xs font-black text-slate-800 dark:text-slate-400 uppercase tracking-[0.2em] mb-1 block">Foco & Disciplina</span>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-950 dark:text-white">Relatório Diário</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-xl md:text-3xl font-black text-amber-700 dark:text-athena-coral">
                      {todayData?.studyMinutes || 0} <span className="text-base text-slate-600 font-bold">/ {state.globalDailyGoal}m</span>
                    </span>
                    <p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-400 mt-1">{Math.round(progressPercent)}% da Meta</p>
                  </div>
                </div>
                <div className="w-full bg-slate-300 dark:bg-slate-800 h-6 md:h-10 rounded-2xl md:rounded-[2rem] border-2 border-slate-400 dark:border-slate-700 shadow-inner p-1">
                  <div className="bg-athena-coral h-full rounded-xl md:rounded-[1.5rem] transition-all duration-1000 shadow-lg relative overflow-hidden" style={{ width: `${progressPercent}%` }}>
                    <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}

            {!isInitialized && session && (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Database size={48} className="text-amber-500 mb-4" />
                <p className="font-black uppercase tracking-widest text-slate-600 text-center">Conectando ao Parthenon...<br/><span className="text-[10px] opacity-60">Sincronizando seus dados</span></p>
              </div>
            )}

            <div className={`animate-fade-in ${!isInitialized ? 'opacity-0' : 'opacity-100'}`}>
              {activeTab === 'calendar' && (
                <Calendar 
                  data={state.calendar || {}} 
                  subjects={state.subjects || []}
                  globalGoal={state.globalDailyGoal || 0}
                  onUpdateDay={updateCalendarDay}
                />
              )}
              {activeTab === 'reports' && <Reports calendar={state.calendar || {}} subjects={state.subjects || []} />}
              {activeTab === 'progress' && <ProgressTracker progressList={state.subjectProgress || []} subjects={state.subjects || []} onUpdate={(l) => setState(p => ({ ...p, subjectProgress: l }))} />}
              {activeTab === 'groups' && <GroupManager userEmail={String(session.user.email || '')} onNotification={showNotification} />}
            </div>
          </div>
        </main>

        <div className="md:hidden border-t-2 border-slate-400 dark:border-slate-800 bg-white dark:bg-slate-900 pb-20">
          <SidebarWidgets />
        </div>
      </div>
    </div>
  );
};

export default App;
