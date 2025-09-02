export default function NotFound() {
  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center px-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Página não encontrada</h2>
        <p className="text-gray-600 mt-2">A página que você procura não existe ou foi movida.</p>
        <a href="/" className="inline-flex mt-4 rounded-md px-4 py-2 text-white" style={{ backgroundColor: '#4bca59' }}>
          Voltar ao início
        </a>
      </div>
    </div>
  );
}


