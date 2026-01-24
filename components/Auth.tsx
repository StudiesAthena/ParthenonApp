
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Bird, Mail, Lock, Loader2, ArrowRight, Sun, Moon, Info, AlertCircle, Send, Inbox, Plus, ArrowLeft } from 'lucide-react';

interface AuthProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onBackToLanding: () => void;
}

export const Auth: React.FC<AuthProps> = ({ theme, toggleTheme, onBackToLanding }) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string, title?: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email: email.toLowerCase().trim(), 
          password 
        });
        if (error) throw error;
        setMessage({ 
          type: 'success', 
          title: 'Verifique seu E-mail',
          text: `Enviamos um link de ativação para ${email.toLowerCase()}. Clique no link para liberar seu acesso ao Parthenon.` 
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: email.toLowerCase().trim(), 
          password 
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao processar autenticação.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Falha ao conectar com o Google.' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative transition-colors duration-300">
      
      {/* Botões de Navegação Superior */}
      <div className="fixed top-6 left-6 z-50">
        <button 
          onClick={onBackToLanding}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-2 border-slate-400 dark:border-slate-800 shadow-xl hover:text-athena-teal hover:scale-110 active:scale-95 transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest px-5"
          title="Voltar para a Landing Page"
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Voltar</span>
        </button>
      </div>

      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-300 border-2 border-slate-400 dark:border-slate-800 shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
          title="Alternar Tema"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-400 dark:border-slate-800 shadow-2xl p-8 md:p-12 animate-fade-in overflow-hidden relative">
          
          {message?.type === 'success' && (
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-athena-teal/5 rounded-full blur-3xl" />
          )}

          <div className="flex flex-col items-center mb-10 relative z-10">
            <div className="p-4 bg-athena-coral rounded-2xl text-white shadow-xl mb-6 transform hover:rotate-6 transition-transform">
              <Bird size={40} />
            </div>
            <h1 className="text-3xl font-black text-athena-teal dark:text-white uppercase tracking-tighter text-center leading-none">
              Parthenon<br/><span className="text-athena-coral">Planner</span>
            </h1>
          </div>

          {message?.type === 'success' ? (
            <div className="space-y-8 text-center animate-fade-in relative z-10">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-athena-teal/20 rounded-full animate-ping" />
                <div className="relative w-24 h-24 bg-athena-teal text-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-800">
                  <Mail size={40} className="animate-bounce" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tighter">{message.title}</h3>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                  {message.text}
                </p>
              </div>

              <button 
                onClick={() => { setIsSignUp(false); setMessage(null); }}
                className="w-full py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all text-[11px] flex items-center justify-center gap-2"
              >
                <ArrowRight size={16} className="rotate-180" /> Voltar para o Login
              </button>
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
              {/* Login Social */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 bg-white dark:bg-slate-800 text-slate-950 dark:text-white rounded-2xl font-black uppercase tracking-widest shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-slate-300 dark:border-slate-700 text-[10px]"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                    Entrar com Google
                  </>
                )}
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OU</span>
                <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-athena-teal transition-colors" />
                    <input
                      type="email"
                      placeholder="E-mail"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-athena-teal transition-all text-sm font-bold text-slate-950 dark:text-white shadow-inner"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-athena-teal transition-colors" />
                    <input
                      type="password"
                      placeholder="Senha"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-athena-teal transition-all text-sm font-bold text-slate-950 dark:text-white shadow-inner"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {message && (
                  <div className={`p-4 rounded-2xl text-[10px] font-black uppercase text-center border-2 flex items-center gap-3 animate-shake ${message.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900' : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900'}`}>
                    {message.type === 'error' ? <AlertCircle size={18} className="shrink-0" /> : <Info size={18} className="shrink-0" />}
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 text-sm
                    ${isSignUp 
                      ? 'bg-athena-teal text-white border-athena-teal/80 hover:bg-athena-teal/90' 
                      : 'bg-amber-500 text-slate-900 border-amber-600 hover:bg-amber-400'}`}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      {isSignUp ? 'Criar minha conta agora' : 'Entrar no Sistema'}
                      <Send size={18} />
                    </>
                  )}
                </button>

                <div className="mt-8 text-center border-t border-slate-200 dark:border-slate-800 pt-8">
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
                    className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 hover:text-athena-coral transition-all tracking-widest flex items-center justify-center gap-2 mx-auto"
                  >
                    {isSignUp ? (
                      <><Inbox size={14}/> Já possui conta? Entre por aqui</>
                    ) : (
                      <><Plus size={14}/> Novo por aqui? Crie sua conta</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        
        <p className="text-center mt-8 text-[10px] font-black uppercase text-slate-500 tracking-widest opacity-40">
          Athena Studies • Domine seu Futuro
        </p>
      </div>
    </div>
  );
};
