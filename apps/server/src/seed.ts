import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { env } from './config/env.js';
import { UserModel, LureModel, CatchModel } from './models/index.js';
const email = process.env.SEED_EMAIL ?? 'angler@example.com';
const password = process.env.SEED_PASSWORD;
if (!password || password.length < 12)
  throw new Error('Set SEED_PASSWORD to at least 12 characters in .env');
await mongoose.connect(env.MONGODB_URI);
if (await UserModel.exists({ email })) {
  console.log('Seed account already exists; no data was changed.');
  await mongoose.disconnect();
  process.exit(0);
}
const user = await UserModel.create({
  name: 'Alex Fisher',
  email,
  passwordHash: await bcrypt.hash(password, 12),
});
const specs = [
  ['Rapala', 'Original Floater', 'Hard Bait', 90, 5, 'Silver', 'floating'],
  ['Salmo', 'Slider 10', 'Hard Bait', 100, 46, 'Real Perch', 'sinking'],
  ['Westin', 'ShadTeez', 'Soft Lure', 120, 15, 'Fireflake', 'sinking'],
  ['Megabass', 'Vision Oneten', 'Hard Bait', 110, 14, 'Mat Tiger', 'suspending'],
  ['Duo', 'Realis Crank', 'Hard Bait', 55, 12, 'Blue Gill', 'floating'],
  ['Savage Gear', '3D Suicide Duck', 'Hard Bait', 105, 28, 'Yellow Duckling', 'floating'],
  ['Mepps', 'Aglia No. 3', 'Spinner', 60, 6.5, 'Gold', 'sinking'],
  ['Keitech', 'Easy Shiner', 'Soft Lure', 100, 6, 'Electric Shad', 'sinking'],
  ['Abu Garcia', 'Toby', 'Spoon', 75, 18, 'Copper', 'sinking'],
];
const lures = await LureModel.insertMany(
  specs.map(([brand, name, type, lengthMm, weightGrams, color, buoyancy]) => ({
    userId: user._id,
    brand,
    name,
    type,
    lengthMm,
    weightGrams,
    color,
    buoyancy,
    description: 'A trusted companion for early starts and one more cast.',
    technique: 'Steady retrieve with occasional pauses',
  })),
);
const species = [
  'Northern Pike',
  'European Perch',
  'Zander',
  'European Perch',
  'Northern Pike',
  'Trout',
];
await CatchModel.insertMany(
  Array.from({ length: 26 }, (_, i) => ({
    userId: user._id,
    lureId: lures[i % lures.length]._id,
    species: species[i % species.length],
    caughtAt: new Date(Date.now() - i * 8 * 86400000 - randomInt(86400000)),
    lengthCm: i % 3 === 0 ? 68 + i : 26 + i,
    weightKg: Number((0.4 + i * 0.15).toFixed(2)),
    location: ['Lake Śniardwy', 'Vistula River', 'Lake Mamry'][i % 3],
    weather: 'Cloudy with a light breeze',
    waterConditions: 'Clear, light chop',
    notes: 'A quiet morning by the water. Slow retrieve near the reed line.',
  })),
);
console.log(`Seeded ${lures.length} lures and 26 catches for ${email}.`);
await mongoose.disconnect();
