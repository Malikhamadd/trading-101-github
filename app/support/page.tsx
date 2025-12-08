export default function SupportPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Contact &amp; Support</h1>
      <p className="text-sm text-slate-300">
        Get help, report issues, and share strategy ideas with the team.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-surface p-4">Ticket submission form</div>
        <div className="rounded-xl bg-surface p-4">Live chat</div>
      </div>
      <div className="rounded-xl bg-surface p-4">My tickets &amp; strategy notes</div>
    </div>
  );
}
