import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Página não encontrada</h1>
      <p className="text-gray-600 mb-4">Verifique o endereço ou volte para o início.</p>
      <Link href="/dashboard" className="text-[#4bca59] hover:underline">Ir para o dashboard</Link>
    </div>
  );
}


