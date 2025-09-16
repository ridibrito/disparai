// API para obter status da instância
import { NextRequest, NextResponse } from 'next/server';

const MEGA_HOST = process.env.MEGA_HOST;
const MEGA_TOKEN = process.env.MEGA_TOKEN;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceKey = searchParams.get('instanceKey');

    if (!instanceKey) {
      return NextResponse.json(
        { error: 'instanceKey é obrigatório' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      console.warn('⚠️ Configurações da Mega API não encontradas, retornando status mock');
      return NextResponse.json({
        success: true,
        message: 'Status mock (configurações não encontradas)',
        data: {
          instance: {
            instanceName: instanceKey,
            status: 'connected',
            qrcode: null,
            pairingCode: null,
            deviceInfo: {
              device: 'Mock Device',
              battery: 100,
              plugged: true,
              platform: 'web'
            }
          }
        }
      });
    }

    console.log('📊 Obtendo status da instância:', { instanceKey });

    const response = await fetch(`${MEGA_HOST}/rest/instance/${instanceKey}`, {
      method: 'GET',
      headers: {
        'apikey': MEGA_TOKEN,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao obter status da instância' },
        { status: response.status }
      );
    }

    console.log('✅ Status da instância obtido');
    return NextResponse.json({
      success: true,
      message: 'Status obtido com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao obter status:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { instanceKey } = await request.json();

    if (!instanceKey) {
      return NextResponse.json(
        { error: 'instanceKey é obrigatório' },
        { status: 400 }
      );
    }

    if (!MEGA_HOST || !MEGA_TOKEN) {
      console.warn('⚠️ Configurações da Mega API não encontradas, retornando status mock');
      return NextResponse.json({
        success: true,
        message: 'Status mock (configurações não encontradas)',
        data: {
          instance: {
            instanceName: instanceKey,
            status: 'connected',
            qrcode: null,
            pairingCode: null,
            deviceInfo: {
              device: 'Mock Device',
              battery: 100,
              plugged: true,
              platform: 'web'
            }
          }
        }
      });
    }

    console.log('📊 Obtendo status da instância:', { instanceKey });

    const response = await fetch(`${MEGA_HOST}/rest/instance/${instanceKey}`, {
      method: 'GET',
      headers: {
        'apikey': MEGA_TOKEN,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Mega API:', result);
      return NextResponse.json(
        { error: result.message || 'Erro ao obter status da instância' },
        { status: response.status }
      );
    }

    console.log('✅ Status da instância obtido');
    return NextResponse.json({
      success: true,
      message: 'Status obtido com sucesso',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Erro ao obter status:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
