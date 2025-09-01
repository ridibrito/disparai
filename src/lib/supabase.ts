import { createBrowserClient } from '@supabase/ssr';

// Tipos para as tabelas do Supabase
export type Tables = {
  plans: {
    Row: {
      id: string;
      name: string;
      price: number;
      contact_limit: number;
      message_limit: number;
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
      features?: Record<string, any>;
      created_at?: string;
      updated_at?: string;
    };
  };
  users: {
    Row: {
      id: string;
      name: string;
      email: string;
      plan_id: string | null;
      created_at?: string;
      updated_at?: string;
      avatar_url?: string | null;
    };
    Insert: {
      id: string;
      name?: string;
      email: string;
      plan_id?: string | null;
      created_at?: string;
      updated_at?: string;
      avatar_url?: string | null;
    };
    Update: {
      id?: string;
      name?: string;
      email?: string;
      plan_id?: string | null;
      created_at?: string;
      updated_at?: string;
      avatar_url?: string | null;
    };
  };
  api_connections: {
    Row: {
      id: string;
      user_id: string;
      type: string;
      api_key: string;
      api_secret: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      type: string;
      api_key: string;
      api_secret: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      type?: string;
      api_key?: string;
      api_secret?: string;
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

// Função para criar o cliente do Supabase no lado do cliente
export const createClientComponentClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Função para criar o cliente do Supabase no lado do servidor (com cookies)
// Nota: utilitário de servidor foi movido para '@/lib/supabaseServer'