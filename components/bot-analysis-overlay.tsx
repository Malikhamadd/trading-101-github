"use client";

import React from "react";
import {
	collection,
	query,
	where,
	orderBy,
	limit,
	onSnapshot,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";

interface BotAnalysisOverlayProps {
	asset: string; // e.g. BTCUSDT
}

interface BotAnalysis {
	id: string;
	asset: string;
	direction: "long" | "short";
	timeframe: string;
	indicator: string;
	metric: string;
	metricValue: number;
	operator: string;
	threshold: number;
	triggered: boolean;
	side: "BUY" | "SELL";
	createdAt?: Date;
}

export function BotAnalysisOverlay({ asset }: BotAnalysisOverlayProps) {
	const [latest, setLatest] = React.useState<BotAnalysis | null>(null);

	React.useEffect(() => {
		const db = getDb();
		const signalsRef = collection(db, "signals");
		const q = query(
			signalsRef,
			where("asset", "==", asset),
			where("source", "==", "builder-test"),
			orderBy("createdAt", "desc"),
			limit(1),
		);

		const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
			if (snap.empty) {
				setLatest(null);
				return;
			}
			const doc = snap.docs[0];
			const data = doc.data();
			setLatest({
				id: doc.id,
				asset: data.asset,
				direction: data.direction,
				timeframe: data.timeframe,
				indicator: data.indicator,
				metric: data.metric,
				metricValue: data.metricValue,
				operator: data.operator,
				threshold: data.threshold,
				triggered: data.triggered,
				side: data.side,
				createdAt: data.createdAt?.toDate?.(),
			});
		});

		return () => unsub();
	}, [asset]);

	if (!latest) return null;

	return (
		<div className="pointer-events-none absolute right-3 top-3 z-20 max-w-xs rounded-md bg-black/80 px-3 py-2 text-[11px] text-slate-100 shadow-lg">
			<div className="flex items-center justify-between gap-2">
				<span className="font-semibold text-sky-300">Bot analysis</span>
				<span className="text-[10px] text-slate-400">
					{latest.asset} · {latest.timeframe}
				</span>
			</div>
			<div className="mt-1 flex items-baseline gap-1">
				<span className="text-slate-300">{latest.metric}</span>
				<span className="font-mono text-[11px]">
					{latest.metricValue.toFixed(2)} {latest.operator} {latest.threshold}
				</span>
			</div>
			<div className="mt-1 flex items-center justify-between gap-2">
				<span className="text-[10px] text-slate-400">
					{latest.indicator} · {latest.direction.toUpperCase()} bot
				</span>
				<span
					className={
						"rounded-full px-2 py-0.5 text-[10px] font-semibold " +
						(latest.triggered
							? latest.side === "BUY"
								? "bg-emerald-500/20 text-emerald-300"
								: "bg-rose-500/20 text-rose-300"
							: "bg-slate-700 text-slate-300")
					}
				>
					{latest.triggered ? `${latest.side} SIGNAL` : "No signal"}
				</span>
			</div>
			{latest.createdAt && (
				<div className="mt-1 text-[10px] text-slate-500">
					Last update: {latest.createdAt.toLocaleTimeString()}
				</div>
			)}
		</div>
	);
}
