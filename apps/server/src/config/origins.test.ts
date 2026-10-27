import { expect, it, vi } from 'vitest';
import supertest from 'supertest';

vi.mock('./env.js', async (original) => {
  const actual = await original<typeof import('./env.js')>();
  return {
    ...actual,
    env: { ...actual.env, NODE_ENV: 'development', CLIENT_ORIGIN: 'http://192.168.1.22:5173' },
  };
});
import { getClientOrigins } from './origins.js';
import { app } from '../app.js';

it('allows the configured LAN origin and exact loopback addresses only in development', () => {
  expect(getClientOrigins('http://192.168.1.22:5173/', 'development')).toEqual([
    'http://192.168.1.22:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]);
  expect(getClientOrigins('https://app.example.com/', 'production')).toEqual([
    'https://app.example.com',
  ]);
  expect(getClientOrigins('http://localhost:5173', 'test')).toEqual(['http://localhost:5173']);
});
it('uses the same trusted origins for CORS and CSRF, while retaining token validation', async () => {
  for (const origin of [
    'http://192.168.1.22:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]) {
    const agent = supertest.agent(app);
    const response = await agent.get('/api/v1/csrf').set('Origin', origin);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    const token = response.body.data.token;
    const submitted = await agent
      .post('/api/v1/auth/register')
      .set('Origin', origin)
      .set('X-CSRF-Token', token)
      .send({});
    // An empty registration reaches request validation; no database write occurs.
    expect(submitted.status).toBe(422);
    expect((await agent.post('/api/v1/auth/register').set('Origin', origin).send({})).status).toBe(
      403,
    );
    for (const untrusted of [
      'https://evil.test',
      'http://192.168.1.23:5173',
      'http://localhost:5174',
      'http://localhost.evil.test:5173',
    ]) {
      const rejected = await agent
        .post('/api/v1/auth/register')
        .set('Origin', untrusted)
        .set('X-CSRF-Token', token)
        .send({});
      expect(rejected.status).toBe(403);
      expect(rejected.headers['access-control-allow-origin']).toBeUndefined();
      expect(rejected.body.error.message).toBe('Request origin is not allowed');
    }
    expect(
      (await agent.post('/api/v1/auth/register').set('X-CSRF-Token', token).send({})).status,
    ).toBe(403);
  }
});
