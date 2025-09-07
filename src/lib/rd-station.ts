import axios from 'axios';
import { env } from './env';

// RD Station API base URL
const RD_STATION_CRM_API_BASE_URL = 'https://crm.rdstation.com/api/v1';

interface CreateDealParams {
  name: string; // Nome da negociação
  deal_stage_id: string; // ID da etapa do funil (ex: 'start', 'qualification', etc.)
  user_id?: string; // ID do usuário proprietário da negociação
  contact_email?: string; // Email do contato para vincular (será usado para buscar o ID do contato)
  // Outros campos da negociação podem ser adicionados aqui conforme a necessidade
}

interface RDStationDealResponse {
  id: string;
  name: string;
  // ... outros campos da resposta da API
}

// Função para obter o token de acesso (OAuth) - simplificado para exemplo
// Em um ambiente de produção, isso envolveria um fluxo OAuth completo com refresh tokens
async function getAccessToken(): Promise<string> {
  // Por enquanto, vamos assumir que o token está em uma variável de ambiente
  // ou que há um mecanismo para obtê-lo. Em um cenário real, você precisaria
  // implementar o fluxo OAuth para obter e gerenciar este token.
  if (!env.rdstation.accessToken) {
    throw new Error('RDSTATION_ACCESS_TOKEN environment variable is not set.');
  }
  return env.rdstation.accessToken;
}

// Função para buscar o ID de um contato pelo email
// RD Station CRM não tem um endpoint direto para buscar contato por email na API v1 de deals
// Geralmente, isso é feito via API de Leads ou Webhooks de conversão.
// Para este exemplo, vamos simular ou assumir que o ID do contato já é conhecido ou pode ser obtido de outra forma.
async function getContactIdByEmail(email: string, accessToken: string): Promise<string | null> {
  // Esta é uma simplificação. Em um cenário real, você precisaria:
  // 1. Usar a API de Leads do RD Station Marketing para buscar o lead/contato.
  // 2. Ou ter um webhook que atualiza seu banco de dados com os IDs dos contatos do RD Station.
  // Por simplicidade, vamos retornar um ID mockado ou null.
  console.warn(`Simulating contact ID lookup for email: ${email}. In a real scenario, implement this via RD Station Marketing API or webhooks.`);
  // Exemplo: se o email for 'test@example.com', retorna um ID fixo
  if (email === 'test@example.com') {
    return 'a1b2c3d4e5f6g7h8i9j0k1l2'; // Exemplo de ID de contato
  }
  return null;
}

export async function createRDStationDeal({
  name,
  deal_stage_id,
  user_id,
  contact_email,
}: CreateDealParams): Promise<{ success: boolean; dealId?: string; error?: string }> {
  try {
    const accessToken = await getAccessToken();

    let contactId: string | null = null;
    if (contact_email) {
      contactId = await getContactIdByEmail(contact_email, accessToken);
      if (!contactId) {
        console.warn(`Contact with email ${contact_email} not found in RD Station. Deal will be created without linked contact.`);
      }
    }

    const dealPayload: any = {
      deal: {
        name,
        deal_stage_id,
        user_id, // ID do usuário proprietário no RD Station
        // ... outros campos do deal
      },
    };

    if (contactId) {
      dealPayload.set_contacts = [{ id: contactId }];
    }

    const response = await axios.post<RDStationDealResponse>(
      `${RD_STATION_CRM_API_BASE_URL}/deals`,
      dealPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true, dealId: response.data.id };
  } catch (error: any) {
    console.error('Error creating RD Station deal:', error.message);
    return { success: false, error: error.message };
  }
}
