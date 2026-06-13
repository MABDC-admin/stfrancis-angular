import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useStaticAssets(process.env.STORAGE_DIR || join(process.cwd(), 'storage'), {
    prefix: '/storage/',
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`SFXSAI API listening on ${await app.getUrl()}`);

  const keepAlive = setInterval(() => undefined, 60_000);
  const shutdown = async () => {
    clearInterval(keepAlive);
    await app.close();
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
void bootstrap();
