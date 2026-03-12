import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import yahooFinance from 'yahoo-finance2';

@Injectable()
export class WealthService {
  // --- SYSTÈME DE CACHE EN MÉMOIRE ---
  private cachedPrices: Record<string, any> = {};
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  constructor(private prisma: PrismaService) {}

  // --- FONCTION INTELLIGENTE D'APPEL API ---
  private async getCryptoPrices(
    cryptoNames: string[],
  ): Promise<Record<string, any>> {
    const now = Date.now();

    const requestedIds = cryptoNames
      .map((name) => this.getCoinGeckoId(name))
      .filter(Boolean);

    const isMissingCoins = requestedIds.some((id) => !this.cachedPrices[id]);

    if (
      !isMissingCoins &&
      now - this.lastFetchTime < this.CACHE_DURATION &&
      Object.keys(this.cachedPrices).length > 0
    ) {
      console.log('✅ Utilisation du cache pour les cryptos');
      return this.cachedPrices;
    }

    try {
      const idsString = requestedIds.join(',');
      if (!idsString) return this.cachedPrices;

      console.log(`🌐 Nouvel appel API CoinGecko pour : ${idsString}`);
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=eur`,
      );

      if (response.ok) {
        const newPrices = await response.json();
        this.cachedPrices = { ...this.cachedPrices, ...newPrices };
        this.lastFetchTime = now;
      } else {
        console.error('❌ Erreur API CoinGecko. Statut :', response.status);
      }
    } catch (error) {
      console.error('Erreur API CoinGecko:', error);
    }

    return this.cachedPrices;
  }

  // --- NOUVEAU : SCANNER SOLANA EN TEMPS RÉEL ---
  private async getSolflareBalance(publicKey: string): Promise<number> {
    try {
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [publicKey],
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('Erreur API Solana:', data.error.message);
        return 0;
      }

      // 1 SOL = 1 000 000 000 Lamports
      return data.result.value / 1_000_000_000;
    } catch (error) {
      console.error('❌ Erreur de lecture réseau Solana:', error);
      return 0;
    }
  }

  // --- NOUVEAU : FONCTION DE TEST BLOCKCHAIN ---
  async testSolanaWallet(address: string) {
    console.log(`🔍 Scan de l'adresse Solana : ${address}`);
    const balance = await this.getSolflareBalance(address);
    const prices = await this.getCryptoPrices(['Solana']);
    const solPrice = prices['solana']?.eur || 0;
    const totalValue = balance * solPrice;

    return {
      message: 'Succès ! Lecture en temps réel effectuée.',
      blockchain: 'Solana',
      address: address,
      liveBalance: `${balance} SOL`,
      currentPrice: `${solPrice} €`,
      estimatedValue: `${totalValue.toFixed(2)} €`,
    };
  }

  // --- LOGIQUE DU DASHBOARD PRINCIPAL (HYBRIDE) ---
  async getWealthData() {
    const assets = await this.prisma.asset.findMany();
    const history = await this.prisma.historicalData.findMany();
    const wallets = await this.prisma.wallet.findMany(); // <-- On récupère les wallets

    const cryptoAssets = assets.filter(
      (a) => a.category.toLowerCase() === 'crypto',
    );
    const cryptoNames = cryptoAssets.map((a) => a.name);
    const livePrices =
      cryptoAssets.length > 0 ? await this.getCryptoPrices(cryptoNames) : {};

    const peaAssets = assets.filter((a) => a.category.toLowerCase() === 'pea');
    const peaNames = peaAssets.map((a) => a.name);
    const liveStockPrices =
      peaAssets.length > 0 ? await this.getStockPrices(peaNames) : {};

    // Utilisation de Promise.all car on fait des appels asynchrones (fetch Solana) dans la boucle
    const dynamicAssets = await Promise.all(
      assets.map(async (a) => {
        let dynamicValue = a.totalValue;
        let liveQuantity = a.quantity || 0;

        if (a.category.toLowerCase() === 'crypto') {
          // --- HYBRIDE : Remplacement de la quantité DB par la quantité Blockchain si un wallet existe ---
          if (a.name.toLowerCase() === 'solana') {
            const solWallet = wallets.find(
              (w) => w.blockchain.toLowerCase() === 'solana',
            );
            if (solWallet) {
              liveQuantity = await this.getSolflareBalance(solWallet.address);
            }
          }
          // *Plus tard, tu pourras ajouter la même logique ici pour Ethereum, Bitcoin, etc.*

          const cgId = this.getCoinGeckoId(a.name);
          const currentPrice = livePrices[cgId]?.eur;

          // Calcul avec la quantité TEMPS RÉEL
          if (currentPrice && liveQuantity > 0) {
            dynamicValue = currentPrice * liveQuantity;
          }
        }
        if (a.category.toLowerCase() === 'pea') {
          const symbol = this.getYahooSymbol(a.name);
          const currentPrice = liveStockPrices[symbol];

          if (currentPrice && liveQuantity > 0) {
            dynamicValue = currentPrice * liveQuantity;
          }
        }

        return { ...a, dynamicValue, liveQuantity };
      }),
    );

    const totalWealth = dynamicAssets.reduce(
      (sum, a) => sum + a.dynamicValue,
      0,
    );

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

    return { totalWealth, distribution, historicalData: formattedHistory };
  }

  // --- LOGIQUE DES DÉTAILS D'UNE CATÉGORIE (HYBRIDE) ---
  async getCategoryDetailsData(category: string) {
    const assets = await this.prisma.asset.findMany({
      where: { category: category.toLowerCase() },
    });

    const rawTransactions = await this.prisma.transaction.findMany({
      where: { category: category.toLowerCase() },
      orderBy: { date: 'desc' },
      include: { asset: true },
    });

    const wallets = await this.prisma.wallet.findMany(); // <-- On récupère les wallets

    const formattedTransactions = rawTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      quantity: tx.quantity,
      date: tx.date,
      assetName: tx.asset.name,
    }));

    const cryptoNames = assets.map((a) => a.name);
    const livePrices =
      category.toLowerCase() === 'crypto' && assets.length > 0
        ? await this.getCryptoPrices(cryptoNames)
        : {};

    // Promise.all pour permettre l'attente des scanners blockchain
    const mappedAssets = await Promise.all(
      assets.map(async (a) => {
        const cgId = this.getCoinGeckoId(a.name);
        const currentPrice = livePrices[cgId]?.eur || null;

        let liveQuantity = a.quantity || 0;
        let dynamicTotalValue = a.totalValue; // Valeur par défaut de la BDD

        // --- HYBRIDE : Remplacement par la Blockchain ---
        if (
          category.toLowerCase() === 'crypto' &&
          a.name.toLowerCase() === 'solana'
        ) {
          const solWallet = wallets.find(
            (w) => w.blockchain.toLowerCase() === 'solana',
          );
          if (solWallet) {
            liveQuantity = await this.getSolflareBalance(solWallet.address);
          }
        }

        // Valeur actuelle du marché = Vraie Quantité * Prix Live
        if (currentPrice && liveQuantity > 0) {
          dynamicTotalValue = currentPrice * liveQuantity;
        }

        // PRU calculé depuis l'historique d'achat (Base de données = la Vérité des Euros)
        const assetTransactions = rawTransactions.filter(
          (tx) => tx.assetId === a.id,
        );
        const pru = this.calculatePRU(assetTransactions);

        // Calcul magique de la plus-value !
        // Ton investissement initial = Ton PRU * La vraie quantité que tu possèdes.
        // Si tu as reçu du Staking, liveQuantity augmente, donc la différence avec totalValue explose (en positif) !
        const totalInvested = a.totalValue; // Ce qui est sorti de ta poche
        const realGainLoss = dynamicTotalValue - totalInvested;
        const realGainLossPercent =
          totalInvested > 0 ? (realGainLoss / totalInvested) * 100 : 0;

        return {
          id: a.id,
          name: a.name,
          quantity: liveQuantity, // On affiche la quantité de la blockchain au Frontend !
          currentPrice,
          pru,
          totalValue: dynamicTotalValue,
          gainLoss: realGainLoss,
          gainLossPercent: Number(realGainLossPercent.toFixed(2)),
        };
      }),
    );

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

  // --- LOGIQUE D'AJOUT DE TRANSACTION ---
  async addTransactionData(body: any) {
    const { type, category, asset, quantity, amount, date } = body;
    let numericAmount = parseFloat(amount);
    let numericQuantity = parseFloat(quantity) || 0;

    if (type === 'vente' || type === 'retrait') {
      numericAmount = -numericAmount;
      numericQuantity = -numericQuantity;
    }

    const defaultUser = await this.prisma.user.findFirst();
    if (!defaultUser) throw new Error('Aucun utilisateur trouvé.');

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

    await this.prisma.transaction.create({
      data: {
        type: type,
        category: category.toLowerCase(),
        amount: parseFloat(amount),
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
    if (n.includes('binance') || n === 'bnb') return 'binancecoin';
    if (n.includes('solana') || n === 'sol') return 'solana';
    if (n.includes('ripple') || n === 'xrp') return 'ripple';
    if (n.includes('cardano') || n === 'ada') return 'cardano';
    if (n.includes('dogecoin') || n === 'doge') return 'dogecoin';
    if (n.includes('avalanche') || n === 'avax') return 'avalanche-2';
    if (n.includes('chainlink') || n === 'link') return 'chainlink';
    if (n.includes('polkadot') || n === 'dot') return 'polkadot';
    if (n.includes('polygon') || n === 'matic') return 'matic-network';
    if (n.includes('litecoin') || n === 'ltc') return 'litecoin';
    if (n.includes('shiba') || n === 'shib') return 'shiba-inu';
    if (n.includes('tron') || n === 'trx') return 'tron';
    if (n.includes('uniswap') || n === 'uni') return 'uniswap';
    return n;
  }

  // --- CALCUL DU PRU (Prix de Revient Unitaire) ---
  private calculatePRU(transactions: any[]): number {
    let currentQuantity = 0;
    let currentTotalCost = 0;
    let pru = 0;

    const sortedTxs = [...transactions].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    for (const tx of sortedTxs) {
      const qty = parseFloat(tx.quantity);
      const amt = parseFloat(tx.amount);

      if (tx.type === 'achat' || tx.type === 'dépôt' || tx.type === 'depot') {
        currentTotalCost += amt;
        currentQuantity += qty;
        if (currentQuantity > 0) {
          pru = currentTotalCost / currentQuantity;
        }
      } else if (tx.type === 'vente' || tx.type === 'retrait') {
        currentQuantity -= qty;
        currentTotalCost -= qty * pru;
      }
    }

    return pru;
  }

  // --- FONCTION UTILITAIRE YAHOO FINANCE (PEA/CTO) ---
  private getYahooSymbol(name: string): string {
    const n = name.toUpperCase();
    // Les actions/ETF les plus courants sur PEA (avec .PA pour la bourse de Paris)
    if (n.includes('LVMH')) return 'MC.PA';
    if (n.includes('AIR LIQUIDE')) return 'AI.PA';
    if (n.includes('TOTAL') || n === 'TTE') return 'TTE.PA';
    if (n.includes('HERMES')) return 'RMS.PA';
    if (n.includes("L'OREAL") || n.includes('LOREAL')) return 'OR.PA';
    if (n.includes('APPLE') || n === 'AAPL') return 'AAPL'; // Bourse US

    // Les ETFs stars du PEA
    if (n.includes('CW8') || n.includes('MSCI WORLD')) return 'CW8.PA'; // Amundi MSCI World
    if (n.includes('S&P 500') || n === 'ESE') return 'ESE.PA'; // BNP Paribas S&P 500

    return n; // Fallback si tu rentres directement un Ticker manuel
  }

  // --- SCANNER DE PRIX BOURSIERS ---
  private async getStockPrices(
    stockNames: string[],
  ): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    for (const name of stockNames) {
      const symbol = this.getYahooSymbol(name);
      try {
        console.log(`📈 Appel Yahoo Finance pour : ${symbol}`);
        const quote: any = await yahooFinance.quote(symbol);

        if (quote && (quote.regularMarketPrice || quote.price)) {
          prices[symbol] = quote.regularMarketPrice;
        }
      } catch (error) {
        console.error(`❌ Erreur Yahoo Finance pour l'actif ${symbol}:`, error);
      }
    }
    return prices;
  }

  // --- LOGIQUE D'AJOUT DE WALLET (PORTFEUILLE BLOCKCHAIN) ---
  async addWalletData(body: {
    name: string;
    blockchain: string;
    address: string;
  }) {
    const defaultUser = await this.prisma.user.findFirst();
    if (!defaultUser) throw new Error('Aucun utilisateur trouvé.');

    // On vérifie si ce wallet n'existe pas déjà pour éviter les doublons
    const existingWallet = await this.prisma.wallet.findFirst({
      where: { address: body.address },
    });

    if (existingWallet) {
      return {
        success: false,
        message: 'Ce portefeuille est déjà lié à votre compte.',
      };
    }

    const newWallet = await this.prisma.wallet.create({
      data: {
        name: body.name,
        blockchain: body.blockchain.toLowerCase(),
        address: body.address,
        userId: defaultUser.id,
      },
    });

    return {
      success: true,
      message: 'Portefeuille lié avec succès !',
      wallet: newWallet,
    };
  }
}
