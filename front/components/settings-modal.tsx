"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  LogOut,
  Trash2,
  Key,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsModal({ isOpen, onClose, onLogout }: any) {
  const [activeTab, setActiveTab] = useState("account");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem("wealth_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/update-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ oldPassword, newPassword }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Mot de passe mis à jour !");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erreur de mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "⚠️ ACTION IRRÉVERSIBLE ! Toutes vos données financières seront supprimées. Continuer ?",
      )
    )
      return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("wealth_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/delete-account`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Erreur serveur");
      toast.success("Compte supprimé définitivement.");
      onLogout(); // Force la déconnexion
    } catch (err) {
      toast.error("Erreur lors de la suppression.");
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card w-full max-w-md rounded-3xl shadow-premium border border-border overflow-hidden relative z-10"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-medium text-foreground">
                Paramètres
              </h2>
              <button
                onClick={onClose}
                className="p-2 bg-muted rounded-full hover:bg-muted/80 text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("account")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "account" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Sécurité
              </button>
              <button
                onClick={() => setActiveTab("danger")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "danger" ? "text-destructive border-b-2 border-destructive" : "text-muted-foreground hover:text-destructive"}`}
              >
                Zone de danger
              </button>
            </div>

            <div className="p-6">
              {activeTab === "account" ? (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                      Ancien mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full h-11 px-4 bg-muted border-none rounded-xl text-foreground font-light focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-11 px-4 bg-muted border-none rounded-xl text-foreground font-light focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || newPassword.length < 6}
                    className="w-full h-11 mt-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Mettre à jour
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-light">
                      T'es sur de vouloir supprimer le compte ?
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="w-full h-11 bg-destructive text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" /> Supprimer mon compte
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-muted/30">
              <button
                onClick={onLogout}
                className="w-full py-2 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" /> Se déconnecter de Freenary
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
