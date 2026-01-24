
import React, { useState } from 'react';
import { 
  Bird, LayoutDashboard, Target, Users, Sparkles, 
  BarChart3, CheckCircle2, ArrowRight, BookOpen, 
  ShieldCheck, Smartphone, Zap, Database, Clock,
  ChevronDown, HelpCircle, Star, CreditCard,
  Award, Crown, Sun, Moon, X, CalendarCheck, Tag, Lock
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
  onFAQClick: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onLoginClick, 
  onPrivacyClick, 
  onTermsClick,
  onFAQClick,
  theme, 
  toggleTheme 
}) => {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const pricingPlans = [
    {
      name: "Free Trial",
      price: "Grátis",
      period: "POR TEMPO LIMITADO",
      desc: "Acesso completo por tempo limitado.",
      badge: null,
      features: [
        { text: "Calendário e agenda estratégica ilimitados", positive: true },
        { text: "Integração entre estudantes e professores", positive: true },
        { text: "Estatísticas de estudo em tempo real, com insights e relatórios", positive: true },
        { text: "Gestão de projetos e compromissos", positive: true },
        { text: "Sincronização em nuvem", positive: true },
        { text: "Acesso por tempo limitado", positive: false },
      ],
      cta: "Acessar Agora",
      highlight: false,
      status: "active"
    },
    {
      name: "Plano Mensal",
      price: "R$ 29,90",
      period: "(EM BREVE)",
      desc: "Flexível e completo.",
      badge: null,
      features: [
        { text: "Acesso completo ao Parthenon Planner", positive: true },
        { text: "Até 50% de desconto no Study Planner Personalizado e no Study Planner Essencial", positive: true },
        { text: "20% de desconto em Aulas Particulares e Listas de Exercícios", positive: true },
      ],
      cta: "Em breve",
      highlight: false,
      status: "soon"
    },
    {
      name: "Plano Semestral",
      price: "R$ 149,90",
      period: "(EM BREVE)",
      desc: "Evolução consistente.",
      badge: "MAIS POPULAR",
      features: [
        { text: "Acesso completo ao Parthenon Planner", positive: true },
        { text: "2 Study Planners Personalizados gratuitos ao longo do período", positive: true },
        { text: "50% de desconto em Study Planners Essenciais", positive: true },
        { text: "50% de desconto em Aulas Particulares e Listas de Exercícios", positive: true },
        { text: "Melhor custo mensal em relação ao plano mensal", positive: true },
      ],
      cta: "Em breve",
      highlight: true,
      status: "soon"
    },
    {
      name: "Plano Anual",
      price: "R$ 399,90",
      period: "(EM BREVE)",
      desc: "Ecossistema completo.",
      badge: "MÁXIMA PERFORMANCE",
      features: [
        { text: "Acesso completo ao Parthenon Planner", positive: true },
        { text: "Até 8 Study Planners Personalizados gratuitos ao longo do período", positive: true },
        { text: "50% de desconto em Study Planners Essenciais", positive: true },
        { text: "1 aula particular gratuita por mês (acumulável)", positive: true },
        { text: "50% de desconto em aulas particulares adicionais", positive: true },
        { text: "1 lista de exercícios gratuita por mês (até 10 questões)", positive: true },
        { text: "50% de desconto em listas de exercícios adicionais", positive: true },
        { text: "Melhor custo-benefício do Parthenon", positive: true },
      ],
      cta: "Em breve",
      highlight: false,
      status: "soon"
    }
  ];

  const featureItems = [
    { 
      icon: LayoutDashboard, 
      title: "Agenda Estratégica", 
      desc: "Organize matérias, tempo dedicado e compromissos em um calendário interativo e funcional.",
      iconColor: "text-emerald-700 dark:text-emerald-400", 
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40", 
      hoverBg: "group-hover:bg-emerald-600" 
    },
    { 
      icon: BarChart3, 
      title: "Relatórios de Performance", 
      desc: "Acompanhe sua sequência de estudos, tempo total e evolução semanal com gráficos precisos.",
      iconColor: "text-athena-coral", 
      iconBg: "bg-athena-coral/20", 
      hoverBg: "group-hover:bg-athena-coral" 
    },
    { 
      icon: Sparkles, 
      title: "Insights Inteligentes", 
      desc: "Receba notificações sobre seu ritmo de estudo e alertas de foco para nunca perder a constância.",
      iconColor: "text-athena-teal", 
      iconBg: "bg-athena-teal/20", 
      hoverBg: "group-hover:bg-athena-teal" 
    },
    { 
      icon: Users, 
      title: "Turmas Colaborativas", 
      desc: "Integre-se com professores e grupos para receber materiais, slides e tarefas diretamente no seu painel.",
      iconColor: "text-athena-gold", 
      iconBg: "bg-athena-gold/20", 
      hoverBg: "group-hover:bg-athena-gold" 
    },
    { 
      icon: Smartphone, 
      title: "Mobilidade Sem Limites", 
      desc: "Acesse sua jornada em qualquer dispositivo com sincronização total e integração direta com o Google Calendar para compromissos e sessões de estudo.",
      iconColor: "text-purple-700 dark:text-purple-400", 
      iconBg: "bg-purple-100 dark:bg-purple-900/40", 
      hoverBg: "group-hover:bg-purple-600" 
    },
    { 
      icon: Award, 
      title: "Conexão Athena", 
      desc: "Compatibilidade total com os serviços da Athena Studies. Integre seus Study Planners Personalizados, mentorias e listas de exercícios para um suporte pedagógico de elite.",
      iconColor: "text-blue-700 dark:text-blue-400", 
      iconBg: "bg-blue-100 dark:bg-blue-900/40", 
      hoverBg: "group-hover:bg-blue-700" 
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-athena-coral selection:text-white scroll-smooth transition-colors duration-300">
      
      {/* Navigation Header */}
      <header className="fixed top-0 w-full z-[100] backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="h-16 md:h-20 flex items-center justify-between">
            <button 
              onClick={(e) => scrollToSection(e as any, 'top')}
              className="flex items-center gap-2 group"
            >
              <div className="p-1.5 md:p-2 bg-athena-coral rounded-lg md:rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform">
                <Bird size={20} className="md:size-6" />
              </div>
              <h1 className="text-lg md:text-xl font-black tracking-tighter text-athena-teal dark:text-white uppercase leading-none">
                Parthenon<span className="text-athena-coral">.</span>
              </h1>
            </button>
            
            <nav className="hidden lg:flex items-center gap-10">
              <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 hover:text-athena-coral tracking-widest transition-colors">Funcionalidades</a>
              <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 hover:text-athena-coral tracking-widest transition-colors">Planos</a>
              <button onClick={onFAQClick} className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 hover:text-athena-coral tracking-widest transition-colors">PERGUNTAS FREQUENTES</button>
            </nav>

            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm hover:scale-110 active:scale-95 transition-all"
                title="Trocar Tema"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <button 
                onClick={onLoginClick}
                className="px-4 md:px-8 py-2 md:py-3 bg-athena-teal text-white rounded-lg md:rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-athena-teal/90 active:scale-95 transition-all flex items-center gap-2 border-b-4 border-slate-900/20"
              >
                Login <ArrowRight size={12} className="hidden md:inline" />
              </button>
            </div>
          </div>

          <nav className="lg:hidden flex items-center justify-center gap-6 py-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="whitespace-nowrap text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Funcionalidades</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="whitespace-nowrap text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Planos</a>
            <button onClick={onFAQClick} className="whitespace-nowrap text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">FAQ</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 md:pt-48 pb-20 px-6 text-center">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-athena-coral/20 text-athena-coral rounded-full border border-athena-coral/40 animate-fade-in">
            <Sparkles size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Roadmap para a Aprovação • 2026</span>
          </div>
          
          <h2 className="text-4xl md:text-7xl font-black leading-[1.1] tracking-tighter text-slate-950 dark:text-white">
            <span className="text-athena-coral">Mais que organização.</span> <span className="text-athena-teal">Um ecossistema de estudos.</span>
          </h2>
          
          <p className="text-lg md:text-xl font-bold text-slate-700 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            O Parthenon Planner é o ecossistema definitivo para organizar sua jornada de estudos e alcançar sua melhor performance em busca dos seus objetivos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
            <button 
              onClick={onLoginClick}
              className="w-full sm:w-auto px-12 py-5 bg-amber-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-3 text-sm border-b-4 border-amber-600"
            >
              COMEÇAR AGORA <Zap size={20} />
            </button>
            <a 
              href="#features" 
              onClick={(e) => scrollToSection(e, 'features')}
              className="w-full sm:w-auto px-12 py-5 bg-white dark:bg-slate-900 text-slate-950 dark:text-white rounded-2xl font-black uppercase tracking-widest shadow-xl border-2 border-slate-400 dark:border-slate-800 hover:bg-slate-50 transition-all text-sm"
            >
              Conhecer Recursos
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 scroll-mt-24 bg-slate-50 dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h3 className="text-[11px] font-black text-athena-teal uppercase tracking-[0.4em]">Arquitetura de Sucesso</h3>
            <h2 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tighter">Tudo o que você precisa em <br/>um só ecossistema.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureItems.map((feature, i) => (
              <div key={i} className="group p-10 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-[2.5rem] hover:border-athena-coral hover:shadow-2xl transition-all duration-300 shadow-md">
                <div className={`w-16 h-16 ${feature.iconBg} ${feature.iconColor} rounded-2xl flex items-center justify-center mb-8 ${feature.hoverBg} group-hover:text-white transition-all duration-300 border border-slate-200 dark:border-slate-700`}>
                  <feature.icon size={32} />
                </div>
                <h4 className="text-xl font-black text-slate-950 dark:text-white mb-4 uppercase tracking-tighter">{feature.title}</h4>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Collaboration & Groups */}
      <section className="py-24 px-6 bg-slate-950 text-white overflow-hidden relative rounded-[3rem] mx-4 md:mx-10 mb-20 shadow-2xl border border-slate-800">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <Users size={800} className="absolute -right-40 -top-40 text-athena-teal" />
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center relative z-10 p-4 md:p-10">
          <div className="space-y-8">
            <h3 className="text-amber-500 text-[11px] font-black uppercase tracking-[0.4em]">Estudo em Rede</h3>
            <h2 className="text-5xl font-black tracking-tighter leading-none">O fim do caos nos grupos de estudo.</h2>
            <p className="text-xl text-slate-300 font-bold leading-relaxed">
              Receba listas de exercícios, slides de aula e recados importantes em um ambiente focado. O Parthenon cria uma ponte direta entre orientadores e estudantes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-6 mt-12">
                <div className="p-10 bg-slate-900 border-2 border-slate-800 rounded-3xl space-y-4 shadow-xl">
                  <BookOpen className="text-athena-coral" size={32} />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300">Conteúdos</p>
                </div>
                <div className="p-10 bg-athena-teal border-2 border-athena-teal/50 rounded-3xl space-y-4 shadow-2xl">
                  <Database className="text-white" size={32} />
                  <p className="text-xs font-black uppercase tracking-widest text-white/90">Arquivos</p>
                </div>
             </div>
             <div className="space-y-6">
                <div className="p-10 bg-amber-500 text-slate-950 rounded-3xl space-y-4 shadow-2xl border-2 border-amber-600">
                  <Zap size={32} />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-950/70">Agilidade</p>
                </div>
                <div className="p-10 bg-slate-900 border-2 border-slate-800 rounded-3xl space-y-4 shadow-xl">
                  <Clock className="text-emerald-500" size={32} />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300">Constância</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-slate-100 dark:bg-slate-900/40 scroll-mt-24">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h3 className="text-[11px] font-black text-athena-coral uppercase tracking-[0.4em]">Planos de Carreira</h3>
            <h2 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tighter">Escolha seu nível de domínio.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
            {pricingPlans.map((plan, i) => (
              <div 
                key={i} 
                className={`flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-2 transition-all relative overflow-hidden group h-full
                ${plan.highlight ? 'border-athena-coral ring-4 ring-athena-coral/10 scale-105 z-10' : 'border-slate-300 dark:border-slate-800 opacity-95 hover:opacity-100 hover:border-athena-coral/40'}`}
              >
                {plan.badge && (
                  <div className={`absolute top-0 right-0 left-0 text-white py-1.5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-center shadow-md border-b border-athena-coral/50 ${plan.highlight ? 'bg-gradient-to-r from-athena-coral to-rose-600' : 'bg-athena-coral'}`}>
                    {plan.badge}
                  </div>
                )}
                
                <div className={`${plan.badge ? 'mt-8' : ''} mb-6`}>
                  <h4 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tighter mb-1">{plan.name}</h4>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight">{plan.desc}</p>
                </div>

                <div className="mb-8 relative group/price">
                  <div className={`flex items-baseline gap-1 transition-all duration-300 ${plan.status === 'soon' ? 'blur-md select-none' : ''}`}>
                    <span className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tighter">{plan.price}</span>
                  </div>
                  
                  {plan.status === 'soon' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="bg-slate-950 dark:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-slate-700 shadow-2xl -rotate-2 flex items-center gap-2 whitespace-nowrap">
                        <Lock size={12} className="text-amber-500" /> EM BREVE
                      </div>
                    </div>
                  )}
                  
                  <p className="text-[10px] font-black text-athena-coral uppercase tracking-widest mt-2">{plan.period}</p>
                </div>

                <ul className="space-y-4 mb-12 flex-1">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3 text-[12px] font-bold text-slate-800 dark:text-slate-300">
                      {feature.positive ? (
                        <CheckCircle2 size={18} className={`shrink-0 ${plan.status === 'active' ? 'text-athena-coral' : 'text-slate-400'}`} />
                      ) : (
                        <X size={18} className="shrink-0 text-rose-500" />
                      )}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={plan.status === 'active' ? onLoginClick : undefined}
                  disabled={plan.status === 'soon'}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg transition-all flex items-center justify-center gap-2
                    ${plan.status === 'active' 
                      ? 'bg-athena-teal text-white hover:bg-rose-600 active:scale-95 border-b-4 border-slate-900/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed border-2 border-slate-300 dark:border-slate-700'}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <button 
            onClick={(e) => scrollToSection(e as any, 'top')}
            className="flex items-center gap-3 group"
          >
            <div className="p-2 bg-athena-coral rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform">
              <Bird size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-athena-teal dark:text-white uppercase">Parthenon</h1>
          </button>
          
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
            <button 
              onClick={onTermsClick}
              className="text-[13px] md:text-sm font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest hover:text-athena-teal transition-colors"
            >
              Termos de Serviço
            </button>
            <button 
              onClick={onPrivacyClick}
              className="text-[13px] md:text-sm font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest hover:text-athena-teal transition-colors"
            >
              Privacidade
            </button>
            <button 
              onClick={onFAQClick}
              className="text-[13px] md:text-sm font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest hover:text-athena-teal transition-colors"
            >
              PERGUNTAS FREQUENTES
            </button>
          </div>

          <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest">© 2026 • DOMINE O SEU FUTURO</p>
        </div>
      </footer>
    </div>
  );
};
