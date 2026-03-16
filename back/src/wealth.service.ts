import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockService } from './stock.service';
import { CryptoService } from './crypto.service';
import { CreateTransactionDto } from './create-transaction.dto'; // 🛡️ Import du DTO

@Injectable()
export class WealthService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
    private cryptoService: CryptoService,
  ) {}

  // ==========================================
  // 🤖 CRON JOBS (Tâches automatisées)
  // ==========================================

  /**
   * S'exécute tous les jours à minuit.
   * Prend une "photo" de la valeur totale du patrimoine de chaque utilisateur.
   * Optimisation : Ne sauvegarde que si la valeur a varié de > 0.2% ou si on est le 1er du mois.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async takeDailySnapshot() {
    console.log('📸 Analyse intelligente du patrimoine...');
    const users = await this.prisma.user.findMany();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const isFirstDayOfMonth = today.getDate() === 1;

    for (const user of users) {
      const { totalWealth } = await this.getWealthData(user.id);

      if (totalWealth > 0) {
        const lastSnapshot = await this.prisma.historicalData.findFirst({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
        });

        if (lastSnapshot) {
          const variationPercent =
            Math.abs((totalWealth - lastSnapshot.value) / lastSnapshot.value) *
            100;
          const isSignificantChange = variationPercent > 0.2;

          if (isFirstDayOfMonth || isSignificantChange) {
            await this.saveSnapshot(user.id, totalWealth, todayStr);
          } else {
            console.log(
              `⏭️ Variation trop faible (${variationPercent.toFixed(3)}%) pour ${user.email}, snapshot sauté.`,
            );
          }
        } else {
          await this.saveSnapshot(user.id, totalWealth, todayStr);
        }
      }
    }
  }

  private async saveSnapshot(userId: string, value: number, date: string) {
    const existing = await this.prisma.historicalData.findFirst({
      where: { userId, date },
    });
    if (existing) {
      await this.prisma.historicalData.update({
        where: { id: existing.id },
        data: { value },
      });
    } else {
      await this.prisma.historicalData.create({
        data: { date, value, userId },
      });
    }
    console.log(`✅ Snapshot enregistré pour l'utilisateur ${userId}`);
  }

  // ==========================================
  // 📊 LECTURE DES DONNÉES (Dashboard & Détails)
  // ==========================================

  /**
   * Calcule le patrimoine global (Valeur totale, répartition et historique)
   */
  async getWealthData(userId: string) {
    // Filtre : Uniquement les actifs possédés ou avec une valeur > 0
    const assets = await this.prisma.asset.findMany({
      where: {
        userId,
        OR: [{ quantity: { gt: 0 } }, { totalValue: { gt: 0 } }],
      },
    });
    const history = await this.prisma.historicalData.findMany({
      where: { userId },
    });

    const cryptoNames = assets
      .filter((a) => a.category.toLowerCase() === 'crypto')
      .map((a) => a.name);
    const peaNames = assets
      .filter((a) => a.category.toLowerCase() === 'pea')
      .map((a) => a.name);

    // Fetch des prix en direct
    const liveCryptoPrices =
      cryptoNames.length > 0
        ? await this.cryptoService.fetchPrices(cryptoNames)
        : {};
    const liveStockPrices =
      peaNames.length > 0 ? await this.stockService.fetchPrices(peaNames) : {};

    const dynamicAssets = await Promise.all(
      assets.map(async (a) => {
        let dynamicValue = a.totalValue;
        const liveQuantity = a.quantity || 0;

        if (a.category.toLowerCase() === 'crypto') {
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
      { id: 'compte-courant', label: 'COMPTE COURANT', color: '#10b981' },
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

  /**
   * Calcule le détail d'une catégorie spécifique incluant les plus-values (PRU)
   */
  async getCategoryDetailsData(category: string, userId: string) {
    const assets = await this.prisma.asset.findMany({
      where: {
        category: category.toLowerCase(),
        userId,
        OR: [{ quantity: { gt: 0 } }, { totalValue: { gt: 0 } }],
      },
    });
    const assetNames = assets.map((a) => a.name);

    const rawTransactions = await this.prisma.transaction.findMany({
      where: { category: category.toLowerCase(), userId },
      orderBy: { date: 'desc' },
      include: { asset: true },
    });

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

        const liveQuantity = a.quantity || 0;
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
      transactions: rawTransactions.map((tx) => ({
        id: tx.id,
        date: tx.date.toISOString(),
        type: tx.type,
        amount: tx.amount,
        quantity: tx.quantity,
        assetName: tx.asset.name,
      })),
    };
  }

  // ==========================================
  // ✍️ ÉCRITURE ET MODIFICATION DES DONNÉES
  // ==========================================

  /**
   * Enregistre une transaction et gère la logique financière du Prix de Revient Unitaire (PRU)
   */
  // ==========================================
  // ✍️ ÉCRITURE ET MODIFICATION DES DONNÉES
  // ==========================================

  // ==========================================
  // ✍️ ÉCRITURE ET MODIFICATION DES DONNÉES
  // ==========================================

  /**
   * Enregistre une transaction et gère la logique financière
   */
  async addTransactionData(body: CreateTransactionDto, userId: string) {
    const { type, category, asset, quantity, amount, date } = body;
    const parsedAmount = Number(amount);
    const parsedQuantity = Number(quantity) || 0;

    const isSale =
      type.toLowerCase() === 'vente' || type.toLowerCase() === 'retrait';
    const isUpdate = type.toLowerCase() === 'update_balance';

    return await this.prisma.$transaction(async (tx) => {
      let currentAsset = await tx.asset.findFirst({
        where: {
          name: { equals: asset, mode: 'insensitive' },
          category: category.toLowerCase(),
          userId,
        },
      });

      let newQuantity = parsedQuantity;
      let newTotalValue = parsedAmount;
      let transactionAmount = parsedAmount;
      let transactionType = type; // On part sur le type envoyé par le front

      if (currentAsset) {
        const oldQuantity = currentAsset.quantity || 0;
        const oldTotalValue = currentAsset.totalValue || 0;

        if (isUpdate) {
          // 🎯 NOUVELLE LOGIQUE : Traduction automatique en Dépôt ou Retrait
          const diff = parsedAmount - oldTotalValue;

          if (diff === 0) {
            return { success: true, message: 'Le solde est déjà à jour.' };
          }

          newTotalValue = parsedAmount;
          newQuantity = oldQuantity;
          transactionAmount = Math.abs(diff); // Toujours un montant positif dans l'historique
          transactionType = diff > 0 ? 'dépôt' : 'retrait'; // Le type s'adapte au contexte !
        } else if (!isSale) {
          newQuantity = oldQuantity + parsedQuantity;
          newTotalValue = oldTotalValue + parsedAmount;
        } else {
          if (['crypto', 'pea'].includes(category.toLowerCase())) {
            const currentPRU =
              oldQuantity > 0 ? oldTotalValue / oldQuantity : 0;
            const capitalRemoved = parsedQuantity * currentPRU;

            newQuantity = Math.max(0, oldQuantity - parsedQuantity);
            newTotalValue = Math.max(0, oldTotalValue - capitalRemoved);

            if (newQuantity <= 0.000001) {
              newQuantity = 0;
              newTotalValue = 0;
            }
          } else {
            newQuantity = Math.max(0, oldQuantity - parsedQuantity);
            newTotalValue = Math.max(0, oldTotalValue - parsedAmount);
          }
        }

        currentAsset = await tx.asset.update({
          where: { id: currentAsset.id },
          data: { quantity: newQuantity, totalValue: newTotalValue },
        });
      } else {
        // L'actif n'existe pas encore
        currentAsset = await tx.asset.create({
          data: {
            name: asset,
            category: category.toLowerCase(),
            quantity: isSale ? 0 : parsedQuantity,
            totalValue: isSale ? 0 : parsedAmount,
            user: { connect: { id: userId } },
          },
        });

        if (isUpdate) {
          transactionAmount = parsedAmount;
          transactionType = 'dépôt';
        }
      }

      // Petite astuce pour embellir l'historique des livrets
      if (
        ['epargne', 'compte-courant', 'epargne-salariale'].includes(
          category.toLowerCase(),
        ) &&
        transactionType.toLowerCase() === 'achat'
      ) {
        transactionType = 'dépôt';
      }

      await tx.transaction.create({
        data: {
          type: transactionType,
          category: category.toLowerCase(),
          amount: transactionAmount,
          quantity: isUpdate ? 0 : parsedQuantity,
          date: new Date(date),
          asset: { connect: { id: currentAsset.id } },
          user: { connect: { id: userId } },
        },
      });

      return {
        success: true,
        message: 'Opération enregistrée avec succès !',
      };
    });
  }

  /**
   * Supprime une transaction et effectue l'opération inverse sur le solde
   */
  async deleteTransaction(transactionId: string, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, userId },
        include: { asset: true },
      });

      if (!transaction)
        throw new NotFoundException('Transaction non trouvée ou accès refusé');

      const { asset, type, amount, quantity } = transaction;
      let newQuantity = asset.quantity || 0;
      let newTotalValue = asset.totalValue || 0;

      // La suppression annule parfaitement la transaction, qu'elle soit issue d'une mise à jour ou non
      if (['achat', 'dépôt', 'in'].includes(type.toLowerCase())) {
        newQuantity -= quantity || 0;
        newTotalValue -= amount;
      } else if (['vente', 'retrait', 'out'].includes(type.toLowerCase())) {
        newQuantity += quantity || 0;
        newTotalValue += amount;
      } else if (type.toLowerCase() === 'ajustement') {
        // Au cas où tu supprimerais un ancien test !
        newTotalValue -= amount;
      }

      await tx.asset.update({
        where: { id: asset.id },
        data: {
          quantity: Math.max(0, newQuantity),
          totalValue: Math.max(0, newTotalValue),
        },
      });

      await tx.transaction.delete({ where: { id: transactionId } });

      return { success: true };
    });
  }

  /**
   * Enregistre un wallet externe
   */
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
