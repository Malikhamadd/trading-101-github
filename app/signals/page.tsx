"use client";

import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import React from "react";
import { getDb } from "@/lib/firebase";

type Signal = {
  id: string;
  asset: string;
  type: "BUY" | "SELL";
  createdAt?: { seconds: number; nanoseconds: number };
};

export default function SignalsPage() {
  const [signals, setSignals] = React.useState<Signal[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);

  React.useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      const db = getDb();
      const signalsRef = collection(db, "signals");
      const q = query(signalsRef, orderBy("createdAt", "desc"));
      unsubscribe = onSnapshot(q, (snap) => {
        const docs: Signal[] = [];
        snap.forEach((doc) => {
          const data = doc.data() as Omit<Signal, "id">;
          docs.push({ id: doc.id, ...data });
        });
        setSignals(docs);
      });
    } catch (e) {
      console.error("Failed to subscribe to signals", e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleAddDemoSignal = async () => {
    try {
      setIsAdding(true);
      const db = getDb();
      const signalsRef = collection(db, "signals");
      await addDoc(signalsRef, {
        asset: "BTCUSDT",
        type: Math.random() > 0.5 ? "BUY" : "SELL",
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to add signal", e);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Signals</h1>
      <p className="text-sm text-slate-300">
        Live view of strategy signals stored in Firestore. Configure your
        Firebase project in <code>.env.local</code> and create a
        <code>signals</code> collection to see real data.
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">
          Collection: <code>signals</code> (Firestore)
        </span>
        <button
          type="button"
          onClick={handleAddDemoSignal}
          disabled={isAdding}
          className="rounded-full bg-sky-500 px-3 py-1 text-xs font-medium text-white hover:bg-sky-400 disabled:opacity-60"
        >
          {isAdding ? "Adding..." : "Add demo signal"}
        </button>
      </div>
      <div className="rounded-xl bg-surface p-4">
        {signals.length === 0 ? (
          <p className="text-sm text-slate-400">
            No signals yet. Use the button above or write from your bot to
            populate Firestore.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800 text-sm">
            {signals.map((s) => {
              const date =
                s.createdAt?.seconds != null
                  ? new Date(s.createdAt.seconds * 1000).toLocaleString()
                  : "Pending...";
              return (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-slate-100">{s.asset}</div>
                    <div className="text-xs text-slate-400">{date}</div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      s.type === "BUY"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    {s.type}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

