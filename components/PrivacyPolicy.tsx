
import React from 'react';
import { ArrowLeft, ShieldCheck, Mail, Bird, Sun, Moon } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack, theme, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-athena-coral selection:text-white transition-colors duration-300">
      
      {/* Header Minimalista */}
      <header className="fixed top-0 w-full z-[100] backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-3 group"
          >
            <div className="p-2 bg-athena-coral rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform">
              <Bird size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-athena-teal dark:text-white uppercase">
              Parthenon<span className="text-athena-coral">.</span>
            </h1>
          </button>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 active:scale-95 transition-all"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button 
              onClick={onBack}
              className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 p-8 md:p-16 shadow-2xl">
          
          <div className="flex items-center gap-4 mb-10 text-athena-teal">
            <ShieldCheck size={48} />
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-950 dark:text-white leading-none">Política de Privacidade</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-2">Athena Studies • Parthenon Planner</p>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300">
            <p className="text-lg font-bold leading-relaxed italic">
              A Athena Studies valoriza a sua privacidade e está comprometida com a proteção dos dados pessoais dos usuários do
              <strong> Parthenon Planner</strong>. Esta Política de Privacidade descreve de forma clara como coletamos, utilizamos,
              armazenamos e protegemos as suas informações, em conformidade com a legislação brasileira, especialmente a Lei Geral
              de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>

            <p className="font-medium">Ao utilizar o Parthenon Planner, você concorda com as práticas descritas nesta Política.</p>

            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">1. Quem somos</h2>
              <p className="font-medium">
                O <strong>Parthenon Planner</strong> é um aplicativo de organização e gestão de estudos desenvolvido pela
                <strong> Athena Studies</strong>, iniciativa educacional voltada a apoiar estudantes na construção de autonomia,
                organização e estratégia de aprendizagem.
              </p>
              <p className="font-medium">
                Para fins desta Política, quando mencionamos “Athena”, “Parthenon”, “nós” ou “nosso”, estamos nos referindo à Athena
                Studies, responsável pelo tratamento dos dados.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">2. Dados que coletamos</h2>
              <p className="font-medium">Coletamos apenas os dados necessários para o funcionamento adequado do aplicativo.</p>

              <div className="space-y-6 mt-4">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-l-4 border-athena-teal">
                  <h3 className="text-xs font-black uppercase mb-3 text-slate-900 dark:text-white">2.1 Dados fornecidos pelo usuário</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm font-bold">
                    <li>Nome</li>
                    <li>Endereço de e-mail</li>
                    <li>Senha (armazenada de forma criptografada)</li>
                  </ul>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-l-4 border-athena-coral">
                  <h3 className="text-xs font-black uppercase mb-3 text-slate-900 dark:text-white">2.2 Dados de uso e conteúdo inserido</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm font-bold">
                    <li>Matérias estudadas</li>
                    <li>Tempo de estudo</li>
                    <li>Datas, compromissos e tarefas</li>
                    <li>Projetos acadêmicos</li>
                    <li>Arquivos e materiais compartilhados</li>
                  </ul>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-l-4 border-athena-gold">
                  <h3 className="text-xs font-black uppercase mb-3 text-slate-900 dark:text-white">2.3 Dados técnicos</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm font-bold">
                    <li>Endereço IP</li>
                    <li>Tipo de dispositivo e navegador</li>
                    <li>Registros de acesso e logs de uso</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 flex items-center gap-3 mt-4">
                <div className="text-amber-600 dark:text-amber-400 font-black text-sm uppercase">Nota:</div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400">O Parthenon Planner não coleta dados sensíveis, como CPF, dados bancários ou informações de saúde.</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">3. Finalidade do uso dos dados</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Funcionamento do aplicativo",
                  "Organização de rotinas e projetos",
                  "Geração de relatórios e insights",
                  "Integração estudante/professor",
                  "Sincronização em nuvem",
                  "Aprimoramento contínuo"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-xs font-black uppercase">
                    <div className="w-2 h-2 rounded-full bg-athena-teal" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">4. Compartilhamento de dados</h2>
              <p className="font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg inline-block">A Athena Studies não vende ou comercializa dados pessoais.</p>
              <ul className="list-disc pl-5 space-y-2 text-sm font-bold">
                <li>Serviços de infraestrutura tecnológica</li>
                <li>Compartilhamento entre usuários mediante autorização</li>
                <li>Cumprimento de obrigações legais</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">5. Armazenamento e segurança</h2>
              <p className="font-medium">
                Adotamos medidas técnicas e organizacionais para proteger os dados contra acessos não autorizados, perdas ou
                alterações indevidas.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">6. Direitos do usuário</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm font-bold">
                <li>Acesso e correção de dados</li>
                <li>Solicitação de exclusão</li>
                <li>Revogação de consentimento</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">7. Exclusão de conta</h2>
              <p className="font-medium">
                O usuário pode solicitar a exclusão de sua conta a qualquer momento, respeitando obrigações legais aplicáveis.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">8. Uso por menores de idade</h2>
              <p className="font-medium">
                O aplicativo é destinado a usuários a partir de 13 anos. Menores de 18 anos devem utilizar com acompanhamento
                responsável.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">9. Cookies</h2>
              <p className="font-medium">
                Podemos utilizar cookies para melhorar a experiência do usuário e garantir o funcionamento adequado do serviço.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">10. Alterações nesta política</h2>
              <p className="font-medium">
                Esta Política pode ser atualizada periodicamente. A versão mais recente estará sempre disponível no site ou app.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">11. Contato</h2>
              <div className="p-6 bg-athena-teal/5 dark:bg-athena-teal/10 rounded-2xl border-2 border-athena-teal/20 flex items-center gap-6">
                <div className="w-12 h-12 bg-athena-teal rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Canal de Atendimento</p>
                  <p className="text-lg font-black text-athena-teal">studiesathena2025@gmail.com</p>
                </div>
              </div>
            </section>

            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
            
            <p className="text-center text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Última atualização: Janeiro de 2026</p>
          </div>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="py-10 text-center border-t border-slate-200 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">© 2026 • DOMINE O SEU FUTURO</p>
      </footer>
    </div>
  );
};
