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
  // 1. Verificar si el usuario ya tiene una API Key asignada
  // Nota: No intentamos leer client_id de usuarios porque esa columna puede no existir
  const { data: existingUser, error: userError } = await supabase
    .from('usuarios')
    .select('api_key')
    .eq('id', userId)
    .single();

  if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
    // Si el error es porque la columna no existe, continuamos
    if (userError.code === '42703') {
      console.warn('⚠️ Columna client_id no existe en usuarios, continuando sin leerla');
    } else {
      throw userError;
    }
  }

  // Si el usuario ya tiene una API Key asignada, buscar esa API Key
  if (existingUser?.api_key) {
    const { data: apiKeyData, error: apiError } = await supabase
      .from('portal_apikeys')
      .select('*')
      .eq('api_key', existingUser.api_key)
      .single();
    
    if (!apiError && apiKeyData) {
      // Generar un Client ID único para este usuario (siempre generamos uno nuevo para consistencia)
      const uniqueClientId = generateUniqueClientId(userId);
      console.log('✅ Usuario ya tiene API Key asignada, generando nuevo Client ID:', uniqueClientId);
      
      return {
        ...apiKeyData,
        client_id: uniqueClientId
      };
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

  // 3. Generar un Client ID único para este usuario
  // IMPORTANTE: Cada usuario necesita su propio Client ID único
  // Portal usa el Client ID para identificar y autenticar a cada cliente/wallet
  const uniqueClientId = generateUniqueClientId(userId);
  
  console.log('🆔 Asignando Client ID para usuario:', {
    userId,
    clientId: uniqueClientId,
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

  // 5. Guardar el Client ID en la tabla usuarios
  // Esto vincula la wallet creada con el client_id en Supabase
  try {
    const { error: clientIdError } = await supabase
      .from('usuarios')
      .update({ client_id: uniqueClientId })
      .eq('id', userId);
    
    if (clientIdError) {
      // Si la columna no existe, es un error de esquema que necesita ser corregido
      if (clientIdError.code === '42703') {
        console.error('❌ Error: La columna client_id no existe en la tabla usuarios de Supabase.');
        console.error('❌ Por favor, agrega la columna client_id (text) a la tabla usuarios en Supabase.');
        throw new Error('La columna client_id no existe en la tabla usuarios. Por favor, agrega esta columna en Supabase.');
      }
      throw clientIdError;
    }
    
    console.log('✅ Client ID guardado en Supabase:', uniqueClientId);
  } catch (error: any) {
    console.error('❌ Error guardando client_id en usuarios:', error);
    // Si es un error de columna faltante, lanzar el error
    if (error?.code === '42703' || error?.message?.includes('client_id')) {
      throw error;
    }
    // Para otros errores, continuar pero advertir
    console.warn('⚠️ No se pudo guardar client_id en usuarios, pero continuaremos');
  }

  // 6. Retornar la API Key con el Client ID
  return {
    ...api,
    client_id: uniqueClientId
  };
} 