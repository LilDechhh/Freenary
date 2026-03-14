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
import LoginScreen from "@/components/login-screen";

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
  const [userName, setUserName] = useState<string>("");

  // --- NOUVEAU : GESTION DE LA SÉCURITÉ ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Gère le chargement initial ET l'auth

  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Au chargement de la page, on vérifie si l'utilisateur a un token dans son navigateur
  useEffect(() => {
    const token = localStorage.getItem("wealth_token");

    if (token) {
      // --- NOUVEAU : DÉCODAGE DU NOM DE L'UTILISATEUR ---
      try {
        // On lit les données cachées dans le token JWT
        const payload = JSON.parse(atob(token.split(".")[1]));

        // On cherche le nom, le prénom, ou à défaut on prend le début de l'email (ex: "hugo@mail.com" -> "hugo")
        let name =
          payload.firstName ||
          payload.name ||
          (payload.email ? payload.email.split("@")[0] : "Aventurier");

        // On met la première lettre en majuscule pour faire propre ("hugo" -> "Hugo")
        name = name.charAt(0).toUpperCase() + name.slice(1);
        setUserName(name);
      } catch (error) {
        console.error("Erreur de lecture du token :", error);
      }
      // ------------------------------------------------
    }
    const savedToken = localStorage.getItem("wealth_token");
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    } else {
      setLoading(false); // On arrête le chargement pour afficher le login
    }
  }, []);

  // 2. On modifie la fonction fetch pour inclure le token de sécurité !
  const fetchWealthData = useCallback(() => {
    if (!token) return; // Sécurité : on ne fetch pas sans token

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/wealth`, {
      headers: {
        Authorization: `Bearer ${token}`, // On montre patte blanche au backend
      },
    })
      .then((res) => {
        if (res.status === 401) {
          // Si le token est expiré ou faux, on déconnecte
          handleLogout();
          throw new Error("Non autorisé");
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur de connexion:", err);
        setLoading(false);
      });
  }, [token]);

  // 3. On déclenche le fetch uniquement SI on est authentifié
  useEffect(() => {
    if (isAuthenticated) {
      fetchWealthData();
    }
  }, [isAuthenticated, fetchWealthData]);

  const handleLogout = () => {
    localStorage.removeItem("wealth_token");
    localStorage.removeItem("wealth_user_id");
    setIsAuthenticated(false);
    setToken(null);
  };

  const handleLoginSuccess = (newToken: string, userId: string) => {
    setToken(newToken);
    setIsAuthenticated(true);
    setLoading(true); // On relance le chargement pour chercher la donnée
  };

  if (loading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 transition-colors duration-300">
        {/* Faux Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse"></div>
              <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse"></div>
            </div>
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Fausse Grille */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse"></div>
              <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse"></div>
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse mb-4"></div>
              <div className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
              <div className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
              <div className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 pb-24">
      {/* HEADER GLOBAL */}
      <div className="bg-white/70 backdrop-blur-xl dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              {/* 🌟 LE MESSAGE DE BIENVENUE EST ICI 🌟 */}
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-4 transition-colors"
              >
                Bonjour,{" "}
                <span className="font-medium text-slate-800 dark:text-white">
                  {userName}
                </span>{" "}
                👋
              </motion.p>

              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wider uppercase mb-1">
                Patrimoine total
              </p>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl text-slate-800 dark:text-white font-light tracking-tight transition-colors"
              >
                {data?.totalWealth.toLocaleString("fr-FR", {
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </motion.h1>
            </div>

            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <LogOut
                  className="w-4 h-4 text-slate-500 dark:text-slate-400"
                  strokeWidth={1.5}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GRILLE PRINCIPALE (La magie du responsive est ici) */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* COLONNE GAUCHE (Prend 8 colonnes sur 12 sur Desktop) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Évolution Historique */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors duration-300">
              <h2 className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-6 transition-colors">
                Évolution historique
              </h2>
              {/* Le graphique est beaucoup plus haut sur Desktop (h-64 au lieu de h-24) */}
              <div className="h-48 md:h-64 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.historicalData}>
                    <XAxis dataKey="date" hide />
                    <Tooltip
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
                      strokeWidth={3}
                      dot={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Répartition Dynamique (Sortie du header pour intégrer la grille) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors duration-300">
              <h2 className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-6">
                Répartition réelle
              </h2>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
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

                <div className="flex-1 w-full space-y-3">
                  {data?.distribution.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-light transition-colors">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium transition-colors">
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

          {/* COLONNE DROITE (Prend 4 colonnes sur 12 sur Desktop) */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-sm text-slate-600 dark:text-slate-400 font-medium px-1 mb-2 transition-colors">
              Détails des catégories
            </h2>

            {data?.distribution.map((asset, index) => (
              <div
                key={index}
                onClick={() =>
                  router.push(`/asset/${asset.name.toLowerCase()}`)
                }
                className="bg-white/70 backdrop-blur-xl dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:bg-white/90 dark:hover:bg-slate-800 group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${asset.color}15` }}
                  >
                    {asset.name === "CRYPTO" && (
                      <Bitcoin size={24} color={asset.color} />
                    )}
                    {asset.name === "PEA" && (
                      <TrendingUp size={24} color={asset.color} />
                    )}
                    {asset.name === "EPARGNE" && (
                      <Wallet size={24} color={asset.color} />
                    )}
                    {asset.name === "EPARGNE-SALARIALE" && (
                      <Briefcase size={24} color={asset.color} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">
                      {asset.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base text-slate-800 dark:text-white font-medium transition-colors">
                    {asset.value.toLocaleString("fr-FR")} €
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOUTON FLOTTANT (Vrai bouton d'action fixé en bas à droite) */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40"
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-105 shadow-xl shadow-blue-600/30"
        >
          <Plus className="w-6 h-6" />
        </button>
      </motion.div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchWealthData}
      />
    </div>
  );
}
