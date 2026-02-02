
import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from './components/Calendar';
import { SideNotes } from './components/SideNotes';
import { SubjectManager } from './components/SubjectManager';
import { Reports } from './components/Reports';
import { ProgressTracker } from './components/ProgressTracker';
import { GroupManager } from './components/GroupManager';
import { Insights } from './components/Insights';
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { FAQPage } from './components/FAQPage';
import { AppState, DayData, CalendarData, Task, Commitment, Subject } from './types';
import { 
  BarChart3, LayoutDashboard, Target, Sun, Moon, 
  Palette, Bird, ChevronUp, ChevronDown, Database, 
  CloudUpload, LogOut, User, CheckCircle, WifiOff, Sparkles, Users,
  Share2, Edit2, X, Save, Loader2
} from 'lucide-react';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';
import { format } from 'date-fns';

const STORAGE_KEY = 'parthenon_state_v16';
const THEME_KEY = 'parthenon_theme_v16';

const PRESET_COLORS = [
  '#0E6E85', '#FF7E67', '#F9C80E', '#10B981', '#3B82F6', 
  '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E', '#F97316',
  '#84CC16', '#06B6D4', '#14B8A6', '#EC4899', '#71717A',
  '#78350F', '#1E3A8A', '#365314', '#581C87', '#451A03',
  '#FF0000', '#7F0000', '#FFABAB', '#00B404', '#F6D900' 
];

const DEFAULT_SUBJECTS: Subject[] = [
  { name: 'Português', color: '#0E6E85' },
  { name: 'Matemática', color: '#FF7E67' },
  { name: 'História', color: '#F9C80E' }
];

const DEFAULT_STATE: AppState = {
  calendar: {},
  subjects: DEFAULT_SUBJECTS,
  generalNotes: '',
  subjectProgress: [],
  recurringTasks: [],
  recurringCommitments: [],
  globalDailyGoal: 120,
  userEmail: '',
  userName: ''
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [view, setView] = useState<'main' | 'privacy' | 'terms' | 'faq'>('main');
  const [activeTab, setActiveTab] = useState<'calendar' | 'reports' | 'progress' | 'insights' | 'groups'>('calendar');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
  });

  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  const [tempName, setTempName] = useState('');
  const skipNextPush = useRef(false);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleFetchError = (err: any) => {
    if (err?.code === 'PGRST116') return;
    const isNetworkError = err?.message?.includes('fetch') || !navigator.onLine;
    setSyncError(isNetworkError ? 'Falha de conexão.' : (err?.message || 'Erro de sincronização.'));
  };

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user?.id) {
        await pullFromCloud(session.user.id);
        setIsInitialized(true);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) pullFromCloud(session.user.id).then(() => setIsInitialized(true));
      else { setState(DEFAULT_STATE); setIsInitialized(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !isInitialized) return;
    if (skipNextPush.current) { skipNextPush.current = false; return; }
    const timer = setTimeout(() => { pushToCloud(); }, 3000);
    return () => clearTimeout(timer);
  }, [state, session, isInitialized]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const pushToCloud = async () => {
    if (!session?.user?.id || !navigator.onLine) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const { error } = await supabase
        .from('user_states')
        .upsert({ 
          user_id: session.user.id,
          email: session.user.email?.toLowerCase().trim(), 
          data: state,
          full_name: state.userName || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }); // Conflito resolvido pela Unique Constraint no user_id
        
      if (error) throw error;
      setLastSync(new Date().toLocaleTimeString());
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setSyncing(false);
    }
  };

  const pullFromCloud = async (userId: string) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('user_states')
        .select('data, full_name')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        skipNextPush.current = true;
        setState({ ...data.data, userName: data.full_name || data.data.userName || '' });
        setTempName(data.full_name || data.data.userName || '');
        setLastSync(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setSyncing(false);
    }
  };

  const updateGlobalGoal = (newGoal: number) => {
    setState(prev => ({ ...prev, globalDailyGoal: Math.max(0, newGoal) }));
  };

  const handleSaveProfile = async () => {
    setState(prev => ({ ...prev, userName: tempName }));
    setShowProfileModal(false);
    showNotification('Perfil atualizado!', 'success');
  };

  const updateCalendarDay = (dateKey: string, dayData: Partial<DayData>, recurringTasks?: Task[], recurringCommitments?: Commitment[]) => {
    setState(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        [dateKey]: { ...(prev.calendar[dateKey] || { commitments: [], tasks: [], studyMinutes: 0 }), ...dayData }
      },
      recurringTasks: recurringTasks || prev.recurringTasks,
      recurringCommitments: recurringCommitments || prev.recurringCommitments
    }));
  };

  if (view !== 'main') {
    const BackBtn = ({ onClick }: { onClick: any }) => (
      <button onClick={onClick} className="fixed top-6 left-6 p-3 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-xl z-50"><X size={20}/></button>
    );
    if (view === 'privacy') return <><BackBtn onClick={() => setView('main')}/><PrivacyPolicy theme={theme} toggleTheme={toggleTheme} onBack={() => setView('main')}/></>;
    if (view === 'terms') return <><BackBtn onClick={() => setView('main')}/><TermsOfService theme={theme} toggleTheme={toggleTheme} onBack={() => setView('main')}/></>;
    if (view === 'faq') return <><BackBtn onClick={() => setView('main')}/><FAQPage theme={theme} toggleTheme={toggleTheme} onBack={() => setView('main')}/></>;
  }

  if (!session) {
    if (showAuth) return <Auth theme={theme} toggleTheme={toggleTheme} onBackToLanding={() => setShowAuth(false)} />;
    return <LandingPage onLoginClick={() => setShowAuth(true)} theme={theme} toggleTheme={toggleTheme} onPrivacyClick={() => setView('privacy')} onTermsClick={() => setView('terms')} onFAQClick={() => setView('faq')} />;
  }

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayData = state.calendar[todayKey];
  const progressPercent = state.globalDailyGoal ? Math.min(100, ((todayData?.studyMinutes || 0) / state.globalDailyGoal) * 100) : 0;

  const SidebarWidgets = () => (
    <div className="space-y-6">
      <section className="bg-slate-100 dark:bg-slate-800/40 p-4 rounded-2xl border-2 border-slate-500 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-athena-teal text-white flex items-center justify-center shadow-md"><User size={20} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-500 uppercase">Estudante</p>
            <p className="text-sm font-black truncate">{state.userName || 'Definir Nome'}</p>
          </div>
          <button onClick={() => setShowProfileModal(true)} className="p-2 text-slate-400 hover:text-athena-teal"><Edit2 size={16}/></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => pushToCloud()} disabled={syncing} className="py-2 bg-white dark:bg-slate-900 border border-slate-400 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1 hover:bg-slate-50 disabled:opacity-50">
            <CloudUpload size={12} className="text-amber-600" /> {syncing ? '...' : 'Salvar'}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="py-2 bg-rose-100 dark:bg-rose-900/20 border border-rose-400 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1 hover:bg-rose-200 text-rose-700">
            <LogOut size={12} /> Sair
          </button>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-400 dark:border-slate-700 flex items-center justify-center gap-2">
          <Database size={10} className={syncing ? 'animate-pulse text-amber-500' : 'text-slate-400'} />
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{lastSync ? `Salvo às ${lastSync}` : 'Sincronizado'}</span>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 border-amber-600 shadow-sm">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-900 dark:text-amber-500 mb-3 flex items-center gap-2"><Target size={14} /> Meta Diária</h2>
        <div className="flex items-center justify-between">
          <span className="text-3xl font-black">{state.globalDailyGoal}m</span>
          <div className="flex flex-col gap-1">
            <button onClick={() => updateGlobalGoal(state.globalDailyGoal + 5)} className="p-1.5 bg-amber-500 text-white rounded-md hover:scale-105 transition-all"><ChevronUp size={16}/></button>
            <button onClick={() => updateGlobalGoal(state.globalDailyGoal - 5)} className="p-1.5 bg-slate-300 dark:bg-slate-700 rounded-md hover:scale-105 transition-all"><ChevronDown size={16}/></button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Bloco de Notas</h2>
        <SideNotes value={state.generalNotes} onChange={(v) => setState(p => ({ ...p, generalNotes: v }))} />
      </section>

      <section>
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Matérias</h2>
        <SubjectManager subjects={state.subjects} onUpdate={(s) => setState(p => ({ ...p, subjects: s }))} />
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Modal Perfil */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border-2 border-athena-teal shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Meu Perfil</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-rose-500"><X size={24}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Nome Completo</label>
                <input type="text" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 font-bold outline-none focus:border-athena-teal" value={tempName} onChange={e => setTempName(e.target.value)} placeholder="Seu nome..." />
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-xs font-medium text-slate-500">E-mail: {session.user.email}</div>
            </div>
            <button onClick={handleSaveProfile} className="w-full py-4 bg-athena-teal text-white rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Salvar Perfil</button>
          </div>
        </div>
      )}

      {/* Sidebar Original */}
      <aside className="w-full md:w-64 lg:w-80 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-500 dark:border-slate-800 flex flex-col md:sticky top-0 md:h-screen z-30 shadow-xl overflow-y-auto no-scrollbar">
        <div className="p-6 border-b border-slate-500 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-athena-coral rounded-xl text-white shadow-lg"><Bird size={24} /></div>
            <h1 className="text-lg font-black tracking-tighter text-athena-teal dark:text-white uppercase leading-none">Parthenon<br/><span className="text-athena-coral text-xs">Planner</span></h1>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-400 dark:border-slate-700">{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}</button>
        </div>

        <nav className="p-4 flex flex-col gap-2">
          {[
            { id: 'calendar', label: 'Dashboard', icon: LayoutDashboard, color: '#F59E0B' },
            { id: 'reports', label: 'Relatórios', icon: BarChart3, color: '#059669' },
            { id: 'progress', label: 'Progresso', icon: Target, color: '#FF7E67' },
            { id: 'insights', label: 'Insights', icon: Sparkles, color: '#8B5CF6' },
            { id: 'groups', label: 'Turmas', icon: Users, color: '#0E6E85' }
          ].map((tab) => {
             const isActive = activeTab === tab.id;
             return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2
                  ${isActive ? 'text-white border-transparent shadow-lg scale-105' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-400 dark:border-slate-700 hover:bg-slate-50'}`}
                style={isActive ? { backgroundColor: tab.color } : {}}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
             );
          })}
        </nav>

        <div className="hidden md:block p-6 mt-auto">
          <SidebarWidgets />
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {activeTab === 'calendar' && (
            <div className="p-6 md:p-10 bg-white dark:bg-slate-900 border-2 border-slate-500 dark:border-slate-800 rounded-[2.5rem] shadow-2xl">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Foco & Disciplina</span>
                  <h2 className="text-2xl md:text-4xl font-black">Estudo Diário</h2>
                </div>
                <div className="text-right">
                  <span className="text-2xl md:text-4xl font-black text-athena-coral">{todayData?.studyMinutes || 0}m <span className="text-sm text-slate-500">/ {state.globalDailyGoal}m</span></span>
                  <p className="text-[10px] font-black uppercase text-slate-500 mt-1">{Math.round(progressPercent)}% da Meta</p>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-6 rounded-full border-2 border-slate-500 dark:border-slate-700 p-1 shadow-inner">
                <div className="bg-athena-coral h-full rounded-full transition-all duration-1000 shadow-md" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          <div className="animate-fade-in">
            {activeTab === 'calendar' && (
              <Calendar 
                data={state.calendar} 
                subjects={state.subjects}
                globalGoal={state.globalDailyGoal}
                onUpdateDay={updateCalendarDay}
                recurringTasks={state.recurringTasks}
                recurringCommitments={state.recurringCommitments}
              />
            )}
            {activeTab === 'reports' && <Reports calendar={state.calendar} subjects={state.subjects} />}
            {activeTab === 'progress' && <ProgressTracker progressList={state.subjectProgress} subjects={state.subjects} onUpdate={(l) => setState(p => ({ ...p, subjectProgress: l }))} />}
            {activeTab === 'insights' && <Insights calendarData={state.calendar} subjectProgress={state.subjectProgress} />}
            {activeTab === 'groups' && (
              <GroupManager 
                userEmail={session.user.email || ''} 
                userId={session.user.id} 
                userName={state.userName}
                onNotification={showNotification} 
              />
            )}
          </div>
        </div>
      </main>

      {/* Widgets Mobile */}
      <div className="md:hidden p-4 border-t border-slate-500 dark:border-slate-800 bg-white dark:bg-slate-900">
        <SidebarWidgets />
      </div>

      {notification && (
        <div className="fixed bottom-6 right-6 z-[300] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <CheckCircle size={18} /> {notification.message}
        </div>
      )}
    </div>
  );
};

export default App;
