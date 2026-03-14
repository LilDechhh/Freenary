import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common'; // <-- NOUVEL IMPORT
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // 🛡️ NOUVEAU : On active la validation stricte partout
  // whitelist: true retire automatiquement tous les champs inconnus envoyés par les hackers
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(3001, '0.0.0.0');
}
bootstrap();
