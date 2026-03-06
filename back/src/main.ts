import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // On garde ça pour autoriser le Frontend

  // MODIFIE CETTE LIGNE : Ajoute '0.0.0.0'
  await app.listen(3001, '0.0.0.0');
}
bootstrap();
