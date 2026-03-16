"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { createContext, useContext, useState, useEffect } from "react";

// 1. On crée le Context pour la discrétion
const PrivacyContext = createContext<{
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
}>({
  isPrivacyMode: false,
  togglePrivacyMode: () => {},
});

// 2. On crée un mini-hook pour l'utiliser partout facilement
export function usePrivacy() {
  return useContext(PrivacyContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  // Au démarrage, on regarde si l'utilisateur l'avait déjà activé
  useEffect(() => {
    const saved = localStorage.getItem("privacy_mode");
    if (saved === "true") setIsPrivacyMode(true);
  }, []);

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const newValue = !prev;
      localStorage.setItem("privacy_mode", String(newValue));
      return newValue;
    });
  };

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode }}>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        {children}
      </NextThemesProvider>
    </PrivacyContext.Provider>
  );
}
