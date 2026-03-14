import { Injectable } from '@nestjs/common';
import YahooFinance from 'yahoo-finance2';
import { PrismaService } from './prisma.service';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

@Injectable()
export class StockService {
  private cachedEurUsdRate: number = 1.08;
  private lastRateFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  // 🌟 On injecte Prisma pour pouvoir récupérer les derniers prix en base si Yahoo échoue
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

  getYahooSymbol(name: string): string {
    const n = name.toUpperCase();
    if (n.includes('LVMH')) return 'MC.PA';
    if (n.includes('AIR LIQUIDE')) return 'AI.PA';
    if (n.includes('TOTAL')) return 'TTE.PA';
    if (n.includes('CW8')) return 'CW8.PA';
    if (n.includes('APPLE') || n === 'AAPL') return 'AAPL';
    return n;
  }

  async fetchPrices(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    const rate = await this.getEurUsdRate();

    for (const name of symbols) {
      const symbol = this.getYahooSymbol(name);
      try {
        const quote: any = await yahooFinance.quote(symbol);
        if (quote?.regularMarketPrice || quote?.price) {
          let price = quote.regularMarketPrice || quote.price;
          prices[symbol] = quote.currency === 'USD' ? price / rate : price;
        }
      } catch (e) {
        console.error(`❌ Erreur Stock ${symbol}`, e);
      }
    }
    return prices;
  }
}
