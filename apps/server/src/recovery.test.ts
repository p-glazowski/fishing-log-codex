import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { createHash } from 'node:crypto';
import { app } from './app.js';
import { UserModel } from './models/index.js';
import { sendRecoveryEmail } from './services/mail.js';
vi.mock('./services/mail.js', () => ({ sendRecoveryEmail: vi.fn().mockResolvedValue(undefined) }));
let mongo: MongoMemoryReplSet;
const agent = supertest.agent(app);
const stale = supertest.agent(app);
let resetToken = '';
let csrf = '',
  staleCsrf = '';
const write = (route: string, body: object, client = agent, token = csrf) =>
  client
    .post(`/api/v1/auth/${route}`)
    .set('Origin', 'http://localhost:5173')
    .set('X-CSRF-Token', token)
    .send(body);
beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  await UserModel.init();
  csrf = (await agent.get('/api/v1/csrf')).body.data.token;
  staleCsrf = (await stale.get('/api/v1/csrf')).body.data.token;
  await write('register', {
    name: 'Test Angler',
    email: 'recovery@example.com',
    password: 'original-password-123',
  });
  await write(
    'login',
    { email: 'recovery@example.com', password: 'original-password-123' },
    stale,
    staleCsrf,
  );
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
describe('password recovery', () => {
  it('does not reveal whether an account exists and stores only a token hash', async () => {
    const missing = await write('forgot-password', { email: 'missing@example.com' });
    const found = await write('forgot-password', { email: 'recovery@example.com' });
    expect(found.body).toEqual(missing.body);
    expect(sendRecoveryEmail).toHaveBeenCalledTimes(1);
    const token = vi.mocked(sendRecoveryEmail).mock.calls[0][1];
    resetToken = token;
    const user = await UserModel.findOne({ email: 'recovery@example.com' }).select(
      '+resetTokenHash',
    );
    expect(user?.resetTokenHash).toBe(createHash('sha256').update(token).digest('hex'));
  });
  it('allows only one concurrent use and revokes sessions', async () => {
    const token = resetToken;
    const results = await Promise.all([
      write('reset-password', { token, password: 'replacement-password-123' }),
      write('reset-password', { token, password: 'replacement-password-123' }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
    expect((await stale.get('/api/v1/auth/me')).status).toBe(401);
    expect(
      (await write('login', { email: 'recovery@example.com', password: 'original-password-123' }))
        .status,
    ).toBe(401);
    expect(
      (
        await write('login', {
          email: 'recovery@example.com',
          password: 'replacement-password-123',
        })
      ).status,
    ).toBe(200);
  });
  it('rejects expired tokens and invalidates tokens on delivery failure', async () => {
    await write('forgot-password', { email: 'recovery@example.com' });
    const token = vi.mocked(sendRecoveryEmail).mock.calls[0][1];
    await UserModel.updateOne(
      { email: 'recovery@example.com' },
      { resetTokenExpires: new Date(0) },
    );
    expect(
      (await write('reset-password', { token, password: 'replacement-password-456' })).status,
    ).toBe(400);
    vi.mocked(sendRecoveryEmail).mockRejectedValueOnce(new Error('delivery failed'));
    expect((await write('forgot-password', { email: 'recovery@example.com' })).status).toBe(200);
    const user = await UserModel.findOne({ email: 'recovery@example.com' }).select(
      '+resetTokenHash',
    );
    expect(user?.resetTokenHash).toBeUndefined();
  });
});
