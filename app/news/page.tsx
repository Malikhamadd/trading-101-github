export default function NewsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">News &amp; Macro</h1>
      <p className="text-sm text-slate-300">
        AI-summarized market news, macro events, earnings, and Fed updates.
      </p>
      <div className="rounded-xl bg-surface p-4">AI highlight cards</div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl bg-surface p-4">News feed</div>
        <div className="space-y-4">
          <div className="rounded-xl bg-surface p-4">Economic calendar</div>
          <div className="rounded-xl bg-surface p-4">Earnings &amp; Fed events</div>
        </div>
      </div>
    </div>
  );
}
