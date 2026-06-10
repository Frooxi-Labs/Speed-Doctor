import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const possiblePaths = [
  join(process.cwd(), '.env'),
  join(process.cwd(), '../../.env'),
  join(__dirname, '../../../.env'),
];

let loadedPath = null;
for (const p of possiblePaths) {
  if (existsSync(p)) {
    try {
      process.loadEnvFile(p);
      loadedPath = p;
      break;
    } catch (e) {
      // Ignored
    }
  }
}

console.log('Worker startup process started...');
console.log('CWD:', process.cwd());
console.log('Loaded env path:', loadedPath);
console.log('REDIS_URL configured:', !!process.env.REDIS_URL);
console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL);

import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  console.log('Bootstrapping NestJS worker...');
  console.log('Importing AppModule...');
  const { AppModule } = await import('./app.module');
  console.log('Imported AppModule. Importing QueueService...');
  const { QueueService } = await import('./queue.service');
  console.log('Imported QueueService. Creating context...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('Context created, initializing...');
  await app.init();

  app.get(QueueService);

  console.log('Worker started: queue infrastructure is initialized.');
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Worker bootstrap failed:', error);
  process.exit(1);
});
