export default function ResearchPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Research &amp; Analytics</h1>
      <p className="text-sm text-slate-300">
        Deep-dive analytics including on-chain indicators, market breadth,
        volatility, correlations, and sentiment.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-surface p-4">On-chain &amp; breadth</div>
        <div className="rounded-xl bg-surface p-4">Volatility &amp; seasonality</div>
        <div className="md:col-span-2 rounded-xl bg-surface p-4">Correlation matrix &amp; volume heatmaps</div>
        <div className="md:col-span-2 rounded-xl bg-surface p-4">Sentiment analysis</div>
      </div>
    </div>
  );
}
