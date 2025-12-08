export default function StrategyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Strategy</h1>
      <p className="text-sm text-slate-300">
        Learn how your trading bot works, including indicators, logic, risk
        management, and backtest results.
      </p>
      <div className="rounded-xl bg-surface p-4">Overview &amp; logic</div>
      <div className="rounded-xl bg-surface p-4">Risk management</div>
      <div className="rounded-xl bg-surface p-4">Backtest results &amp; FAQ</div>
    </div>
  );
}
