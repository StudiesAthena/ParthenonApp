
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bird, Mail, Lock, Loader2, ArrowRight, Sun, Moon } from 'lucide-react';

const SUPABASE_URL = 'https://wajmeqsfcgruhuxasuux.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CvIBWIOhrKX3kGNKNwzlFg_7fUZzOUk';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface AuthProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Auth: React.FC<AuthProps> = ({ theme, toggleTheme }) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Conta criada! Verifique seu e-mail para confirmar.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao processar autenticação.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative transition-colors duration-300">
      
      {/* Botão de Tema - Posicionamento fixo para evitar cortes em qualquer resolução */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-800 shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
          title="Alternar Tema"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-300 dark:border-slate-800 shadow-2xl p-8 md:p-12 animate-fade-in">
          <div className="flex flex-col items-center mb-10">
            <div className="p-4 bg-athena-coral rounded-2xl text-white shadow-xl mb-6">
              <Bird size={40} />
            </div>
            <h1 className="text-3xl font-black text-athena-teal dark:text-white uppercase tracking-tighter text-center leading-none">
              Parthenon<br/><span className="text-athena-coral">Planner</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-5 text-center leading-relaxed w-full">
              Seu organizador de estudos personalizado
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-4 text-slate-400" />
              <input
                type="email"
                placeholder="Seu e-mail"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-athena-teal transition-all text-sm font-bold text-slate-950 dark:text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-4 text-slate-400" />
              <input
                type="password"
                placeholder="Sua senha"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-athena-teal transition-all text-sm font-bold text-slate-950 dark:text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-xs font-black uppercase text-center border-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-amber-500 text-slate-900 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-amber-600 text-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {isSignUp ? 'Criar Minha Conta' : 'Entrar no Sistema'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center border-t border-slate-200 dark:border-slate-800 pt-8">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 hover:text-athena-coral transition-colors tracking-widest"
            >
              {isSignUp ? 'Já possui uma conta? Acesse aqui' : 'Não tem conta? Registre-se agora'}
            </button>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] font-black uppercase text-slate-400 tracking-widest opacity-60">
          Parthenon • Disciplina é Liberdade
        </p>
      </div>
    </div>
  );
};
