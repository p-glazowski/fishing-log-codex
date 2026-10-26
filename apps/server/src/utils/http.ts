import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CleanupModel } from '../models/index.js';
import { HttpError } from '../middleware/security.js';
export const send = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ data });
export const userSafe = (u: unknown) => {
  const { _id, name, email, avatar, createdAt } = u as Record<string, unknown>;
  return { _id, name, email, avatar, createdAt };
};
export const id = (value: unknown) => {
  if (
    typeof value !== 'string' ||
    !mongoose.isValidObjectId(value) ||
    !/^[a-f\d]{24}$/i.test(value)
  )
    throw new HttpError(400, 'Invalid record ID');
  return value;
};
export const owned = (req: Request) => ({ _id: id(req.params.id), userId: req.userId });
export const notFound = () => {
  throw new HttpError(404, 'Record not found');
};
export const queueImage = async (image: unknown, session: mongoose.ClientSession) => {
  if (image) {
    const { provider, fileId } = image as { provider: string; fileId: string };
    await CleanupModel.create([{ provider, fileId }], { session });
  }
};
