export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Profile &amp; Settings</h1>
      <p className="text-sm text-slate-300">
        Manage your account details, API keys, notifications, appearance, and
        risk preferences.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-surface p-4">Account &amp; appearance</div>
        <div className="rounded-xl bg-surface p-4">API keys &amp; notifications</div>
        <div className="rounded-xl bg-surface p-4">Bot risk preferences</div>
        <div className="rounded-xl bg-surface p-4">Subscription &amp; billing</div>
      </div>
    </div>
  );
}
