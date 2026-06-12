"use client";

import { useState } from "react";
import { LogOut, PieChart as PieChartIcon, Menu } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePrivacy } from "@/app/provider";
import PrivacyToggle from "@/components/privacy-toggle";
import ThemeToggle from "@/components/theme-toggle";
import { GlobalData } from "@/types";

interface SidebarProps {
  globalData: GlobalData;
  currentCategory: string;
  onCategorySelect: (category: string) => void;
  isMobileMenuOpen: boolean;
  onLogout: () => void;
  onToTheMoon: () => void;
}

export default function Sidebar({
  globalData,
  currentCategory,
  onCategorySelect,
  isMobileMenuOpen,
  onLogout,
  onToTheMoon,
}: SidebarProps) {
  const { isPrivacyMode } = usePrivacy();
  const [cryptoClicks, setCryptoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Couleurs pour les catégories
  const categoryColors: Record<string, string> = {
    "EPARGNE-SALARIALE": "bg-donut-pink",
    EPARGNE: "bg-donut-purple",
    CRYPTO: "bg-donut-orange",
    PEA: "bg-donut-blue",
    "COMPTE COURANT": "bg-donut-green",
  };
  const categorySlugs: Record<string, string> = {
    "EPARGNE-SALARIALE": "epargne-salariale",
    EPARGNE: "epargne",
    CRYPTO: "crypto",
    PEA: "pea",
    "COMPTE COURANT": "compte-courant",
  };

  const handleCategoryClick = (id: string, name: string) => {
    onCategorySelect(id);
    if (name.toUpperCase() === "CRYPTO" || id === "crypto") {
      const now = Date.now();
      if (now - lastClickTime < 500) {
        const newCount = cryptoClicks + 1;
        setCryptoClicks(newCount);
        if (newCount >= 4) {
          onToTheMoon();
          setCryptoClicks(0);
        }
      } else {
        setCryptoClicks(1);
      }
      setLastClickTime(now);
    }
  };

  const renderNavItem = (
    name: string,
    value: number | null,
    isActive: boolean,
    isGlobal = false,
    id: string
  ) => {
    const colorClass = categoryColors[name] || "bg-slate-400 dark:bg-slate-600";
    return (
      <button
        key={id}
        onClick={() => handleCategoryClick(id, name)}
        className={`w-full flex items-center group cursor-pointer text-left py-3 px-4 transition-colors ${
          isActive
            ? "border-l-[3px] border-primary bg-muted rounded-r-xl"
            : "border-l-[3px] border-transparent hover:bg-muted/50 rounded-r-xl"
        }`}
      >
        {isGlobal ? (
          <>
            <PieChartIcon
              className={`w-4 h-4 mr-3 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}
            />
            <span
              className={`text-sm font-bold ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
            >
              Vue Globale
            </span>
          </>
        ) : (
          <>
            <span
              className={`text-sm font-semibold flex items-center gap-2 ${
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${colorClass}`}></span> {name}
            </span>
            <div
              className={`grow border-b-2 border-dotted mx-3 relative -top-1 transition-colors ${
                isActive
                  ? "border-primary/30"
                  : "border-slate-300 dark:border-slate-700 group-hover:border-slate-400 dark:group-hover:border-slate-600"
              }`}
            ></div>
            <span
              className={`text-sm font-bold tracking-tight ${
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              }`}
            >
              {formatCurrency(value || 0, isPrivacyMode, 0)} €
            </span>
          </>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`fixed md:relative inset-y-0 left-0 w-[85%] md:w-[320px] lg:w-[400px] h-screen bg-card border-r border-border flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="hidden md:flex p-8 items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="font-bold tracking-widest text-sm uppercase text-foreground">Freenary</span>
        </div>
        <div className="flex items-center gap-3">
          <PrivacyToggle />
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive bg-muted p-2 rounded-lg transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-8 pt-8 pb-4 flex flex-col justify-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-2">Capital Net</p>
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-none mb-2 text-foreground">
          {formatCurrency(globalData.totalWealth, isPrivacyMode, 0)}{" "}
          <span className="text-2xl text-muted-foreground font-medium ml-1">€</span>
        </h1>
        <p
          className={`text-sm font-semibold ${globalData.ytdPerformance >= 0 ? "text-success" : "text-destructive"}`}
        >
          {globalData.ytdPerformance >= 0 ? "+" : ""} {formatCurrency(globalData.ytdPerformance, isPrivacyMode, 0)} €{" "}
          <span className="text-muted-foreground font-medium ml-1">YTD</span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 md:pb-6">
        <div className="mb-6">
          {renderNavItem("Vue Globale", null, currentCategory === "global", true, "global")}
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-4 px-4">
            Portefeuilles
          </p>
          <div className="space-y-1">
            {globalData.distribution?.map((cat) => (
              <div key={cat.name}>
                {renderNavItem(
                  cat.name,
                  cat.value,
                  currentCategory === (categorySlugs[cat.name] || cat.name.toLowerCase()),
                  false,
                  categorySlugs[cat.name] || cat.name.toLowerCase()
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
