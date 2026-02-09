
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Mail, Bird, Sun, Moon, Scale } from 'lucide-react';

interface TermsOfServiceProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ theme, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-athena-coral selection:text-white transition-colors duration-300">

      {/* Header Minimalista */}
      <header className="fixed top-0 w-full z-[100] backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <div className="p-2 bg-athena-coral rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform">
              <Bird size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-athena-teal dark:text-white uppercase">
              Parthenon<span className="text-athena-coral">.</span>
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 active:scale-95 transition-all"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <Link
              to="/"
              className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Voltar
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 p-8 md:p-16 shadow-2xl">

          <div className="flex items-center gap-4 mb-10 text-athena-coral">
            <FileText size={48} />
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-950 dark:text-white leading-none">Termos de Serviço</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-2">Athena Studies • Parthenon Planner</p>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300">
            <p className="text-lg font-bold leading-relaxed italic">
              Estes Termos de Serviço regulam o uso do aplicativo <strong>Parthenon Planner</strong>, desenvolvido e mantido pela
              <strong> Athena Studies</strong>. Ao acessar ou utilizar o aplicativo, você declara que leu, compreendeu e concorda
              com estes Termos.
            </p>

            <p className="font-medium">Caso não concorde com qualquer disposição aqui descrita, recomendamos que não utilize o serviço.</p>

            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">1. Sobre o Parthenon Planner</h2>
              <p className="font-medium">
                O <strong>Parthenon Planner</strong> é um aplicativo de organization e gestão de estudos, voltado a estudantes que
                desejam estruturar sua rotina acadêmica, acompanhar seu progresso e integrar estudos com professores, tutores ou
                colegas.
              </p>
              <p className="font-medium">
                A Athena Studies reserva-se o direito de modificar, suspender ou atualizar funcionalidades do aplicativo visando
                melhorias contínuas da experiência do usuário.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">2. Elegibilidade</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Idade mínima de 13 anos",
                  "Dados verídicos no cadastro",
                  "Responsabilidade por credenciais",
                  "Menores devem ter supervisão"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="w-2 h-2 rounded-full bg-athena-coral" />
                    <span className="text-xs font-black uppercase">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-slate-500 mt-2">Menores de 18 anos devem utilizar o aplicativo com o conhecimento e acompanhamento de um responsável legal.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">3. Cadastro e conta</h2>
              <p className="font-medium">O acesso ao Parthenon Planner depende da criação de uma conta individual e intransferível.</p>
              <ul className="list-disc pl-5 space-y-2 text-sm font-bold">
                <li>O usuário é responsável por todas as atividades realizadas em sua conta</li>
                <li>A segurança do login e da senha é de responsabilidade do usuário</li>
                <li>A Athena Studies não se responsabiliza por acessos não autorizados decorrentes de negligência</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">4. Uso adequado do serviço</h2>
              <p className="font-medium">Ao utilizar o Parthenon Planner, o usuário compromete-se a:</p>
              <ul className="space-y-3">
                {[
                  "Fins educacionais e organizacionais apenas",
                  "Não compartilhar conteúdos ofensivos",
                  "Não tentar burlar sistemas de segurança",
                  "Não usar para fins comerciais não autorizados"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-bold">
                    <Scale size={18} className="text-athena-teal shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900">
                <p className="text-xs font-bold text-rose-800 dark:text-rose-400">O descumprimento destas regras pode resultar em suspensão ou encerramento da conta.</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">5. Conteúdo do usuário</h2>
              <p className="font-medium">Todo conteúdo inserido no Parthenon Planner permanece de propriedade do próprio usuário.</p>
              <p className="font-medium">Ao utilizar o aplicativo, o usuário concede à Athena Studies uma licença limitada e não exclusiva para armazenar, processar e exibir o conteúdo apenas na medida necessária para a prestação do serviço.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">6. Integração entre usuários</h2>
              <p className="font-medium">O Parthenon Planner permite a integração entre estudantes, professores e colegas para compartilhamento de tarefas, materiais e compromissos.</p>
              <p className="font-medium">Esse compartilhamento ocorre exclusivamente por iniciativa do usuário. A Athena Studies não se responsabiliza por eventuais usos indevidos decorrentes dessa integração.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">7. Planos, pagamentos e benefícios</h2>
              <p className="font-medium">O Parthenon Planner pode oferecer período gratuito por tempo limitado e planos pagos (mensal, semestral e anual).</p>
              <p className="font-medium">Valores, condições e benefícios serão apresentados de forma clara no site ou aplicativo. A Athena Studies poderá alterar preços e ofertas, respeitando assinaturas vigentes.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">8. Cancelamento e encerramento da conta</h2>
              <p className="font-medium">O usuário pode solicitar o cancelamento da conta a qualquer momento.</p>
              <p className="font-medium">A Athena Studies poderá suspender ou encerrar contas que violem estes Termos, especialmente em casos de uso indevido, fraude ou violação de leis.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">9. Limitação de responsabilidade</h2>
              <p className="font-medium italic">O Parthenon Planner é fornecido “como está”, sem garantias de funcionamento ininterrupto ou livre de erros.</p>
              <p className="font-medium">A Athena Studies não se responsabiliza por perdas decorrentes de falhas técnicas, interrupções do serviço ou decisões tomadas com base nas informações organizadas no aplicativo.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">10. Propriedade intelectual</h2>
              <p className="font-medium">Todo o conteúdo estrutural do Parthenon Planner, incluindo design, layout, textos e marca, é de propriedade exclusiva da Athena Studies.</p>
              <p className="font-medium">É proibida a reprodução ou uso não autorizado desses elementos.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">11. Alterações nos termos</h2>
              <p className="font-medium">Estes Termos podem ser atualizados periodicamente. O uso continuado do serviço após alterações implica aceitação dos novos Termos.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">12. Lei aplicável e foro</h2>
              <p className="font-medium">Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do usuário para dirimir eventuais controvérsias.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-black text-athena-teal dark:text-athena-coral uppercase tracking-tight">13. Contato</h2>
              <div className="p-6 md:p-8 bg-athena-coral/5 dark:bg-athena-coral/10 rounded-3xl border-2 border-athena-coral/20 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                <div className="w-12 h-12 bg-athena-coral rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                  <Mail size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Suporte Jurídico</p>
                  <p className="text-base md:text-lg font-black text-athena-coral break-all">studiesathena2025@gmail.com</p>
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
