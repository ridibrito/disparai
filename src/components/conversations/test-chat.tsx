'use client';

export default function TestChat() {
  return (
    <div className="h-screen w-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-96 bg-gray-100 border-r">
        <div className="p-4">
          <h1 className="text-lg font-bold">Conversas</h1>
        </div>
        <div className="p-2">
          <div className="p-3 bg-green-100 border border-green-300 rounded">
            João Silva - Selecionado
          </div>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 bg-white">
        <div className="bg-red-500 text-white p-4">
          TESTE: Chat deve aparecer aqui
        </div>
        <div className="flex-1 bg-blue-100 p-4">
          <h2>Chat funcionando!</h2>
          <p>Esta é uma área de teste</p>
        </div>
        <div className="bg-green-500 text-white p-4">
          Input de mensagem
        </div>
      </div>
    </div>
  );
}
