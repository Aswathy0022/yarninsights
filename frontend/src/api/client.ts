const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let authToken: string | null = localStorage.getItem('yi_token');
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('yi_token', token);
  else localStorage.removeItem('yi_token');
}

export function getAuthToken() {
  return authToken;
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  isForm?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  let body: BodyInit | undefined;
  if (options.isForm) {
    body = options.body as FormData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers, body });

  if (res.status === 401) {
    setAuthToken(null);
    onUnauthorized?.();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.detail ?? message;
    } catch {
      // ignore parse failure, use default message
    }
    throw new ApiError(res.status, message);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return res.blob() as unknown as Promise<T>;
}

export const apiGet = <T>(path: string) => request<T>(path, { method: 'GET' });
export const apiPost = <T>(path: string, bodyData?: unknown) => request<T>(path, { method: 'POST', body: bodyData });
export const apiPatch = <T>(path: string, bodyData?: unknown) => request<T>(path, { method: 'PATCH', body: bodyData });
export const apiDelete = <T>(path: string) => request<T>(path, { method: 'DELETE' });
export const apiPostForm = <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form, isForm: true });

export async function downloadFile(path: string, filename: string) {
  const headers: Record<string, string> = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) throw new ApiError(res.status, `Download failed (${res.status})`);
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
