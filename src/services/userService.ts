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
  email_verified = true,
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
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{
      nombre,
      apellido,
      email,
      password_hash,
      wallet_address,
      clabe,
      api_key,
      auth_method,
      email_verified,
    }])
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

/** Marcar email como verificado (tras confirmar enlace de Supabase). */
export async function updateEmailVerified(email: string) {
  const { error } = await supabase
    .from('usuarios')
    .update({ email_verified: true })
    .eq('email', email);
  if (error) throw error;
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