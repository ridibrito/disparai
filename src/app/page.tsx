import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="py-4 bg-white shadow-sm">
        <div className="container flex items-center justify-between px-4 mx-auto">
          <div className="text-2xl font-bold text-green-600">
            <Image src={'/logo.png'} alt='logo disparai' width={200} height={60}/>
          </div>
          <div className="space-x-4">
            <Link 
              href="/login" 
              className="px-4 py-2 text-green-600 border border-green-600 rounded-md hover:bg-green-50"
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Registrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="py-20 bg-gradient-to-r from-green-500 to-green-700 text-white">
          <div className="container px-4 mx-auto text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-6xl">Automatize seu WhatsApp com o DisparaMaker</h1>
            <p className="mb-10 text-xl md:text-2xl">Envie mensagens em massa, crie campanhas e gerencie seus contatos de forma simples e eficiente.</p>
            <Link 
              href="/signup" 
              className="px-8 py-3 text-lg font-medium text-green-600 bg-white rounded-md hover:bg-gray-100"
            >
              Comece Agora
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container px-4 mx-auto">
            <h2 className="mb-12 text-3xl font-bold text-center">Recursos Principais</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="mb-4 text-xl font-semibold">Envio em Massa</h3>
                <p className="text-gray-600">Envie mensagens para múltiplos contatos de uma só vez, economizando tempo e aumentando sua produtividade.</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="mb-4 text-xl font-semibold">Campanhas Programadas</h3>
                <p className="text-gray-600">Crie e agende campanhas para serem enviadas automaticamente nos horários mais adequados.</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="mb-4 text-xl font-semibold">Gestão de Contatos</h3>
                <p className="text-gray-600">Organize seus contatos em grupos e segmente suas listas para envios mais direcionados.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16">
          <div className="container px-4 mx-auto">
            <h2 className="mb-12 text-3xl font-bold text-center">Planos e Preços</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                <h3 className="mb-2 text-xl font-semibold">Básico</h3>
                <p className="mb-6 text-3xl font-bold">R$ 49,90<span className="text-sm font-normal text-gray-600">/mês</span></p>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Até 500 mensagens/mês
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    1 dispositivo conectado
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Suporte por email
                  </li>
                </ul>
                <Link 
                  href="/signup?plan=basic" 
                  className="block w-full py-2 text-center text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Escolher Plano
                </Link>
              </div>
              
              <div className="p-6 bg-green-50 rounded-lg shadow-md border-2 border-green-500 relative">
                <div className="absolute top-0 right-0 px-3 py-1 text-xs font-semibold text-white transform translate-y-[-50%] bg-green-500 rounded-full">
                  Popular
                </div>
                <h3 className="mb-2 text-xl font-semibold">Profissional</h3>
                <p className="mb-6 text-3xl font-bold">R$ 99,90<span className="text-sm font-normal text-gray-600">/mês</span></p>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Até 2000 mensagens/mês
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    3 dispositivos conectados
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Suporte prioritário
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Campanhas programadas
                  </li>
                </ul>
                <Link 
                  href="/signup?plan=professional" 
                  className="block w-full py-2 text-center text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Escolher Plano
                </Link>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                <h3 className="mb-2 text-xl font-semibold">Empresarial</h3>
                <p className="mb-6 text-3xl font-bold">R$ 199,90<span className="text-sm font-normal text-gray-600">/mês</span></p>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Mensagens ilimitadas
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    10 dispositivos conectados
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Suporte 24/7
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    API para integração
                  </li>
                </ul>
                <Link 
                  href="/signup?plan=enterprise" 
                  className="block w-full py-2 text-center text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Escolher Plano
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-gray-800 text-white">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 text-xl font-bold md:mb-0">DisparaMaker</div>
            <div className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} DisparaMaker. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
