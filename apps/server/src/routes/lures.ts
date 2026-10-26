import { Router } from 'express';
import mongoose from 'mongoose';
import { lureSchema } from '@lurelog/shared';
import { LureModel, CatchModel } from '../models/index.js';
import { send, owned, notFound, queueImage } from '../utils/http.js';
import { querySchema, escape } from '../validators/query.js';
export const lureRouter = Router();
async function lureWithCount(lure: Record<string, unknown>) {
  return {
    ...lure,
    catchCount: await CatchModel.countDocuments({
      lureId: lure._id as mongoose.Types.ObjectId,
      userId: lure.userId as mongoose.Types.ObjectId,
    }),
  };
}
lureRouter.get('/lures', async (req, res) => {
  const q = querySchema.parse(req.query);
  const match: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(req.userId) };
  if (q.search)
    match.$or = [
      { name: { $regex: escape(q.search), $options: 'i' } },
      { brand: { $regex: escape(q.search), $options: 'i' } },
    ];
  if (q.brand) match.brand = q.brand;
  if (q.type) match.type = q.type;
  if (q.minSize !== undefined || q.maxSize !== undefined)
    match.lengthMm = {
      ...(q.minSize !== undefined ? { $gte: q.minSize } : {}),
      ...(q.maxSize !== undefined ? { $lte: q.maxSize } : {}),
    };
  const sort: Record<string, 1 | -1> =
    q.sort === 'name'
      ? { name: 1 as const, _id: 1 as const }
      : q.sort === 'catches'
        ? { catchCount: -1 as const, _id: 1 as const }
        : { createdAt: -1 as const, _id: 1 as const };
  const [result] = await LureModel.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'catches',
        let: { lure: '$_id', owner: '$userId' },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ['$lureId', '$$lure'] }, { $eq: ['$userId', '$$owner'] }] },
            },
          },
          { $count: 'total' },
        ],
        as: 'counts',
      },
    },
    { $set: { catchCount: { $ifNull: [{ $arrayElemAt: ['$counts.total', 0] }, 0] } } },
    { $unset: 'counts' },
    {
      $facet: {
        data: [{ $sort: sort }, { $skip: (q.page - 1) * q.limit }, { $limit: q.limit }],
        total: [{ $count: 'value' }],
      },
    },
  ]);
  const total = result.total[0]?.value ?? 0;
  res.json({ data: result.data, total, page: q.page, pages: Math.ceil(total / q.limit) });
});
lureRouter.get('/lure-filters', async (req, res) =>
  send(res, await LureModel.distinct('brand', { userId: req.userId })),
);
lureRouter.post('/lures', async (req, res) =>
  send(res, await LureModel.create({ ...lureSchema.parse(req.body), userId: req.userId }), 201),
);
lureRouter.get('/lures/:id', async (req, res) => {
  const lure = await LureModel.findOne(owned(req)).lean();
  if (!lure) return notFound();
  const [summary] = await CatchModel.aggregate([
    { $match: { lureId: lure._id, userId: new mongoose.Types.ObjectId(req.userId) } },
    {
      $group: {
        _id: null,
        species: { $addToSet: '$species' },
        largestLength: { $max: '$lengthCm' },
        largestWeight: { $max: '$weightKg' },
      },
    },
  ]);
  send(res, {
    ...(await lureWithCount(lure)),
    summary: {
      species: summary?.species.length ?? 0,
      largestLength: summary?.largestLength ?? null,
      largestWeight: summary?.largestWeight ?? null,
    },
  });
});
lureRouter.patch('/lures/:id', async (req, res) => {
  const lure = await LureModel.findOneAndUpdate(
    owned(req),
    { $set: lureSchema.partial().parse(req.body), $inc: { revision: 1 } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!lure) return notFound();
  send(res, lure);
});
lureRouter.delete('/lures/:id', async (req, res) => {
  await mongoose.connection.transaction(async (session) => {
    const lure = await LureModel.findOneAndDelete(owned(req), { session });
    if (!lure) return notFound();
    const catches = await CatchModel.find({ lureId: lure._id, userId: req.userId }).session(
      session,
    );
    for (const c of catches) await queueImage(c.photo, session);
    await queueImage(lure.image, session);
    await CatchModel.deleteMany({ lureId: lure._id, userId: req.userId }, { session });
  });
  res.status(204).end();
});
