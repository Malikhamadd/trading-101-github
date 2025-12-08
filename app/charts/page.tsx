import { BtcPerpChart } from "@/components/btc-perp-chart";

export default function ChartsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Advanced Charts</h1>
      <p className="text-sm text-slate-300">
        Live BTCUSDT perpetual futures chart using Binance data, with room to
        expand into multi-asset, multi-panel views.
      </p>
      <BtcPerpChart />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-surface p-4">Order book (future)</div>
        <div className="rounded-xl bg-surface p-4">Recent trades (future)</div>
        <div className="rounded-xl bg-surface p-4">Backtest summary (future)</div>
      </div>
    </div>
  );
}

