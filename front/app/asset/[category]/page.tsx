"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  Wallet,
  Bitcoin,
  Briefcase,
} from "lucide-react";

export default function CategoryDetail() {
  const { category } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      const token = localStorage.getItem("wealth_token");
      if (!category) return;

      try {
        // On s'assure que la catégorie est en minuscule pour l'API
        const categoryParam = category.toString().toLowerCase();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/wealth/${categoryParam}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const json = await res.json();
        console.log("Données reçues du backend :", json);
        setData(json);
      } catch (err) {
        console.error("Erreur fetch :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [category]);

  // --- SKELETON LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 p-6 md:p-12 transition-colors">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Valeurs de sécurité pour éviter les erreurs "undefined"
  const totalValue = data?.totalCategoryValue || 0;
  const totalGain = data?.totalGain || 0;
  const totalGainPercent = data?.totalGainPercent || 0;
  const assets = data?.assets || [];

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 transition-colors duration-300 pb-12">
      {/* HEADER */}
      <div className="bg-white/70 backdrop-blur-xl dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="text-lg font-medium text-slate-800 dark:text-white capitalize">
            Détails {category}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* CARTE RÉCAPITULATIVE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-xl dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-8 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                {category === "crypto" && <Bitcoin size={28} />}
                {category === "pea" && <TrendingUp size={28} />}
                {category === "epargne" && <Wallet size={28} />}
                {category === "epargne-salariale" && <Briefcase size={28} />}
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">
                  Valeur Totale
                </p>
                <h2 className="text-3xl font-light text-slate-800 dark:text-white">
                  {totalValue.toLocaleString("fr-FR")} €
                </h2>
              </div>
            </div>

            <div className="text-left md:text-right p-4 md:p-0 bg-slate-50 md:bg-transparent dark:bg-slate-800/50 md:dark:bg-transparent rounded-2xl">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">
                Plus-value latente
              </p>
              <p
                className={`text-xl font-medium ${totalGain >= 0 ? "text-emerald-500" : "text-rose-500"}`}
              >
                {totalGain >= 0 ? "+" : ""}
                {totalGain.toLocaleString("fr-FR")} €
                <span className="text-sm ml-2 opacity-80">
                  ({totalGainPercent.toFixed(2)}%)
                </span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* LISTE DES ACTIFS */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">
            Tes Actifs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.length > 0 ? (
              assets.map((asset: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/70 backdrop-blur-xl dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-slate-800 dark:text-white uppercase tracking-tight">
                        {asset.name}
                      </h4>
                      <p className="text-sm text-slate-400 font-light">
                        {(asset.quantity || 0).toLocaleString("fr-FR", {
                          maximumFractionDigits: 4,
                        })}{" "}
                        unités
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-800 dark:text-white">
                        {(asset.currentValue || 0).toLocaleString("fr-FR")} €
                      </p>
                      <p className="text-xs text-slate-400 italic">
                        Prix :{" "}
                        {(asset.currentPrice || 0).toLocaleString("fr-FR")} €
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">
                        PRU
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {(asset.pru || 0).toLocaleString("fr-FR", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        €
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">
                        Performance
                      </p>
                      <p
                        className={`text-sm font-bold ${(asset.gain || 0) >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {(asset.gain || 0) >= 0 ? "+" : ""}
                        {(asset.gain || 0).toLocaleString("fr-FR")} € (
                        {(asset.gainPercent || 0) >= 0 ? "+" : ""}
                        {(asset.gainPercent || 0).toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 italic">
                Aucun actif trouvé dans cette catégorie.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
