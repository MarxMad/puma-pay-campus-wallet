import { buildApiUrl } from '@/config/backend';

/**
 * Servicio para obtener Client Session Tokens de Portal
 * 
 * Según la documentación de Portal:
 * - Portal API Key se usa en el servidor para crear Client Session Tokens
 * - Client Session Token se usa en el SDK del cliente para autenticar usuarios
 */

export interface PortalClientResponse {
  success: boolean;
  clientId: string;
  clientSessionToken: string;
  metadata?: {
    timestamp: string;
  };
}

export interface PortalSessionResponse {
  success: boolean;
  clientSessionToken: string;
  metadata?: {
    timestamp: string;
  };
}

/**
 * Crear un nuevo cliente en Portal y obtener Client Session Token
 * Este endpoint usa la Portal API Key en el servidor para crear el cliente
 */
export async function createPortalClient(): Promise<PortalClientResponse> {
  try {
    const response = await fetch(buildApiUrl('/portal/create-client'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error al crear cliente en Portal');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('❌ Error creando cliente en Portal:', error);
    throw new Error(`No se pudo crear cliente en Portal: ${error.message || error}`);
  }
}

/**
 * Refrescar Client Session Token para un cliente existente
 * Los Client Session Tokens expiran después de 24 horas de inactividad
 */
export async function refreshPortalSession(clientId: string): Promise<PortalSessionResponse> {
  try {
    const response = await fetch(buildApiUrl(`/portal/refresh-session/${clientId}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error al refrescar Client Session Token');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('❌ Error refrescando Client Session Token:', error);
    throw new Error(`No se pudo refrescar Client Session Token: ${error.message || error}`);
  }
}

