import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockService } from './stock.service';
import { CryptoService } from './crypto.service';

@Injectable()
export class WealthService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
    private cryptoService: CryptoService,
  ) {}

  // --- LE ROBOT QUOTIDIEN ---
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async takeDailySnapshot() {
    console.log('📸 Déclenchement de la photo du patrimoine...');
    const users = await this.prisma.user.findMany();
    const today = new Date().toISOString().split('T')[0];

    for (const user of users) {
      const { totalWealth } = await this.getWealthData(user.id);

      if (totalWealth > 0) {
        const existingPhoto = await this.prisma.historicalData.findFirst({
          where: { userId: user.id, date: today },
        });

        if (existingPhoto) {
          await this.prisma.historicalData.update({
            where: { id: existingPhoto.id },
            data: { value: totalWealth },
          });
        } else {
          await this.prisma.historicalData.create({
            data: {
              date: today,
              value: totalWealth,
              user: { connect: { id: user.id } },
            },
          });
        }
      }
    }
    console.log('✅ Photo du patrimoine enregistrée !');
  }

  // --- LOGIQUE DU DASHBOARD PRINCIPAL ---
  async getWealthData(userId: string) {
    const assets = await this.prisma.asset.findMany({ where: { userId } });
    const history = await this.prisma.historicalData.findMany({
      where: { userId },
    });
    const wallets = await this.prisma.wallet.findMany({ where: { userId } });

    // Filtrage des noms pour les appels API groupés
    const cryptoNames = assets
      .filter((a) => a.category.toLowerCase() === 'crypto')
      .map((a) => a.name);
    const peaNames = assets
      .filter((a) => a.category.toLowerCase() === 'pea')
      .map((a) => a.name);

    // Appels aux services spécialisés
    const liveCryptoPrices =
      cryptoNames.length > 0
        ? await this.cryptoService.fetchPrices(cryptoNames)
        : {};
    const liveStockPrices =
      peaNames.length > 0 ? await this.stockService.fetchPrices(peaNames) : {};

    const dynamicAssets = await Promise.all(
      assets.map(async (a) => {
        let dynamicValue = a.totalValue;
        let liveQuantity = a.quantity || 0;

        if (a.category.toLowerCase() === 'crypto') {
          // Check Blockchain Solana
          if (a.name.toLowerCase() === 'solana') {
            const solWallet = wallets.find(
              (w) => w.blockchain.toLowerCase() === 'solana',
            );
            if (solWallet)
              liveQuantity = await this.cryptoService.getSolanaBalance(
                solWallet.address,
              );
          }
          const price = liveCryptoPrices[a.name.toLowerCase()]?.eur;
          if (price && liveQuantity > 0) dynamicValue = price * liveQuantity;
        } else if (a.category.toLowerCase() === 'pea') {
          const symbol = this.stockService.getYahooSymbol(a.name);
          const price = liveStockPrices[symbol];
          if (price && liveQuantity > 0) dynamicValue = price * liveQuantity;
        }

        return { ...a, dynamicValue, liveQuantity };
      }),
    );

    const totalWealth = dynamicAssets.reduce(
      (sum, a) => sum + a.dynamicValue,
      0,
    );

    // Formatage de l'historique
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    let formattedHistory = sortedHistory.map((h) => ({
      date: new Date(h.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      }),
      value: h.value,
    }));

    if (formattedHistory.length === 0)
      formattedHistory = [{ date: "Aujourd'hui", value: totalWealth }];

    const categories = [
      { id: 'crypto', label: 'CRYPTO', color: '#f59e0b' },
      { id: 'pea', label: 'PEA', color: '#3b82f6' },
      { id: 'epargne', label: 'EPARGNE', color: '#8b5cf6' },
      { id: 'epargne-salariale', label: 'EPARGNE-SALARIALE', color: '#ec4899' },
    ];

    const distribution = categories.map((cat) => {
      const val = dynamicAssets
        .filter((a) => a.category === cat.id)
        .reduce((s, a) => s + a.dynamicValue, 0);
      return {
        name: cat.label,
        value: val,
        percentage:
          totalWealth > 0 ? ((val / totalWealth) * 100).toFixed(1) : '0',
        color: cat.color,
      };
    });

    return { totalWealth, distribution, historicalData: formattedHistory };
  }

  // --- LOGIQUE DES DÉTAILS D'UNE CATÉGORIE ---
  async getCategoryDetailsData(category: string, userId: string) {
    const assets = await this.prisma.asset.findMany({
      where: { category: category.toLowerCase(), userId },
    });
    const wallets = await this.prisma.wallet.findMany({ where: { userId } });
    const assetNames = assets.map((a) => a.name);

    let livePrices: Record<string, any> = {};
    if (category.toLowerCase() === 'crypto')
      livePrices = await this.cryptoService.fetchPrices(assetNames);
    else if (category.toLowerCase() === 'pea')
      livePrices = await this.stockService.fetchPrices(assetNames);

    const mappedAssets = await Promise.all(
      assets.map(async (a) => {
        let currentPrice: number | null = null;
        if (category.toLowerCase() === 'crypto')
          currentPrice = livePrices[a.name.toLowerCase()]?.eur || null;
        else if (category.toLowerCase() === 'pea')
          currentPrice =
            livePrices[this.stockService.getYahooSymbol(a.name)] || null;

        let liveQuantity = a.quantity || 0;
        if (
          category.toLowerCase() === 'crypto' &&
          a.name.toLowerCase() === 'solana'
        ) {
          const solWallet = wallets.find(
            (w) => w.blockchain.toLowerCase() === 'solana',
          );
          if (solWallet)
            liveQuantity = await this.cryptoService.getSolanaBalance(
              solWallet.address,
            );
        }

        const currentValue = currentPrice
          ? currentPrice * liveQuantity
          : a.totalValue;
        const gain = currentValue - a.totalValue;

        return {
          id: a.id,
          name: a.name,
          quantity: liveQuantity,
          currentPrice,
          currentValue,
          pru: liveQuantity > 0 ? a.totalValue / liveQuantity : 0,
          gain,
          gainPercent: a.totalValue > 0 ? (gain / a.totalValue) * 100 : 0,
        };
      }),
    );

    const totalCategoryValue = mappedAssets.reduce(
      (sum, a) => sum + a.currentValue,
      0,
    );
    const totalInvested = assets.reduce((sum, a) => sum + a.totalValue, 0);

    return {
      title: category.toUpperCase(),
      totalCategoryValue,
      totalGain: totalCategoryValue - totalInvested,
      totalGainPercent:
        totalInvested > 0
          ? ((totalCategoryValue - totalInvested) / totalInvested) * 100
          : 0,
      assets: mappedAssets,
    };
  }

  // --- LOGIQUE D'AJOUT DE TRANSACTION SÉCURISÉE ---
  async addTransactionData(body: any, userId: string) {
    const { type, category, asset, quantity, amount, date } = body;
    let numericAmount = parseFloat(amount);
    let numericQuantity = parseFloat(quantity) || 0;

    if (type === 'vente' || type === 'retrait') {
      numericAmount = -numericAmount;
      numericQuantity = -numericQuantity;
    }

    return await this.prisma.$transaction(async (tx) => {
      let currentAsset = await tx.asset.findFirst({
        where: {
          name: { equals: asset, mode: 'insensitive' },
          category,
          userId,
        },
      });

      if (currentAsset) {
        currentAsset = await tx.asset.update({
          where: { id: currentAsset.id },
          data: {
            quantity: (currentAsset.quantity || 0) + numericQuantity,
            totalValue: currentAsset.totalValue + numericAmount,
          },
        });
      } else {
        currentAsset = await tx.asset.create({
          data: {
            name: asset,
            category: category.toLowerCase(),
            quantity: numericQuantity,
            totalValue: numericAmount,
            user: { connect: { id: userId } },
          },
        });
      }

      await tx.transaction.create({
        data: {
          type,
          category: category.toLowerCase(),
          amount: parseFloat(amount),
          quantity: parseFloat(quantity) || 0,
          date: new Date(date),
          asset: { connect: { id: currentAsset.id } },
          user: { connect: { id: userId } },
        },
      });

      return { success: true, message: 'Transaction enregistrée !' };
    });
  }

  // --- LOGIQUE D'AJOUT DE WALLET ---
  async addWalletData(
    body: { name: string; blockchain: string; address: string },
    userId: string,
  ) {
    const existingWallet = await this.prisma.wallet.findFirst({
      where: { address: body.address },
    });
    if (existingWallet)
      return { success: false, message: 'Ce portefeuille est déjà lié.' };

    const newWallet = await this.prisma.wallet.create({
      data: { ...body, blockchain: body.blockchain.toLowerCase(), userId },
    });

    return { success: true, message: 'Portefeuille lié !', wallet: newWallet };
  }
}
