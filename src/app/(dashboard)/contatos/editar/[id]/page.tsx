interface PageProps {
  params: { id: string };
}

export const metadata = {
  title: 'Editar Contato - DisparaMaker',
};

export default function ContatosEditarPage({ params }: PageProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Editar contato</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-700">
        Em breve: formulário para editar o contato ID: <span className="font-mono">{params.id}</span>.
      </div>
    </div>
  );
}


