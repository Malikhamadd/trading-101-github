export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-sm text-slate-300">
        High-level overview of global markets, your bot status, latest signals,
        and portfolio snapshot.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-surface p-4">Global market summary</div>
        <div className="rounded-xl bg-surface p-4">Bot status & quick actions</div>
        <div className="rounded-xl bg-surface p-4">Portfolio snapshot</div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl bg-surface p-4">
          Latest signals
        </div>
        <div className="space-y-4">
          <div className="rounded-xl bg-surface p-4">Fear &amp; Greed</div>
          <div className="rounded-xl bg-surface p-4">News feed</div>
        </div>
      </div>
    </div>
  );
}
