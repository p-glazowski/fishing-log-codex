import { activityMonthSchema } from '@lurelog/shared';
import { Router } from 'express';
import mongoose from 'mongoose';
import { LureModel, CatchModel } from '../models/index.js';
import { send } from '../utils/http.js';
export const dashboardRouter = Router();
dashboardRouter.get('/dashboard/stats', async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const match = { $match: { userId } };
  const [totalLures, totalCatches, species, activity, rank, recentCatches] = await Promise.all([
    LureModel.countDocuments({ userId }),
    CatchModel.countDocuments({ userId }),
    CatchModel.aggregate([
      match,
      { $group: { _id: '$species', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]),
    CatchModel.aggregate([
      match,
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$caughtAt', timezone: 'UTC' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 24 },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: '$_id', count: 1 } },
    ]),
    CatchModel.aggregate([
      match,
      { $group: { _id: '$lureId', catchCount: { $sum: 1 } } },
      { $sort: { catchCount: -1, _id: 1 } },
      { $limit: 5 },
    ]),
    CatchModel.find({ userId })
      .sort({ caughtAt: -1 })
      .limit(4)
      .populate({ path: 'lureId', match: { userId }, select: 'name brand' })
      .lean(),
  ]);
  const ranked = await LureModel.find({ userId, _id: { $in: rank.map((r) => r._id) } }).lean();
  const topLures = rank.flatMap((r) => {
    const lure = ranked.find((l) => l._id.equals(r._id));
    return lure ? [{ ...lure, catchCount: r.catchCount }] : [];
  });
  send(res, {
    totalLures,
    totalCatches,
    uniqueSpecies: species.length,
    species,
    activity,
    topLures,
    recentCatches,
  });
});

dashboardRouter.get('/dashboard/activity', async (req, res) => {
  const month = activityMonthSchema.parse(req.query.month);
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const counts = await CatchModel.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.userId),
        caughtAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$caughtAt', timezone: 'UTC' } },
        count: { $sum: 1 },
      },
    },
  ]);
  const byDate = new Map(counts.map((point) => [point._id, point.count]));
  const dayCount = new Date(end.getTime() - 86400000).getUTCDate();
  const days = Array.from({ length: dayCount }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, '0')}`;
    return { date, count: byDate.get(date) ?? 0 };
  });
  send(res, { month, total: counts.reduce((sum, point) => sum + point.count, 0), days });
});
