
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { FAQPage } from './components/FAQPage';
import { Dashboard } from './components/Dashboard';
import { AppState, DayData, Task, Commitment, Subject } from './types';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';
import { App as CapacitorApp } from '@capacitor/app';

const STORAGE_KEY = 'parthenon_state_v16';
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
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // view state removed
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
    CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      console.log('OAuth URL:', url); // Debug para Logcat

      // Tentar extrair do hash (#) - Padrão do Google
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        const params = new URLSearchParams(url.substring(hashIndex + 1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          console.log('Tokens found in hash');
          supabase.auth.setSession({ access_token, refresh_token });
          return;
        }
      }

      // Fallback: Tentar extrair da query (?) - Alguns providers
      const queryIndex = url.indexOf('?');
      if (queryIndex !== -1) {
        const params = new URLSearchParams(url.substring(queryIndex + 1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          console.log('Tokens found in query');
          supabase.auth.setSession({ access_token, refresh_token });
          return;
        }
      }

      console.log('No tokens found in URL');
    });
  }, []);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      // Pequeno delay para evitar flash
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user?.id) {
        await pullFromCloud(session.user.id);
        setIsInitialized(true);
      }
      setLoading(false);
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        pullFromCloud(session.user.id).then(() => setIsInitialized(true));
      } else {
        setState(DEFAULT_STATE);
        setIsInitialized(false);
      }
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-athena-teal"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/privacy-policy" element={<PrivacyPolicy theme={theme} toggleTheme={toggleTheme} />} />
      <Route path="/terms-of-service" element={<TermsOfService theme={theme} toggleTheme={toggleTheme} />} />
      <Route path="/faq" element={<FAQPage theme={theme} toggleTheme={toggleTheme} />} />
      <Route path="/" element={
        !session ? (
          showAuth ? (
            <Auth
              theme={theme}
              toggleTheme={toggleTheme}
              onBackToLanding={() => setShowAuth(false)}
            />
          ) : (
            <LandingPage
              onLoginClick={() => setShowAuth(true)}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          )
        ) : (
          <Dashboard
            session={session}
            state={state}
            setState={setState}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            theme={theme}
            toggleTheme={toggleTheme}
            showProfileModal={showProfileModal}
            setShowProfileModal={setShowProfileModal}
            tempName={tempName}
            setTempName={setTempName}
            syncing={syncing}
            lastSync={lastSync}
            pushToCloud={pushToCloud}
            handleSaveProfile={handleSaveProfile}
            updateGlobalGoal={updateGlobalGoal}
            updateCalendarDay={updateCalendarDay}
            notification={notification}
            showNotification={showNotification}
            logout={async () => { await supabase.auth.signOut(); }}
          />
        )
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
