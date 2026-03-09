"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  History,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryData {
  title: string;
  totalValue: number;
  assets: any[];
  transactions: any[];
}

export default function AssetDetails() {
  const router = useRouter();
  const params = useParams();
  const category = params.category as string;

  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "crypto":
        return "#f59e0b";
      case "pea":
        return "#3b82f6";
      case "epargne":
        return "#8b5cf6";
      case "epargne-salariale":
        return "#ec4899";
      default:
        return "#10b981";
    }
  };
  const categoryColor = getCategoryColor(category);

  useEffect(() => {
    fetch(`http://localhost:3001/wealth/${category}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, [category]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <p className="text-slate-400 animate-pulse">
          Chargement des détails...
        </p>
      </div>
    );
  }

  const pieColors = [
    categoryColor,
    `${categoryColor}CC`,
    `${categoryColor}99`,
    `${categoryColor}66`,
  ];
  const totalGainLoss =
    data.assets?.reduce((sum, asset) => sum + (asset.gainLoss || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push("/")}
              className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-xl text-slate-800 dark:text-white font-light">
                {data.title}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-light mt-0.5">
                {data.assets.length} position{data.assets.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 transition-colors">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-light mb-1">
              Valeur totale
            </p>
            <p className="text-3xl text-slate-800 dark:text-white font-light tracking-tight mb-3">
              {data.totalValue.toLocaleString("fr-FR", {
                maximumFractionDigits: 2,
              })}{" "}
              €
            </p>
            <div className="flex items-center gap-2">
              {totalGainLoss >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <p
                className={`text-sm font-light ${totalGainLoss >= 0 ? "text-emerald-500" : "text-red-500"}`}
              >
                {totalGainLoss >= 0 ? "+" : ""}
                {totalGainLoss.toLocaleString("fr-FR", {
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-md mx-auto px-6 pt-6">
        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 h-12 p-1 rounded-xl transition-colors">
            <TabsTrigger
              value="positions"
              className="rounded-lg data-[state=active]:bg-slate-800 dark:data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-600 dark:text-slate-400 font-light transition-all"
            >
              <Wallet className="w-4 h-4 mr-2" /> Positions
            </TabsTrigger>
            <TabsTrigger
              value="historique"
              className="rounded-lg data-[state=active]:bg-slate-800 dark:data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-600 dark:text-slate-400 font-light transition-all"
            >
              <History className="w-4 h-4 mr-2" /> Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="mt-6">
            <div className="space-y-3">
              {data.assets?.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 transition-colors"
                >
                  {/* MODIFICATION DE LA MISE EN PAGE ICI */}
                  <div className="flex justify-between mb-2">
                    {/* Partie Gauche : Nom + Prix en dessous */}
                    <div>
                      <h3 className="text-slate-800 dark:text-white font-medium">
                        {asset.name}
                      </h3>
                      {asset.currentPrice && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-light mt-1">
                          {asset.quantity && `${asset.quantity} × `}
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            {asset.currentPrice.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "USD",
                            })}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Partie Droite : Valeur Totale */}
                    <div className="text-right">
                      <p className="text-lg text-slate-800 dark:text-white font-light">
                        {asset.totalValue.toLocaleString("fr-FR", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        €
                      </p>
                    </div>
                  </div>

                  {/* Partie Basse : Plus ou moins-value */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span
                      className={`text-xs font-light ${asset.gainLossPercent >= 0 ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {asset.gainLossPercent >= 0 ? "+" : ""}
                      {asset.gainLossPercent}% ({asset.gainLoss > 0 ? "+" : ""}
                      {asset.gainLoss.toLocaleString("fr-FR", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      €)
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="historique" className="mt-6">
            {data.transactions && data.transactions.length > 0 ? (
              <div className="space-y-3">
                {data.transactions.map((tx: any, index: number) => (
                  <motion.div
                    key={tx.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icône : Vert si achat/dépôt, Rouge si vente/retrait */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type.toLowerCase() === "achat" ||
                          tx.type === "versement"
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500"
                            : "bg-red-50 dark:bg-red-900/30 text-red-500"
                        }`}
                      >
                        {tx.type.toLowerCase() === "achat" ||
                        tx.type === "versement" ? (
                          <ArrowDownRight className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      {/* Infos de la transaction */}
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          {tx.assetName}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-light mt-0.5">
                          {new Date(tx.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Montants et Quantités */}
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          tx.type === "achat" || tx.type === "versement"
                            ? "text-emerald-500"
                            : "text-slate-800 dark:text-white"
                        }`}
                      >
                        {tx.type === "achat" || tx.type === "versement"
                          ? "+"
                          : "-"}
                        {tx.amount.toLocaleString("fr-FR", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        €
                      </p>
                      {/* Affiche la quantité si elle existe et n'est pas 0 */}
                      {tx.quantity ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-light mt-0.5">
                          {tx.type === "achat" || tx.type === "versement"
                            ? "+"
                            : "-"}
                          {tx.quantity} parts
                        </p>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Le design vide s'il n'y a pas encore de transactions */
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 dark:text-slate-500 font-light">
                  Aucun historique pour le moment.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
