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

  async getSolanaBalance(address: string): Promise<number> {
    try {
      const res = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address],
        }),
      });
      const data = await res.json();
      return (data.result?.value || 0) / 1_000_000_000;
    } catch (e) {
      return 0;
    }
  }
}
