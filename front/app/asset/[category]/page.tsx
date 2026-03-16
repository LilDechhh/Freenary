"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  TrendingUp,
  Wallet,
  Bitcoin,
  Briefcase,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Plus,
  Pencil, // 👈 Nouvelle icône
  Loader2, // 👈 Nouvelle icône de chargement
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { usePrivacy } from "@/app/provider"; // 👈 Ajout
import { formatCurrency } from "@/lib/utils"; // 👈 Ajout

import AddTransactionModal from "@/components/add-transaction";

// ==========================================
// 🛡️ INTERFACES
// ==========================================
interface Asset {
  id: string;
  name: string;
  quantity: number;
  currentPrice: number | null;
  currentValue: number;
  pru: number;
  gain: number;
  gainPercent: number;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  quantity: number | null;
  assetName: string;
}

interface CategoryData {
  title: string;
  totalCategoryValue: number;
  totalGain: number;
  totalGainPercent: number;
  assets: Asset[];
  transactions: Transaction[];
}

// ==========================================
// 🚀 COMPOSANT PRINCIPAL
// ==========================================
export default function CategoryDetail() {
  const { category } = useParams();
  const router = useRouter();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // --- NOUVEAUX ÉTATS POUR LA MISE A JOUR RAPIDE ---
  const [assetToUpdate, setAssetToUpdate] = useState<Asset | null>(null);
  const [updateAmount, setUpdateAmount] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Savoir si on est sur une page où la mise à jour rapide est pertinente
  const isFixedAsset = [
    "epargne",
    "compte-courant",
    "epargne-salariale",
  ].includes(category as string);

  const fetchDetails = useCallback(async () => {
    const token = localStorage.getItem("wealth_token");
    if (!category || !token) return;

    try {
      const categoryParam = category.toString().toLowerCase();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wealth/${categoryParam}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) throw new Error("Erreur serveur");

      const json: CategoryData = await res.json();
      setData(json);
    } catch (err) {
      toast.error("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleDelete = async (id: string) => {
    if (
      !confirm("Supprimer cette transaction ? Cela mettra à jour votre solde.")
    )
      return;
    try {
      const token = localStorage.getItem("wealth_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wealth/transaction/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        toast.success("Transaction supprimée avec succès");
        fetchDetails();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (err) {
      toast.error("Erreur réseau");
    }
  };

  // --- NOUVELLE FONCTION : SOUMISSION DE LA MISE A JOUR RAPIDE ---
  const handleQuickUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetToUpdate) return;
    setIsUpdating(true);

    try {
      const token = localStorage.getItem("wealth_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wealth/transaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: category as string,
            type: "update_balance", // 👈 Utilise la logique d'ajustement du backend
            asset: assetToUpdate.name,
            quantity: 0,
            amount: parseFloat(updateAmount),
            date: new Date().toISOString().split("T")[0],
          }),
        },
      );

      if (res.ok) {
        toast.success(`Solde de ${assetToUpdate.name} mis à jour !`);
        setAssetToUpdate(null);
        setUpdateAmount("");
        fetchDetails(); // Recharge les données de la page
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (err) {
      toast.error("Erreur réseau");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-12 transition-colors">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="h-10 w-32 bg-muted rounded-xl animate-pulse" />
          <div className="h-32 w-full bg-muted rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  const totalValue = data?.totalCategoryValue || 0;
  const totalGain = data?.totalGain || 0;
  const totalGainPercent = data?.totalGainPercent || 0;
  const assets = data?.assets || [];
  const transactions = data?.transactions || [];

  return (
    <div className="min-h-dvh bg-background transition-colors duration-300 pb-24 relative">
      <div className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-30 transition-colors">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          {" "}
          {/* 👈 justify-between ajouté */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-medium text-foreground capitalize">
              Détails {category}
            </h1>
          </div>
          {/* 👈 BOUTON OEIL ICI */}
          <button
            onClick={togglePrivacyMode}
            className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground"
          >
            {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-8 shadow-premium transition-colors"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                {category === "crypto" && <Bitcoin size={28} />}
                {category === "pea" && <TrendingUp size={28} />}
                {category === "epargne" && <Wallet size={28} />}
                {category === "epargne-salariale" && <Briefcase size={28} />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                  Valeur Totale
                </p>
                <h2 className="text-3xl font-light text-foreground">
                  {formatCurrency(totalValue, isPrivacyMode)} €
                </h2>
              </div>
            </div>

            <div className="text-left md:text-right p-4 md:p-0 bg-muted/50 md:bg-transparent rounded-2xl">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                Plus-value latente
              </p>
              <p
                className={`text-xl font-medium ${totalGain >= 0 ? "text-success" : "text-destructive"}`}
              >
                {!isPrivacyMode && totalGain >= 0 ? "+" : ""}
                {formatCurrency(totalGain, isPrivacyMode)} €
                <span className="text-sm ml-2 opacity-80">
                  ({isPrivacyMode ? "***" : totalGainPercent.toFixed(2)}%)
                </span>
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1">
            Vos Actifs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.length > 0 ? (
              assets.map((asset, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  // 👈 La carte devient cliquable si c'est un compte fixe !
                  onClick={() => isFixedAsset && setAssetToUpdate(asset)}
                  className={`bg-card/80 backdrop-blur-xl border border-border p-6 rounded-2xl shadow-premium transition-all relative overflow-hidden group ${
                    isFixedAsset
                      ? "cursor-pointer hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-foreground uppercase tracking-tight flex items-center gap-2">
                        {asset.name}
                        {isFixedAsset && (
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all" />
                        )}
                      </h4>
                      {!isFixedAsset && (
                        <p className="text-sm text-muted-foreground font-light">
                          {/* 👈 Quantité masquée */}
                          {formatCurrency(
                            asset.quantity,
                            isPrivacyMode,
                            4,
                          )}{" "}
                          unités
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(asset.currentValue, isPrivacyMode)} €
                      </p>
                      {!isFixedAsset && (
                        <p className="text-xs text-muted-foreground italic">
                          Prix :{" "}
                          {formatCurrency(asset.currentPrice, isPrivacyMode)} €
                        </p>
                      )}
                    </div>
                  </div>

                  {!isFixedAsset && (
                    <div className="pt-4 border-t border-border flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          PRU
                        </p>
                        <p className="text-sm text-foreground/80">
                          {formatCurrency(asset.pru, isPrivacyMode)} €
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          Performance
                        </p>
                        <p
                          className={`text-sm font-bold ${asset.gain >= 0 ? "text-success" : "text-destructive"}`}
                        >
                          {asset.gain >= 0 ? "+" : ""}
                          {formatCurrency(asset.gain, isPrivacyMode)} € (
                          {asset.gainPercent >= 0 ? "+" : ""}
                          {formatCurrency(asset.gainPercent, isPrivacyMode)}%)
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground italic">
                Aucun actif possédé dans cette catégorie.
              </div>
            )}
          </div>
        </div>

        {transactions.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1">
              Historique des mouvements
            </h3>
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-premium transition-colors">
              <div className="divide-y divide-border">
                {transactions.map((tx) => {
                  const isAchat = ["achat", "dépôt", "in"].includes(
                    tx.type.toLowerCase(),
                  );
                  const isUpdate = tx.type.toLowerCase() === "ajustement";

                  return (
                    <div
                      key={tx.id}
                      className="group p-4 md:p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isUpdate
                              ? "bg-primary/10 text-primary"
                              : isAchat
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {isUpdate ? (
                            <Pencil size={18} />
                          ) : isAchat ? (
                            <ArrowDownLeft size={20} />
                          ) : (
                            <ArrowUpRight size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {tx.assetName}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {tx.type} •{" "}
                            {new Date(tx.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p
                            className={`text-sm font-medium ${isUpdate ? "text-foreground" : isAchat ? "text-success" : "text-destructive"}`}
                          >
                            {isAchat
                              ? "+"
                              : isUpdate
                                ? tx.amount >= 0
                                  ? "+"
                                  : ""
                                : "-"}
                            {formatCurrency(Math.abs(tx.amount), isPrivacyMode)}{" "}
                            €
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          title="Supprimer"
                          className="opacity-100 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

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
        onSuccess={fetchDetails}
        defaultCategory={category as string}
      />

      {/* 🌟 NOUVEAU : MINI-MODALE DE MISE A JOUR RAPIDE 🌟 */}
      <AnimatePresence>
        {assetToUpdate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssetToUpdate(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-sm rounded-3xl shadow-premium border border-border p-6 relative z-10"
            >
              <button
                onClick={() => setAssetToUpdate(null)}
                className="absolute top-4 right-4 p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-medium text-foreground mb-1">
                Mettre à jour
              </h3>
              <p className="text-sm text-muted-foreground mb-6 font-light">
                {assetToUpdate.name}
              </p>

              <form onSubmit={handleQuickUpdate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">
                    Nouveau Solde Total (€)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    autoFocus
                    placeholder={`Actuel: ${assetToUpdate.currentValue} €`}
                    value={updateAmount}
                    onChange={(e) => setUpdateAmount(e.target.value)}
                    className="w-full h-12 px-4 bg-muted border-none rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Valider"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
