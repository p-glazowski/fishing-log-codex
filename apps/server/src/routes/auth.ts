import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema, profileSchema, passwordSchema } from '@lurelog/shared';
import { UserModel } from '../models/index.js';
import { auth, HttpError, cookieName, cookieOptions, setSession } from '../middleware/security.js';
import { send, userSafe } from '../utils/http.js';
export const authRouter = Router();
const authLimit = rateLimit({
  windowMs: 15 * 60000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' },
    });
  },
});
authRouter.get('/health', (_req, res) =>
  send(
    res,
    { status: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable' },
    mongoose.connection.readyState === 1 ? 200 : 503,
  ),
);
authRouter.post('/auth/register', authLimit, async (req, res) => {
  const body = registerSchema.parse(req.body);
  const user = await UserModel.create({
    name: body.name,
    email: body.email,
    passwordHash: await bcrypt.hash(body.password, 12),
  });
  setSession(res, user);
  send(res, userSafe(user), 201);
});
authRouter.post('/auth/login', authLimit, async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await UserModel.findOne({ email: body.email }).select(
    '+passwordHash +sessionVersion',
  );
  const valid = await bcrypt.compare(
    body.password,
    user?.passwordHash ?? '$2b$12$zYr6Iyd4EyYa5lOmG9HSeO3m8gJXb1Y5Oze/XvXR6zVDZ3Ly4XqDe',
  );
  if (!user || !valid) throw new HttpError(401, 'Email or password is incorrect');
  setSession(res, user);
  send(res, userSafe(user));
});
authRouter.post('/auth/logout', auth, async (req, res) => {
  await UserModel.updateOne({ _id: req.userId }, { $inc: { sessionVersion: 1 } });
  res.clearCookie(cookieName, cookieOptions);
  send(res, { message: 'Signed out' });
});
authRouter.get(['/auth/me', '/users/me'], auth, async (req, res) =>
  send(res, userSafe(await UserModel.findById(req.userId))),
);
authRouter.patch('/users/me', auth, async (req, res) =>
  send(
    res,
    userSafe(
      await UserModel.findByIdAndUpdate(req.userId, profileSchema.parse(req.body), {
        returnDocument: 'after',
        runValidators: true,
      }),
    ),
  ),
);
authRouter.patch('/auth/password', auth, authLimit, async (req, res) => {
  const body = passwordSchema.parse(req.body);
  const user = await UserModel.findById(req.userId).select('+passwordHash +sessionVersion');
  if (!user || !(await bcrypt.compare(body.currentPassword, user.passwordHash)))
    throw new HttpError(400, 'Current password is incorrect');
  user.passwordHash = await bcrypt.hash(body.newPassword, 12);
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();
  setSession(res, user);
  send(res, { message: 'Password updated. Other sessions have been signed out.' });
});
