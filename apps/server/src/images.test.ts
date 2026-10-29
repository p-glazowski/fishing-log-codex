import { beforeAll, afterAll, it, expect } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import supertest from 'supertest';
import sharp from 'sharp';
import { app } from './app.js';
import { UserModel, CleanupModel } from './models/index.js';
import { drainCleanup } from './services/storage.js';
let mongo: MongoMemoryReplSet;
const owner = supertest.agent(app),
  other = supertest.agent(app);
const origin = 'http://localhost:5173';
let ownerToken = '',
  otherToken = '',
  lureId = '',
  catchId = '';
const write = (agent: typeof owner, token: string, method: 'post' | 'delete', route: string) =>
  agent[method]('/api/v1' + route)
    .set('Origin', origin)
    .set('X-CSRF-Token', token);
beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  await UserModel.init();
  ownerToken = (await owner.get('/api/v1/csrf')).body.data.token;
  otherToken = (await other.get('/api/v1/csrf')).body.data.token;
  for (const [agent, token, email] of [
    [owner, ownerToken, 'photo-owner@example.test'],
    [other, otherToken, 'photo-other@example.test'],
  ] as const)
    expect(
      (
        await write(agent, token, 'post', '/auth/register').send({
          name: 'Photo QA',
          email,
          password: 'photo-removal-test-2026',
        })
      ).status,
    ).toBe(201);
  lureId = (
    await write(owner, ownerToken, 'post', '/lures').send({
      name: 'Aglia',
      brand: 'Mepps',
      type: 'Spinner',
      lengthMm: 45,
    })
  ).body.data._id;
  catchId = (
    await write(owner, ownerToken, 'post', '/catches').send({
      lureId,
      species: 'Trout',
      caughtAt: '2026-10-01T08:00:00Z',
    })
  ).body.data._id;
});
afterAll(async () => {
  await drainCleanup();
  await mongoose.disconnect();
  await mongo?.stop();
});
it.each(['lure', 'catch', 'avatar'] as const)(
  'removes an owned %s photo without deleting the record or exposing another user’s photo',
  async (kind) => {
    const route =
      kind === 'lure'
        ? `/lures/${lureId}/image`
        : kind === 'catch'
          ? `/catches/${catchId}/photo`
          : '/users/me/avatar';
    const record =
      kind === 'lure' ? `/lures/${lureId}` : kind === 'catch' ? `/catches/${catchId}` : '/users/me';
    const field = kind === 'lure' ? 'image' : kind === 'catch' ? 'photo' : 'avatar';
    const bytes = await sharp({
      create: { width: 20, height: 20, channels: 3, background: '#24543f' },
    })
      .png()
      .toBuffer();
    const uploaded = await write(owner, ownerToken, 'post', route).attach(
      'image',
      bytes,
      'photo.png',
    );
    expect(uploaded.status).toBe(201);
    const image = uploaded.body.data;
    const forbidden = await write(other, otherToken, 'delete', route);
    expect(forbidden.status).toBe(kind === 'avatar' ? 204 : 404);
    expect((await owner.get(image.url)).status).toBe(200);
    expect((await write(owner, ownerToken, 'delete', route)).status).toBe(204);
    expect((await owner.get('/api/v1' + record)).body.data[field]).toBeUndefined();
    expect((await owner.get(image.url)).status).toBe(404);
    expect((await owner.get('/api/v1' + record)).status).toBe(200);
    expect(await CleanupModel.exists({ fileId: image.fileId })).toBeTruthy();
    expect((await write(owner, ownerToken, 'delete', route)).status).toBe(204);
  },
);
