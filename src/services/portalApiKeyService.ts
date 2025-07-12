import { supabase } from './supabaseClient';

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

  // 2. Marcarla como asignada
  const { error: updateError } = await supabase
    .from('portal_apikeys')
    .update({
      in_use: true,
      assigned_to: userId,
      assigned_at: new Date().toISOString()
    })
    .eq('id', api.id);

  if (updateError) throw updateError;

  return api; // Devuelve la API Key para usarla en la creación de la wallet
} 