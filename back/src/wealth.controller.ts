import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { WealthService } from './wealth.service';
import { AuthGuard } from './auth.guard';
import { CreateTransactionDto } from './create-transaction.dto';

@UseGuards(AuthGuard)
@Controller('wealth')
export class WealthController {
  // On injecte le service ici
  constructor(private readonly wealthService: WealthService) {}

  @Get()
  async getWealth(@Request() req: any) {
    // On récupère l'ID sécurisé depuis le token décodé par l'AuthGuard
    const userId = req.user?.sub || req.user?.id;
    if (!userId)
      throw new UnauthorizedException(
        'Utilisateur non identifié dans le token',
      );

    return this.wealthService.getWealthData(userId);
  }

  @Get(':category')
  async getCategoryDetails(
    @Param('category') category: string,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;

    return this.wealthService.getCategoryDetailsData(category, userId);
  }

  @Post('transaction')
  async addTransaction(
    @Body() body: CreateTransactionDto, // 🛡️ Fini le "any", place au DTO !
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.wealthService.addTransactionData(body, userId);
  }

  @Post('wallet')
  async addWallet(
    @Body() body: { name: string; blockchain: string; address: string },
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;

    return this.wealthService.addWalletData(body, userId);
  }
}
