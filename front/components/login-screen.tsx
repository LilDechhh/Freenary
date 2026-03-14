"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (token: string, userId: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true); // True = Connexion, False = Inscription
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
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Une erreur est survenue");
      }

      // Succès ! On stocke le token et on prévient la page principale
      localStorage.setItem("wealth_token", data.access_token);
      localStorage.setItem("wealth_user_id", data.user.id);

      onLoginSuccess(data.access_token, data.user.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800"
      >
        {/* Logo */}
        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/30">
          <Activity size={32} />
        </div>

        <h1 className="text-2xl text-slate-800 dark:text-white font-light text-center tracking-tight mb-2">
          {isLogin ? "Bon retour" : "Créer un compte"}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-light text-center mb-8">
          {isLogin
            ? "Connectez-vous pour voir votre patrimoine."
            : "Rejoignez-nous pour suivre vos actifs."}
        </p>

        {/* Message d'erreur */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-red-50 dark:bg-red-500/10 text-red-500 text-sm px-4 py-3 rounded-xl flex items-center gap-2"
            >
              <AlertCircle size={16} className="shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Champ Nom (Uniquement pour l'inscription) */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  required={!isLogin}
                  placeholder="Votre prénom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-light transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Champ Email */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail size={18} className="text-slate-400" />
            </div>
            <input
              type="email"
              required
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-light transition-all"
            />
          </div>

          {/* Champ Mot de passe */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-slate-400" />
            </div>
            <input
              type="password"
              required
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-light transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Chargement...</span>
            ) : (
              <>
                {isLogin ? "Se connecter" : "Créer mon compte"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Bouton de bascule Connexion/Inscription */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(""); // On efface les erreurs quand on change de mode
            }}
            className="text-sm text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {isLogin
              ? "Pas encore de compte ? S'inscrire"
              : "Déjà un compte ? Se connecter"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
