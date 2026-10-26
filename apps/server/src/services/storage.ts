import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { CleanupModel } from '../models/index.js';
import { HttpError } from '../middleware/security.js';
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});
export const uploadRoot = path.resolve(env.UPLOAD_DIR);
export async function saveImage(buffer: Buffer, userId: string) {
  const kind = await fileTypeFromBuffer(buffer);
  if (!kind || !['image/jpeg', 'image/png', 'image/webp'].includes(kind.mime))
    throw new HttpError(415, 'Choose a JPEG, PNG, or WebP image');
  let optimized: Buffer;
  try {
    optimized = await sharp(buffer, { limitInputPixels: 40000000, animated: false })
      .rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    throw new HttpError(415, 'This image is invalid or too large to decode');
  }
  const id = new mongoose.Types.ObjectId();
  let fileId = `${userId}/${randomUUID()}.webp`;
  if (env.STORAGE_PROVIDER === 'local') {
    await mkdir(path.join(uploadRoot, userId), { recursive: true });
    await writeFile(path.join(uploadRoot, fileId), optimized, { flag: 'wx' });
  } else {
    const result = await new Promise<{ public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `lurelog/${userId}`,
          type: 'authenticated',
          resource_type: 'image',
          format: 'webp',
        },
        (error, result) => (error || !result ? reject(error) : resolve(result)),
      );
      stream.end(optimized);
    });
    fileId = result.public_id;
  }
  return { _id: id, provider: env.STORAGE_PROVIDER, fileId, url: `/media/${id}` };
}
export async function deleteFile(provider: string, fileId: string) {
  if (provider === 'cloudinary') {
    const result = await cloudinary.uploader.destroy(fileId, {
      type: 'authenticated',
      invalidate: true,
    });
    if (!['ok', 'not found'].includes(result.result)) throw new Error('Cloudinary cleanup failed');
  } else {
    const resolved = path.resolve(uploadRoot, fileId);
    if (!resolved.startsWith(uploadRoot + path.sep)) throw new Error('Invalid storage path');
    await unlink(resolved).catch((e: NodeJS.ErrnoException) => {
      if (e.code !== 'ENOENT') throw e;
    });
  }
}
export async function drainCleanup() {
  for (const job of await CleanupModel.find().limit(50)) {
    try {
      await deleteFile(job.provider!, job.fileId!);
      await job.deleteOne();
    } catch {
      await CleanupModel.updateOne({ _id: job._id }, { $inc: { attempts: 1 } });
    }
  }
}
export function cloudUrl(fileId: string) {
  return cloudinary.url(fileId, {
    type: 'authenticated',
    sign_url: true,
    secure: true,
    format: 'webp',
  });
}
