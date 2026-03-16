import { Injectable } from '@nestjs/common';

@Injectable()
export class CryptoService {
  private cachedPrices: Record<string, any> = {};
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  private getCoinGeckoId(name: string): string {
    const n = name.toLowerCase();
    if (n === 'btc' || n.includes('bitcoin')) return 'bitcoin';
    if (n === 'eth' || n.includes('ethereum')) return 'ethereum';
    if (n === 'sol' || n.includes('solana')) return 'solana';
    return n;
  }

  async fetchPrices(names: string[]): Promise<Record<string, any>> {
    const now = Date.now();
    const ids = names.map((n) => this.getCoinGeckoId(n)).join(',');

    if (
      now - this.lastFetchTime < this.CACHE_DURATION &&
      this.cachedPrices[names[0]]
    ) {
      return this.cachedPrices;
    }

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`,
      );
      if (res.ok) {
        this.cachedPrices = await res.json();
        this.lastFetchTime = now;
      }
    } catch (e) {
      console.error('❌ Erreur CoinGecko', e);
    }
    return this.cachedPrices;
  }

  // --- MOTEUR DE RECHERCHE CRYPTO (COINGECKO) ---
  async searchCrypto(query: string) {
    if (!query || query.length < 2) return [];

    try {
      const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();

      // On récupère les 10 premiers résultats
      return data.coins.slice(0, 10).map((coin: any) => ({
        symbol: coin.id, // On utilise l'ID (ex: 'bitcoin') pour que CoinGecko retrouve le prix plus tard
        ticker: coin.symbol, // Le symbole court (ex: 'BTC')
        name: coin.name,
        thumb: coin.thumb, // Petite icône du jeton
        type: 'CRYPTO',
      }));
    } catch (error) {
      console.error('Erreur Search CoinGecko:', error);
      return [];
    }
  }
}
