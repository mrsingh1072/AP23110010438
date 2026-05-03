export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://20.207.122.201/evaluation-service').replace(/\/$/, '');

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
