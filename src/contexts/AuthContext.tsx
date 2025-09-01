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
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Redirecionar baseado no evento
      if (event === 'SIGNED_IN') {
        console.log('Usuário logado, redirecionando para dashboard...');
        router.replace('/dashboard');
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
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      console.log('Signup successful:', data.user?.email);

      // Buscar o plano básico para associar ao novo usuário
      const { data: basicPlan, error: planError } = await supabase
        .from('plans')
        .select('id')
        .eq('name', 'Básico')
        .single();

      if (planError) {
        console.error('Erro ao buscar plano básico:', planError);
        throw new Error('Não foi possível associar o usuário ao plano básico');
      }

      // Após o registro, inserir dados adicionais do usuário na tabela users
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
            plan_id: basicPlan.id, // Associar ao plano básico
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          throw new Error('Erro ao criar perfil de usuário');
        }
      }

      // Se a autenticação estiver configurada para confirmação por email
      if (data.session) {
        // Se já temos uma sessão, redirecionar para o dashboard
        console.log('Usuário registrado com sessão, redirecionando...');
        router.replace('/dashboard');
      } else {
        // Caso contrário, redirecionar para a página de verificação
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