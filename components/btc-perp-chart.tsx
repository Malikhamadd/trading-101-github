"use client";

import React from "react";

interface TradingViewWidgetConstructor {
  new (options: unknown): unknown;
}

declare global {
  interface Window {
    TradingView?: {
      widget: TradingViewWidgetConstructor;
    };
  }
}

interface BtcPerpChartProps {
  symbol: string;
}

export function BtcPerpChart({ symbol }: BtcPerpChartProps) {
  const containerId = React.useId().replace(":", "_");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const initWidget = () => {
      if (!window.TradingView) return;

      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = "";
      }

      new window.TradingView.widget({
        symbol,
        interval: "60",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        allow_symbol_change: true,
        autosize: true,
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
  }, [containerId, symbol]);

  return (
    <div className="h-full w-full bg-surface">
      <div id={containerId} className="h-full w-full" />
    </div>
  );
}
