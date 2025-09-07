import { env } from './env';

const MEGA_API_HOST = env.megaApi.host;
const MEGA_API_TOKEN = env.megaApi.token;

interface MegaApiInstance {
  instance_key: string;
  status: string;
}

interface MegaApiQrCode {
  qrcode: string;
}

export const MegaAPI = {
  async createInstance(instanceName: string, webhookUrl: string): Promise<MegaApiInstance> {
    const response = await fetch(`${MEGA_API_HOST}/rest/instance/init?instance_key=${instanceName}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MEGA_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messageData: {
          webhookUrl: webhookUrl,
          webhookEnabled: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create Mega API instance: ${errorText}`);
    }

    return response.json();
  },

  async getInstance(instanceName: string): Promise<MegaApiInstance | null> {
    const response = await fetch(`${MEGA_API_HOST}/rest/instance/${instanceName}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MEGA_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Mega API instance: ${errorText}`);
    }

    return response.json();
  },

  async getQrCode(instanceName: string): Promise<MegaApiQrCode> {
    const response = await fetch(`${MEGA_API_HOST}/rest/instance/qrcode_base64/${instanceName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MEGA_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Mega API QR code: ${errorText}`);
    }

    return response.json();
  }
};