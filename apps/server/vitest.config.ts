import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
    env: {
      NODE_ENV: 'test',
      CLIENT_ORIGIN: 'http://localhost:5173',
      JWT_SECRET: 'integration-tests-only-32-character-secret',
      MONGODB_URI: 'mongodb://localhost/test',
      UPLOAD_DIR: './uploads/test',
    },
  },
});
