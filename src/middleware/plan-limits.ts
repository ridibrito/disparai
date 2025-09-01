// middleware.js
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
// Importe o seu middleware de verificação de limites
import { checkPlanLimitsMiddleware } from './caminho-para-seu-middleware';

export async function middleware(req: NextRequest) {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Lógica de redirecionamento para o login, se o usuário não estiver autenticado
  if (!session && pathname !== '/auth/login') {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Se a rota for de adição de contatos, chame o seu middleware de verificação
  if (pathname === '/contacts/add') {
    return await checkPlanLimitsMiddleware(req, 'contacts');
  }

  // Adicione outras verificações para outras rotas aqui
  // Exemplo:
  // if (pathname === '/messages/send') {
  //   return await checkPlanLimitsMiddleware(req, 'messages');
  // }

  return NextResponse.next();
}

// O matcher do Next.js define quais rotas o middleware irá proteger
export const config = {
  matcher: ['/dashboard/:path*', '/contacts/:path*', '/messages/:path*'],
};



