"use client";

import React from "react";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => console.error("SW registration failed", error));
    }
  }, []);

  return <>{children}</>;
}
