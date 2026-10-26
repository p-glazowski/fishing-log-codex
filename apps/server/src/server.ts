import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { UserModel, LureModel, CatchModel, CleanupModel } from './models/index.js';
import { drainCleanup } from './services/storage.js';
await mongoose.connect(env.MONGODB_URI);
await Promise.all([UserModel.init(), LureModel.init(), CatchModel.init(), CleanupModel.init()]);
const server = app.listen(env.PORT, () =>
  console.log(`LureLog API listening on http://localhost:${env.PORT}`),
);
let cleaning = false;
const timer = setInterval(async () => {
  if (cleaning) return;
  cleaning = true;
  try {
    await drainCleanup();
  } catch (error) {
    console.error('Image cleanup failed', error);
  } finally {
    cleaning = false;
  }
}, 30000);
timer.unref();
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    clearInterval(timer);
    server.close(() => {
      void mongoose.disconnect().then(() => process.exit(0));
    });
  });
