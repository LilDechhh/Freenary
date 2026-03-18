"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultCategory?: string;
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory,
}: AddTransactionModalProps) {
  const [category, setCategory] = useState(defaultCategory || "crypto");
  const [type, setType] = useState("achat");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("");
  const [asset, setAsset] = useState("");
  const [assetName, setAssetName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (defaultCategory) setCategory(defaultCategory);
  }, [defaultCategory, isOpen]);

  const isFixedAsset = [
    "epargne",
    "compte-courant",
    "epargne-salariale",
  ].includes(category);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (assetName.length >= 2 && !isFixedAsset) {
        if (category === "pea") fetchSuggestions("search/stocks", assetName);
        else if (category === "crypto")
          fetchSuggestions("search/crypto", assetName);
      } else {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [assetName, category, isFixedAsset]);

  const fetchSuggestions = async (endpoint: string, query: string) => {
    setIsSearching(true);
    try {
      const token = localStorage.getItem("wealth_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wealth/${endpoint}?q=${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Erreur recherche:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const token = localStorage.getItem("wealth_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wealth/transaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category,
            type,
            asset: asset || assetName,
            quantity: isFixedAsset ? 0 : quantity ? parseFloat(quantity) : 0,
            amount: parseFloat(amount),
            date,
          }),
        },
      );

      if (response.ok) {
        toast.success("Opération enregistrée !");
        onClose();
        resetForm();
        onSuccess();
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setQuantity("");
    setAsset("");
    setAssetName("");
    setSuggestions([]);
    setDate(new Date().toISOString().split("T")[0]);
    setType("achat");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="w-full sm:max-w-md bg-card rounded-t-[2rem] sm:rounded-[2rem] shadow-premium border border-border relative z-10 max-h-[90vh] flex flex-col"
          >
            <div className="shrink-0 border-b border-border px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl text-foreground font-light tracking-tight">
                  Nouvelle opération
                </h2>
                <p className="text-xs text-muted-foreground font-light">
                  Mettez à jour votre patrimoine
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">
                      Catégorie
                    </label>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        resetForm();
                      }}
                      className="w-full h-12 px-4 bg-muted border-none rounded-xl text-foreground font-light focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                    >
                      <option value="compte-courant">Compte Courant</option>
                      <option value="crypto">Crypto-actifs</option>
                      <option value="pea">Bourse (PEA/CTO)</option>
                      <option value="epargne">Épargne</option>
                      <option value="epargne-salariale">Ép. Salariale</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">
                      Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-12 px-4 bg-muted border-none rounded-xl text-foreground font-light focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                    >
                      <option value="achat">Dépôt / Achat</option>
                      <option value="vente">Retrait / Vente</option>
                      <option value="intérêts">
                        {isFixedAsset ? "Versement Intérêts" : "Dividendes"}
                      </option>
                      {isFixedAsset && (
                        <option value="update_balance">
                          Mise à jour du solde
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">
                    {isFixedAsset ? "Nom du compte" : "Nom de l'actif"}
                  </label>
                  {category === "epargne" ? (
                    <select
                      value={assetName}
                      onChange={(e) => {
                        setAssetName(e.target.value);
                        setAsset(e.target.value);
                      }}
                      className="w-full h-12 px-4 bg-muted border-none rounded-xl text-foreground font-light outline-none cursor-pointer"
                      required
                    >
                      <option value="">Choisir un livret...</option>
                      <option value="Livret A">Livret A</option>
                      <option value="LDDS">LDDS</option>
                      <option value="LEP">LEP</option>
                      <option value="PEL">PEL / CEL</option>
                      <option value="Assurance Vie">Assurance Vie</option>
                    </select>
                  ) : category === "compte-courant" ||
                    category === "epargne-salariale" ? (
                    <input
                      type="text"
                      required
                      value={assetName}
                      onChange={(e) => {
                        setAssetName(e.target.value);
                        setAsset(e.target.value);
                      }}
                      placeholder={
                        category === "compte-courant"
                          ? "Ex: BNP, Boursorama..."
                          : "Ex: PEE Amundi..."
                      }
                      className="w-full h-12 px-4 bg-muted border-none rounded-xl text-foreground font-light outline-none"
                    />
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <input
                        type="text"
                        required
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder={
                          category === "pea"
                            ? "Rechercher Apple, LVMH..."
                            : "Bitcoin, Ethereum..."
                        }
                        className="w-full h-12 pl-11 pr-10 bg-muted border-none rounded-xl text-foreground font-light outline-none"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                      )}
                    </div>
                  )}

                  <AnimatePresence>
                    {showSuggestions &&
                      suggestions.length > 0 &&
                      !isFixedAsset && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute z-20 w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl max-h-56 overflow-y-auto overflow-x-hidden"
                        >
                          {suggestions.map((s, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setAsset(s.symbol);
                                setAssetName(s.name);
                                setShowSuggestions(false);
                              }}
                              className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center border-b border-border last:border-none group"
                            >
                              <div className="flex items-center gap-3">
                                {s.thumb && (
                                  <img
                                    src={s.thumb}
                                    alt={s.name}
                                    className="w-5 h-5 rounded-full"
                                  />
                                )}
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {s.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground uppercase">
                                    {s.ticker ? `${s.ticker} • ` : ""}
                                    {s.exchDisp || s.symbol}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase font-bold">
                                {s.type}
                              </span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                  </AnimatePresence>
                </div>

                <div
                  className={`grid ${isFixedAsset ? "grid-cols-1" : "grid-cols-2 gap-4"}`}
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-12 px-4 bg-muted border-none rounded-xl text-foreground font-light outline-none"
                    />
                  </div>
                  {!isFixedAsset && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">
                        Quantité
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        placeholder="0.00"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full h-12 px-4 bg-muted border-none rounded-xl text-foreground font-light outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">
                    {type === "update_balance"
                      ? "Nouveau Solde Total Actuel (€)"
                      : "Montant de l'opération (€)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="Ex: 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-12 px-4 bg-muted border-none rounded-xl text-foreground font-light outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 mt-4 bg-primary text-primary-foreground rounded-2xl transition-all hover:opacity-90 font-medium tracking-wide disabled:opacity-50 shadow-premium active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Valider"
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
