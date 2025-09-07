/**
 * Traduz e melhora mensagens de erro do Supabase Auth para português
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'Ocorreu um erro inesperado. Tente novamente.';

  const errorMessage = error.message || error.toString();

  // Mapeamento de erros comuns do Supabase Auth
  const errorMap: Record<string, string> = {
    // Erros de login
    'Invalid login credentials': 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.',
    'Email not confirmed': 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
    'Too many requests': 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.',
    'User not found': 'Nenhuma conta encontrada com este email. Verifique o email ou crie uma nova conta.',
    
    // Erros de registro
    'User already registered': 'Já existe uma conta com este email. Tente fazer login ou use outro email.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Signup is disabled': 'O registro de novas contas está temporariamente desabilitado.',
    'Email rate limit exceeded': 'Muitas tentativas de registro. Aguarde alguns minutos antes de tentar novamente.',
    
    // Erros de validação
    'Invalid email': 'Por favor, insira um email válido.',
    'Password is too weak': 'A senha é muito fraca. Use uma combinação de letras, números e símbolos.',
    
    // Erros de rede/conexão
    'Network request failed': 'Problema de conexão. Verifique sua internet e tente novamente.',
    'Failed to fetch': 'Erro de conexão. Verifique sua internet e tente novamente.',
    
    // Erros de servidor
    'Internal server error': 'Erro interno do servidor. Tente novamente em alguns minutos.',
    'Service unavailable': 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
  };

  // Verifica se há uma tradução específica
  for (const [key, translation] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return translation;
    }
  }

  // Verifica códigos de erro específicos
  if (error.code) {
    switch (error.code) {
      case 'invalid_credentials':
        return 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
      case 'email_not_confirmed':
        return 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.';
      case 'too_many_requests':
        return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
      case 'user_not_found':
        return 'Nenhuma conta encontrada com este email. Verifique o email ou crie uma nova conta.';
      case 'email_address_invalid':
        return 'Por favor, insira um email válido.';
      case 'weak_password':
        return 'A senha é muito fraca. Use uma combinação de letras, números e símbolos.';
      case 'signup_disabled':
        return 'O registro de novas contas está temporariamente desabilitado.';
      default:
        break;
    }
  }

  // Se não encontrar uma tradução específica, retorna uma mensagem genérica mais amigável
  if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return 'Problema de conexão. Verifique sua internet e tente novamente.';
  }

  if (errorMessage.includes('timeout')) {
    return 'A operação demorou muito para ser concluída. Tente novamente.';
  }

  // Mensagem padrão mais amigável
  return 'Ocorreu um erro inesperado. Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.';
}

/**
 * Verifica se o erro é relacionado a credenciais inválidas
 */
export function isInvalidCredentialsError(error: any): boolean {
  const message = error?.message || '';
  return message.toLowerCase().includes('invalid login credentials') ||
         message.toLowerCase().includes('invalid_credentials') ||
         error?.code === 'invalid_credentials';
}

/**
 * Verifica se o erro é relacionado a email não confirmado
 */
export function isEmailNotConfirmedError(error: any): boolean {
  const message = error?.message || '';
  return message.toLowerCase().includes('email not confirmed') ||
         message.toLowerCase().includes('email_not_confirmed') ||
         error?.code === 'email_not_confirmed';
}

/**
 * Verifica se o erro é relacionado a muitas tentativas
 */
export function isRateLimitError(error: any): boolean {
  const message = error?.message || '';
  return message.toLowerCase().includes('too many requests') ||
         message.toLowerCase().includes('rate limit') ||
         error?.code === 'too_many_requests';
}
