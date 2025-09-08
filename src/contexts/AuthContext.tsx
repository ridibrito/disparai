'use client';

import { createClientComponentClient } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('getUser error', error.message);
      }
      setUser(user ?? null);
      // mantém sessão via getSession apenas para compatibilidade
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session ?? null);
      setIsLoading(false);
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      // busca usuário autenticado para evitar warning de integridade
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ?? null);
      setIsLoading(false);
      
      // Redirecionar baseado no evento
      if (event === 'SIGNED_IN') {
        console.log('Usuário logado, redirecionando para dashboard...');
        // Só redireciona se não estiver já na página de login
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          router.replace('/dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('Usuário deslogado, redirecionando para home...');
        router.replace('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log('Login successful:', data.session?.user?.email);
      // Aguarda a sessão estar disponível para evitar corrida com o middleware
      let tries = 0;
      while (tries < 10) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          break;
        }
        await new Promise((r) => setTimeout(r, 150));
        tries += 1;
      }

      // Redireciona explicitamente; onAuthStateChange também fará o replace
      router.replace('/dashboard');
      // Força atualização do cache de rotas
      router.refresh();
      // Fallback duro caso algo impeça a navegação SPA
      setTimeout(() => {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/dashboard')) {
          window.location.href = '/dashboard';
        }
      }, 300);

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${baseUrl}/verify`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      console.log('Signup successful:', data.user?.email);

      // Não inserir manualmente em public.users.
      // O perfil é criado pelo trigger public.handle_new_user ao inserir em auth.users.
      // O plano padrão será definido por trigger no banco (ou na primeira sessão) caso necessário.

      if (data.session) {
        console.log('Usuário registrado com sessão, redirecionando...');
        router.replace('/dashboard');
      } else {
        router.replace('/verify');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/');
    } catch (error) {
      console.error('Signout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}