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
  auth_method
}: {
  nombre: string,
  apellido: string,
  email: string,
  password: string,
  wallet_address: string,
  clabe: string,
  api_key?: string,
  auth_method: string
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
      auth_method
    }])
    .select(); // <-- Esto asegura que se retorne el usuario insertado con su ID
  if (error) throw error;
  return data;
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