import { getEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase, getMongoUriForEnv } from './config/database.js';
import { createApp } from './app.js';

const env = getEnv();
const app = createApp(env);

const uri = getMongoUriForEnv(env);
await connectDatabase(uri);

const PORT = env.PORT;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('unhandledRejection', (err: unknown) => {
  const e = err as { name?: string; message?: string };
  console.error(`UnhandledRejection Error: ${e.name} | ${e.message}`);
  server.close(async () => {
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
});
