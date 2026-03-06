"use client";

import React from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type {
  SimpleStrategy,
  ComparisonOperator,
  IndicatorType,
  IndicatorParams,
} from "@/lib/strategy";

type TestResult = {
  rsi: number;
  triggered: boolean;
  side: "BUY" | "SELL";
};

async function fetchBinanceRsi(
  symbol: string,
  interval: string,
  length: number,
  bars: number,
): Promise<number | null> {
  try {
    const minNeeded = length + 1;
    const limit = Math.max(bars, minNeeded);
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(
        symbol,
      )}&interval=${encodeURIComponent(interval)}&limit=${limit}`,
    );
    if (!res.ok) return null;
    const data: unknown[] = await res.json();
    const closes = (data as unknown[]).map((d) => {
      const row = d as [number, string, string, string, string, ...unknown[]];
      return parseFloat(row[4]);
    });
    if (closes.length < length + 1) return null;

    // Simple RSI calculation on closing prices
    const slice = closes.slice(-length - 1);
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < slice.length; i++) {
      const diff = slice[i] - slice[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / length;
    const avgLoss = losses / length;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    return rsi;
  } catch (e) {
    console.error("Failed to fetch Binance data", e);
    return null;
  }
}

function getBinanceInterval(tf: SimpleStrategy["timeframe"]): string {
  switch (tf) {
    case "1m":
      return "1m";
    case "5m":
      return "5m";
    case "15m":
      return "15m";
    case "1h":
      return "1h";
    case "4h":
      return "4h";
    case "1d":
      return "1d";
  }
}

function compare(value: number, op: ComparisonOperator, threshold: number): boolean {
  if (op === ">") return value > threshold;
  if (op === ">=") return value >= threshold;
  if (op === "<") return value < threshold;
  return value <= threshold;
}

function defaultParamsForIndicator(indicator: IndicatorType): IndicatorParams {
  switch (indicator) {
    case "RSI":
      return { length: 14, bars: 100 };
    case "EMA":
    case "SMA":
      return { length: 20, bars: 100 };
    case "MACD":
      return { fastLength: 12, slowLength: 26, signalLength: 9, bars: 100 };
    case "BOLLINGER_BANDS":
      return { length: 20, stdDev: 2, band: "lower", bars: 100 };
    case "VWAP":
      return { bars: 100 };
  }
}

function defaultThresholdForIndicator(indicator: IndicatorType): number {
  switch (indicator) {
    case "RSI":
      return 30;
    case "EMA":
    case "SMA":
      return 0;
    case "MACD":
      return 0;
    case "BOLLINGER_BANDS":
      return 0;
    case "VWAP":
      return 0;
  }
}

export default function BotPage() {
  const [strategy, setStrategy] = React.useState<SimpleStrategy>({
    name: "BTCUSDT RSI Oversold",
    symbol: "BTCUSDT",
    timeframe: "15m",
    direction: "long",
    condition: {
      type: "indicator_condition",
      indicator: "RSI",
        params: { length: 14, bars: 100 },
      operator: "<",
      threshold: 30,
    },
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<TestResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = <K extends keyof SimpleStrategy>(key: K, value: SimpleStrategy[K]) => {
    setStrategy((prev) => ({ ...prev, [key]: value }));
  };

  const handleConditionChange = <K extends keyof SimpleStrategy["condition"]>(
    key: K,
    value: SimpleStrategy["condition"][K],
  ) => {
    setStrategy((prev) => ({
      ...prev,
      condition: {
        ...prev.condition,
        [key]: value,
      },
    }));
  };

  const handleIndicatorChange = (indicator: IndicatorType) => {
    setStrategy((prev) => ({
      ...prev,
      condition: {
        ...prev.condition,
        indicator,
        params: defaultParamsForIndicator(indicator),
        threshold: defaultThresholdForIndicator(indicator),
      },
    }));
  };

  const handleIndicatorParamChange = <K extends keyof IndicatorParams>(
    key: K,
    value: NonNullable<IndicatorParams[K]>,
  ) => {
    setStrategy((prev) => ({
      ...prev,
      condition: {
        ...prev.condition,
        params: {
          ...prev.condition.params,
          [key]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const db = getDb();
      const ref = collection(db, "strategies");
      await addDoc(ref, {
        ...strategy,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      setError("Failed to save strategy");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setError(null);
    setIsTesting(true);
    setTestResult(null);
    try {
      if (strategy.condition.indicator !== "RSI") {
        setError("Testing is currently implemented for RSI only.");
        return;
      }
      const interval = getBinanceInterval(strategy.timeframe);
      const length = strategy.condition.params.length ?? 14;
      const bars = strategy.condition.params.bars ?? 100;
      const rsi = await fetchBinanceRsi(strategy.symbol, interval, length, bars);
      if (rsi == null) {
        setError("Could not load market data for test.");
        return;
      }
      const triggered = compare(rsi, strategy.condition.operator, strategy.condition.threshold);
      const side: "BUY" | "SELL" = strategy.direction === "long" ? "BUY" : "SELL";
      setTestResult({ rsi, triggered, side });

      const db = getDb();
      const signalsRef = collection(db, "signals");
      await addDoc(signalsRef, {
        asset: strategy.symbol,
        direction: strategy.direction,
        timeframe: strategy.timeframe,
        indicator: strategy.condition.indicator,
        indicatorParams: strategy.condition.params,
        metric: "RSI",
        metricValue: rsi,
        operator: strategy.condition.operator,
        threshold: strategy.condition.threshold,
        triggered,
        side,
        confidence: triggered ? 1 : 0,
        createdAt: serverTimestamp(),
        source: "builder-test",
      });
    } catch (e) {
      console.error(e);
      setError("Test run failed");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Trading Bot Builder</h1>
      <p className="text-sm text-slate-300">
        Visually define a simple RSI-based strategy and test it against live
        Binance data for the same market you see on the chart.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-100">
              Strategy configuration
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-slate-300">
                Name
                <input
                  className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                  value={strategy.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </label>
              <label className="text-xs text-slate-300">
                Symbol (Binance)
                <input
                  className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                  value={strategy.symbol}
                  onChange={(e) => handleChange("symbol", e.target.value.toUpperCase())}
                />
              </label>
              <label className="text-xs text-slate-300">
                Timeframe
                <select
                  className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                  value={strategy.timeframe}
                  onChange={(e) => handleChange("timeframe", e.target.value as SimpleStrategy["timeframe"])}
                >
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                  <option value="1d">1d</option>
                </select>
              </label>
              <label className="text-xs text-slate-300">
                Direction
                <select
                  className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                  value={strategy.direction}
                  onChange={(e) => handleChange("direction", e.target.value as SimpleStrategy["direction"])}
                >
                  <option value="long">Long (BUY when condition true)</option>
                  <option value="short">Short (SELL when condition true)</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-xl bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-100">
              Indicator condition
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-xs text-slate-300">
                Indicator
                <select
                  className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                  value={strategy.condition.indicator}
                  onChange={(e) => handleIndicatorChange(e.target.value as IndicatorType)}
                >
                  <option value="RSI">RSI</option>
                  <option value="EMA">EMA</option>
                  <option value="SMA">SMA</option>
                  <option value="MACD">MACD</option>
                  <option value="BOLLINGER_BANDS">Bollinger Bands</option>
                  <option value="VWAP">VWAP</option>
                </select>
              </label>

              {strategy.condition.indicator === "RSI" && (
                <label className="text-xs text-slate-300">
                  Length
                  <input
                    type="number"
                    min={2}
                    className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                    value={strategy.condition.params.length ?? 14}
                    onChange={(e) =>
                      handleIndicatorParamChange("length", Number(e.target.value) || 14)
                    }
                  />
                </label>
              )}

              <label className="text-xs text-slate-300">
                Bars to compute
                <input
                  type="number"
                  min={20}
                  className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                  value={strategy.condition.params.bars ?? 100}
                  onChange={(e) =>
                    handleIndicatorParamChange("bars", Number(e.target.value) || 100)
                  }
                />
              </label>

              {(strategy.condition.indicator === "EMA" ||
                strategy.condition.indicator === "SMA") && (
                <label className="text-xs text-slate-300">
                  Length
                  <input
                    type="number"
                    min={2}
                    className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                    value={strategy.condition.params.length ?? 20}
                    onChange={(e) =>
                      handleIndicatorParamChange("length", Number(e.target.value) || 20)
                    }
                  />
                </label>
              )}

              {strategy.condition.indicator === "MACD" && (
                <>
                  <label className="text-xs text-slate-300">
                    Fast length
                    <input
                      type="number"
                      min={2}
                      className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                      value={strategy.condition.params.fastLength ?? 12}
                      onChange={(e) =>
                        handleIndicatorParamChange(
                          "fastLength",
                          Number(e.target.value) || 12,
                        )
                      }
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Slow length
                    <input
                      type="number"
                      min={2}
                      className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                      value={strategy.condition.params.slowLength ?? 26}
                      onChange={(e) =>
                        handleIndicatorParamChange(
                          "slowLength",
                          Number(e.target.value) || 26,
                        )
                      }
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Signal length
                    <input
                      type="number"
                      min={2}
                      className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                      value={strategy.condition.params.signalLength ?? 9}
                      onChange={(e) =>
                        handleIndicatorParamChange(
                          "signalLength",
                          Number(e.target.value) || 9,
                        )
                      }
                    />
                  </label>
                </>
              )}

              {strategy.condition.indicator === "BOLLINGER_BANDS" && (
                <>
                  <label className="text-xs text-slate-300">
                    Length
                    <input
                      type="number"
                      min={2}
                      className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                      value={strategy.condition.params.length ?? 20}
                      onChange={(e) =>
                        handleIndicatorParamChange("length", Number(e.target.value) || 20)
                      }
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Std dev
                    <input
                      type="number"
                      min={0.5}
                      step={0.1}
                      className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                      value={strategy.condition.params.stdDev ?? 2}
                      onChange={(e) =>
                        handleIndicatorParamChange(
                          "stdDev",
                          Number(e.target.value) || 2,
                        )
                      }
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Band
                    <select
                      className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                      value={strategy.condition.params.band ?? "lower"}
                      onChange={(e) =>
                        handleIndicatorParamChange(
                          "band",
                          e.target.value as "upper" | "middle" | "lower",
                        )
                      }
                    >
                      <option value="upper">Upper</option>
                      <option value="middle">Middle</option>
                      <option value="lower">Lower</option>
                    </select>
                  </label>
                </>
              )}

              <label className="text-xs text-slate-300">
                Operator
                <select
                  className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                  value={strategy.condition.operator}
                  onChange={(e) =>
                    handleConditionChange("operator", e.target.value as ComparisonOperator)
                  }
                >
                  <option value="<">Below</option>
                  <option value="<=">Below or equal</option>
                  <option value=">">Above</option>
                  <option value=">=">Above or equal</option>
                </select>
              </label>
              <label className="text-xs text-slate-300">
                Threshold
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="mt-1 w-full rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500"
                  value={strategy.condition.threshold}
                  onChange={(e) =>
                    handleConditionChange("threshold", Number(e.target.value) || 30)
                  }
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save strategy"}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="rounded-full border border-sky-500 px-4 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/10 disabled:opacity-60"
            >
              {isTesting ? "Testing..." : "Test against live chart"}
            </button>
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          {testResult && (
            <div className="rounded-xl bg-surface p-4 text-xs text-slate-200">
              <div>Latest RSI: {testResult.rsi.toFixed(2)}</div>
              <div>
                Condition: {strategy.condition.indicator} {strategy.condition.operator} {strategy.condition.threshold}{" "}
                {testResult.triggered ? (
                  <span className="font-semibold text-emerald-300">
                    TRIGGERED ({testResult.side})
                  </span>
                ) : (
                  <span className="text-slate-400">not triggered</span>
                )}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                When triggered, a demo signal is also written to your Firestore
                <code className="ml-1 rounded bg-slate-900 px-1">signals</code> collection.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-surface p-4 text-xs text-slate-300">
            <h2 className="mb-2 text-sm font-semibold text-slate-100">How this works</h2>
            <p>
              This is a first MVP of the no-code bot builder. You define an RSI
              rule, we fetch recent candles from Binance for the same symbol &amp;
              timeframe, calculate RSI, and determine whether a BUY/SELL signal
              would fire.
            </p>
            <p className="mt-2">
              Next steps will move this logic to a backend worker, add more
              indicators &amp; market-structure blocks, and overlay the signals on
              the TradingView chart.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

