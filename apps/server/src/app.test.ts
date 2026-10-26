import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import supertest from 'supertest';
import sharp from 'sharp';
import { app } from './app.js';
import { CatchModel, CleanupModel, UserModel } from './models/index.js';
import { drainCleanup } from './services/storage.js';
import { rm } from 'node:fs/promises';
let mongo: MongoMemoryReplSet;
const origin = 'http://localhost:5173';
const alice = supertest.agent(app),
  bob = supertest.agent(app);
let aToken = '',
  bToken = '',
  lureId = '',
  catchId = '',
  imageUrl = '';
const lure = { name: 'Original Floater', brand: 'Rapala', type: 'Minnow', lengthMm: 90 };
const catchBody = (id: string) => ({
  species: 'Northern Pike',
  lureId: id,
  caughtAt: '2026-10-23T08:30:00Z',
  lengthCm: 78,
  weightKg: 3.2,
});
const write = (
  agent: typeof alice,
  method: 'post' | 'patch' | 'delete',
  route: string,
  token = aToken,
) => agent[method](`/api/v1${route}`).set('Origin', origin).set('X-CSRF-Token', token);
beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(mongo.getUri());
  await UserModel.init();
  aToken = (await alice.get('/api/v1/csrf')).body.data.token;
  bToken = (await bob.get('/api/v1/csrf')).body.data.token;
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
  await rm('./uploads/test', { recursive: true, force: true });
});
describe('private fishing workspace', () => {
  it('guards private records and rejects forged origins/CSRF', async () => {
    expect((await supertest(app).get('/api/v1/lures')).status).toBe(401);
    expect((await alice.post('/api/v1/auth/register').send({})).status).toBe(403);
    expect(
      (
        await alice
          .post('/api/v1/auth/register')
          .set('Origin', 'https://evil.test')
          .set('X-CSRF-Token', aToken)
          .send({})
      ).status,
    ).toBe(403);
  });
  it('validates registration and establishes an HTTP-only session', async () => {
    expect(
      (
        await write(alice, 'post', '/auth/register').send({
          name: 'A',
          email: 'bad',
          password: 'short',
        })
      ).status,
    ).toBe(422);
    const result = await write(alice, 'post', '/auth/register').send({
      name: 'Alice Angler',
      email: 'alice@example.com',
      password: 'strong-password-123',
    });
    expect(result.status).toBe(201);
    expect(result.headers['set-cookie'].join(';')).toContain('HttpOnly');
    expect(result.body.data).not.toHaveProperty('passwordHash');
    expect((await alice.get('/api/v1/auth/me')).body.data.email).toBe('alice@example.com');
    expect(
      (
        await write(bob, 'post', '/auth/register', bToken).send({
          name: 'Bob Fisher',
          email: 'bob@example.com',
          password: 'strong-password-456',
        })
      ).status,
    ).toBe(201);
  });
  it('rejects duplicate accounts and incorrect credentials', async () => {
    expect(
      (
        await write(alice, 'post', '/auth/register').send({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'strong-password-123',
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await write(alice, 'post', '/auth/login').send({
          email: 'alice@example.com',
          password: 'incorrect',
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await write(alice, 'post', '/auth/login').send({
          email: 'alice@example.com',
          password: 'strong-password-123',
        })
      ).status,
    ).toBe(200);
  });
  it('creates, filters, validates and edits an owned lure', async () => {
    expect((await write(alice, 'post', '/lures').send({ ...lure, lengthMm: -1 })).status).toBe(422);
    expect(
      (
        await write(alice, 'post', '/lures').send({
          ...lure,
          userId: new mongoose.Types.ObjectId(),
        })
      ).status,
    ).toBe(422);
    const result = await write(alice, 'post', '/lures').send(lure);
    expect(result.status).toBe(201);
    lureId = result.body.data._id;
    expect((await alice.get('/api/v1/lures?search=Rapala&type=Minnow&minSize=80')).body.total).toBe(
      1,
    );
    expect((await alice.get('/api/v1/lures?search=%5B')).body.total).toBe(0);
    expect(
      (await write(alice, 'patch', `/lures/${lureId}`).send({ color: 'Silver' })).body.data.color,
    ).toBe('Silver');
    expect((await alice.get('/api/v1/lures/not-an-id')).status).toBe(400);
  });
  it('blocks cross-user lure CRUD, photos and catch association', async () => {
    expect((await bob.get(`/api/v1/lures/${lureId}`)).status).toBe(404);
    expect(
      (await write(bob, 'patch', `/lures/${lureId}`, bToken).send({ name: 'Stolen' })).status,
    ).toBe(404);
    expect((await write(bob, 'delete', `/lures/${lureId}`, bToken)).status).toBe(404);
    expect((await write(bob, 'post', '/catches', bToken).send(catchBody(lureId))).status).toBe(404);
    expect((await bob.get('/api/v1/lures')).body.total).toBe(0);
    expect((await bob.get(`/api/v1/lures/${lureId}/catches`)).status).toBe(404);
  });
  it('records multiple real catches and calculates dashboard totals', async () => {
    const result = await write(alice, 'post', '/catches').send(catchBody(lureId));
    expect(result.status).toBe(201);
    catchId = result.body.data._id;
    expect(
      (
        await write(alice, 'post', '/catches').send({
          ...catchBody(lureId),
          species: 'Custom River Fish',
        })
      ).status,
    ).toBe(201);
    expect((await alice.get(`/api/v1/lures/${lureId}`)).body.data.catchCount).toBe(2);
    const stats = (await alice.get('/api/v1/dashboard/stats')).body.data;
    expect(stats.totalCatches).toBe(2);
    expect(stats.uniqueSpecies).toBe(2);
    expect(stats.topLures[0].catchCount).toBe(2);
    expect(
      (await alice.get('/api/v1/catches?species=Northern%20Pike&from=2026-10-01&to=2026-10-24'))
        .body.total,
    ).toBe(1);
    expect((await bob.get('/api/v1/dashboard/stats')).body.data.totalCatches).toBe(0);
  });
  it('rejects fake files by content and oversized uploads', async () => {
    expect(
      (
        await write(alice, 'post', `/catches/${catchId}/photo`).attach(
          'image',
          Buffer.from('this is not a jpeg'),
          { filename: 'fish.jpg', contentType: 'image/jpeg' },
        )
      ).status,
    ).toBe(415);
    expect(
      (
        await write(alice, 'post', `/catches/${catchId}/photo`).attach(
          'image',
          Buffer.alloc(5 * 1024 * 1024 + 1),
          { filename: 'fish.jpg', contentType: 'image/jpeg' },
        )
      ).status,
    ).toBe(400);
  });
  it('persists optimized photos and protects them from other accounts', async () => {
    const image = await sharp({
      create: { width: 24, height: 24, channels: 3, background: '#215e42' },
    })
      .png()
      .toBuffer();
    const result = await write(alice, 'post', `/catches/${catchId}/photo`).attach('image', image, {
      filename: 'fish.png',
      contentType: 'image/png',
    });
    expect(result.status).toBe(201);
    imageUrl = result.body.data.url;
    const photo = await alice.get(imageUrl);
    expect(photo.status).toBe(200);
    expect(photo.headers['content-type']).toContain('image/webp');
    expect((await bob.get(imageUrl)).status).toBe(404);
    expect((await supertest(app).get(imageUrl)).status).toBe(401);
    expect((await alice.get(`/api/v1/catches/${catchId}`)).body.data.photo.url).toBe(imageUrl);
  });
  it('edits catches, denies cross-user actions, and validates input', async () => {
    expect(
      (
        await write(alice, 'patch', `/catches/${catchId}`).send({
          notes: 'Released safely',
          lengthCm: 81,
        })
      ).body.data.lengthCm,
    ).toBe(81);
    expect((await write(alice, 'patch', `/catches/${catchId}`).send({ weightKg: -1 })).status).toBe(
      422,
    );
    expect((await bob.get(`/api/v1/catches/${catchId}`)).status).toBe(404);
    expect(
      (await write(bob, 'patch', `/catches/${catchId}`, bToken).send({ species: 'Changed' }))
        .status,
    ).toBe(404);
    expect((await write(bob, 'delete', `/catches/${catchId}`, bToken)).status).toBe(404);
  });
  it('deletes a catch independently', async () => {
    const result = await write(alice, 'post', '/catches').send(catchBody(lureId));
    expect((await write(alice, 'delete', `/catches/${result.body.data._id}`)).status).toBe(204);
    expect((await alice.get(`/api/v1/catches/${result.body.data._id}`)).status).toBe(404);
  });
  it('cascades lure deletion atomically and queues safe photo cleanup', async () => {
    expect((await write(alice, 'delete', `/lures/${lureId}`)).status).toBe(204);
    expect(await CatchModel.countDocuments()).toBe(0);
    expect(await CleanupModel.countDocuments()).toBe(1);
    expect((await alice.get(imageUrl)).status).toBe(404);
    await drainCleanup();
    expect(await CleanupModel.countDocuments()).toBe(0);
    expect((await alice.get('/api/v1/dashboard/stats')).body.data.totalCatches).toBe(0);
  });
  it('handles concurrent catch creation and lure deletion without orphans', async () => {
    const created = await write(alice, 'post', '/lures').send(lure);
    const raceId = created.body.data._id;
    const [catchResult, deleteResult] = await Promise.all([
      write(alice, 'post', '/catches').send(catchBody(raceId)),
      write(alice, 'delete', `/lures/${raceId}`),
    ]);
    expect([201, 404]).toContain(catchResult.status);
    expect(deleteResult.status).toBe(204);
    expect(await CatchModel.countDocuments({ lureId: raceId })).toBe(0);
  });
  it('keeps CSRF tokens stable across tabs and returns structured malformed JSON errors', async () => {
    expect((await alice.get('/api/v1/csrf')).body.data.token).toBe(aToken);
    const malformed = await write(alice, 'post', '/lures')
      .set('Content-Type', 'application/json')
      .send('{bad');
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('REQUEST_ERROR');
    expect((await write(alice, 'post', '/lures', 'z'.repeat(64)).send(lure)).status).toBe(403);
  });
  it('updates profiles and passwords and revokes old sessions', async () => {
    expect(
      (
        await write(alice, 'patch', '/users/me').send({
          name: 'Alice River',
          email: 'alice@example.com',
        })
      ).body.data.name,
    ).toBe('Alice River');
    const stale = supertest.agent(app);
    const token = (await stale.get('/api/v1/csrf')).body.data.token;
    await write(stale, 'post', '/auth/login', token).send({
      email: 'alice@example.com',
      password: 'strong-password-123',
    });
    expect(
      (
        await write(alice, 'patch', '/auth/password').send({
          currentPassword: 'incorrect',
          newPassword: 'new-strong-password',
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await write(alice, 'patch', '/auth/password').send({
          currentPassword: 'strong-password-123',
          newPassword: 'new-strong-password',
        })
      ).status,
    ).toBe(200);
    expect((await stale.get('/api/v1/auth/me')).status).toBe(401);
    expect((await alice.get('/api/v1/auth/me')).status).toBe(200);
    expect((await write(alice, 'post', '/auth/logout')).status).toBe(200);
    expect((await alice.get('/api/v1/auth/me')).status).toBe(401);
  });
});
