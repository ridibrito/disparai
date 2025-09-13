import Link from 'next/link';
import Image from 'next/image';
import { Zap, MessageSquare, Users, Brain, BarChart3, ShieldCheck, Webhook, Workflow } from 'lucide-react';
import HeroVideoDialog from '@/components/ui/hero-video-dialog';
import AnimatedBeamDemo from '@/components/ui/animated-beam-demo';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="py-4 backdrop-blur bg-white/70 sticky top-0 z-30 border-b border-gray-100">
        <div className="container flex items-center justify-between px-4 mx-auto">
          <div className="flex items-center gap-2">
            <Image src={'/logo.png'} alt='logo disparai' width={100} height={30} className="md:w-[140px] md:h-[42px]"/>
          </div>
          
          {/* Menu mobile */}
          <div className="md:hidden">
            <button className="p-2 text-gray-700 hover:text-[#4bca59]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          {/* Menu desktop */}
          <div className="hidden md:flex space-x-3">
            <Link href="#recursos" className="px-4 py-2 text-gray-700 hover:text-[#4bca59]">Recursos</Link>
            <Link href="#precos" className="px-4 py-2 text-gray-700 hover:text-[#4bca59]">Preços</Link>
            <Link href="#integracoes" className="px-4 py-2 text-gray-700 hover:text-[#4bca59]">Integrações</Link>
            <Link href="#faq" className="px-4 py-2 text-gray-700 hover:text-[#4bca59]">FAQ</Link>
            <Link href="/login" className="px-4 py-2 text-[#4bca59] border border-[#4bca59] rounded-md hover:bg-[#4bca5915]">Login</Link>
            <Link href="/signup" className="px-4 py-2 text-white rounded-md btn-primary">Começar grátis</Link>
          </div>
        </div>
      </header>

      {/* Hero c/ efeito UAU */}
      <main className="flex-grow">
        <section className="relative overflow-hidden py-24">
          {/* Partículas/feixes simples */}
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(600px_200px_at_50%_-40px,#4bca5920,transparent_80%),radial-gradient(400px_160px_at_20%_10%,#4bca5915,transparent_60%),radial-gradient(500px_180px_at_80%_0%,#4bca5912,transparent_60%)]"></div>
          <div className="container relative px-4 mx-auto text-center">
            <span className="inline-block px-3 py-1 mb-4 text-xs font-medium rounded-full bg-[#4bca5915] text-[#2da643]">Platforma de Conversas & Campanhas</span>
            <h1 className="mx-auto mb-4 text-3xl font-extrabold tracking-tight md:text-6xl text-gray-900">
              Converta conversas em <span className="text-[#4bca59]">resultados</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
              Dispare mensagens, crie fluxos e gerencie equipes no WhatsApp com uma experiência leve, rápida e encantadora.
            </p>
            <div className="flex items-center justify-center mb-8">
              <Link href="/signup" className="px-8 py-4 text-white rounded-lg btn-primary text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                🚀 Teste Grátis por 3 Dias
              </Link>
            </div>
            {/* Demo em vídeo (Hero Video Dialog) */}
            <div className="relative mt-14">
              <div className="absolute inset-0 blur-3xl opacity-40" style={{ background: 'radial-gradient(600px 180px at 50% 0,#4bca5922,transparent 70%)' }}></div>
              <div className="relative mx-auto max-w-5xl">
                <HeroVideoDialog
                  animationStyle="from-center"
                  videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?autoplay=1&rel=0"
                  thumbnailSrc="/capa.png"
                  thumbnailAlt="Apresentação do disparai"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Demonstração AnimatedBeam */}
        <AnimatedBeamDemo />

        {/* Recursos */}
        <section id="recursos" className="py-20 bg-white">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Recursos que economizam tempo</h2>
              <p className="text-gray-600">Tudo que você precisa para disparar mensagens, atender conversas e escalar operações no WhatsApp.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-5 h-5 text-[#4bca59]" />
                  <h3 className="text-lg font-semibold text-gray-900">Disparos em massa</h3>
                </div>
                <p className="text-gray-600">Envie campanhas para listas ou segmentos com retomada em caso de falha e janela de horário.</p>
              </div>

              <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="w-5 h-5 text-[#4bca59]" />
                  <h3 className="text-lg font-semibold text-gray-900">Caixa de conversas</h3>
                </div>
                <p className="text-gray-600">Organize e atribua conversas a atendentes com histórico centralizado e indicadores de status.</p>
              </div>

              <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-[#4bca59]" />
                  <h3 className="text-lg font-semibold text-gray-900">Contatos & listas</h3>
                </div>
                <p className="text-gray-600">Importe CSV, crie listas e segmente públicos para campanhas e fluxos.</p>
              </div>

              <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Brain className="w-5 h-5 text-[#4bca59]" />
                  <h3 className="text-lg font-semibold text-gray-900">Atendimento com IA</h3>
                </div>
                <p className="text-gray-600">Respostas automáticas (padrão/avançado) e triagem inicial para reduzir tempo de atendimento.</p>
              </div>

              <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="w-5 h-5 text-[#4bca59]" />
                  <h3 className="text-lg font-semibold text-gray-900">Relatórios e métricas</h3>
                </div>
                <p className="text-gray-600">Acompanhe envios, entregas, falhas, conversas ativas e geração de relatórios rápidos.</p>
              </div>


              <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Workflow className="w-5 h-5 text-[#4bca59]" />
                  <h3 className="text-lg font-semibold text-gray-900">Fluxos e templates</h3>
                </div>
                <p className="text-gray-600">Sequências com delays e condições, além de modelos de mensagens reutilizáveis.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Preços */}
        <section id="precos" className="py-20 bg-white">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">Preços simples e transparentes</h2>
              <p className="text-gray-600">Escolha o plano ideal e comece agora. Você pode mudar de plano quando quiser.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Básico */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
                <div className="mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">Básico</h3>
                  <p className="text-sm text-gray-500">Ideal para profissionais autônomos e pequenas equipes.</p>
                </div>
                <div className="mt-2 mb-6">
                  <h4 className="text-4xl font-extrabold text-gray-900">R$ 99 <span className="text-base font-medium text-gray-500">/ mês</span></h4>
                </div>
                <ul className="space-y-2 text-gray-700 flex-1">
                  <li>✅ 1 usuário admin + 1 atendente</li>
                  <li>✅ 1.000 contatos</li>
                  <li>✅ 5.000 mensagens</li>
                  <li>✅ Atendimento com IA (padrão)</li>
                </ul>
                <Link 
                  href="/signup"
                  className="mt-6 inline-flex items-center justify-center rounded-lg px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  style={{ backgroundColor: '#00DC4F' }}
                >
                  🚀 Teste Grátis por 3 Dias
                </Link>
              </div>
              
              {/* Profissional */}
              <div className="rounded-2xl border-2 bg-white shadow-md transition-shadow p-6 flex flex-col"
                   style={{ borderColor: '#00DC4F' }}>
                <div className="mb-3">
                  <div className="inline-block mb-2 text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: '#00DC4F1a', color: '#00A63A' }}>Mais popular</div>
                  <h3 className="text-xl font-semibold text-gray-900">Profissional</h3>
                  <p className="text-sm text-gray-500">Ideal para equipes em crescimento e agências.</p>
                </div>
                <div className="mt-2 mb-6">
                  <h4 className="text-4xl font-extrabold text-gray-900">R$ 299 <span className="text-base font-medium text-gray-500">/ mês</span></h4>
                </div>
                <ul className="space-y-2 text-gray-700 flex-1">
                  <li>✅ 1 usuário admin + 5 atendentes</li>
                  <li>✅ 5.000 contatos</li>
                  <li>✅ 25.000 mensagens</li>
                  <li>✅ Atendimento com IA (avançado)</li>
                  <li>✅ Fluxos de cadência automática</li>
                </ul>
                <Link 
                  href="/signup"
                  className="mt-6 inline-flex items-center justify-center rounded-lg px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  style={{ backgroundColor: '#00DC4F' }}
                >
                  🚀 Teste Grátis por 3 Dias
                </Link>
              </div>
              
              {/* Empresarial */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
                <div className="mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">Empresarial</h3>
                  <p className="text-sm text-gray-500">Ideal para grandes empresas e operações em escala.</p>
                </div>
                <div className="mt-2 mb-6">
                  <h4 className="text-4xl font-extrabold text-gray-900">R$ 699 <span className="text-base font-medium text-gray-500">/ mês</span></h4>
                </div>
                <ul className="space-y-2 text-gray-700 flex-1">
                  <li>✅ 1 usuário admin + 10 atendentes</li>
                  <li>✅ 20.000 contatos</li>
                  <li>✅ 100.000 mensagens</li>
                  <li>✅ Suporte prioritário</li>
                  <li>✅ Todas as funcionalidades</li>
                </ul>
                <Link 
                  href="mailto:contato@disparai.com"
                  className="mt-6 inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2"
                  style={{ color: '#00DC4F', borderColor: '#00DC4F' }}
                >
                  💬 Fale Conosco
                </Link>
              </div>
            </div>

            {/* Extra Agent Pricing */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="text-left">
                  <h4 className="text-lg font-semibold text-gray-900">Preço por Atendente Extra</h4>
                  <p className="text-gray-600">Adicione mais atendentes quando precisar.</p>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div>
                  <span className="text-xl font-extrabold" style={{ color: '#00DC4F' }}>R$ 50</span>
                  <span className="text-gray-600"> / mês por atendente</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integrações */}
        <section id="integracoes" className="py-20 bg-gray-50">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Integrações que aceleram seu fluxo</h2>
              <p className="text-gray-600">Conecte com suas ferramentas favoritas para importar contatos, automatizar disparos e consolidar dados.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <img src="https://img.icons8.com/color/48/whatsapp.png" alt="WhatsApp" className="w-8 h-8" />
                  <h3 className="text-lg font-semibold text-gray-900">WhatsApp Business</h3>
                </div>
                <p className="text-gray-600">Integração nativa com WhatsApp Business API para alto volume respeitando boas práticas.</p>
              </div>
              <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <img src="https://img.icons8.com/color/48/google-calendar--v2.png" alt="Google Calendar" className="w-8 h-8" />
                  <h3 className="text-lg font-semibold text-gray-900">Google Calendar</h3>
                </div>
                <p className="text-gray-600">Agende reuniões automaticamente e sincronize com sua agenda do Google.</p>
              </div>
              <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <img src="/bitrix.png" alt="CRM" className="w-16 h-4" />
                  <h3 className="text-lg font-semibold text-gray-900">CRMs Populares</h3>
                </div>
                <p className="text-gray-600">Conecte com Bitrix24, RD Station, Pipedrive e outros CRMs via webhooks.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 bg-gray-50">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Perguntas frequentes</h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  Isso é compatível com as políticas do WhatsApp?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Seguimos boas práticas e respeitamos limites/regras da plataforma. Recomendamos listas opt-in e conteúdo relevante.</p>
              </details>
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  Posso importar meus contatos?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Sim, via planilhas (CSV) e integrações. Validamos colunas e prevenimos duplicidades.</p>
              </details>
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  Como funciona o faturamento?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Planos mensais sem fidelidade. Você pode mudar de plano ou cancelar quando quiser.</p>
              </details>
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  Tem teste grátis? Precisa de cartão?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Sim, oferecemos teste grátis para começar sem compromisso e sem cartão de crédito.</p>
              </details>
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  Como faço para cancelar?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Você pode cancelar a qualquer momento nas configurações de assinatura. O acesso permanece até o fim do ciclo vigente.</p>
              </details>
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  Quais são os limites por plano?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Cada plano possui limites de contatos, mensagens e atendentes. Consulte a seção Preços para os detalhes e opções de upgrade.</p>
              </details>
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  Vocês possuem API pública e webhooks?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Sim. Disponibilizamos API e webhooks para integrações. Você encontra credenciais e documentação em Configurações &gt; Conexão API.</p>
              </details>
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  Quais integrações estão disponíveis?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Planilhas (CSV/Google Sheets), CRMs via webhooks e integrações com a API do WhatsApp. Novas integrações são adicionadas conforme demanda.</p>
              </details>
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  Posso usar vários números ou dispositivos?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Sim, é possível operar múltiplos números conforme o seu plano e as políticas da API do WhatsApp.</p>
              </details>
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  É fácil migrar de outra ferramenta?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Sim. Auxiliamos na importação de contatos, templates e configuração de fluxos para acelerar a transição.</p>
              </details>
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  O disparai está em conformidade com a LGPD?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Sim. Aplicamos RLS por organização, mínimos de acesso e boas práticas de segurança para proteger os dados.</p>
              </details>
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  Há suporte e SLA?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Oferecemos suporte por e-mail e chat conforme o plano. Para operações críticas, podemos avaliar SLA dedicado.</p>
              </details>
              <details className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-900">
                  Vocês emitem nota fiscal?
                  <span className="text-gray-500">+</span>
                </summary>
                <p className="mt-2 text-gray-600">Sim, emitimos NF para empresas brasileiras usando os dados cadastrais informados na conta.</p>
              </details>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container px-4 mx-auto text-center">
            <div className="inline-flex items-center gap-3 px-6 py-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-left">
                <h3 className="text-xl font-semibold text-gray-900">Pronto para acelerar suas conversas?</h3>
                <p className="text-gray-600">Teste agora e migre quando quiser. Sem cartão.</p>
              </div>
              <Link href="/signup" className="px-8 py-4 text-white rounded-lg btn-primary text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                🚀 Teste Grátis por 3 Dias
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 bg-gray-900 text-white">
        <div className="container px-4 mx-auto text-center">
          <Image 
            src={'/logo_branca.png'} 
            alt='logo disparai' 
            width={140} 
            height={42} 
            className="mx-auto mb-6"
            style={{ width: 'auto', height: 'auto' }}
          />
          
          {/* Badges de confiança */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <ShieldCheck className="w-4 h-4 text-[#4bca59]" />
              LGPD Compliant
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <ShieldCheck className="w-4 h-4 text-[#4bca59]" />
              SSL Seguro
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <ShieldCheck className="w-4 h-4 text-[#4bca59]" />
              99.9% Uptime
            </div>
          </div>
          
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} disparai. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

// (removido botão de demo; agora usamos HeroVideoDialog acima)
