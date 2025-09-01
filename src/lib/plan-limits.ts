import { createServerClient } from './supabase';

/**
 * Verifica se o usuário atingiu o limite de contatos do seu plano
 * @param userId ID do usuário
 * @returns Um objeto contendo o resultado da verificação
 */
export async function checkContactLimit(userId: string) {
  const supabase = createServerClient();
  
  // Buscar o plano do usuário
  const { data: user } = await supabase
    .from('users')
    .select('plan_id, plans(contact_limit)')
    .eq('id', userId)
    .single();
  
  if (!user || !user.plans) {
    return { allowed: false, message: 'Plano não encontrado' };
  }
  
  // Contar quantos contatos o usuário já tem
  const { count } = await supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  const contactLimit = user.plans.contact_limit;
  const currentCount = count || 0;
  
  return {
    allowed: currentCount < contactLimit,
    current: currentCount,
    limit: contactLimit,
    message: currentCount >= contactLimit 
      ? `Você atingiu o limite de ${contactLimit} contatos do seu plano. Faça upgrade para adicionar mais contatos.`
      : `Você tem ${currentCount} de ${contactLimit} contatos disponíveis.`
  };
}

/**
 * Verifica se o usuário atingiu o limite de mensagens do seu plano
 * @param userId ID do usuário
 * @returns Um objeto contendo o resultado da verificação
 */
export async function checkMessageLimit(userId: string) {
  const supabase = createServerClient();
  
  // Buscar o plano do usuário
  const { data: user } = await supabase
    .from('users')
    .select('plan_id, plans(message_limit)')
    .eq('id', userId)
    .single();
  
  if (!user || !user.plans) {
    return { allowed: false, message: 'Plano não encontrado' };
  }
  
  // Contar quantas mensagens o usuário já enviou no mês atual
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', firstDayOfMonth)
    .lte('created_at', lastDayOfMonth);
  
  const messageLimit = user.plans.message_limit;
  const currentCount = count || 0;
  
  return {
    allowed: currentCount < messageLimit,
    current: currentCount,
    limit: messageLimit,
    message: currentCount >= messageLimit 
      ? `Você atingiu o limite de ${messageLimit} mensagens do seu plano para este mês. Faça upgrade para enviar mais mensagens.`
      : `Você enviou ${currentCount} de ${messageLimit} mensagens disponíveis neste mês.`
  };
}

/**
 * Verifica se o usuário tem acesso a um recurso específico com base no seu plano
 * @param userId ID do usuário
 * @param feature Nome do recurso a ser verificado
 * @returns Um objeto contendo o resultado da verificação
 */
export async function checkFeatureAccess(userId: string, feature: string) {
  const supabase = createServerClient();
  
  // Buscar o plano do usuário
  const { data: user } = await supabase
    .from('users')
    .select('plan_id, plans(features)')
    .eq('id', userId)
    .single();
  
  if (!user || !user.plans || !user.plans.features) {
    return { allowed: false, message: 'Plano não encontrado' };
  }
  
  const features = user.plans.features;
  const hasAccess = features[feature] === true;
  
  return {
    allowed: hasAccess,
    message: hasAccess 
      ? `Você tem acesso a este recurso.`
      : `Este recurso não está disponível no seu plano atual. Faça upgrade para acessá-lo.`
  };
}

/**
 * Verifica se o usuário atingiu o limite de dispositivos do seu plano
 * @param userId ID do usuário
 * @returns Um objeto contendo o resultado da verificação
 */
export async function checkDeviceLimit(userId: string) {
  const supabase = createServerClient();
  
  // Buscar o plano do usuário
  const { data: user } = await supabase
    .from('users')
    .select('plan_id, plans(features)')
    .eq('id', userId)
    .single();
  
  if (!user || !user.plans || !user.plans.features) {
    return { allowed: false, message: 'Plano não encontrado' };
  }
  
  // Contar quantos dispositivos o usuário já tem
  const { count } = await supabase
    .from('devices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  const deviceLimit = user.plans.features.dispositivos || 1;
  const currentCount = count || 0;
  
  return {
    allowed: currentCount < deviceLimit,
    current: currentCount,
    limit: deviceLimit,
    message: currentCount >= deviceLimit 
      ? `Você atingiu o limite de ${deviceLimit} dispositivos do seu plano. Faça upgrade para adicionar mais dispositivos.`
      : `Você tem ${currentCount} de ${deviceLimit} dispositivos disponíveis.`
  };
}