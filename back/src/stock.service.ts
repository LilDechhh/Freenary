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
      const quote = (await yahooFinance.quote('EURUSD=X')) as { regularMarketPrice?: number };
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

  async fetchPrices(
    symbols: string[],
  ): Promise<Record<string, { price: number; name: string }>> {
    const prices: Record<string, { price: number; name: string }> = {};
    const rate = await this.getEurUsdRate();

    await Promise.all(
      symbols.map(async (name) => {
        const symbol = this.getYahooSymbol(name);
        try {
          const quote = (await yahooFinance.quote(symbol)) as {
            regularMarketPrice?: number;
            price?: number;
            currency?: string;
            shortName?: string;
            longName?: string;
          };
          const price = quote?.regularMarketPrice || quote?.price;
          if (price !== undefined) {
            // 🌟 On enregistre le prix ET le vrai nom (shortName ou longName)
            prices[symbol] = {
              price: quote.currency === 'USD' ? price / rate : price,
              name: quote.shortName || quote.longName || symbol,
            };
          }
        } catch (e: unknown) {
          if (e instanceof Error) {
            console.error(`❌ Erreur Prix Yahoo pour ${symbol}`, e.message);
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
      const data = (await response.json()) as { quotes: any[] };

      return data.quotes
        .filter(
          (q) =>
            q.quoteType === 'EQUITY' ||
            q.quoteType === 'ETF' ||
            q.quoteType === 'MUTUALFUND',
        )
        .map((q) => ({
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
