import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WealthController } from './wealth.controller';
import { PrismaService } from './prisma.service';
import { WealthService } from './wealth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { StockService } from './stock.service';
import { CryptoService } from './crypto.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AppController, WealthController, AuthController],
  providers: [
    AppService,
    PrismaService,
    WealthService,
    AuthService,
    StockService,
    CryptoService,
  ],
})
export class AppModule {}
