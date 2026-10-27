import { env } from './env.js';

export function getClientOrigins(origin: string, mode: 'development' | 'test' | 'production') {
  const configured = new URL(origin);
  const origins = new Set([configured.origin]);
  if (mode === 'development') {
    // Only the configured frontend port is trusted; never allow arbitrary LAN origins.
    const port = configured.port || (configured.protocol === 'https:' ? '443' : '80');
    origins.add(`${configured.protocol}//localhost:${port}`);
    origins.add(`${configured.protocol}//127.0.0.1:${port}`);
  }
  return [...origins].map((origin) => new URL(origin).origin);
}
export const clientOrigins = getClientOrigins(env.CLIENT_ORIGIN, env.NODE_ENV);
export const isClientOrigin = (origin: string | undefined) =>
  !!origin && clientOrigins.includes(origin);
