import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, ApiErrorResponse } from '@/types/api.types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://api.devsculptor.cl/api/v1' : 'http://localhost:3000/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de Request: Inyección de JWT y X-Request-Id para trazabilidad
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Inyección de UUID v4 en cabecera X-Request-Id (Pino correlation)
    const requestId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    config.headers['X-Request-Id'] = requestId;

    // 2. Inyección de JWT Bearer
    const token = localStorage.getItem('devsculptor_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 3. Inyección transparente de BYOK AI (Zero-Retention)
    const activeKey = localStorage.getItem('devsculptor_active_ai_key');
    const activeProvider = localStorage.getItem('devsculptor_active_ai_provider');
    const activeModel = localStorage.getItem('devsculptor_active_ai_model');
    const activeEndpoint = localStorage.getItem('devsculptor_active_ai_endpoint');

    const isAiEndpoint = Boolean(
      config.url && /^\/?projects\/[0-9a-f-]{36}\/ai(\/|$)/i.test(config.url)
    );

    if (isAiEndpoint) {
      config.timeout = 60000;
    }

    if (activeKey && config.headers && isAiEndpoint) {
      config.headers['X-User-Ai-Key'] = activeKey;
      if (activeProvider) config.headers['X-User-Ai-Provider'] = activeProvider;
      if (activeModel) config.headers['X-User-Ai-Model'] = activeModel;
      if (activeEndpoint) config.headers['X-User-Ai-Endpoint'] = activeEndpoint;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Response: Manejo del envelope uniforme y mitigación de fugas
apiClient.interceptors.response.use(
  (response) => {
    // El backend devuelve siempre { success: true, data: T, meta?: PaginationMeta }
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const { status, data } = error.response;

      // Desconexión automática y limpieza de sesión ante 401
      if (status === 401) {
        localStorage.removeItem('devsculptor_token');
        localStorage.removeItem('devsculptor_user');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      // Si el backend devolvió el envelope estándar de error
      if (data && data.error) {
        let msg = data.error.message || 'Error en la solicitud';
        const details = (data.error as unknown as { details?: Array<{ field?: string; message: string }> }).details;
        if (Array.isArray(details) && details.length > 0) {
          const formattedDetails = details
            .map((d) => (d.field ? `${d.field}: ${d.message}` : d.message))
            .filter(Boolean)
            .join(', ');
          if (formattedDetails) {
            msg = `${msg} (${formattedDetails})`;
          }
        }
        return Promise.reject(new Error(msg));
      }
    } else if (error.request) {
      if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
        return Promise.reject(new Error('El asistente técnico tardó demasiado en responder (tiempo límite excedido). Por favor reintenta.'));
      }
      return Promise.reject(new Error('No se pudo establecer conexión con el servidor backend (verifique que esté activo en el puerto 3000).'));
    }

    return Promise.reject(new Error(error.message || 'Error inesperado'));
  }
);

// Helper genérico tipado para desempaquetar el envelope { success, data, meta }
export async function apiRequest<T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: unknown,
  params?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const response = await apiClient.request<ApiResponse<T>>({
    method,
    url,
    data,
    params,
  });

  return response.data;
}
