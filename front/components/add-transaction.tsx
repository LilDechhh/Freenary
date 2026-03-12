"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useRouter } from "next/navigation";

// NOUVEAU : Ajout de onSuccess dans les props
interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess, // NOUVEAU : Récupération de la prop
}: AddTransactionModalProps) {
  const router = useRouter();

  const [category, setCategory] = useState("crypto");
  const [type, setType] = useState("achat");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("");
  const [asset, setAsset] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wealth/transaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category,
            type,
            asset: asset || category,
            quantity: quantity ? parseFloat(quantity) : 0,
            amount: parseFloat(amount),
            date,
          }),
        },
      );

      if (response.ok) {
        setShowSuccess(true);

        setTimeout(() => {
          setShowSuccess(false);
          setIsLoading(false);
          onClose();

          setAmount("");
          setQuantity("");
          setAsset("");
          setDate(new Date().toISOString().split("T")[0]);

          // NOUVEAU : On met à jour l'UI de manière fluide sans recharger la page !
          onSuccess();
        }, 1500);
      } else {
        console.error("Erreur lors de l'enregistrement");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 bg-white dark:bg-slate-900 md:rounded-3xl rounded-t-3xl shadow-2xl z-50 w-full md:max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl text-slate-800 dark:text-white font-light">
                  Nouvelle transaction
                </h2>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Ajouter un mouvement
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* LIGNE 1 : Catégorie & Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 font-light uppercase tracking-wider">
                      Catégorie
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white font-light focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="crypto">Crypto</option>
                      <option value="pea">Bourse (PEA/CTO)</option>
                      <option value="epargne">Épargne</option>
                      <option value="epargne-salariale">Ép. Salariale</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 font-light uppercase tracking-wider">
                      Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white font-light focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="achat">Achat / Dépôt</option>
                      <option value="vente">Vente / Retrait</option>
                    </select>
                  </div>
                </div>

                {/* Actif - Adapté selon la catégorie */}
                {category === "crypto" && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 font-light uppercase tracking-wider">
                      Nom de la crypto
                    </label>
                    <select
                      required
                      value={asset}
                      onChange={(e) => setAsset(e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white font-light focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="" disabled>
                        Sélectionnez une crypto
                      </option>
                      <option value="" disabled>
                        Sélectionnez une crypto
                      </option>
                      <option value="Bitcoin">Bitcoin (BTC)</option>
                      <option value="Ethereum">Ethereum (ETH)</option>
                      <option value="Binance Coin">Binance Coin (BNB)</option>
                      <option value="Solana">Solana (SOL)</option>
                      <option value="Ripple">Ripple (XRP)</option>
                      <option value="Cardano">Cardano (ADA)</option>
                      <option value="Dogecoin">Dogecoin (DOGE)</option>
                      <option value="Avalanche">Avalanche (AVAX)</option>
                      <option value="Chainlink">Chainlink (LINK)</option>
                      <option value="Polkadot">Polkadot (DOT)</option>
                      <option value="Polygon">Polygon (MATIC)</option>
                      <option value="Litecoin">Litecoin (LTC)</option>
                      <option value="Shiba Inu">Shiba Inu (SHIB)</option>
                      <option value="TRON">TRON (TRX)</option>
                      <option value="Uniswap">Uniswap (UNI)</option>
                    </select>
                  </div>
                )}

                {/* Actif Bourse (PEA/CTO) */}
                {category === "pea" && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 font-light uppercase tracking-wider">
                      Nom de l'Action / ETF
                    </label>
                    <select
                      required
                      value={asset}
                      onChange={(e) => setAsset(e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white font-light focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="" disabled>
                        Sélectionnez un actif
                      </option>
                      <optgroup label="ETFs (Fonds Indexés)">
                        <option value="CW8">Amundi MSCI World (CW8)</option>
                        <option value="ESE">BNP S&P 500 (ESE)</option>
                      </optgroup>
                      <optgroup label="Actions Françaises">
                        <option value="LVMH">LVMH</option>
                        <option value="Air Liquide">Air Liquide</option>
                        <option value="TotalEnergies">TotalEnergies</option>
                        <option value="Hermes">Hermès</option>
                        <option value="L'Oreal">L'Oréal</option>
                      </optgroup>
                      <optgroup label="Actions US">
                        <option value="Apple">Apple</option>
                      </optgroup>
                    </select>
                  </div>
                )}

                {/* NOUVEAU : Date */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-light uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white font-light focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Quantité & Montant */}
                <div className="grid grid-cols-2 gap-4">
                  {(category === "crypto" || category === "pea") && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500 font-light uppercase tracking-wider">
                        Quantité
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="Ex: 0.5"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white font-light focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  )}
                  <div
                    className={`space-y-1.5 w-full ${category === "epargne" || category === "epargne-salariale" ? "col-span-2" : "col-span-1"}`}
                  >
                    <label className="text-xs text-slate-500 font-light uppercase tracking-wider">
                      Montant total (€)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="Ex: 1000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-white font-light focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium tracking-wide disabled:opacity-50"
                >
                  {isLoading
                    ? "Enregistrement..."
                    : "Enregistrer la transaction"}
                </button>
              </form>
            </div>

            {/* Animation Succès */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 md:rounded-3xl rounded-t-3xl"
                >
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4"
                  >
                    <Check
                      className="w-8 h-8 text-emerald-500"
                      strokeWidth={2}
                    />
                  </motion.div>
                  <h3 className="text-xl text-slate-800 dark:text-white font-light mb-1">
                    Enregistré !
                  </h3>
                  <p className="text-sm text-slate-400 font-light">
                    Mise à jour du patrimoine...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
