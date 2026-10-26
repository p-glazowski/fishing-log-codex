import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { UserModel } from '../models/index.js';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}
export const cookieName = env.NODE_ENV === 'production' ? '__Host-lurelog' : 'lurelog';
export const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
export function setSession(res: Response, user: { _id: unknown; sessionVersion?: number }) {
  res.cookie(
    cookieName,
    jwt.sign({ sub: String(user._id), v: user.sessionVersion ?? 0 }, env.JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'lurelog',
      audience: 'lurelog-web',
    }),
    { ...cookieOptions, maxAge: 7 * 86400000 },
  );
}
export async function auth(req: Request, _res: Response, next: NextFunction) {
  try {
    const payload = jwt.verify(req.cookies[cookieName] ?? '', env.JWT_SECRET, {
      issuer: 'lurelog',
      audience: 'lurelog-web',
      algorithms: ['HS256'],
    }) as jwt.JwtPayload;
    const user = await UserModel.findById(payload.sub).select('+sessionVersion');
    if (!user || payload.v !== user.sessionVersion) throw new Error();
    req.userId = String(user._id);
    next();
  } catch {
    next(new HttpError(401, 'Please sign in to continue'));
  }
}
const csrfCookieName = env.NODE_ENV === 'production' ? '__Host-lurelog-csrf' : 'lurelog-csrf';
export function csrf(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' && req.path === '/csrf') {
    const existing = req.cookies[csrfCookieName];
    const token =
      typeof existing === 'string' && /^[a-f0-9]{64}$/.test(existing)
        ? existing
        : randomBytes(32).toString('hex');
    res.cookie(csrfCookieName, token, { ...cookieOptions, maxAge: 86400000 });
    res.json({ data: { token } });
    return;
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (req.get('origin') !== env.CLIENT_ORIGIN)
      return next(new HttpError(403, 'Request origin is not allowed'));
    const token = req.get('x-csrf-token') ?? '';
    const cookie = req.cookies[csrfCookieName] ?? '';
    if (
      !/^[a-f0-9]{64}$/.test(token) ||
      typeof cookie !== 'string' ||
      !/^[a-f0-9]{64}$/.test(cookie) ||
      !timingSafeEqual(Buffer.from(token), Buffer.from(cookie))
    )
      return next(new HttpError(403, 'Session verification failed. Refresh and try again.'));
  }
  next();
}
