import { supabase } from './supabaseClient';
import bcrypt from 'bcryptjs';

export async function registrarUsuario({
  nombre,
  apellido,
  email,
  password,
  wallet_address,
  clabe,
  api_key,
  auth_method,
  email_verified,
}: {
  nombre: string,
  apellido: string,
  email: string,
  password: string,
  wallet_address: string,
  clabe: string,
  api_key?: string,
  auth_method: string,
  email_verified?: boolean,
}) {
  const password_hash = await bcrypt.hash(password, 10);
  const row: Record<string, unknown> = {
    nombre,
    apellido,
    email,
    password_hash,
    wallet_address,
    clabe,
    api_key,
    auth_method,
  };
  if (email_verified !== undefined) {
    row.email_verified = email_verified;
  }
  const { data, error } = await supabase
    .from('usuarios')
    .insert([row])
    .select();
  if (error) throw error;
  return data;
}

/** Obtener usuario completo por email (sin validar contraseña). Para usar tras login con Supabase Auth. */
export async function getUsuarioByEmailFull(email: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Marcar email como verificado (tras confirmar enlace de Supabase).
 * Si la tabla no tiene la columna email_verified (migración no aplicada), no hace nada y no lanza.
 */
export async function updateEmailVerified(email: string): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .update({ email_verified: true })
    .eq('email', email);
  if (error) {
    if (error.code === 'PGRST204' || error.message?.includes('email_verified')) {
      return;
    }
    throw error;
  }
}

export async function obtenerUsuarioPorEmail(email: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, email')
    .eq('email', email)
    .limit(1);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0];
}

export async function loginUsuario(email: string, password: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();
  if (error) throw error;
  const valido = await bcrypt.compare(password, data.password_hash);
  if (!valido) throw new Error('Contraseña incorrecta');
  return data;
}