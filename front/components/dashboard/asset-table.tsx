"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePrivacy } from "@/app/provider";
import { CategoryDetailsData, Asset, Transaction } from "@/types";
import { useState, useEffect } from "react";

const getInitialLogoUrl = (category: string, name: string) => {
  if (["epargne", "compte-courant", "epargne-salariale"].includes(category)) return "";
  if (category === "crypto") {
    const cryptoTickers: Record<string, string> = {
      bitcoin: "btc", btc: "btc",
      ethereum: "eth", eth: "eth",
      solana: "sol", sol: "sol",
      binancecoin: "bnb", bnb: "bnb",
      cardano: "ada", ada: "ada",
      ripple: "xrp", xrp: "xrp",
      polkadot: "dot", dot: "dot",
      dogecoin: "doge", doge: "doge",
      avalanche: "avax", avax: "avax",
      matic: "matic",
      tether: "usdt", usdt: "usdt"
    };
    const ticker = cryptoTickers[name.toLowerCase()];
    if (ticker) return `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/${ticker}.png`;
  } else if (category === "pea") {
    return `https://assets.parqet.com/logos/symbol/${name.split('.')[0]}?format=png`;
  }
  return "";
};

const AssetLogo = ({ asset }: { asset: any }) => {
  const name = asset.displayName || asset.name;
  
  const initialUrl = getInitialLogoUrl(asset.category, asset.name);
  const [imgSrc, setImgSrc] = useState<string>(initialUrl);
  const [fallbackStep, setFallbackStep] = useState(initialUrl ? 0 : 99);

  useEffect(() => {
    const url = getInitialLogoUrl(asset.category, asset.name);
    setImgSrc(url);
    setFallbackStep(url ? 0 : 99);
  }, [asset.category, asset.name]);

  const handleError = () => {
    if (fallbackStep === 0 && asset.category === "pea") {
      setImgSrc(`https://financialmodelingprep.com/image-stock/${asset.name}.png`);
      setFallbackStep(1);
    } else if (fallbackStep === 1 && asset.category === "pea") {
      setImgSrc(`https://logo.clearbit.com/${asset.name.split('.')[0].toLowerCase()}.com`);
      setFallbackStep(2);
    } else {
      setFallbackStep(99);
    }
  };

  if (fallbackStep >= 99 || !imgSrc) {
    return (
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={name}
      className="w-8 h-8 rounded-full object-cover shrink-0 bg-muted"
      onError={handleError}
    />
  );
};

interface AssetTableProps {
  categoryData: CategoryDetailsData | null;
  isFixedAsset: boolean;
  onAddTransaction: (asset?: { ticker: string; name: string }) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function AssetTable({
  categoryData,
  isFixedAsset,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: AssetTableProps) {
  const { isPrivacyMode } = usePrivacy();

  return (
    <>
      {/* POSITIONS ACTIVES */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Positions Actives
          </h2>
          <button
            onClick={() => onAddTransaction()}
            className="text-[10px] font-bold text-primary hover:opacity-80 transition-opacity uppercase tracking-[0.1em] flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <th className="py-3 px-4 font-bold">Actif</th>
                {!isFixedAsset && (
                  <th className="py-3 px-4 font-bold text-right hidden sm:table-cell">
                    Quantité
                  </th>
                )}
                {!isFixedAsset && (
                  <th className="py-3 px-4 font-bold text-right">PRU / Prix</th>
                )}
                <th className="py-3 px-4 font-bold text-right">Valeur</th>
                {!isFixedAsset && (
                  <th className="py-3 px-4 font-bold text-right w-10"></th>
                )}
              </tr>
            </thead>
            <tbody className="text-sm">
              {categoryData?.assets && categoryData.assets.length > 0 ? (
                categoryData.assets.map((asset: any) => (
                  <tr
                    key={asset.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => {
                      if (isFixedAsset) {
                        onAddTransaction({ ticker: asset.name, name: asset.displayName || asset.name });
                      }
                    }}
                  >
                    <td className="py-4 px-4 font-semibold flex items-center gap-3">
                      <AssetLogo asset={asset} />
                      <div className="flex flex-col">
                        <span className="flex items-center gap-2">
                          {asset.displayName || asset.name}
                          {asset.displayName && asset.displayName !== asset.name && (
                            <span className="text-muted-foreground text-[10px] font-bold bg-muted px-2 py-0.5 rounded">
                              {asset.name}
                            </span>
                          )}
                        </span>
                        {isFixedAsset && (
                          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1">
                            <Pencil className="w-3 h-3" /> Éditer
                          </span>
                        )}
                      </div>
                    </td>
                    {!isFixedAsset && (
                      <td className="py-4 px-4 text-right font-medium text-muted-foreground hidden sm:table-cell">
                        {formatCurrency(asset.quantity, isPrivacyMode, 4)}
                      </td>
                    )}
                    {!isFixedAsset && (
                      <td className="py-4 px-4 text-right font-medium text-muted-foreground">
                        {formatCurrency(asset.pru, isPrivacyMode)} €<br />
                        <span className="text-xs italic">
                          ({formatCurrency(asset.currentPrice, isPrivacyMode)} €)
                        </span>
                      </td>
                    )}
                    <td className="py-4 px-4 text-right font-bold text-base text-foreground tracking-tight">
                      {formatCurrency(asset.currentValue, isPrivacyMode)} €
                    </td>
                    {!isFixedAsset && (
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddTransaction({ ticker: asset.name, name: asset.displayName || asset.name });
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                          title="Ajouter une transaction pour cet actif"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr className="text-center">
                  <td colSpan={4} className="py-8 font-medium text-muted-foreground">
                    Aucun actif trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* HISTORIQUE */}
      {categoryData?.transactions && categoryData.transactions.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 space-y-4">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
            Historique des transactions
          </h2>
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Actif</th>
                  <th className="py-3 px-4 font-bold text-right">Montant</th>
                  <th className="py-3 px-4 font-bold text-right w-10"></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {categoryData.transactions.map((tx: any) => {
                  const isAchat = ["achat", "dépôt", "in", "intérêts", "dividendes"].includes(
                    tx.type.toLowerCase()
                  );
                  const isUpdate =
                    tx.type.toLowerCase() === "ajustement" ||
                    tx.type.toLowerCase() === "update_balance";

                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-muted-foreground text-xs">
                        {new Date(tx.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {tx.updatedAt &&
                          tx.createdAt &&
                          new Date(tx.updatedAt).getTime() - new Date(tx.createdAt).getTime() >
                            1000 && (
                            <span
                              className="ml-2 italic text-[9px] text-primary/70 font-bold"
                              title="Transaction modifiée"
                            >
                              (Modifié)
                            </span>
                          )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded font-bold text-[10px] uppercase tracking-wider ${
                            isUpdate
                              ? "bg-primary/10 text-primary"
                              : isAchat
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-foreground">
                        {tx.assetName}
                        {tx.label && (
                          <span className="text-muted-foreground ml-2 text-[10px] font-bold bg-muted px-2 py-0.5 rounded">
                            {tx.label}
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-4 px-4 text-right font-bold text-base tracking-tight ${
                          isUpdate
                            ? "text-foreground"
                            : isAchat
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {isAchat ? "+" : isUpdate ? (tx.amount >= 0 ? "+" : "") : "-"}
                        {formatCurrency(Math.abs(tx.amount), isPrivacyMode)} €
                      </td>
                      <td className="py-4 px-4 text-right flex justify-end gap-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
