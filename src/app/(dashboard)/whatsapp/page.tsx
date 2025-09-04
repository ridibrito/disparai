import { Metadata } from 'next';
import WhatsAppConnectionPageWithUser from '@/components/whatsapp/WhatsAppConnectionPageWithUser';

export const metadata: Metadata = {
  title: 'WhatsApp - Conectar',
  description: 'Conecte seu WhatsApp para enviar mensagens em massa',
};

export default function WhatsAppPage() {
  return <WhatsAppConnectionPageWithUser />;
}
