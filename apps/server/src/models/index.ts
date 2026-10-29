import mongoose, { Schema } from 'mongoose';
import { lureTypes } from '@lurelog/shared';
const imageSchema = new Schema(
  {
    provider: { type: String, enum: ['local', 'cloudinary'], required: true },
    fileId: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: true },
);
const owner = { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true };
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    sessionVersion: { type: Number, default: 0, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    avatar: imageSchema,
  },
  { timestamps: true },
);
const lureSchema = new Schema(
  {
    userId: owner,
    name: { type: String, required: true },
    brand: { type: String, required: true },
    type: { type: String, required: true, enum: lureTypes },
    lengthMm: { type: Number, required: true, min: 0 },
    weightGrams: Number,
    color: String,
    buoyancy: String,
    technique: String,
    description: String,
    image: imageSchema,
    purchaseDate: Date,
    purchasePrice: Number,
    revision: { type: Number, default: 0 },
  },
  { timestamps: true },
);
lureSchema.index({ userId: 1, createdAt: -1 });
lureSchema.index({ userId: 1, type: 1, brand: 1 });
const catchSchema = new Schema(
  {
    userId: owner,
    lureId: { type: Schema.Types.ObjectId, ref: 'Lure', required: true, index: true },
    species: { type: String, required: true },
    caughtAt: { type: Date, required: true },
    lengthCm: Number,
    weightKg: Number,
    location: String,
    notes: String,
    waterConditions: String,
    weather: String,
    photo: imageSchema,
    photoPosition: {
      type: new Schema(
        {
          x: { type: Number, required: true, min: 0, max: 100 },
          y: { type: Number, required: true, min: 0, max: 100 },
        },
        { _id: false },
      ),
      default: undefined,
    },
  },
  { timestamps: true },
);
catchSchema.index({ userId: 1, caughtAt: -1 });
catchSchema.index({ userId: 1, lureId: 1 });
catchSchema.index({ userId: 1, species: 1 });
const cleanupSchema = new Schema(
  { provider: String, fileId: String, attempts: { type: Number, default: 0 } },
  { timestamps: true },
);
export const UserModel = mongoose.model('User', userSchema);
export const LureModel = mongoose.model('Lure', lureSchema);
export const CatchModel = mongoose.model('Catch', catchSchema);
export const CleanupModel = mongoose.model('ImageCleanup', cleanupSchema);
