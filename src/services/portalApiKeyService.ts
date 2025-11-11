import { supabase } from './supabaseClient';

/**
 * Genera un Client ID único para un usuario
 * Portal requiere un Client ID único por usuario/wallet
 */
function generateUniqueClientId(userId: string): string {
  // Generar un Client ID único basado en el userId y timestamp
  // Formato: pumapay-{userId}-{timestamp}-{random}
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `pumapay-${userId}-${timestamp}-${random}`;
}

export async function asignarApiKeyAUsuario(userId: string) {
  // 1. Buscar la primera API Key libre
  const { data: apis, error } = await supabase
    .from('portal_apikeys')
    .select('*')
    .eq('in_use', false)
    .order('id', { ascending: true })
    .limit(1);

  if (error) throw error;
  if (!apis || apis.length === 0) throw new Error('No hay API Keys disponibles');

  const api = apis[0];

  // 2. Generar un Client ID único para este usuario
  // IMPORTANTE: Cada usuario necesita su propio Client ID único
  // Portal usa el Client ID para identificar y autenticar a cada cliente/wallet
  const uniqueClientId = generateUniqueClientId(userId);
  
  console.log('🆔 Generando Client ID único para usuario:', {
    userId,
    clientId: uniqueClientId,
    apiKey: api.api_key?.substring(0, 10) + '...'
  });

  // 3. Marcarla como asignada y guardar el Client ID único
  const { error: updateError } = await supabase
    .from('portal_apikeys')
    .update({
      in_use: true,
      assigned_to: userId,
      assigned_at: new Date().toISOString(),
      // Si la tabla tiene un campo client_id, actualizarlo
      // Si no, lo retornaremos en el objeto
    })
    .eq('id', api.id);

  if (updateError) throw updateError;

  // 4. Retornar la API Key con el Client ID único generado
  return {
    ...api,
    client_id: uniqueClientId // Sobrescribir o agregar el Client ID único
  };
} 