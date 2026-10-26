import { Router } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { LureModel, CatchModel, UserModel, CleanupModel } from '../models/index.js';
import { auth, HttpError } from '../middleware/security.js';
import { send, id, owned, notFound, queueImage } from '../utils/http.js';
import { saveImage, deleteFile, uploadRoot, cloudUrl } from '../services/storage.js';
export const uploadRouter = Router();
export const mediaRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
});
const uploadLimit = rateLimit({
  windowMs: 60000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' },
    });
  },
});
for (const [route, kind, field] of [
  ['/lures/:id/image', 'lure', 'image'],
  ['/catches/:id/photo', 'catch', 'photo'],
  ['/users/me/avatar', 'user', 'avatar'],
] as const) {
  uploadRouter.post(route, uploadLimit, upload.single('image'), async (req, res) => {
    const filter = kind === 'user' ? { _id: req.userId } : owned(req);
    const model = (
      kind === 'lure' ? LureModel : kind === 'catch' ? CatchModel : UserModel
    ) as mongoose.Model<unknown>;
    if (!(await model.exists(filter))) return notFound();
    if (!req.file) throw new HttpError(400, 'Choose an image');
    const image = await saveImage(req.file.buffer, req.userId);
    try {
      await mongoose.connection.transaction(async (session) => {
        const old = await model
          .findOneAndUpdate(filter, { $set: { [field]: image } }, { session })
          .lean();
        if (!old) return notFound();
        await queueImage((old as Record<string, unknown>)[field], session);
      });
    } catch (error) {
      try {
        await deleteFile(image.provider, image.fileId);
      } catch {
        await CleanupModel.create({ provider: image.provider, fileId: image.fileId });
      }
      throw error;
    }
    send(res, image, 201);
  });
}
mediaRouter.get('/:imageId', auth, async (req, res) => {
  const imageId = id(req.params.imageId);
  const [lure, fish, user] = await Promise.all([
    LureModel.findOne({ userId: req.userId, 'image._id': imageId }).lean(),
    CatchModel.findOne({ userId: req.userId, 'photo._id': imageId }).lean(),
    UserModel.findOne({ _id: req.userId, 'avatar._id': imageId }).lean(),
  ]);
  const image = lure?.image ?? fish?.photo ?? user?.avatar;
  if (!image) return notFound();
  res.set('Cache-Control', 'private, no-store');
  res.type('webp');
  if (image.provider === 'cloudinary') {
    const upstream = await fetch(cloudUrl(image.fileId));
    if (!upstream.ok || !upstream.body)
      throw new HttpError(502, 'Photo storage is temporarily unavailable');
    await pipeline(
      Readable.fromWeb(upstream.body as import('node:stream/web').ReadableStream),
      res,
    );
    return;
  }
  res.type('webp').sendFile(path.resolve(uploadRoot, image.fileId));
});
