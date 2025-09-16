import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Tipos para as tabelas do Supabase
export type Tables = {
  plans: {
    Row: {
      id: string;
      name: string;
      price: number;
      contact_limit: number;
      message_limit: number;
      connection_limit: number; // Limite de conexões API por plano
      features: Record<string, any>;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      name: string;
      price: number;
      contact_limit: number;
      message_limit: number;
      connection_limit?: number;
      features?: Record<string, any>;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      name?: string;
      price?: number;
      contact_limit?: number;
      message_limit?: number;
      connection_limit?: number;
      features?: Record<string, any>;
      created_at?: string;
      updated_at?: string;
    };
  };
  users: {
    Row: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      bio: string | null;
      phone: string | null;
      plan_id: string | null;
      billing_address: Record<string, any> | null;
      payment_method: Record<string, any> | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id: string;
      full_name?: string | null;
      avatar_url?: string | null;
      bio?: string | null;
      phone?: string | null;
      plan_id?: string | null;
      billing_address?: Record<string, any> | null;
      payment_method?: Record<string, any> | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      full_name?: string | null;
      avatar_url?: string | null;
      bio?: string | null;
      phone?: string | null;
      plan_id?: string | null;
      billing_address?: Record<string, any> | null;
      payment_method?: Record<string, any> | null;
      created_at?: string;
      updated_at?: string;
    };
  };
  api_connections: {
    Row: {
      id: string;
      user_id: string;
      organization_id: string;
      type: string;
      name: string | null;
      instance_id: string | null;
      api_key: string;
      api_secret: string;
      is_active: boolean | null;
      status: string | null;
      description: string | null;
      webhook_url: string | null;
      phone_number_id: string | null;
      provider: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      organization_id?: string;
      type: string;
      name?: string | null;
      instance_id?: string | null;
      api_key: string;
      api_secret: string;
      is_active?: boolean | null;
      status?: string | null;
      description?: string | null;
      webhook_url?: string | null;
      phone_number_id?: string | null;
      provider?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      organization_id?: string;
      type?: string;
      name?: string | null;
      instance_id?: string | null;
      api_key?: string;
      api_secret?: string;
      is_active?: boolean | null;
      status?: string | null;
      description?: string | null;
      webhook_url?: string | null;
      phone_number_id?: string | null;
      provider?: string | null;
      created_at?: string;
      updated_at?: string;
    };
  };
  contact_lists: {
    Row: {
      id: string;
      user_id: string;
      name: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      name: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      name?: string;
      created_at?: string;
      updated_at?: string;
    };
  };
  contact_list_members: {
    Row: {
      contact_id: string;
      list_id: string;
      created_at: string;
    };
    Insert: {
      contact_id: string;
      list_id: string;
      created_at?: string;
    };
    Update: {
      contact_id?: string;
      list_id?: string;
      created_at?: string;
    };
  };
  contacts: {
    Row: {
      id: string;
      user_id: string;
      list_id: string;
      phone: string;
      name: string | null;
      custom_fields: Record<string, any>;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      list_id: string;
      phone: string;
      name?: string | null;
      custom_fields?: Record<string, any>;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      list_id?: string;
      phone?: string;
      name?: string | null;
      custom_fields?: Record<string, any>;
      created_at?: string;
      updated_at?: string;
    };
  };
  campaigns: {
    Row: {
      id: string;
      user_id: string;
      list_id: string;
      name: string;
      message_content: string;
      scheduled_at: string | null;
      status: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      list_id: string;
      name: string;
      message_content: string;
      scheduled_at?: string | null;
      status: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      list_id?: string;
      name?: string;
      message_content?: string;
      scheduled_at?: string | null;
      status?: string;
      created_at?: string;
      updated_at?: string;
    };
  };
  conversations: {
    Row: {
      id: string;
      contact_id: string;
      user_id: string;
      start_time: string;
      status: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      contact_id: string;
      user_id: string;
      start_time?: string;
      status: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      contact_id?: string;
      user_id?: string;
      start_time?: string;
      status?: string;
      created_at?: string;
      updated_at?: string;
    };
  };
  messages: {
    Row: {
      id: string;
      conversation_id: string;
      sender: string;
      content: string;
      media_url: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      conversation_id: string;
      sender: string;
      content: string;
      media_url?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      conversation_id?: string;
      sender?: string;
      content?: string;
      media_url?: string | null;
      created_at?: string;
    };
  };
  subscriptions: {
    Row: {
      id: string;
      user_id: string;
      status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';
      price_id: string;
      quantity: number;
      cancel_at_period_end: boolean;
      created_at: string;
      current_period_start: string;
      current_period_end: string;
      ended_at: string | null;
      cancel_at: string | null;
      canceled_at: string | null;
      trial_start: string | null;
      trial_end: string | null;
      stripe_customer_id: string;
      stripe_subscription_id: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';
      price_id: string;
      quantity?: number;
      cancel_at_period_end?: boolean;
      created_at?: string;
      current_period_start: string;
      current_period_end: string;
      ended_at?: string | null;
      cancel_at?: string | null;
      canceled_at?: string | null;
      trial_start?: string | null;
      trial_end?: string | null;
      stripe_customer_id: string;
      stripe_subscription_id: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      status?: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';
      price_id?: string;
      quantity?: number;
      cancel_at_period_end?: boolean;
      created_at?: string;
      current_period_start?: string;
      current_period_end?: string;
      ended_at?: string | null;
      cancel_at?: string | null;
      canceled_at?: string | null;
      trial_start?: string | null;
      trial_end?: string | null;
      stripe_customer_id?: string;
      stripe_subscription_id?: string;
    };
  };
  prices: {
    Row: {
      id: string;
      product_id: string;
      active: boolean;
      description: string | null;
      unit_amount: number;
      currency: string;
      type: 'one_time' | 'recurring';
      interval: 'day' | 'week' | 'month' | 'year' | null;
      interval_count: number | null;
      trial_period_days: number | null;
      metadata: Record<string, any> | null;
      created_at: string;
    };
    Insert: {
      id: string;
      product_id: string;
      active?: boolean;
      description?: string | null;
      unit_amount: number;
      currency: string;
      type: 'one_time' | 'recurring';
      interval?: 'day' | 'week' | 'month' | 'year' | null;
      interval_count?: number | null;
      trial_period_days?: number | null;
      metadata?: Record<string, any> | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      product_id?: string;
      active?: boolean;
      description?: string | null;
      unit_amount?: number;
      currency?: string;
      type?: 'one_time' | 'recurring';
      interval?: 'day' | 'week' | 'month' | 'year' | null;
      interval_count?: number | null;
      trial_period_days?: number | null;
      metadata?: Record<string, any> | null;
      created_at?: string;
    };
  };
  products: {
    Row: {
      id: string;
      active: boolean;
      name: string;
      description: string | null;
      image: string | null;
      metadata: Record<string, any> | null;
      created_at: string;
    };
    Insert: {
      id: string;
      active?: boolean;
      name: string;
      description?: string | null;
      image?: string | null;
      metadata?: Record<string, any> | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      active?: boolean;
      name?: string;
      description?: string | null;
      image?: string | null;
      metadata?: Record<string, any> | null;
      created_at?: string;
    };
  };
};

// Tipos para o banco de dados do Supabase
export type Database = {
  public: {
    Tables: {
      plans: Tables['plans'];
      users: Tables['users'];
      api_connections: Tables['api_connections'];
      contact_lists: Tables['contact_lists'];
      contact_list_members: Tables['contact_list_members'];
      contacts: Tables['contacts'];
      campaigns: Tables['campaigns'];
      conversations: Tables['conversations'];
      messages: Tables['messages'];
      subscriptions: Tables['subscriptions'];
      prices: Tables['prices'];
      products: Tables['products'];
    };
  };
};

// Singleton para evitar múltiplas instâncias do GoTrueClient
let supabaseClientInstance: SupabaseClient<Database> | null = null;

// Função para criar o cliente do Supabase no lado do cliente (singleton)
export const createClientComponentClient = (): SupabaseClient<Database> => {
  if (typeof window === 'undefined') {
    // No servidor, sempre criar nova instância
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://temp.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'temp_anon_key'
    );
  }
  
  if (!supabaseClientInstance) {
    supabaseClientInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://temp.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'temp_anon_key'
    );
  }
  return supabaseClientInstance;
};

// Export para compatibilidade - removido para evitar instância global

// Função para criar o cliente do Supabase no lado do servidor (com cookies)
// Nota: utilitário de servidor foi movido para '@/lib/supabaseServer'

// Cliente admin para operações que precisam contornar RLS (apenas no servidor)
let supabaseAdminInstance: SupabaseClient<Database> | null = null;
export const supabaseAdmin = (() => {
  if (typeof window === 'undefined' && !supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      env.supabase.url || 'https://temp.supabase.co', 
      env.supabase.serviceRoleKey || 'temp_service_role_key', 
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdminInstance;
})();

// Cliente normal para operações do usuário (apenas no servidor)
let supabaseServerInstance: SupabaseClient<Database> | null = null;
export const supabase = (() => {
  if (typeof window === 'undefined' && !supabaseServerInstance) {
    supabaseServerInstance = createClient(
      env.supabase.url || 'https://temp.supabase.co', 
      env.supabase.anonKey || 'temp_anon_key'
    );
  }
  return supabaseServerInstance;
})();