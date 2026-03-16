import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  Query,
  Delete,
} from '@nestjs/common';
import { WealthService } from './wealth.service';
import { AuthGuard } from './auth.guard';
import { CreateTransactionDto } from './create-transaction.dto';
import { StockService } from './stock.service';
import { CryptoService } from './crypto.service';

// ==========================================
// 🛡️ INTERFACES LOCALES
// ==========================================
// Permet à TypeScript de savoir que 'req' contient un utilisateur après le passage du Guard
interface RequestWithUser extends Request {
  user: {
    sub: string;
    id?: string;
    email: string;
  };
}

@UseGuards(AuthGuard)
@Controller('wealth')
export class WealthController {
  constructor(
    private readonly wealthService: WealthService,
    private readonly stockService: StockService,
    private readonly cryptoService: CryptoService,
  ) {}

  // ==========================================
  // 🔍 ROUTES DE RECHERCHE (APIs Externes)
  // ==========================================

  /**
   * Interroge CoinGecko pour trouver une cryptomonnaie
   */
  @Get('search/crypto')
  async searchCrypto(@Query('q') query: string) {
    return this.cryptoService.searchCrypto(query);
  }

  /**
   * Interroge Yahoo Finance pour trouver une Action ou un ETF
   */
  @Get('search/stocks')
  async searchStocks(@Query('q') query: string) {
    return this.stockService.searchStocks(query);
  }

  // ==========================================
  // 📊 ROUTES DU TABLEAU DE BORD (Lecture)
  // ==========================================

  /**
   * Récupère la vue globale du patrimoine (Dashboard)
   */
  @Get()
  async getWealth(@Request() req: RequestWithUser) {
    const userId = req.user.sub || req.user.id;
    if (!userId) throw new UnauthorizedException('Utilisateur non identifié');

    return this.wealthService.getWealthData(userId);
  }

  /**
   * Récupère le détail des actifs d'une catégorie spécifique (ex: /wealth/pea)
   */
  @Get(':category')
  async getCategoryDetails(
    @Param('category') category: string,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.wealthService.getCategoryDetailsData(category, userId || '');
  }

  // ==========================================
  // ✍️ ROUTES D'ÉCRITURE (Transactions & Wallets)
  // ==========================================

  /**
   * Ajoute une nouvelle transaction (Achat/Vente) et met à jour l'actif concerné
   * 🛡️ Utilise CreateTransactionDto pour valider les données entrantes
   */
  @Post('transaction')
  async addTransaction(
    @Body() body: CreateTransactionDto,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.wealthService.addTransactionData(body, userId || '');
  }

  /**
   * Supprime une transaction et recalcule le solde de l'actif
   */
  @Delete('transaction/:id')
  async deleteTransaction(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.wealthService.deleteTransaction(id, userId || '');
  }

  /**
   * Lie un portefeuille externe (ex: adresse Ethereum)
   */
  @Post('wallet')
  async addWallet(
    @Body() body: { name: string; blockchain: string; address: string },
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.wealthService.addWalletData(body, userId || '');
  }
}
