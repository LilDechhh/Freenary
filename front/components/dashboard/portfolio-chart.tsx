"use client";

import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { GlobalData, CategoryDetailsData } from "@/types";
import { usePrivacy } from "@/app/provider";

interface PortfolioChartProps {
  currentCategory: string;
  categoryName: string;
  globalData: GlobalData;
  categoryData: CategoryDetailsData | null;
  isToTheMoon?: boolean;
}

export default function PortfolioChart({
  currentCategory,
  categoryName,
  globalData,
  categoryData,
  isToTheMoon,
}: PortfolioChartProps) {
  const { isPrivacyMode } = usePrivacy();

  let dataToDisplay =
    currentCategory === "global" ? globalData.historicalData : categoryData?.historicalData || [];

  // Effet Easter Egg : To The Moon 🚀
  if (isToTheMoon && dataToDisplay.length > 0) {
    const lastValue = dataToDisplay[dataToDisplay.length - 1].value || 1000;
    dataToDisplay = [
      ...dataToDisplay,
      { date: "Ignition", value: lastValue * 1.5 },
      { date: "Liftoff", value: lastValue * 3 },
      { date: "Orbit", value: lastValue * 8 },
      { date: "Moon", value: lastValue * 20 },
    ];
  }

  return (
    <section className="h-[35vh] lg:h-[40vh] border-b border-border bg-card relative flex items-end p-6 lg:p-8 overflow-hidden">
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8 z-10 bg-card/80 backdrop-blur px-4 py-2 rounded-xl shadow-sm border border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-1">
          Performance
        </p>
        <p className="font-bold tracking-tight text-2xl lg:text-3xl text-foreground capitalize">
          {categoryName}
        </p>
      </div>

      {/* Lignes de fond SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50 dark:opacity-20">
        <line
          x1="0"
          y1="25%"
          x2="100%"
          y2="25%"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="50%"
          stroke="currentColor"
          className="text-border"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line
          x1="0"
          y1="75%"
          x2="100%"
          y2="75%"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Graphique Recharts */}
      <div className="absolute inset-0 pt-20 pb-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dataToDisplay}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide={true} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card/90 backdrop-blur border border-border p-3 rounded-xl shadow-xl">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                        {label}
                      </p>
                      <p className="text-lg font-bold text-foreground tracking-tight">
                        {formatCurrency(payload[0].value as number, isPrivacyMode)} €
                      </p>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{
                stroke: "currentColor",
                strokeWidth: 1,
                strokeDasharray: "4 4",
                opacity: 0.2,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fill="url(#chartGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
