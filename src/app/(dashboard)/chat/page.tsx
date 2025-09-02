import { MessageSquare, Send, Phone, Search, Paperclip, MoreVertical, Smile, Mic, CheckCheck } from 'lucide-react';

export const metadata = {
  title: 'Conversas - disparai',
  description: 'Lista de conversas estilo WhatsApp',
};

export default function ChatPage() {
  const conversations = [
    { id: '1', name: 'vivika Novo', lastMessage: 'Eu to pensando em pedir demissão', time: '09:55', unread: 0 },
    { id: '2', name: 'Rodrigo Durante', lastMessage: 'Bom dia', time: '09:57', unread: 1 },
    { id: '3', name: 'ALBUQUERQUES', lastMessage: 'Tio: Bom dia família', time: '09:54', unread: 0 },
    { id: '4', name: 'Amor', lastMessage: 'Ok', time: '09:49', unread: 0 },
  ];

  const getInitial = (name: string) => (name?.trim()[0] || '?').toUpperCase();

  return (
    <div className="space-y-0 h-full">

      <div className="bg-white text-gray-900 overflow-hidden full-bleed-chat">
        <div className="px-4 py-3 bg-white border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Conversas</h1>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <input
              placeholder="Pesquisar ou começar uma nova conversa"
              className="w-full pl-8 pr-3 py-2 rounded-md text-sm bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 h-full">
          {/* Lista de conversas (fixa) */}
          <div className="border-r border-gray-200 h-full overflow-y-auto w-full md:w-[360px] bg-white">
            {conversations.map((c) => (
              <div key={c.id} className={`px-4 py-3 flex items-center hover:bg-gray-50 cursor-pointer ${c.unread ? 'bg-green-50' : ''}`}>
                <div className="mr-3 flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-medium">
                  {getInitial(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500 ml-2 flex-shrink-0">{c.time}</p>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && (
                  <span className="ml-3 inline-flex items-center justify-center rounded-full bg-[#25D366] text-white text-xs w-5 h-5">
                    {c.unread}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Área de conversa (flexível) */}
          <div className="flex-1 h-full flex flex-col min-h-0">
            {/* Header da conversa com status */}
            <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#4bca59]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">vivika Novo</h3>
                  <p className="text-xs text-gray-500">visto por último hoje às 10:44</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-500">
                <Search className="w-5 h-5" />
                <Paperclip className="w-5 h-5" />
                <MoreVertical className="w-5 h-5" />
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto px-6 py-4 chat-bg">
              <div className="space-y-2 min-x-2xl">
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 text-gray-800 rounded-lg rounded-tl-none px-3 py-2 max-w-[75%] bubble-in">
                    <p className="text-sm">Oi paaaai</p>
                    <div className="flex items-center justify-end mt-1 gap-1 text-[10px] text-gray-500"><span>09:55</span></div>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 text-gray-800 rounded-lg rounded-tl-none px-3 py-2 max-w-[75%] bubble-in">
                    <p className="text-sm">Tudo bem? Podemos conversar?</p>
                    <div className="flex items-center justify-end mt-1 gap-1 text-[10px] text-gray-500"><span>09:56</span></div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#4bca59] text-white rounded-lg rounded-tr-none px-3 py-2 max-w-[75%] shadow bubble-out">
                    <p className="text-sm">Bom diaaa, tudo bem e vc? Podemos sim!</p>
                    <div className="flex items-center justify-end mt-1 gap-1 text-[10px] opacity-80"><span>09:57</span><CheckCheck className="w-3 h-3" /></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <div className="min-w-2xl flex items-center gap-3">
                <button className="text-gray-500 hover:text-gray-700"><Smile className="w-5 h-5" /></button>
                <button className="text-gray-500 hover:text-gray-700"><Paperclip className="w-5 h-5" /></button>
                <input
                  type="text"
                  placeholder="Digite uma mensagem"
                  className="flex-1 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-primary"
                />
                <button className="text-white bg-[#25D366] hover:bg-[#1fc15d] rounded-full w-9 h-9 flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
