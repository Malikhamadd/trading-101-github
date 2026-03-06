export type IndicatorType =
  | "RSI"
  | "EMA"
  | "SMA"
  | "MACD"
  | "BOLLINGER_BANDS"
  | "VWAP";

export type ComparisonOperator = ">" | ">=" | "<" | "<=";

export interface IndicatorParams {
  // Common lookback length (RSI, EMA, SMA, Bollinger)
  length?: number;
  // How many bars/candles to fetch/compute over for this timeframe
  bars?: number;
  // MACD-specific
  fastLength?: number;
  slowLength?: number;
  signalLength?: number;
  // Bollinger-specific
  stdDev?: number;
  band?: "upper" | "middle" | "lower";
}

export interface SimpleIndicatorCondition {
  type: "indicator_condition";
  indicator: IndicatorType;
  params: IndicatorParams;
  operator: ComparisonOperator;
  threshold: number;
}

export interface SimpleStrategy {
  id?: string;
  name: string;
  symbol: string; // e.g. BTCUSDT
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
  direction: "long" | "short";
  condition: SimpleIndicatorCondition;
  createdAt?: string;
}
