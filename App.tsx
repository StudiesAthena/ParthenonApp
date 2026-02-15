
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
  Share2, Edit2, X, Save, Loader2, Key, Lock
} from 'lucide-react';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';
import { App as CapacitorApp } from '@capacitor/app';
import { format } from 'date-fns';

const THEME_KEY = 'parthenon_theme_v16';

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
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
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

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

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
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        const params = new URLSearchParams(url.substring(hashIndex + 1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          supabase.auth.setSession({ access_token, refresh_token });
          return;
        }
      }
    });
  }, []);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setShowResetModal(true);
      }
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
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setLastSync(new Date().toISOString());
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
        // Merge with DEFAULT_STATE to ensure new fields (like recurringCommitments) are present even in old records
        const mergedData = {
          ...DEFAULT_STATE,
          ...data.data,
          userName: data.full_name || data.data.userName || ''
        };
        setState(mergedData);
        setTempName(mergedData.userName);
        setLastSync(new Date().toISOString());
      }
    } catch (err: any) {
      handleFetchError(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      showNotification('Mínimo 8 caracteres.', 'error');
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setShowResetModal(false);
      setNewPassword('');
      showNotification('Senha atualizada!', 'success');
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setResetLoading(false);
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

  const updateCalendarDay = (
    dateKey: string, 
    dayData: Partial<DayData>, 
    recurringTasks?: Task[], 
    recurringCommitments?: Commitment[],
    bulkUpdates?: { date: string, data: Partial<DayData> }[]
  ) => {
    setState(prev => {
      const newCalendar = { ...prev.calendar };
      
      // Atualização do dia principal
      newCalendar[dateKey] = { 
        ...(prev.calendar[dateKey] || { commitments: [], tasks: [], studyMinutes: 0 }), 
        ...dayData 
      };

      // Processamento de atualizações em massa (para repetição diária)
      if (bulkUpdates && bulkUpdates.length > 0) {
        bulkUpdates.forEach(update => {
          const currentDay = newCalendar[update.date] || { commitments: [], tasks: [], studyMinutes: 0 };
          
          if (update.data.tasks) {
            currentDay.tasks = [...(currentDay.tasks || []), ...update.data.tasks];
          }
          if (update.data.commitments) {
            currentDay.commitments = [...(currentDay.commitments || []), ...update.data.commitments];
          }
          
          newCalendar[update.date] = currentDay;
        });
      }

      return {
        ...prev,
        calendar: newCalendar,
        recurringTasks: recurringTasks !== undefined ? recurringTasks : prev.recurringTasks,
        recurringCommitments: recurringCommitments !== undefined ? recurringCommitments : prev.recurringCommitments
      };
    });
  };

  if (currentPath === '/privacidade') {
    return <PrivacyPolicy theme={theme} toggleTheme={toggleTheme} onBack={() => navigate('/')} />;
  }
  if (currentPath === '/termos') {
    return <TermsOfService theme={theme} toggleTheme={toggleTheme} onBack={() => navigate('/')} />;
  }
  if (currentPath === '/faq') {
    return <FAQPage theme={theme} toggleTheme={toggleTheme} onBack={() => navigate('/')} />;
  }

  if (!session) {
    if (showAuth) return <Auth theme={theme} toggleTheme={toggleTheme} onBackToLanding={() => setShowAuth(false)} />;
    return (
      <LandingPage 
        onLoginClick={() => setShowAuth(true)} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onPrivacyClick={() => navigate('/privacidade')} 
        onTermsClick={() => navigate('/termos')} 
        onFAQClick={() => navigate('/faq')} 
      />
    );
  }

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayData = state.calendar[todayKey];
  const progressPercent = state.globalDailyGoal ? Math.min(100, ((todayData?.studyMinutes || 0) / state.globalDailyGoal) * 100) : 0;

  const renderSidebarWidgets = () => (
    <div className="space-y-6">
      <section className="bg-slate-100 dark:bg-slate-800/40 p-4 rounded-2xl border-2 border-slate-500 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-athena-teal text-white flex items-center justify-center shadow-md"><User size={20} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-500 uppercase">Estudante</p>
            <p className="text-sm font-black truncate">{state.userName || 'Definir Nome'}</p>
          </div>
          <button onClick={() => setShowProfileModal(true)} className="p-2 text-slate-400 hover:text-athena-teal"><Edit2 size={16} /></button>
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
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{lastSync ? `Salvo às ${format(new Date(lastSync), 'HH:mm:ss')}` : 'Sincronizado'}</span>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 border-amber-600 shadow-sm">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-900 dark:text-amber-500 mb-3 flex items-center gap-2"><Target size={14} /> Meta Diária</h2>
        <div className="flex items-center justify-between">
          <span className="text-xl sm:text-2xl md:text-3xl font-black">{state.globalDailyGoal}m</span>
          <div className="flex flex-col gap-1">
            <button onClick={() => updateGlobalGoal(state.globalDailyGoal + 5)} className="p-1.5 bg-amber-500 text-white rounded-md hover:scale-105 transition-all"><ChevronUp size={16} /></button>
            <button onClick={() => updateGlobalGoal(state.globalDailyGoal - 5)} className="p-1.5 bg-slate-300 dark:bg-slate-700 rounded-md hover:scale-105 transition-all"><ChevronDown size={16} /></button>
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
    <div className="app-safe-area min-h-screen bg-slate-200 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">

      {showResetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border-2 border-amber-500 shadow-2xl space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Key size={32}/></div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Nova Senha</h3>
              <p className="text-xs font-bold text-slate-500 mt-2">Crie sua nova senha de acesso.</p>
            </div>
            <div className="space-y-4">
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-athena-teal transition-colors" />
                <input
                  type="password"
                  placeholder="Nova Senha (mín. 8 chars)"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-2xl outline-none focus:border-athena-teal transition-all text-sm font-bold text-slate-950 dark:text-white"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <button 
              onClick={handleUpdatePassword} 
              disabled={resetLoading}
              className="w-full py-5 bg-athena-teal text-white rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {resetLoading ? <Loader2 className="animate-spin" /> : 'Atualizar Senha'}
            </button>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 border-2 border-athena-teal shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Meu Perfil</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-rose-500"><X size={24} /></button>
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

      <aside className="w-full md:w-64 lg:w-80 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-500 dark:border-slate-800 flex flex-col md:sticky top-0 md:h-[100dvh] z-30 shadow-xl overflow-y-auto no-scrollbar">
        <div className="p-6 border-b border-slate-500 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-athena-coral rounded-xl text-white shadow-lg"><Bird size={24} /></div>
            <h1 className="text-lg font-black tracking-tighter text-athena-teal dark:text-white uppercase leading-none">Parthenon<br /><span className="text-athena-coral text-xs">Planner</span></h1>
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
          {renderSidebarWidgets()}
        </div>
      </aside>

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

      <div className="md:hidden p-4 border-t border-slate-500 dark:border-slate-800 bg-white dark:bg-slate-900">
        {renderSidebarWidgets()}
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
