import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import { Toaster } from "sonner";

// On importe Inter à la place de Geist
const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Améliore le chargement de la police
});

// J'ai mis à jour le titre pour correspondre à ta DA
export const metadata: Metadata = {
  title: "Freenary",
  description: "Master your Wealth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // On passe le html en français
    <html lang="fr" suppressHydrationWarning>
      <body
        // On applique la classe générée par Inter directement sur le body
        className={`${inter.className} antialiased`}
      >
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}