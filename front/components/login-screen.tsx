"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, AlertCircle, ArrowRight } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (userId: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "login" : "register";
    const body = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include", // 🛡️ SÉCURITÉ : Envoie et reçoit les cookies HttpOnly
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Une erreur est survenue");

      localStorage.setItem("wealth_user_id", data.user.id);
      onLoginSuccess(data.user.id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Erreur de connexion");
      } else {
        setError("Erreur de connexion");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background animate-in fade-in duration-700 relative overflow-hidden">
      {/* 🌟 FOND : Grille subtile (Style Vercel/Stripe) + Lueur douce */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-primary/30 rounded-full blur-[100px] mix-blend-normal"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-card/80 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-premium border border-border"
      >
        <div className="flex justify-center mb-8">
          <img 
            src="/icon.png" 
            alt="Logo Freenary" 
            className="w-16 h-16 rounded-2xl shadow-inner object-cover" 
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl text-foreground font-bold tracking-tight mb-2">
            <span className="text-primary">Freenary</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {isLogin
              ? "Connecte toi"
              : "Rejoint nous pour suivre tes actifs."}
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl flex items-center gap-2 overflow-hidden border border-destructive/20"
            >
              <AlertCircle size={16} className="shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pb-2">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-2 block ml-2">
                    Prénom
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 bg-transparent border border-border rounded-xl text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      placeholder="Huey"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-2 block ml-2">
              Adresse Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-transparent border border-border rounded-xl text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Riley@freeman.com"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-2 block ml-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-transparent border border-border rounded-xl text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-6 bg-primary text-white rounded-xl font-medium text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <span className="animate-pulse">Chargement...</span>
            ) : (
              <>
                {isLogin ? "Se connecter" : "Créer mon compte"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-primary font-bold hover:underline ml-1"
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

