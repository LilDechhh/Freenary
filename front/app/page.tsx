"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Landmark,
  Eye,
  EyeOff,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import AddTransactionModal from "@/components/add-transaction";
import LoginScreen from "@/components/login-screen";
import { usePrivacy } from "@/app/provider";
import { formatCurrency } from "@/lib/utils";
// ==========================================
// 🛡️ INTERFACES (Fini les "any" !)
// ==========================================
interface DistributionData {
  name: string;
  value: number;
  percentage: string;
  color: string;
}

interface HistoricalData {
  date: string;
  value: number;
}

interface WealthData {
  totalWealth: number;
  distribution: DistributionData[];
  historicalData: HistoricalData[];
}

// ==========================================
// 🚀 COMPOSANT PRINCIPAL
// ==========================================
export default function Dashboard() {
  const router = useRouter();

  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  // --- ÉTATS ---
  const [data, setData] = useState<WealthData | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // --- INITIALISATION ---
  /**
   * Vérifie au chargement si l'utilisateur est déjà connecté.
   * Si oui, on extrait son prénom du token JWT pour lui dire bonjour.
   */
  // --- INITIALISATION ---
  /**
   * Vérifie au chargement si l'utilisateur est déjà connecté.
   */
  useEffect(() => {
    const savedToken = localStorage.getItem("wealth_token");
    if (savedToken) {
      try {
        const base64Url = savedToken.split(".")[1];
        if (!base64Url) throw new Error("Token invalide");

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(window.atob(base64));

        const name =
          payload.name ||
          (payload.email ? payload.email.split("@")[0] : "Aventurier");
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      } catch (error) {
        console.error("Erreur de décodage du token :", error);
        // Si le token est corrompu, on nettoie pour éviter de bloquer l'app
        localStorage.removeItem("wealth_token");
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      setToken(savedToken);
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }
  }, []);

  // --- APPELS API ---
  /**
   * Récupère les données globales du patrimoine depuis le backend.
   * Utilisé au chargement et après l'ajout d'une nouvelle transaction.
   */
  const fetchWealthData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wealth`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        handleLogout();
        throw new Error("Session expirée, veuillez vous reconnecter.");
      }

      const json: WealthData = await res.json();
      setData(json);
    } catch (err) {
      console.error("Erreur lors de la récupération des données :", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Déclenche la récupération des données dès que l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated) fetchWealthData();
  }, [isAuthenticated, fetchWealthData]);

  // --- ACTIONS ---
  /**
   * Déconnecte l'utilisateur et nettoie le navigateur.
   */
  const handleLogout = () => {
    localStorage.removeItem("wealth_token");
    localStorage.removeItem("wealth_user_id");
    setIsAuthenticated(false);
    setToken(null);
  };

  // ==========================================
  // 🎨 RENDU VISUEL (RENDER)
  // ==========================================

  // 1. Écran de chargement
  if (loading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-32 bg-muted rounded-md animate-pulse"></div>
      </div>
    );
  }

  // 2. Écran de connexion
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={(t) => {
          setToken(t);
          setIsAuthenticated(true);
          setLoading(true);
        }}
      />
    );
  }

  // 3. Dashboard Principal
  return (
    <div className="min-h-dvh bg-background transition-colors duration-300 pb-24">
      {/* HEADER : Bonjour et Patrimoine Total */}
      <div className="bg-card/80 backdrop-blur-xl border-b border-border transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm md:text-base text-muted-foreground mb-4"
              >
                Bonjour,{" "}
                <span className="font-medium text-foreground">{userName}</span>{" "}
                👋
              </motion.p>
              <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase mb-1">
                Patrimoine total
              </p>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl text-foreground font-light tracking-tight"
              >
                {/* 👈 Modification de l'affichage du total */}
                {formatCurrency(data?.totalWealth, isPrivacyMode)} €
              </motion.h1>
            </div>

            <div className="flex items-center gap-3">
              {/* 👈 NOUVEAU BOUTON OEIL */}
              <button
                onClick={togglePrivacyMode}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
              >
                {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <ThemeSwitcher />
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <LogOut
                  className="w-4 h-4 text-muted-foreground"
                  strokeWidth={1.5}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU : Graphiques et Catégories */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Section Gauche : Graphiques */}
          <div className="lg:col-span-8 space-y-8">
            {/* Graphique d'évolution */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-premium transition-all">
              <h2 className="text-sm text-muted-foreground font-medium mb-6">
                Évolution historique
              </h2>
              <div className="h-48 md:h-64 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.historicalData}>
                    <XAxis dataKey="date" hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        color: "var(--foreground)",
                        borderRadius: "12px",
                        border: "1px solid var(--border)",
                      }}
                      labelFormatter={(date) => `${date}`}
                      formatter={(value?: number) => [
                        `${value?.toLocaleString("fr-FR") ?? "0"} €`,
                        "Valeur",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graphique de répartition (Camembert) */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-premium transition-all">
              <h2 className="text-sm text-muted-foreground font-medium mb-6">
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

                {/* Légende du graphique */}
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
                        <span className="text-sm text-muted-foreground font-light">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm text-foreground font-medium">
                        {data && data.totalWealth > 0
                          ? Math.round((item.value / data.totalWealth) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section Droite : Liste des Catégories */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-sm text-muted-foreground font-medium px-1 mb-2">
              Vos portefeuilles
            </h2>
            {data?.distribution.map((asset, index) => (
              <div
                key={index}
                onClick={() =>
                  // 👈 CORRECTION URL : On remplace l'espace par un tiret
                  router.push(
                    `/asset/${asset.name.toLowerCase().replace(" ", "-")}`,
                  )
                }
                className="bg-card/80 backdrop-blur-xl p-5 rounded-2xl border border-border flex items-center justify-between shadow-premium hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${asset.color}15` }}
                  >
                    {/* 👈 CORRECTION ICÔNE : Sans "S" */}
                    {asset.name === "COMPTE COURANT" && (
                      <Landmark size={24} color={asset.color} />
                    )}
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
                  <p className="text-sm font-medium text-foreground">
                    {asset.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base text-foreground font-medium">
                    {formatCurrency(asset.value, isPrivacyMode)} €
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOUTON FLOTTANT D'AJOUT (+) */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-40"
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-transform hover:scale-105 shadow-premium"
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
