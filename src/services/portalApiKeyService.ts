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
  // NOTA: Solo intentamos obtenerlo si la columna existe (para usuarios existentes)
  // Para usuarios nuevos, generaremos el client_id y lo guardaremos después
  let existingClientId: string | null = null;
  let existingApiKey: string | null = null;
  
  try {
    const { data: existingUser, error: userError } = await supabase
      .from('usuarios')
      .select('client_id, api_key')
      .eq('id', userId)
      .single();

    // Si la columna no existe (error 42703), es un usuario nuevo y continuamos
    if (userError && userError.code === '42703') {
      console.log('ℹ️ Columna client_id no existe aún, será creada para este usuario nuevo');
    } else if (userError && userError.code !== 'PGRST116') {
      // Otro error, lanzarlo
      throw userError;
    } else if (existingUser) {
      existingClientId = existingUser.client_id || null;
      existingApiKey = existingUser.api_key || null;
      
      // Si el usuario ya tiene un Client ID y API Key, retornarla
      if (existingClientId && existingApiKey) {
        console.log('✅ Usuario ya tiene Client ID guardado:', existingClientId);
        
        // Buscar la API Key en la tabla portal_apikeys
        const { data: apiKeyData, error: apiError } = await supabase
          .from('portal_apikeys')
          .select('*')
          .eq('api_key', existingApiKey)
          .single();
        
        if (!apiError && apiKeyData) {
          return {
            ...apiKeyData,
            client_id: existingClientId
          };
        }
      }
    }
  } catch (error: any) {
    // Si hay un error al obtener el usuario (por ejemplo, columna no existe), continuamos
    if (error?.code === '42703') {
      console.log('ℹ️ Columna client_id no existe aún, será creada para este usuario nuevo');
    } else {
      console.warn('⚠️ Error obteniendo datos del usuario, continuando...', error);
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
  const uniqueClientId = existingClientId || generateUniqueClientId(userId);
  
  console.log('🆔 Asignando Client ID para usuario:', {
    userId,
    clientId: uniqueClientId,
    esNuevo: !existingClientId,
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

  // 5. NO intentamos guardar el Client ID aquí porque:
  // - Si la columna no existe, fallará
  // - El Client ID se guardará en el paso 5 del flujo de creación de cuenta
  // - Para usuarios existentes, ya debería estar guardado
  console.log('ℹ️ Client ID será guardado en el paso de actualización del usuario');

  // 6. Retornar la API Key con el Client ID
  return {
    ...api,
    client_id: uniqueClientId
  };
} 