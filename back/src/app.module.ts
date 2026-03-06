import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WealthController } from './wealth.controller';
import { PrismaService } from './prisma.service';

@Module({
  imports: [],
  controllers: [AppController,WealthController],
  providers: [AppService,PrismaService],
})
export class AppModule {}
