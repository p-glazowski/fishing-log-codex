import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { catchSchema } from '@lurelog/shared';
import { LureModel, CatchModel } from '../models/index.js';
import { send, id, owned, notFound, queueImage } from '../utils/http.js';
import { querySchema, escape } from '../validators/query.js';
export const catchRouter = Router();
async function listCatches(req: Request, res: Response) {
  const q = querySchema.parse(req.query);
  const filter: Record<string, unknown> = { userId: req.userId };
  if (req.params.id) {
    const lure = await LureModel.exists(owned(req));
    if (!lure) return notFound();
    filter.lureId = id(req.params.id);
  } else if (q.lure) filter.lureId = id(q.lure);
  if (q.search) filter.species = { $regex: escape(q.search), $options: 'i' };
  if (q.species) filter.species = q.species;
  if (q.from || q.to || q.fromInstant || q.toExclusive)
    filter.caughtAt = {
      ...(q.fromInstant
        ? { $gte: new Date(q.fromInstant) }
        : q.from
          ? { $gte: new Date(q.from) }
          : {}),
      ...(q.toExclusive
        ? { $lt: new Date(q.toExclusive) }
        : q.to
          ? { $lte: new Date(q.to + 'T23:59:59.999Z') }
          : {}),
    };
  const sort: Record<string, 1 | -1> =
    q.sort === 'length'
      ? { lengthCm: -1 as const, _id: -1 as const }
      : q.sort === 'weight'
        ? { weightKg: -1 as const, _id: -1 as const }
        : { caughtAt: -1 as const, _id: -1 as const };
  const [data, total] = await Promise.all([
    CatchModel.find(filter)
      .sort(sort)
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate({
        path: 'lureId',
        match: { userId: req.userId },
        select: 'name brand image type lengthMm',
      })
      .lean(),
    CatchModel.countDocuments(filter),
  ]);
  res.json({ data, total, page: q.page, pages: Math.ceil(total / q.limit) });
}
catchRouter.get('/catches', listCatches);
catchRouter.get('/lures/:id/catches', listCatches);
catchRouter.post('/catches', async (req, res) => {
  const body = catchSchema.parse(req.body);
  let result;
  await mongoose.connection.transaction(async (session) => {
    const lure = await LureModel.findOneAndUpdate(
      { _id: body.lureId, userId: req.userId },
      { $inc: { revision: 1 } },
      { session },
    );
    if (!lure) return notFound();
    [result] = await CatchModel.create([{ ...body, userId: req.userId }], { session });
  });
  send(res, result, 201);
});
catchRouter.get('/catches/:id', async (req, res) => {
  const item = await CatchModel.findOne(owned(req)).populate({
    path: 'lureId',
    match: { userId: req.userId },
  });
  if (!item) return notFound();
  send(res, item);
});
catchRouter.patch('/catches/:id', async (req, res) => {
  const body = catchSchema.partial().parse(req.body);
  let result;
  await mongoose.connection.transaction(async (session) => {
    const existing = await CatchModel.findOne(owned(req)).session(session);
    if (!existing) return notFound();
    const lure = await LureModel.findOneAndUpdate(
      { _id: body.lureId ?? existing.lureId, userId: req.userId },
      { $inc: { revision: 1 } },
      { session },
    );
    if (!lure) return notFound();
    result = await CatchModel.findOneAndUpdate(
      owned(req),
      { $set: body },
      { returnDocument: 'after', runValidators: true, session },
    );
  });
  send(res, result);
});
catchRouter.delete('/catches/:id', async (req, res) => {
  await mongoose.connection.transaction(async (session) => {
    const item = await CatchModel.findOneAndDelete(owned(req), { session });
    if (!item) return notFound();
    await queueImage(item.photo, session);
  });
  res.status(204).end();
});
