"use client";

import React from "react";

declare global {
  interface Window {
    TradingView?: {
      widget: (options: unknown) => unknown;
    };
  }
}

export function BtcPerpChart() {
  const containerId = React.useId().replace(":", "_");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const initWidget = () => {
      if (!window.TradingView) return;

      new window.TradingView.widget({
        symbol: "BINANCE:BTCUSDT.P",
        interval: "60",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        allow_symbol_change: false,
        container_id: containerId,
      });
    };

    if (!document.querySelector('script[src="https://s3.tradingview.com/tv.js"]')) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      initWidget();
    }
  }, [containerId]);

  return (
    <div className="h-[480px] w-full rounded-xl bg-surface">
      <div id={containerId} className="h-full w-full" />
    </div>
  );
}
