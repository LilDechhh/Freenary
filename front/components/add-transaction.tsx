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
  preselectedAsset?: { ticker: string; name: string } | null;
  transactionToEdit?: any; // NEW
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory,
  preselectedAsset,
  transactionToEdit,
}: AddTransactionModalProps) {
  const [category, setCategory] = useState(defaultCategory || "crypto");
  const [type, setType] = useState("achat");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("");
  const [asset, setAsset] = useState("");
  const [assetName, setAssetName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [label, setLabel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setCategory(transactionToEdit.category || "crypto");
        setType(transactionToEdit.type || "achat");
        setAmount(transactionToEdit.amount?.toString() || "");
        setQuantity(transactionToEdit.quantity?.toString() || "");
        setAsset(transactionToEdit.assetName || ""); // Dans la V1 on triche avec name
        setAssetName(transactionToEdit.assetName || "");
        setDate(new Date(transactionToEdit.date).toISOString().split("T")[0]);
        setLabel(transactionToEdit.label || "");
      } else {
        if (defaultCategory) setCategory(defaultCategory);
        if (preselectedAsset) {
          setAsset(preselectedAsset.ticker);
          setAssetName(preselectedAsset.name);
        } else {
          setAsset("");
          setAssetName("");
        }
        setType("achat");
        setAmount("");
        setQuantity("");
        setDate(new Date().toISOString().split("T")[0]);
        setLabel("");
      }
      setSuggestions([]);
    }
  }, [isOpen, defaultCategory, preselectedAsset, transactionToEdit]);

  const isFixedAsset = [
    "epargne",
    "compte-courant",
    "epargne-salariale",
  ].includes(category);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Evite la recherche si on édite déjà avec un actif défini
      if (assetName.length >= 2 && !isFixedAsset && !asset && !transactionToEdit) {
        if (category === "pea") fetchSuggestions("search/stocks", assetName);
        else if (category === "crypto")
          fetchSuggestions("search/crypto", assetName);
      } else {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [assetName, category, isFixedAsset, asset, transactionToEdit]);

  const fetchSuggestions = async (endpoint: string, query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wealth/${endpoint}?q=${query}`,
        {
          credentials: "include",
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

    try {
      const method = transactionToEdit ? "PUT" : "POST";
      const url = transactionToEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/wealth/transaction/${transactionToEdit.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/wealth/transaction`;

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          type,
          asset: asset || assetName,
          quantity: isFixedAsset ? 0 : quantity ? parseFloat(quantity) : 0,
          amount: parseFloat(amount),
          date,
          label: label || undefined,
        }),
      });

      if (response.ok) {
        toast.success(
          transactionToEdit ? "Opération modifiée !" : "Opération enregistrée !"
        );
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
    setLabel("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 border border-border"
          >
            <div className="px-8 pt-8 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
                  {transactionToEdit ? "Modifier l'opération" : "Nouvelle opération"}
                </h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  {transactionToEdit ? "Édition Manuelle" : "Saisie Manuelle"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1 mb-2 block">
                      Poche
                    </label>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        if (!transactionToEdit) resetForm();
                      }}
                      disabled={!!transactionToEdit}
                      className="w-full h-12 px-4 bg-muted/50 border border-border rounded-xl text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="compte-courant">Compte Courant</option>
                      <option value="crypto">Crypto</option>
                      <option value="pea">PEA</option>
                      <option value="epargne">Épargne</option>
                      <option value="epargne-salariale">Ép. Salariale</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1 mb-2 block">
                      Direction
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-12 px-4 bg-muted/50 border border-border rounded-xl text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                    >
                      <option value="achat">Achat / Dépôt</option>
                      <option value="vente">Vente / Retrait</option>
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

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1 mb-2 block">
                    Libellé de l&apos;opération
                  </label>
                  {category === "epargne-salariale" ? (
                    <select
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="w-full h-12 px-4 bg-muted/50 border border-border rounded-xl text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                    >
                      <option value="">Sélectionner un motif (Optionnel)</option>
                      <option value="Participation">Participation</option>
                      <option value="Intéressement">Intéressement</option>
                      <option value="Versement volontaire">Versement volontaire</option>
                      <option value="Abondement">Abondement</option>
                      <option value="Arbitrage">Arbitrage / Fusion de fonds</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Ex: Salaire, Virement..."
                      className="w-full h-12 px-4 bg-transparent border-b-2 border-border text-foreground font-semibold outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                    />
                  )}
                </div>

                <div className="relative">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1 mb-2 block">
                    {isFixedAsset ? "Nom du compte" : "Actif concerné"}
                  </label>
                  {category === "epargne" ? (
                    <select
                      value={assetName}
                      onChange={(e) => {
                        setAssetName(e.target.value);
                        setAsset("");
                      }}
                      disabled={!!transactionToEdit}
                      className="w-full h-12 px-4 bg-transparent border-b-2 border-border text-foreground font-semibold outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
                      required
                    >
                      <option value="">Choisir un livret...</option>
                      <option value="Livret A">Livret A</option>
                      <option value="LDDS">LDDS</option>
                      <option value="LEP">LEP</option>
                      <option value="PEL">PEL / CEL</option>
                      <option value="Livret Jeune">Livret Jeune</option>
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
                      disabled={!!transactionToEdit}
                      placeholder={
                        category === "compte-courant"
                          ? "Ex: BNP, Boursorama..."
                          : "Ex: PEE Amundi..."
                      }
                      className="w-full h-12 px-4 bg-transparent border-b-2 border-border text-foreground font-semibold outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
                    />
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                        onFocus={() => {
                          if (!transactionToEdit) setShowSuggestions(true);
                        }}
                        disabled={!!transactionToEdit}
                        placeholder={
                          category === "pea"
                            ? "Ex: Apple, LVMH..."
                            : "Ex: Bitcoin, Ethereum..."
                        }
                        className="w-full h-12 pl-6 pr-10 bg-transparent border-b-2 border-border text-foreground font-semibold outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                      )}
                    </div>
                  )}

                  <AnimatePresence>
                    {showSuggestions &&
                      suggestions.length > 0 &&
                      !isFixedAsset &&
                      !transactionToEdit && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute z-20 w-full mt-2 bg-card border border-border rounded-xl shadow-2xl max-h-56 overflow-y-auto overflow-x-hidden"
                        >
                          {suggestions.map((s, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setAsset(s.symbol);
                                setAssetName(s.name);
                                setShowSuggestions(false);
                              }}
                              className="p-3 hover:bg-muted/50 cursor-pointer flex justify-between items-center border-b border-border last:border-none group"
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
                                  <span className="text-sm font-semibold">
                                    {s.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
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
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1 mb-2 block">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-12 px-4 bg-muted/50 border border-border rounded-xl text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {!isFixedAsset && (
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1 mb-2 block">
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
                        className="w-full h-12 px-4 bg-transparent border-b-2 border-border text-foreground font-semibold outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1 mb-2 block">
                    {type === "update_balance"
                      ? "Nouveau Solde Total Actuel (€)"
                      : "Montant (€)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-border py-2 text-foreground font-bold tracking-tight text-4xl outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-foreground text-card rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-slate-900/10 tracking-wide disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      transactionToEdit ? "Sauvegarder les modifications" : "Valider l'opération"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
