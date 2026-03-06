"use client";

import { BtcPerpChart } from "@/components/btc-perp-chart";
import { BotAnalysisOverlay } from "@/components/bot-analysis-overlay";

export default function ChartsPage() {
  return (
    <div className="relative h-full w-full -mx-4 -my-4 md:-mx-8 md:-my-6">
      <BtcPerpChart symbol="BINANCE:BTCUSDT" />
      <BotAnalysisOverlay asset="BTCUSDT" />
    </div>
  );
}

