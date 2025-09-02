import Link from 'next/link';

export const metadata = {
  title: 'Verificar Email | disparai',
  description: 'Verifique seu email para continuar',
};

export default function VerifyPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold">Verifique seu Email</h1>
        <p className="mt-4 text-gray-600">
          Enviamos um link de verificação para o seu email. Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
        </p>
        <p className="mt-4 text-gray-600">
          Não recebeu o email? Verifique sua pasta de spam ou solicite um novo link de verificação.
        </p>
        <div className="mt-8">
          <Link 
            href="/login" 
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}