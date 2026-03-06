"use client";

import React from "react";
import { BtcPerpChart } from "@/components/btc-perp-chart";

type BarDirection = "up" | "down";

type BarPattern =
  | "standard"
  | "doji"
  | "longLeggedDoji"
  | "crossDoji"
  | "hammer"
  | "hangingMan"
  | "invertedHammer"
  | "shootingStar"
  | "bullishOpeningMarubozu"
  | "bearishOpeningMarubozu"
  | "spinningTop"
  | "bullishClosingMarubozu"
  | "bearishClosingMarubozu";

type StructurePattern =
  | "invHeadAndShoulders"
  | "bullishFlag"
  | "ascendingTriangle"
  | "headAndShoulders"
  | "bearishFlag"
  | "descendingTriangle"
  | "fallingWedge"
  | "symmetricalTriangle"
  | "risingWedge"
  | "doubleBottom"
  | "doubleTop";

const PATTERN_SWING = 14;

const PATTERN_OFFSETS: Record<StructurePattern, number[]> = {
  // Inverted head & shoulders: extra bars on the shoulders and neckline
  invHeadAndShoulders: [
    0,
    PATTERN_SWING * 0.6,
    PATTERN_SWING * 0.2,
    PATTERN_SWING * 1.3,
    PATTERN_SWING * 0.1,
    PATTERN_SWING * 1.4,
    PATTERN_SWING * 0.3,
    PATTERN_SWING * 1.8,
    PATTERN_SWING * 2.1,
  ],
  // Bullish flag: strong pole then more candles in the flag
  bullishFlag: [
    0,
    PATTERN_SWING * 1.6,
    PATTERN_SWING * 1.2,
    PATTERN_SWING * 1.7,
    PATTERN_SWING * 1.3,
    PATTERN_SWING * 1.6,
    PATTERN_SWING * 1.4,
    PATTERN_SWING * 2.1,
  ],
  // Ascending triangle: repeated resistance at top with rising lows
  ascendingTriangle: [
    PATTERN_SWING,
    PATTERN_SWING * 0.4,
    PATTERN_SWING,
    PATTERN_SWING * 0.6,
    PATTERN_SWING,
    PATTERN_SWING * 0.8,
    PATTERN_SWING,
    PATTERN_SWING * 1.3,
  ],
  // Classic head & shoulders: more candles across the shoulders and head
  headAndShoulders: [
    PATTERN_SWING * 1.4,
    PATTERN_SWING * 0.8,
    PATTERN_SWING * 1.8,
    PATTERN_SWING * 0.9,
    PATTERN_SWING * 2.1,
    PATTERN_SWING * 0.7,
    PATTERN_SWING * 1.3,
    PATTERN_SWING * 0.3,
    0,
  ],
  // Bearish flag: impulse down then several candles in the flag
  bearishFlag: [
    PATTERN_SWING * 1.9,
    PATTERN_SWING * 0.5,
    PATTERN_SWING * 1.3,
    PATTERN_SWING * 0.7,
    PATTERN_SWING * 1.1,
    PATTERN_SWING * 0.4,
    PATTERN_SWING * 0.9,
    0,
  ],
  // Descending triangle: flat base with more lower-high touches
  descendingTriangle: [
    PATTERN_SWING * 1.6,
    PATTERN_SWING,
    PATTERN_SWING * 1.3,
    PATTERN_SWING,
    PATTERN_SWING * 1.1,
    PATTERN_SWING,
    PATTERN_SWING * 0.9,
    0,
  ],
  // Falling wedge: several converging swings before breakout
  fallingWedge: [
    PATTERN_SWING * 1.5,
    PATTERN_SWING,
    PATTERN_SWING * 1.3,
    PATTERN_SWING * 0.9,
    PATTERN_SWING * 1.1,
    PATTERN_SWING * 0.7,
    PATTERN_SWING * 0.9,
    0,
  ],
  // Symmetrical triangle: converging highs/lows with a few extra touches
  symmetricalTriangle: [
    PATTERN_SWING,
    PATTERN_SWING * 0.3,
    PATTERN_SWING * 0.9,
    PATTERN_SWING * 0.4,
    PATTERN_SWING * 0.7,
    PATTERN_SWING * 0.5,
    PATTERN_SWING * 0.8,
    PATTERN_SWING * 1.2,
    PATTERN_SWING * 1.5,
  ],
  // Rising wedge: multiple converging swings before breakdown
  risingWedge: [
    0,
    PATTERN_SWING * 0.7,
    PATTERN_SWING * 0.4,
    PATTERN_SWING * 1.0,
    PATTERN_SWING * 0.8,
    PATTERN_SWING * 1.2,
    PATTERN_SWING * 1.0,
    PATTERN_SWING * 1.4,
  ],
  // Double bottom: two clear lows with intervening highs and breakout
  doubleBottom: [
    0,
    PATTERN_SWING,
    0,
    PATTERN_SWING * 0.8,
    0,
    PATTERN_SWING * 1.3,
    PATTERN_SWING * 1.7,
  ],
  // Double top: two clear highs with intervening lows and breakdown
  doubleTop: [
    PATTERN_SWING * 1.7,
    PATTERN_SWING,
    PATTERN_SWING * 1.7,
    PATTERN_SWING * 0.9,
    PATTERN_SWING * 1.6,
    PATTERN_SWING * 0.5,
    0,
  ],
};

interface SketchBar {
  id: number;
  // x-position in sketch space (0-120, viewBox units)
  x: number;
  // vertical offset applied to the whole bar in sketch units
  yOffset: number;
  direction: BarDirection;
  pattern: BarPattern;
  // Optional per-bar custom OHLC shape, used by generated patterns
  customShape?: {
    baseHighY: number;
    baseLowY: number;
    baseOpenY: number;
    baseCloseY: number;
  };
}

interface ConfluencePoint {
  id: number;
  x: number; // 0-100 in sketch space
  y: number; // 0-100 in sketch space
}

type Tool = "add-up" | "add-down" | "confluence";

interface OhlcBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

async function fetchRecentOhlc(
  symbol: string,
  interval: string,
  limit: number,
): Promise<OhlcBar[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(
    symbol,
  )}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to load market data");
  }
  const data: unknown[] = await res.json();
  return (data as unknown[]).map((d) => {
    const row = d as [number, string, string, string, string, ...unknown[]];
    return {
      time: row[0],
      open: parseFloat(row[1]),
      high: parseFloat(row[2]),
      low: parseFloat(row[3]),
      close: parseFloat(row[4]),
    };
  });
}

function normalizeSeries(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

function matchPatternOnSeries(patternOffsets: number[], series: number[]) {
  const patternLength = patternOffsets.length;
  if (patternLength === 0 || series.length < patternLength) {
    return {
      matches: 0,
      bestScore: Infinity,
      testedBars: series.length,
      bestIndex: null,
      patternLength,
    };
  }

  const patternProfile = normalizeSeries(patternOffsets);
  let matches = 0;
  let bestScore = Infinity;
  let bestIndex: number | null = null;

  for (let i = 0; i <= series.length - patternLength; i += 1) {
    const window = series.slice(i, i + patternLength);
    const windowNorm = normalizeSeries(window);
    let sumSq = 0;
    for (let j = 0; j < patternLength; j += 1) {
      const diff = patternProfile[j] - windowNorm[j];
      sumSq += diff * diff;
    }
    const mse = sumSq / patternLength;
    if (mse < bestScore) {
      bestScore = mse;
      bestIndex = i;
    }
    // Threshold tuned to allow approximate matches but avoid noise
    if (mse < 0.02) {
      matches += 1;
    }
  }

  return { matches, bestScore, testedBars: series.length, bestIndex, patternLength };
}

export default function CreateConfluencesPage() {
  const [bars, setBars] = React.useState<SketchBar[]>([]);
  const [points, setPoints] = React.useState<ConfluencePoint[]>([]);
  const [activeTool, setActiveTool] = React.useState<Tool>("add-up");
  const [zoom, setZoom] = React.useState(0.5);
  const [selectedPattern, setSelectedPattern] = React.useState<BarPattern>("doji");
  const [selectedStructurePattern, setSelectedStructurePattern] =
    React.useState<StructurePattern>("invHeadAndShoulders");
  const [confluenceName, setConfluenceName] = React.useState("My Confluence");
  const [isTestingChart, setIsTestingChart] = React.useState(false);
  const [testError, setTestError] = React.useState<string | null>(null);
  const [testResult, setTestResult] = React.useState<
    | {
        matches: number;
        bestScore: number;
        testedBars: number;
        bestIndex: number | null;
        patternLength: number;
      }
    | null
  >(null);
  const nextBarId = React.useRef(1);
  const nextPointId = React.useRef(1);
  const [dragState, setDragState] = React.useState<
    {
      barId: number;
      startX: number;
      startYOffset: number;
      startClientX: number;
      startClientY: number;
    } | null
  >(null);

  const handleAddBar = (direction: BarDirection, pattern: BarPattern = "standard") => {
    setBars((prev) => {
      const barWidth = 6;
      const barSpacing = 4;
      const x = 10 + prev.length * (barWidth + barSpacing);
      return [
        ...prev,
        {
          id: nextBarId.current++,
          x,
          yOffset: 0,
          direction,
          pattern,
        },
      ];
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool !== "confluence") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const baseWidth = 120;
    const baseHeight = 100;
    const viewWidth = baseWidth / zoom;
    const viewHeight = baseHeight / zoom;
    const viewX = (baseWidth - viewWidth) / 2;
    const viewY = (baseHeight - viewHeight) / 2;

    const fracX = (e.clientX - rect.left) / rect.width;
    const fracY = (e.clientY - rect.top) / rect.height;
    const xCoord = viewX + fracX * viewWidth;
    const yCoord = viewY + fracY * viewHeight;
    setPoints((prev) => [
      ...prev,
      {
        id: nextPointId.current++,
			x: Math.max(0, Math.min(baseWidth, xCoord)),
			y: Math.max(0, Math.min(baseHeight, yCoord)),
      },
    ]);
  };

  const barWidth = 6; // in sketch units (viewBox)

  const getBarShape = (bar: SketchBar) => {
    // Base extremes and body levels for each candlestick pattern.
    // Coordinates are in sketch units where 0 is top and 100 is bottom.
    let baseHighY: number;
    let baseLowY: number;
    let baseOpenY: number;
    let baseCloseY: number;

    if (bar.customShape) {
      ({ baseHighY, baseLowY, baseOpenY, baseCloseY } = bar.customShape);
    } else {
      baseHighY = 25;
      baseLowY = 75;

      switch (bar.pattern) {
        case "doji": {
          // Small cross with short wicks
          baseHighY = 40;
          baseLowY = 60;
          baseOpenY = 50;
          baseCloseY = 50.5;
          break;
        }
        case "longLeggedDoji": {
          // Long wicks above and below tiny body
          baseHighY = 25;
          baseLowY = 75;
          baseOpenY = 50;
          baseCloseY = 50.5;
          break;
        }
        case "crossDoji": {
          // Similar to doji, slightly longer wicks
          baseHighY = 35;
          baseLowY = 65;
          baseOpenY = 50;
          baseCloseY = 50.5;
          break;
        }
        case "hammer": {
          // Small body near the top with long lower wick
          baseHighY = 40;
          baseLowY = 80;
          baseOpenY = 46;
          baseCloseY = 42;
          break;
        }
        case "hangingMan": {
          // Same geometry as hammer, but usually bearish (red)
          baseHighY = 40;
          baseLowY = 80;
          baseOpenY = 46;
          baseCloseY = 42;
          break;
        }
        case "invertedHammer": {
          // Body near the bottom with long upper wick
          baseHighY = 20;
          baseLowY = 60;
          baseOpenY = 54;
          baseCloseY = 50;
          break;
        }
        case "shootingStar": {
          // Small body low with very long upper wick
          baseHighY = 15;
          baseLowY = 55;
          baseOpenY = 36;
          baseCloseY = 32;
          break;
        }
        case "bullishOpeningMarubozu": {
          // Tall bullish candle, little/no upper wick
          baseHighY = 22;
          baseLowY = 78;
          baseOpenY = 76;
          baseCloseY = 26;
          break;
        }
        case "bearishOpeningMarubozu": {
          // Tall bearish candle, little/no lower wick
          baseHighY = 22;
          baseLowY = 78;
          baseOpenY = 24;
          baseCloseY = 74;
          break;
        }
        case "spinningTop": {
          // Small body with moderate wicks
          baseHighY = 35;
          baseLowY = 65;
          baseOpenY = 54;
          baseCloseY = 46;
          break;
        }
        case "bullishClosingMarubozu": {
          // Bullish candle closing at the top (no upper wick)
          baseHighY = 24;
          baseLowY = 78;
          baseOpenY = 76;
          baseCloseY = 24;
          break;
        }
        case "bearishClosingMarubozu": {
          // Bearish candle closing at the bottom (no lower wick)
          baseHighY = 22;
          baseLowY = 76;
          baseOpenY = 26;
          baseCloseY = 76;
          break;
        }
        case "standard":
        default: {
          baseHighY = 30;
          baseLowY = 70;
          baseOpenY = bar.direction === "up" ? 66 : 34;
          baseCloseY = bar.direction === "up" ? 34 : 66;
        }
      }
    }

    const highY = baseHighY + bar.yOffset;
    const lowY = baseLowY + bar.yOffset;
    const openY = baseOpenY + bar.yOffset;
    const closeY = baseCloseY + bar.yOffset;

    return { baseHighY, baseLowY, baseOpenY, baseCloseY, highY, lowY, openY, closeY };
  };

  const renderBars = () => {
    return bars.map((bar) => {
      const xCenter = bar.x;
      const bodyHalfWidth = barWidth / 2;

      // Simple stylized bar: up = green, down = red
      const color = bar.direction === "up" ? "#22c55e" : "#ef4444";

      const { highY, lowY, openY, closeY } = getBarShape(bar);

      const onMouseDown = (e: React.MouseEvent<SVGGElement>) => {
        e.stopPropagation();
        const svg = (e.currentTarget.ownerSVGElement ?? e.currentTarget) as SVGSVGElement;
        const rect = svg.getBoundingClientRect();
        if (!rect.width) return;
        setDragState({
          barId: bar.id,
          startX: bar.x,
          startYOffset: bar.yOffset,
          startClientX: e.clientX,
          startClientY: e.clientY,
        });
      };

      return (
        <g key={bar.id} onMouseDown={onMouseDown}>
          {/* wick */}
          <line
            x1={xCenter}
            x2={xCenter}
            y1={highY}
            y2={lowY}
            stroke={color}
            strokeWidth={1.2}
          />
          {/* body */}
          <rect
            x={xCenter - bodyHalfWidth}
            width={barWidth}
            y={Math.min(openY, closeY)}
            height={Math.abs(closeY - openY)}
            fill={color}
            rx={0.8}
          />
        </g>
      );
    });
  };

  const renderConnections = () => {
    if (bars.length < 2) return null;

    const sorted = [...bars].sort((a, b) => a.x - b.x);

    const points = sorted.map((bar) => {
      const { closeY } = getBarShape(bar);
      return { x: bar.x, y: closeY };
    });

    const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(" ");

    return (
      <polyline
        points={pointsAttr}
        fill="none"
        stroke="#64748b"
        strokeWidth={0.8}
        strokeDasharray="2 2"
        opacity={0.9}
      />
    );
  };

  const renderPoints = () => {
    return points.map((p) => (
      <g key={p.id}>
        <circle
          cx={p.x}
          cy={p.y}
          r={1.8}
          fill="#facc15"
          stroke="#000000"
          strokeWidth={0.4}
        />
        <line
          x1={p.x}
          x2={p.x}
          y1={p.y}
          y2={100}
          stroke="#facc15"
          strokeDasharray="2 2"
          strokeWidth={0.5}
        />
      </g>
    ));
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragState) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    const baseWidth = 120;
    const baseHeight = 100;
    const viewWidth = baseWidth / zoom;
    const viewHeight = baseHeight / zoom;
    const viewX = (baseWidth - viewWidth) / 2;
    const viewY = (baseHeight - viewHeight) / 2;

    const dxPx = e.clientX - dragState.startClientX;
    const dyPx = e.clientY - dragState.startClientY;
    const dxUnits = (dxPx / rect.width) * viewWidth;
    const dyUnits = (dyPx / rect.height) * viewHeight;

    // Horizontal bounds: full visible width of the current zoomed viewBox
    const minX = viewX + barWidth / 2;
    const maxX = viewX + viewWidth - barWidth / 2;

    const proposedX = dragState.startX + dxUnits;
    const newX = Math.max(minX, Math.min(maxX, proposedX));

    // Vertical bounds: allow the bar's high/low to traverse the
    // entire visible height of the zoomed viewBox.
  const currentBar = bars.find((b) => b.id === dragState.barId);
  if (!currentBar) return;
  const { baseHighY, baseLowY } = getBarShape(currentBar);
    const minHighY = viewY;
    const maxLowY = viewY + viewHeight;

    const proposedYOffset = dragState.startYOffset + dyUnits;
    const clampedYOffset = Math.min(
      maxLowY - baseLowY,
      Math.max(minHighY - baseHighY, proposedYOffset),
    );

    setBars((prev) =>
      prev.map((b) =>
        b.id === dragState.barId
          ? { ...b, x: newX, yOffset: clampedYOffset }
          : b,
      ),
    );
  };

  const handleCanvasMouseUp = () => {
    if (dragState) {
      setDragState(null);
    }
  };

  const handleTestPatternOnChart = async () => {
    setTestError(null);
    setTestResult(null);

    const patternOffsets = PATTERN_OFFSETS[selectedStructurePattern];
    if (!patternOffsets || patternOffsets.length === 0) {
      setTestError("No pattern profile available for this structure.");
      return;
    }

    if (!confluenceName.trim()) {
      setTestError("Please enter a confluence name before testing.");
      return;
    }

    setIsTestingChart(true);
    try {
      // Match the TradingView chart: BTCUSDT 1h, last 200 bars
      const bars = await fetchRecentOhlc("BTCUSDT", "1h", 200);
      const closes = bars.map((b) => b.close);
      const { matches, bestScore, testedBars, bestIndex, patternLength } =
        matchPatternOnSeries(patternOffsets, closes);
      setTestResult({ matches, bestScore, testedBars, bestIndex, patternLength });
    } catch (e) {
      console.error(e);
      setTestError("Failed to test pattern on chart data.");
    } finally {
      setIsTestingChart(false);
    }
  };

  const handleAddStructurePattern = () => {
    // Spawn a pre-arranged sequence of candles that approximates
    // the chosen pattern from the reference image. All created
    // candles remain fully draggable/editable.

    const horizontalGap = barWidth + 2;

    // Helper to push a bar with relative positioning.
    const addBarAt = (
      collection: SketchBar[],
      index: number,
      direction: BarDirection,
      customShape: SketchBar["customShape"],
      startX: number,
    ) => {
      collection.push({
        id: nextBarId.current++,
        x: startX + index * horizontalGap,
        yOffset: 0,
        direction,
        pattern: "standard",
        customShape,
      });
    };

    const bullish: StructurePattern[] = [
      "invHeadAndShoulders",
      "bullishFlag",
      "ascendingTriangle",
      "fallingWedge", // bullish falling wedge
      "symmetricalTriangle",
      "risingWedge", // can break either way but treat as bullish here
      "doubleBottom",
    ];
    const isBullish = bullish.includes(selectedStructurePattern);

    const baseY = isBullish ? 10 : -10;
    const swing = PATTERN_SWING;

    const offsets = PATTERN_OFFSETS[selectedStructurePattern];

    setBars((prev) => {
      const newBars: SketchBar[] = [];
      const centerBase = 50 + baseY;

      const candleCount = offsets.length;
      const patternWidth = (candleCount - 1) * horizontalGap;
      const baseWidth = 120;

      const startX =
        prev.length === 0
          ? Math.max(10, (baseWidth - patternWidth) / 2)
          : Math.min(100, Math.max(...prev.map((b) => b.x)) + horizontalGap * 2);

      offsets.forEach((off, index) => {
        const dir: BarDirection = isBullish
          ? index === offsets.length - 1
            ? "up"
            : index % 2 === 0
              ? "up"
              : "down"
          : index === offsets.length - 1
            ? "down"
            : index % 2 === 0
              ? "down"
              : "up";

        // Determine the vertical center of this candle for the pattern
        const centerY = centerBase + (isBullish ? -off : off);

        // Give each bar a different total height based on its swing size
        const rawHeight = 10 + (Math.abs(off) / swing) * 4 + (index % 2 === 0 ? 1 : -1);
        const fullHeight = Math.max(6, Math.min(24, rawHeight));

        const baseHighY = centerY - fullHeight / 2;
        const baseLowY = centerY + fullHeight / 2;

        // Body is slightly smaller than full range to leave wicks
        const bodyMargin = fullHeight * 0.15;
        const bodyTop = baseHighY + bodyMargin;
        const bodyBottom = baseLowY - bodyMargin;

        let baseOpenY: number;
        let baseCloseY: number;

        if (dir === "up") {
          // Bullish: open near the low, close near the high
          baseOpenY = bodyBottom;
          baseCloseY = bodyTop;
        } else {
          // Bearish: open near the high, close near the low
          baseOpenY = bodyTop;
          baseCloseY = bodyBottom;
        }

        addBarAt(newBars, index, dir, {
          baseHighY,
          baseLowY,
          baseOpenY,
          baseCloseY,
        }, startX);
      });

      return [...prev, ...newBars];
    });
  };

  return (
    <div className="relative h-full w-full -mx-4 -my-4 flex flex-col md:-mx-8 md:-my-6">
      <div className="relative flex-1 min-h-0 w-full bg-black/80">
        {(() => {
          const baseWidth = 120;
          const baseHeight = 100;
          const viewWidth = baseWidth / zoom;
          const viewHeight = baseHeight / zoom;
          const viewX = (baseWidth - viewWidth) / 2;
          const viewY = (baseHeight - viewHeight) / 2;
          const viewBox = `${viewX} ${viewY} ${viewWidth} ${viewHeight}`;
          return (
            <svg
              viewBox={viewBox}
              className="h-full w-full"
              preserveAspectRatio="xMidYMid slice"
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            >
              {/* background grid */}
              <defs>
                <pattern
                  id="smallGrid"
                  width="5"
                  height="5"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 5 0 L 0 0 0 5"
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth="0.3"
                  />
                </pattern>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="20" height="20" fill="url(#smallGrid)" />
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>

              <rect
                x={viewX}
                y={viewY}
                width={viewWidth}
                height={viewHeight}
                fill="url(#grid)"
              />

              {renderConnections()}
              {renderBars()}
              {renderPoints()}
            </svg>
          );
        })()}

        {/* Left-side toolbar inside sketch area, like TradingView */}
        <div className="pointer-events-auto absolute left-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3 rounded-2xl bg-slate-900/90 p-2 text-[11px] text-slate-100 shadow-lg">
          <div className="flex flex-col gap-1">
            <span className="px-1 text-[10px] uppercase tracking-wide text-slate-500">
              Candels
            </span>
            <select
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value as BarPattern)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 outline-none"
            >
              <option value="doji">Doji</option>
              <option value="longLeggedDoji">Long-Legged Doji</option>
              <option value="crossDoji">Cross Doji</option>
              <option value="hammer">Hammer</option>
              <option value="hangingMan">Hanging Man</option>
              <option value="invertedHammer">Inverted Hammer</option>
              <option value="shootingStar">Shooting Star</option>
              <option value="bullishOpeningMarubozu">Bullish Opening Marubozu</option>
              <option value="bearishOpeningMarubozu">Bearish Opening Marubozu</option>
              <option value="spinningTop">Spinning Top</option>
              <option value="bullishClosingMarubozu">Bullish Closing Marubozu</option>
              <option value="bearishClosingMarubozu">Bearish Closing Marubozu</option>
            </select>
          </div>

          <div className="mt-1 flex flex-col gap-1">
            <span className="px-1 text-[10px] uppercase tracking-wide text-slate-500">
              Patterns
            </span>
            <select
              value={selectedStructurePattern}
              onChange={(e) =>
                setSelectedStructurePattern(e.target.value as StructurePattern)
              }
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 outline-none"
            >
              <option value="invHeadAndShoulders">Inv. Head & Shoulders</option>
              <option value="bullishFlag">Bullish Flag</option>
              <option value="ascendingTriangle">Ascending Triangle</option>
              <option value="headAndShoulders">Head & Shoulders</option>
              <option value="bearishFlag">Bearish Flag</option>
              <option value="descendingTriangle">Descending Triangle</option>
              <option value="fallingWedge">Falling Wedge</option>
              <option value="symmetricalTriangle">Symmetrical Triangle</option>
              <option value="risingWedge">Rising Wedge</option>
              <option value="doubleBottom">Double Bottom</option>
              <option value="doubleTop">Double Top</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleAddStructurePattern}
            className="mt-1 rounded-lg bg-sky-600 px-3 py-1 text-[11px] font-medium text-black hover:bg-sky-500"
          >
            Add pattern
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool("add-up");
              handleAddBar("up", selectedPattern);
            }}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium ${
              activeTool === "add-up" ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-100"
            }`}
          >
            + Up bar
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTool("add-down");
              handleAddBar("down", selectedPattern);
            }}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium ${
              activeTool === "add-down" ? "bg-rose-500 text-black" : "bg-slate-800 text-slate-100"
            }`}
          >
            + Down bar
          </button>
          <button
            type="button"
            onClick={() => setActiveTool("confluence")}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium ${
              activeTool === "confluence"
                ? "bg-amber-400 text-black"
                : "bg-slate-800 text-slate-100"
            }`}
          >
            Mark confluence
          </button>
          <div className="mt-1 flex flex-col gap-1 rounded-lg bg-slate-900/80 px-2 py-1 text-[10px]">
            <span className="text-[10px] text-slate-400">Zoom</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded bg-slate-800 px-2 py-0.5 text-[10px]"
                onClick={() => setZoom((z) => Math.max(0.1, z - 0.2))}
              >
                -
              </button>
              <span className="w-10 text-center font-mono">{zoom.toFixed(1)}x</span>
              <button
                type="button"
                className="rounded bg-slate-800 px-2 py-0.5 text-[10px]"
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
              >
                +
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setBars([]);
              setPoints([]);
            }}
            className="mt-1 rounded-lg bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-200"
          >
            Clear sketch
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-2 left-2 flex items-center justify-between gap-4 rounded bg-black/70 px-2 py-1 text-[10px] text-slate-400">
          <div>
            Bars: <span className="font-mono text-slate-200">{bars.length}</span>
          </div>
          <div>
            Confluences:
            {points.length === 0 ? (
              <span className="ml-1 font-mono text-slate-500">none yet</span>
            ) : (
              <span className="ml-1 font-mono text-slate-200">
                {points.map((p) => `#${p.id}`).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative h-72 w-full border-t border-slate-800 bg-black/90">
        <BtcPerpChart symbol="BINANCE:BTCUSDT" />

        {/* Highlight the best-matching window on the chart using a translucent band */}
        {testResult && testResult.bestIndex != null && testResult.patternLength > 0 && (() => {
          const total = Math.max(testResult.testedBars - 1, 1);
          const startFrac = testResult.bestIndex! / total;
          const endIndex = Math.min(
            testResult.bestIndex! + testResult.patternLength - 1,
            testResult.testedBars - 1,
          );
          const endFrac = endIndex / total;
          const left = `${startFrac * 100}%`;
          const width = `${Math.max(endFrac - startFrac, 0.02) * 100}%`;

          return (
            <div
              className="pointer-events-none absolute inset-y-0 bg-emerald-500/15 border-x border-emerald-400/60"
              style={{ left, width }}
            />
          );
        })()}

        <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
          <div className="pointer-events-auto mb-3 w-full max-w-xl rounded-xl bg-slate-950/95 p-3 text-[11px] text-slate-100 shadow-lg">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">
                Confluence name
              </span>
              <input
                type="text"
                value={confluenceName}
                onChange={(e) => setConfluenceName(e.target.value)}
                className="flex-1 min-w-[120px] rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none"
                placeholder="e.g. BTC 1h Bullish Flag"
              />
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
              <span>Pattern to test:</span>
              <span className="font-mono text-slate-100">
                {selectedStructurePattern}
              </span>
              <span className="text-slate-500">(select from the left toolbar)</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestPatternOnChart}
                disabled={isTestingChart}
                className="rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-medium text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTestingChart ? "Testing on chart..." : "Test on BTC 1h chart"}
              </button>
              {testResult && (
                <div className="text-[10px] text-slate-300">
                  <span className="font-semibold text-emerald-300">
                    {testResult.matches > 0 ? "Pattern recognized" : "No clear match"}
                  </span>
                  <span className="ml-2">
                    {testResult.matches} hit(s) in last {testResult.testedBars} bars
                  </span>
                  <span className="ml-2 text-slate-500">
                    best score {testResult.bestScore.toFixed(3)}
                  </span>
                </div>
              )}
              {testError && (
                <div className="text-[10px] text-rose-400">{testError}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
