import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
const dbPath = path.resolve('.local/mongo');
await mkdir(dbPath, { recursive: true });
const mongo = await MongoMemoryReplSet.create({
  instanceOpts: [{ port: 27017, dbPath }],
  replSet: { name: 'rs0', count: 1, storageEngine: 'wiredTiger' },
});
console.log('Local MongoDB ready on mongodb://127.0.0.1:27017/lurelog?replicaSet=rs0');
console.log('Data is persisted in .local/mongo. Keep this terminal open.');
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    void mongo.stop({ doCleanup: false }).then(() => process.exit(0));
  });
