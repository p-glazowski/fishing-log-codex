import { getLocale, canonicalSpecies } from './i18n';
import type { User, Lure, FishCatch, Stats, Page, DailyActivity } from '@lurelog/shared';
let csrfToken = '';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method ?? 'GET';
  if (!['GET', 'HEAD'].includes(method) && !csrfToken) {
    const res = await fetch('/api/v1/csrf', { credentials: 'include' });
    if (!res.ok) throw new ApiError(res.status, 'Cannot verify your session');
    csrfToken = (await res.json()).data.token;
  }
  const res = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(!(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' ? { 'X-CSRF-Token': csrfToken } : {}),
      ...options.headers,
    },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 403) csrfToken = '';
    throw new ApiError(res.status, body.error?.message ?? 'Could not connect to LureLog');
  }
  return body as T;
}
export async function data<T>(path: string, options?: RequestInit) {
  return (await request<{ data: T }>(path, options)).data;
}
export const json = (body: unknown) => JSON.stringify(body);
export const api = {
  me: () => data<User>('/auth/me'),
  lure: (id: string, options?: RequestInit) => data<Lure>(`/lures/${id}`, options),
  catch: (id: string) => data<FishCatch>(`/catches/${id}`),
  stats: () => data<Stats>('/dashboard/stats'),
  activity: (month: string) =>
    data<DailyActivity>(`/dashboard/activity?month=${encodeURIComponent(month)}`),
  lures: (query = '', options?: RequestInit) => request<Page<Lure>>(`/lures?${query}`, options),
  catches: (query = '') => {
    const params = new URLSearchParams(query);
    if (params.has('search')) params.set('search', canonicalSpecies(params.get('search')!));
    return request<Page<FishCatch>>(`/catches?${params}`);
  },
};
export async function upload(path: string, file: File) {
  const form = new FormData();
  form.set('image', file);
  return data(path, { method: 'POST', body: form });
}
export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong';
export const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString(getLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
export const lureOf = (item: FishCatch) => (typeof item.lureId === 'object' ? item.lureId : null);
