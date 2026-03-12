import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { WealthService } from './wealth.service';

@Controller('wealth')
export class WealthController {
  // On injecte le service ici
  constructor(private readonly wealthService: WealthService) {}

  @Get()
  async getWealth() {
    return this.wealthService.getWealthData();
  }

  @Get(':category')
  async getCategoryDetails(@Param('category') category: string) {
    return this.wealthService.getCategoryDetailsData(category);
  }

  @Post('transaction')
  async addTransaction(@Body() body: any) {
    return this.wealthService.addTransactionData(body);
  }

  @Post('wallet')
  async addWallet(
    @Body() body: { name: string; blockchain: string; address: string },
  ) {
    return this.wealthService.addWalletData(body);
  }
}
