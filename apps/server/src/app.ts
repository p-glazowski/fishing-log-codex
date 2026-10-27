import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { lureTypes, fishSpecies } from '@lurelog/shared';
import { clientOrigins } from './config/origins.js';
import { env } from './config/env.js';
import { auth, csrf, HttpError } from './middleware/security.js';
import { errorHandler } from './middleware/errors.js';
import { authRouter } from './routes/auth.js';
import { lureRouter } from './routes/lures.js';
import { catchRouter } from './routes/catches.js';
import { uploadRouter, mediaRouter } from './routes/images.js';
import { dashboardRouter } from './routes/dashboard.js';
import { send } from './utils/http.js';
export const app = express();
app.disable('x-powered-by');
if (env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'blob:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  }),
  cors({ origin: clientOrigins, credentials: true }),
  express.json({ limit: '64kb' }),
  cookieParser(),
);
app.use(
  '/api',
  rateLimit({
    windowMs: 60000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' },
      });
    },
  }),
);
const api = express.Router();
app.use(
  '/api/v1',
  (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  },
  api,
);
api.use(csrf);
api.use(authRouter);
api.use(auth);
api.get('/config', (_req, res) => send(res, { lureTypes, fishSpecies }));
api.use(lureRouter, catchRouter, uploadRouter, dashboardRouter);
app.use('/media', mediaRouter);
app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Endpoint not found')));
if (env.NODE_ENV === 'production') {
  const client = path.resolve(import.meta.dirname, '../../client/dist');
  app.use(express.static(client));
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(client, 'index.html')));
}
app.use(errorHandler);
