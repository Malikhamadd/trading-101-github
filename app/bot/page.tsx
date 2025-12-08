export default function BotPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Trading Bot</h1>
      <p className="text-sm text-slate-300">
        Control, monitor, and analyze your automated trading strategies.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl bg-surface p-4">Bot controls &amp; markets</div>
          <div className="rounded-xl bg-surface p-4">Strategy parameters</div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl bg-surface p-4">Live signal feed</div>
          <div className="rounded-xl bg-surface p-4">System status &amp; logs</div>
        </div>
      </div>
      <div className="rounded-xl bg-surface p-4">Performance dashboard</div>
    </div>
  );
}
