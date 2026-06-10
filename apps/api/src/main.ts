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

for (const p of possiblePaths) {
  if (existsSync(p)) {
    try {
      process.loadEnvFile(p);
      break;
    } catch (e) {
      // Ignored
    }
  }
}

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    // trustProxy: 'loopback' makes Fastify derive req.ip from X-Forwarded-For
    // ONLY when the connecting socket is the local reverse proxy (nginx). This
    // prevents clients from spoofing X-Forwarded-For to bypass rate limiting.
    new FastifyAdapter({ logger: true, trustProxy: 'loopback', bodyLimit: 64 * 1024 }),
    { bufferLogs: true },
  );

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`API running on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
