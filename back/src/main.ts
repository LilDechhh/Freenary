import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🛡️ SÉCURITÉ CORS STRICTE
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL, // C'est ici que tu mettras l'URL de ton site Vercel
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Autorise les requêtes serveur-à-serveur (sans origine) ou celles de ta liste
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://192.168.')
      ) {
        callback(null, true);
      } else {
        console.error(`🚨 CORS bloqué pour : ${origin}`);
        callback(new Error('Non autorisé par le CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Validation stricte toujours active
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // ☁️ GESTION DU PORT POUR LE CLOUD
  // Les hébergeurs comme Render injectent leur propre PORT dans l'environnement
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Serveur démarré sur le port ${port}`);
}
bootstrap();
