export interface HistoricalDataPoint {
  date: string;
  value: number;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  quantity: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  // Computed fields from the backend
  currentPrice?: number;
  currentValue?: number;
  pru?: number;
}

export interface Transaction {
  id: string;
  date: string;
  category: string;
  type: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  quantity: number;
  price: number;
  label: string | null;
  assetId: string;
  asset?: Asset;
}

export interface CategoryData {
  name: string;
  value: number;
  percent: number;
}

export interface GlobalData {
  totalWealth: number;
  ytdPerformance: number;
  distribution: CategoryData[];
  historicalData: HistoricalDataPoint[];
  assets: Asset[];
}

export interface CategoryDetailsData {
  title?: string;
  totalWealth?: number;
  totalCategoryValue?: number;
  totalGain?: number;
  totalGainPercent?: number;
  historicalData: HistoricalDataPoint[];
  assets: Asset[];
  transactions: Transaction[];
}
