import { PrismaService } from './prisma.service';
import { Controller, Get, Param, Post, Body } from '@nestjs/common'; // <-- Ajout de Post et Body
import YahooFinance from 'yahoo-finance2';

@Controller('wealth')
export class WealthController {
  // --- SYSTÈME DE CACHE EN MÉMOIRE ---
  private cachedPrices: Record<string, any> = {};
  private lastFetchTime: number = 0;
  // Durée du cache : 5 minutes (en millisecondes).
  // Pendant 5 min, aucun appel API supplémentaire ne sera fait !
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  constructor(private prisma: PrismaService) {}

  // --- FONCTION INTELLIGENTE D'APPEL API ---
  private async getCryptoPrices(
    cryptoNames: string[],
  ): Promise<Record<string, any>> {
    const now = Date.now();

    // 1. Si on a déjà les prix et qu'ils datent de moins de 5 minutes, on utilise la mémoire
    if (
      now - this.lastFetchTime < this.CACHE_DURATION &&
      Object.keys(this.cachedPrices).length > 0
    ) {
      console.log('Utilisation du cache pour les cryptos');
      return this.cachedPrices;
    }

    // 2. Sinon, le cache est expiré (ou vide), on appelle CoinGecko
    try {
      const ids = cryptoNames
        .map((name) => this.getCoinGeckoId(name))
        .filter(Boolean)
        .join(',');
      if (!ids) return this.cachedPrices;

      console.log("🌐 Nouvel appel à l'API CoinGecko...");
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, // Correction: on remet EUR ici
      );

      if (response.ok) {
        this.cachedPrices = await response.json();
        this.lastFetchTime = now; // On met à jour l'heure du cache
      } else {
        console.error('❌ Erreur API CoinGecko. Statut :', response.status);
      }
    } catch (error) {
      console.error('Erreur API CoinGecko:', error);
    }

    return this.cachedPrices;
  }

  // --- 1. ROUTE DU DASHBOARD PRINCIPAL ---
  @Get()
  async getWealth() {
    const assets = await this.prisma.asset.findMany();
    const history = await this.prisma.historicalData.findMany();

    // On isole les cryptos et on récupère les prix (via cache ou API)
    const cryptoAssets = assets.filter(
      (a) => a.category.toLowerCase() === 'crypto',
    );
    const cryptoNames = cryptoAssets.map((a) => a.name);
    const livePrices =
      cryptoAssets.length > 0 ? await this.getCryptoPrices(cryptoNames) : {};

    // On calcule les valeurs dynamiques de TOUS les actifs (Quantité * Prix)
    const dynamicAssets = assets.map((a) => {
      let dynamicValue = a.totalValue;

      if (a.category.toLowerCase() === 'crypto') {
        const cgId = this.getCoinGeckoId(a.name);
        const currentPrice = livePrices[cgId]?.usd;
        // Le calcul Quantité * Prix
        if (currentPrice && a.quantity) {
          dynamicValue = currentPrice * a.quantity;
        }
      }
      return { ...a, dynamicValue };
    });

    const totalWealth = dynamicAssets.reduce(
      (sum, a) => sum + a.dynamicValue,
      0,
    );

    // Fusion de l'historique
    const groupedHistory = history.reduce(
      (acc, curr) => {
        if (!acc[curr.date]) acc[curr.date] = 0;
        acc[curr.date] += curr.value;
        return acc;
      },
      {} as Record<string, number>,
    );

    const monthOrder = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sept',
      'Oct',
      'Nov',
      'Déc',
    ];
    let formattedHistory = Object.entries(groupedHistory)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => monthOrder.indexOf(a.date) - monthOrder.indexOf(b.date));

    if (formattedHistory.length === 0) {
      formattedHistory = [
        { date: 'Jan', value: totalWealth * 0.85 },
        { date: 'Fév', value: totalWealth * 0.92 },
        { date: 'Mar', value: totalWealth },
      ];
    }

    // Répartition dynamique
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

      const percentage =
        totalWealth > 0 ? ((val / totalWealth) * 100).toFixed(1) : '0';

      return { name: cat.label, value: val, percentage, color: cat.color };
    });

    return {
      totalWealth,
      distribution,
      historicalData: formattedHistory,
    };
  }

  // --- 2. ROUTE DES DÉTAILS D'UNE CATÉGORIE ---
  @Get(':category')
  async getCategoryDetails(@Param('category') category: string) {
    const assets = await this.prisma.asset.findMany({
      where: { category: category.toLowerCase() },
    });

    const rawTransactions = await this.prisma.transaction.findMany({
      where: { category: category.toLowerCase() },
      orderBy: { date: 'desc' },
      include: { asset: true }, // <-- Demande à Prisma de joindre la table Asset !
    });

    // On formate un peu pour que ton Frontend s'y retrouve facilement
    const formattedTransactions = rawTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      quantity: tx.quantity,
      date: tx.date,
      assetName: tx.asset.name, // On extrait le nom de l'actif pour l'affichage
    }));

    // Récupération intelligente des prix via notre fonction
    const cryptoNames = assets.map((a) => a.name);
    const livePrices =
      category.toLowerCase() === 'crypto' && assets.length > 0
        ? await this.getCryptoPrices(cryptoNames)
        : {};

    const mappedAssets = assets.map((a) => {
      const cgId = this.getCoinGeckoId(a.name);
      const currentPrice = livePrices[cgId]?.usd || null;

      let dynamicTotalValue = a.totalValue;

      if (currentPrice && a.quantity) {
        dynamicTotalValue = currentPrice * a.quantity;
      }

      const realGainLoss = dynamicTotalValue - a.totalValue;
      const realGainLossPercent =
        a.totalValue > 0 ? (realGainLoss / a.totalValue) * 100 : 0;

      // ---> Le console.log problématique a été supprimé ici ! <---

      return {
        id: a.id,
        name: a.name,
        quantity: a.quantity,
        currentPrice,
        totalValue: dynamicTotalValue,
        gainLoss: realGainLoss,
        gainLossPercent: Number(realGainLossPercent.toFixed(2)),
      };
    });

    // C'est seulement ICI que la variable dynamicCategoryTotal est créée
    const dynamicCategoryTotal = mappedAssets.reduce(
      (sum, a) => sum + a.totalValue,
      0,
    );

    return {
      title: category.toUpperCase(),
      totalValue: dynamicCategoryTotal,
      assets: mappedAssets,
      transactions: formattedTransactions,
    };
  }

  // --- NOUVELLE ROUTE : AJOUTER UNE TRANSACTION ---
  @Post('transaction')
  async addTransaction(@Body() body: any) {
    const { type, category, asset, quantity, amount, date } = body;

    let numericAmount = parseFloat(amount);
    let numericQuantity = parseFloat(quantity) || 0;

    // Pour le solde total de l'actif, on fait + ou - selon le type
    if (type === 'vente' || type === 'retrait') {
      numericAmount = -numericAmount;
      numericQuantity = -numericQuantity;
    }

    const defaultUser = await this.prisma.user.findFirst();
    if (!defaultUser) throw new Error('Aucun utilisateur trouvé.');

    // 1. GESTION DE L'ACTIF (Création ou Mise à jour)
    let currentAsset = await this.prisma.asset.findFirst({
      where: {
        name: { equals: asset, mode: 'insensitive' },
        category: category,
      },
    });

    if (currentAsset) {
      currentAsset = await this.prisma.asset.update({
        where: { id: currentAsset.id },
        data: {
          quantity: (currentAsset.quantity || 0) + numericQuantity,
          totalValue: currentAsset.totalValue + numericAmount,
        },
      });
    } else {
      currentAsset = await this.prisma.asset.create({
        data: {
          name: asset,
          category: category.toLowerCase(),
          quantity: numericQuantity,
          totalValue: numericAmount,
          user: { connect: { id: defaultUser.id } },
        },
      });
    }

    // 2. GESTION DE L'HISTORIQUE (Graphique global)
    const dateObj = new Date(date);
    const months = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sept',
      'Oct',
      'Nov',
      'Déc',
    ];
    const monthName = months[dateObj.getMonth()];

    const existingHistory = await this.prisma.historicalData.findFirst({
      where: { date: monthName },
    });

    if (existingHistory) {
      await this.prisma.historicalData.update({
        where: { id: existingHistory.id },
        data: { value: existingHistory.value + numericAmount },
      });
    } else {
      await this.prisma.historicalData.create({
        data: { date: monthName, value: numericAmount },
      });
    }

    // 3. CRÉATION DU TICKET DE CAISSE (Transaction)
    // On relie proprement l'actif et l'utilisateur selon ton schéma Prisma !
    await this.prisma.transaction.create({
      data: {
        type: type,
        category: category.toLowerCase(),
        amount: parseFloat(amount), // On garde la valeur absolue pour le ticket
        quantity: parseFloat(quantity) || 0,
        date: new Date(date),
        asset: { connect: { id: currentAsset.id } },
        user: { connect: { id: defaultUser.id } },
      },
    });

    return { success: true, message: 'Transaction enregistrée avec succès !' };
  }

  // --- FONCTION UTILITAIRE COINGECKO ---
  private getCoinGeckoId(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('bitcoin') || n === 'btc') return 'bitcoin';
    if (n.includes('ethereum') || n === 'eth') return 'ethereum';
    if (n.includes('solana') || n === 'sol') return 'solana';
    if (n.includes('cardano') || n === 'ada') return 'cardano';
    if (n.includes('ripple') || n === 'xrp') return 'ripple';
    return n;
  }
}
