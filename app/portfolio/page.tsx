export default function PortfolioPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
      <p className="text-sm text-slate-300">
        Track your holdings, equity curve, realized and unrealized P&L, and
        risk exposure.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-surface p-4">Summary metrics</div>
        <div className="rounded-xl bg-surface p-4">Equity curve</div>
        <div className="rounded-xl bg-surface p-4">Allocation</div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl bg-surface p-4">Holdings</div>
        <div className="space-y-4">
          <div className="rounded-xl bg-surface p-4">Wins vs losses</div>
          <div className="rounded-xl bg-surface p-4">Bot vs manual</div>
        </div>
      </div>
    </div>
  );
}
