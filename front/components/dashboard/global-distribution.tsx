"use client";

import { GlobalData } from "@/types";

interface GlobalDistributionProps {
  globalData: GlobalData;
}

export default function GlobalDistribution({ globalData }: GlobalDistributionProps) {
  const categoryColors: Record<string, string> = {
    "EPARGNE-SALARIALE": "bg-donut-pink",
    EPARGNE: "bg-donut-purple",
    CRYPTO: "bg-donut-orange",
    PEA: "bg-donut-blue",
    "COMPTE COURANT": "bg-donut-green",
  };
  const categoryHexColors: Record<string, string> = {
    "EPARGNE-SALARIALE": "#ec4899",
    EPARGNE: "#8b5cf6",
    CRYPTO: "#f59e0b",
    PEA: "#3b82f6",
    "COMPTE COURANT": "#10b981",
  };

  const totalDistribution = globalData.distribution.reduce((acc, item) => acc + item.value, 0);
  let currentOffset = 0;
  const svgSegments = globalData.distribution.map((item) => {
    const percent = totalDistribution > 0 ? (item.value / totalDistribution) * 100 : 0;
    const strokeDasharray = `${percent} ${100 - percent}`;
    const offset = -currentOffset;
    currentOffset += percent;
    return { ...item, strokeDasharray, offset, percent };
  });

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-card border border-border rounded-[2rem] p-6 lg:p-8 shadow-sm">
      <h2 className="text-sm font-bold text-muted-foreground mb-8 uppercase tracking-wide">
        Répartition réelle
      </h2>
      <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-8 lg:gap-16">
        <div className="relative w-48 h-48 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-sm">
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              className="stroke-muted"
              strokeWidth="4"
            ></circle>
            {svgSegments.map((seg, idx) => (
              <circle
                key={idx}
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                strokeWidth="4"
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.offset}
                className={`transition-all duration-1000 ease-out hover:stroke-[5px] cursor-pointer`}
                style={{
                  stroke: categoryHexColors[seg.name] || "#94a3b8",
                }}
              ></circle>
            ))}
          </svg>
        </div>
        <div className="w-full max-w-sm space-y-3">
          {svgSegments.map((seg, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    categoryColors[seg.name] || "bg-slate-400 dark:bg-slate-600"
                  }`}
                ></div>
                <span className="text-sm font-semibold text-muted-foreground uppercase">
                  {seg.name}
                </span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {Math.round(seg.percent)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
