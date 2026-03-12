"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  XAxis,
} from "recharts";
import {
  Bitcoin,
  TrendingUp,
  Wallet,
  Briefcase,
  Plus,
  LogOut,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { useRouter } from "next/navigation";
import AddTransactionModal from "@/components/add-transaction";

interface WealthData {
  totalWealth: number;
  distribution: {
    name: string;
    value: number;
    percentage: string;
    color: string;
  }[];
  historicalData: {
    date: string;
    value: number;
  }[];
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<WealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // NOUVEAU : On extrait la requête dans une fonction réutilisable
  const fetchWealthData = useCallback(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/wealth`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur de connexion au backend:", err);
        setLoading(false);
      });
  }, []);

  // NOUVEAU : On utilise la fonction au montage du composant
  useEffect(() => {
    fetchWealthData();
  }, [fetchWealthData]);

  const handleLogout = () => router.push("/");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <p className="text-slate-400 font-light animate-pulse">
          Chargement des données...
        </p>
      </div>
    );
  }

  return (
    // ICI : Changement du fond principal
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      {/* ICI : Changement du fond du header et de sa bordure */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-light mb-1">
                Patrimoine total
              </p>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                // ICI : Couleur du texte principal
                className="text-3xl text-slate-800 dark:text-white font-light tracking-tight transition-colors"
              >
                {data?.totalWealth.toLocaleString("fr-FR")} €
              </motion.h1>
            </div>

            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <button
                onClick={handleLogout}
                // ICI : Adaptation du bouton
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <LogOut
                  className="w-4 h-4 text-slate-400 dark:text-slate-300"
                  strokeWidth={1.5}
                />
              </button>
            </div>
          </div>

          {/* Répartition Dynamique */}
          {/* ICI : Fond de la carte */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 transition-colors duration-300">
            <h2 className="text-sm text-slate-600 dark:text-slate-300 font-light mb-4">
              Répartition réelle
            </h2>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {data?.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-2">
                {data?.distribution.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-light transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-800 dark:text-slate-200 font-light transition-colors">
                      {Math.round(
                        (item.value / (data?.totalWealth || 1)) * 100,
                      )}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Évolution (Historique de la BDD) */}
      <div className="max-w-md mx-auto px-6 py-6">
        {/* ICI : Fond de la carte */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 mb-6 shadow-sm transition-colors duration-300">
          <h2 className="text-sm text-slate-600 dark:text-slate-300 font-light mb-4 transition-colors">
            Évolution historique
          </h2>
          <div className="h-24 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.historicalData}>
                <XAxis dataKey="date" hide />
                <Tooltip
                  // On rend le tooltip plus neutre pour passer en light/dark
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#000",
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  labelFormatter={(date) => `${date}`}
                  formatter={(value: any) => [
                    `${value.toLocaleString("fr-FR")} €`,
                    "Valeur",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-300 dark:text-slate-500 uppercase tracking-widest transition-colors">
            <span>Début</span>
            <span>Aujourd'hui</span>
          </div>
        </div>

        {/* Cartes d'actifs dynamiques */}
        <div className="space-y-4">
          <h2 className="text-sm text-slate-600 dark:text-slate-400 font-light px-1 transition-colors">
            Détails des catégories
          </h2>

          {data?.distribution.map((asset, index) => (
            <div
              key={index}
              onClick={() => router.push(`/asset/${asset.name.toLowerCase()}`)}
              // ICI : Fond et texte des cartes de catégories
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${asset.color}15` }}
                >
                  {asset.name === "CRYPTO" && (
                    <Bitcoin size={20} color={asset.color} />
                  )}
                  {asset.name === "PEA" && (
                    <TrendingUp size={20} color={asset.color} />
                  )}
                  {asset.name === "EPARGNE" && (
                    <Wallet size={20} color={asset.color} />
                  )}
                  {asset.name === "EPARGNE-SALARIALE" && (
                    <Briefcase size={20} color={asset.color} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">
                    {asset.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-800 dark:text-white font-medium transition-colors">
                  {asset.value.toLocaleString("fr-FR")} €
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="h-24" />
      </div>

      {/* Bouton flottant pour ajouter */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-8 right-1/2 translate-x-1/2 max-w-md w-full px-6 flex justify-end"
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" />
        </button>
      </motion.div>

      {/* ---> LA MODALE EST ICI <--- */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchWealthData} // NOUVEAU : On passe la fonction pour recharger silencieusement
      />
    </div>
  );
}
