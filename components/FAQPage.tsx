
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, Bird, Sun, Moon, Search, HelpCircle, Sparkles } from 'lucide-react';

interface FAQPageProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const FAQPage: React.FC<FAQPageProps> = ({ theme, toggleTheme }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    { q: "O que é o Parthenon Planner?", a: "O Parthenon é um ecossistema digital de organização de estudos que integra agenda, calendário, estatísticas, projetos e colaboração entre estudantes e professores." },
    { q: "O Parthenon Planner é gratuito?", a: "Sim. O aplicativo pode ser utilizado gratuitamente por tempo limitado no plano Free Trial, com acesso completo às funcionalidades." },
    { q: "O que muda entre o Free Trial e os planos pagos?", a: "O Free Trial permite experimentar todo o ecossistema por tempo limitado. Os planos pagos garantem acesso contínuo e oferecem vantagens exclusivas nos serviços da Athena Studies." },
    { q: "O aplicativo tem alguma funcionalidade bloqueada nos planos?", a: "Não. Todos os planos oferecem acesso completo às funcionalidades do Parthenon. A diferença está no tempo de uso e nos benefícios adicionais." },
    { q: "Para quem o Parthenon Planner é indicado?", a: "Para estudantes do Ensino Fundamental, Médio, Superior, vestibulandos e concurseiros que desejam mais organização, clareza e constância nos estudos." },
    { q: "Posso usar o Parthenon com professores ou colegas?", a: "Sim. O Parthenon permite integração entre estudantes, professores e colegas para compartilhamento de tarefas, materiais, listas e compromissos." },
    { q: "Posso editar tudo dentro do aplicativo?", a: "Sim. Matérias, horários, tempo de estudo, projetos, anotações e organização geral são totalmente personalizáveis." },
    { q: "O Parthenon gera relatórios de estudo?", a: "Sim. O aplicativo fornece estatísticas, relatórios e insights sobre tempo estudado, frequência, sequência de dias e progresso geral." },
    { q: "Posso cancelar ou fazer upgrade do meu plano a qualquer momento?", a: "Sim. O cancelamento ou upgrade pode ser feito a qualquer momento, sem multas, respeitando o período já contratado." },
    { q: "Quais benefícios extras estão incluídos nos planos pagos?", a: "Descontos e benefícios em Study Planners, aulas particulares, listas de exercícios e e-books da Athena Studies, variando conforme o plano." },
    { q: "O que são os Study Planners e como eles se relacionam com o Parthenon?", a: "Os Study Planners são ferramentas estratégicas de planejamento de estudo, contendo calendário, indicação de material, indicações de tempo de estudo, exercícios e revisão, tudo de forma personalizada. O Parthenon complementa esses planners com gestão digital, acompanhamento e estatísticas." },
    { q: "As aulas particulares e listas de exercícios são obrigatórias?", a: "Não. Elas são opcionais e podem ser utilizadas conforme a necessidade do estudante, com descontos exclusivos para assinantes." },
    { q: "Posso usar o Parthenon em mais de um dispositivo?", a: "Sim. O aplicativo possui sincronização em nuvem, permitindo acesso de diferentes dispositivos." },
    { q: "O Parthenon substitui um professor?", a: "Não. O Parthenon é uma ferramenta de organização e estratégia. Ele potencializa o estudo, mas não substitui o papel do professor ou tutor." },
    { q: "O Parthenon funciona para quem estuda poucas horas por dia?", a: "Sim. O Parthenon se adapta à sua realidade atual, seja para quem estuda 30 minutos por dia ou várias horas. A proposta é criar constância, não sobrecarga." },
    { q: "Posso usar o Parthenon só para organização pessoal, sem focar em provas?", a: "Pode. O Parthenon funciona tanto para estudos acadêmicos quanto para projetos pessoais, cursos livres e organização geral de aprendizado." },
    { q: "O aplicativo envia lembretes ou avisos?", a: "Sim. Compromissos, tarefas e projetos podem ser organizados na agenda para facilitar o acompanhamento da rotina de estudos." },
    { q: "Preciso ter experiência com planejamento para usar o Parthenon?", a: "Não. O Parthenon foi criado para ser intuitivo, mesmo para quem nunca utilizou planners ou ferramentas de organização." },
    { q: "O Parthenon é melhor para quem estuda sozinho ou acompanhado?", a: "Para os dois. Ele funciona muito bem para estudos individuais e também para quem estuda com professores, tutores ou grupos." },
    { q: "Os benefícios dos planos têm prazo de validade?", a: "Os benefícios são válidos enquanto o plano estiver ativo, respeitando as regras específicas de cada plano contratado." },
    { q: "O Parthenon substitui planners físicos?", a: "Ele não substitui, mas complementa. Muitos estudantes usam o Parthenon junto com planners físicos para uma visão ainda mais estratégica." },
    { q: "O aplicativo é indicado para quem tem dificuldade em matemática?", a: "Sim. O Parthenon foi pensado especialmente para apoiar estudantes que querem organizar melhor seus estudos, com destaque para matemática." }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-athena-teal selection:text-white transition-colors duration-300">

      {/* Header */}
      <header className="fixed top-0 w-full z-[100] backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-athena-teal rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform">
              <Bird size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-athena-teal dark:text-white uppercase">
              Parthenon<span className="text-athena-teal">.</span>
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <Link to="/" className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
              <ArrowLeft size={14} /> Voltar
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-athena-teal/10 text-athena-teal rounded-full border border-athena-teal/20 mb-2">
              <HelpCircle size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Suporte Central</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-950 dark:text-white leading-none">
              Perguntas <span className="text-athena-teal">Frequentes</span>
            </h1>
            <p className="text-sm md:text-lg font-bold text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Tudo o que você precisa saber sobre o ecossistema Parthenon e como ele potencializa sua jornada de estudos.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-16">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Busque por uma dúvida específica..."
              className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:border-athena-teal transition-all text-sm font-bold text-slate-950 dark:text-white shadow-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-[2rem] overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md hover:border-athena-teal">
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full p-6 md:p-8 flex items-center justify-between text-left"
                  >
                    <span className="text-sm md:text-base font-black text-slate-950 dark:text-white uppercase tracking-tight leading-snug">
                      {faq.q}
                    </span>
                    <div className={`p-2 rounded-xl transition-all duration-300 ${activeFaq === i ? 'bg-athena-teal text-white rotate-180' : 'bg-slate-100 dark:bg-slate-800 text-athena-teal'}`}>
                      <ChevronDown size={20} />
                    </div>
                  </button>
                  <div className={`transition-all duration-300 ease-in-out ${activeFaq === i ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-6 md:p-8 pt-0 text-sm md:text-base font-bold text-slate-700 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 mt-2">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-300 dark:border-slate-800">
                <Search size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm font-black uppercase text-slate-500 tracking-widest">Nenhuma pergunta encontrada</p>
              </div>
            )}
          </div>

          <div className="mt-20 p-10 bg-athena-teal rounded-[3rem] text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
            <Sparkles className="absolute -top-10 -right-10 text-white/10" size={200} />
            <h2 className="text-3xl font-black uppercase tracking-tighter relative z-10">Ainda tem dúvidas?</h2>
            <p className="text-sm font-bold opacity-90 relative z-10">Nossa equipe de suporte está pronta para te ajudar a dominar seus estudos.</p>
            <a href="mailto:studiesathena2025@gmail.com" className="inline-flex items-center gap-3 px-10 py-4 bg-white text-athena-teal rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-all relative z-10">
              Contate-nos Agora <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center border-t border-slate-200 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">© 2026 • PARTHENON PLANNER • DOMINE O SEU FUTURO</p>
      </footer>
    </div>
  );
};
