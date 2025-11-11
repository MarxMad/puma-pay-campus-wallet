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
  // 1. Verificar si el usuario ya tiene un Client ID guardado en la base de datos
  const { data: existingUser, error: userError } = await supabase
    .from('usuarios')
    .select('client_id, api_key')
    .eq('id', userId)
    .single();

  if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw userError;
  }

  // Si el usuario ya tiene un Client ID, usarlo
  if (existingUser?.client_id) {
    console.log('✅ Usuario ya tiene Client ID guardado:', existingUser.client_id);
    
    // Si también tiene API Key, retornarla
    if (existingUser.api_key) {
      // Buscar la API Key en la tabla portal_apikeys
      const { data: apiKeyData, error: apiError } = await supabase
        .from('portal_apikeys')
        .select('*')
        .eq('api_key', existingUser.api_key)
        .single();
      
      if (!apiError && apiKeyData) {
        return {
          ...apiKeyData,
          client_id: existingUser.client_id
        };
      }
    }
  }

  // 2. Buscar la primera API Key libre
  const { data: apis, error } = await supabase
    .from('portal_apikeys')
    .select('*')
    .eq('in_use', false)
    .order('id', { ascending: true })
    .limit(1);

  if (error) throw error;
  if (!apis || apis.length === 0) throw new Error('No hay API Keys disponibles');

  const api = apis[0];

  // 3. Generar un Client ID único para este usuario (solo si no existe)
  // IMPORTANTE: Cada usuario necesita su propio Client ID único
  // Portal usa el Client ID para identificar y autenticar a cada cliente/wallet
  const uniqueClientId = existingUser?.client_id || generateUniqueClientId(userId);
  
  console.log('🆔 Asignando Client ID para usuario:', {
    userId,
    clientId: uniqueClientId,
    esNuevo: !existingUser?.client_id,
    apiKey: api.api_key?.substring(0, 10) + '...'
  });

  // 4. Marcarla como asignada
  const { error: updateError } = await supabase
    .from('portal_apikeys')
    .update({
      in_use: true,
      assigned_to: userId,
      assigned_at: new Date().toISOString()
    })
    .eq('id', api.id);

  if (updateError) throw updateError;

  // 5. Guardar el Client ID en la tabla usuarios si no existe
  if (!existingUser?.client_id) {
    const { error: clientIdError } = await supabase
      .from('usuarios')
      .update({ client_id: uniqueClientId })
      .eq('id', userId);
    
    if (clientIdError) {
      console.warn('⚠️ No se pudo guardar client_id en usuarios:', clientIdError);
      // No lanzamos error, continuamos
    }
  }

  // 6. Retornar la API Key con el Client ID
  return {
    ...api,
    client_id: uniqueClientId
  };
} 