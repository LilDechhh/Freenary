import { Injectable } from '@nestjs/common';
import YahooFinance from 'yahoo-finance2';
import { PrismaService } from './prisma.service';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

@Injectable()
export class StockService {
  private cachedEurUsdRate: number = 1.08;
  private lastRateFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  constructor(private prisma: PrismaService) {}

  async getEurUsdRate(): Promise<number> {
    const now = Date.now();
    if (
      now - this.lastRateFetchTime < this.CACHE_DURATION &&
      this.lastRateFetchTime !== 0
    ) {
      return this.cachedEurUsdRate;
    }
    try {
      const quote: any = await yahooFinance.quote('EURUSD=X');
      if (quote?.regularMarketPrice) {
        this.cachedEurUsdRate = quote.regularMarketPrice;
        this.lastRateFetchTime = now;
      }
    } catch (error) {
      console.error(
        '⚠️ Impossible de joindre Yahoo pour le taux EUR/USD, utilisation du cache.',
      );
    }
    return this.cachedEurUsdRate;
  }

  // 🌟 NETTOYAGE : On ne traduit plus les noms.
  // On renvoie simplement le symbole tel quel car il vient de ton nouveau moteur de recherche.
  getYahooSymbol(name: string): string {
    return name.toUpperCase().trim();
  }

  async fetchPrices(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    const rate = await this.getEurUsdRate();

    // On utilise Promise.all pour aller plus vite au lieu d'une boucle 'for' lente
    await Promise.all(
      symbols.map(async (name) => {
        const symbol = this.getYahooSymbol(name);
        try {
          const quote: any = await yahooFinance.quote(symbol);
          if (quote?.regularMarketPrice || quote?.price) {
            let price = quote.regularMarketPrice || quote.price;
            // 🌟 Conversion automatique si l'action est en Dollars
            prices[symbol] = quote.currency === 'USD' ? price / rate : price;
          }
        } catch (e) {
          console.error(`❌ Erreur Prix Yahoo pour ${symbol}`, e.message);

          // Optionnel : Fallback sur le dernier prix en base de données si Yahoo échoue
          const lastAsset = await this.prisma.asset.findFirst({
            where: { name: symbol, category: 'pea' },
          });
          if (lastAsset && !prices[symbol]) {
            // On peut mettre une logique ici pour ne pas afficher 0€
          }
        }
      }),
    );

    return prices;
  }

  // --- MOTEUR DE RECHERCHE BOURSIER ---
  async searchStocks(query: string) {
    if (!query || query.length < 2) return [];

    try {
      const cleanedQuery = query.replace(/pea/gi, '').trim();
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanedQuery)}&quotesCount=10`;

      const response = await fetch(url);
      const data = await response.json();

      return data.quotes
        .filter(
          (q: any) =>
            q.quoteType === 'EQUITY' ||
            q.quoteType === 'ETF' ||
            q.quoteType === 'MUTUALFUND',
        )
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.longname || q.shortname || q.symbol,
          exchDisp: q.exchDisp || 'Global',
          type: q.quoteType,
        }));
    } catch (error) {
      console.error('Erreur Search Yahoo:', error);
      return [];
    }
  }
}
