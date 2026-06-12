"use client";

import { Menu } from "lucide-react";
import PrivacyToggle from "@/components/privacy-toggle";
import ThemeToggle from "@/components/theme-toggle";

interface HeaderMobileProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

export default function HeaderMobile({ isMobileMenuOpen, setIsMobileMenuOpen }: HeaderMobileProps) {
  return (
    <header className="md:hidden bg-card border-b border-border flex items-center justify-between p-4 z-40 relative shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-primary rounded-full"></div>
        <span className="font-bold tracking-widest text-sm uppercase text-foreground">Freenary</span>
      </div>
      <div className="flex items-center gap-2">
        <PrivacyToggle />
        <ThemeToggle />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-muted-foreground bg-muted rounded-lg transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
