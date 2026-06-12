"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import { GlobalData, CategoryDetailsData, Transaction } from "@/types";
import LoginScreen from "@/components/login-screen";
import AddTransactionModal from "@/components/add-transaction";
import Sidebar from "@/components/layout/sidebar";
import HeaderMobile from "@/components/layout/header-mobile";
import PortfolioChart from "@/components/dashboard/portfolio-chart";
import GlobalDistribution from "@/components/dashboard/global-distribution";
import AssetTable from "@/components/dashboard/asset-table";

const categoryNames: Record<string, string> = {
  global: "Vue Globale",
  "epargne-salariale": "Épargne Salariale",
  epargne: "Épargne",
  crypto: "Crypto",
  pea: "PEA",
  "compte-courant": "Compte Courant",
};

export default function Dashboard() {
  const [currentCategory, setCurrentCategory] = useState("global");
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryDetailsData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [preselectedAsset, setPreselectedAsset] = useState<{ ticker: string; name: string } | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isToTheMoon, setIsToTheMoon] = useState(false);

  const handleToTheMoon = () => {
    if (isToTheMoon) return;
    setIsToTheMoon(true);
    setTimeout(() => {
      setIsToTheMoon(false);
    }, 4000);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Erreur auth/me:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const fetchGlobalData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wealth`, {
        credentials: "include",
      });
      if (res.ok) {
        setGlobalData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchCategoryData = useCallback(async () => {
    if (!isAuthenticated || currentCategory === "global") return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wealth/${currentCategory}`, {
        credentials: "include",
      });
      if (res.ok) {
        setCategoryData(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  }, [isAuthenticated, currentCategory]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGlobalData();
      if (currentCategory !== "global") {
        fetchCategoryData();
      }
    }
  }, [isAuthenticated, currentCategory, fetchGlobalData, fetchCategoryData]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Erreur lors de la déconnexion", e);
    }
    localStorage.removeItem("wealth_user_id");
    setIsAuthenticated(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Supprimer cette transaction ?")) return;
    if (!isAuthenticated) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wealth/transaction/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Transaction supprimée !");
        fetchGlobalData();
        if (currentCategory !== "global") fetchCategoryData();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (err) {
      toast.error("Erreur réseau");
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <LoginScreen
        onLoginSuccess={() => {
          setIsAuthenticated(true);
        }}
      />
    );
  }

  if (loading || !globalData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isFixedAsset = ["epargne", "compte-courant", "epargne-salariale"].includes(currentCategory);

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-background overflow-hidden animate-in fade-in duration-500">
      <HeaderMobile isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm"
          ></motion.div>
        )}
      </AnimatePresence>

      <Sidebar
        globalData={globalData}
        currentCategory={currentCategory}
        onCategorySelect={(cat) => {
          setCurrentCategory(cat);
          setIsMobileMenuOpen(false);
        }}
        isMobileMenuOpen={isMobileMenuOpen}
        onLogout={handleLogout}
        onToTheMoon={handleToTheMoon}
      />

      <main className="flex-1 h-[calc(100vh-64px)] md:h-screen overflow-y-auto bg-background relative w-full">
        <PortfolioChart
          currentCategory={currentCategory}
          categoryName={categoryNames[currentCategory] || currentCategory}
          globalData={globalData}
          categoryData={categoryData}
          isToTheMoon={isToTheMoon}
        />

        <div className="p-4 md:p-8 lg:p-12 space-y-8 lg:space-y-12 max-w-5xl mx-auto pb-24 md:pb-12">
          {currentCategory === "global" ? (
            <GlobalDistribution globalData={globalData} />
          ) : (
            <AssetTable
              categoryData={categoryData}
              isFixedAsset={isFixedAsset}
              onAddTransaction={(asset) => {
                setPreselectedAsset(asset || null);
                setIsModalOpen(true);
              }}
              onEditTransaction={(tx) => {
                setTransactionToEdit(tx);
                setIsModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <AddTransactionModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setTransactionToEdit(null);
              setPreselectedAsset(null);
            }}
            onSuccess={() => {
              fetchGlobalData();
              if (currentCategory !== "global") fetchCategoryData();
              setIsModalOpen(false);
              setTransactionToEdit(null);
              setPreselectedAsset(null);
            }}
            transactionToEdit={transactionToEdit}
            defaultCategory={currentCategory === "global" ? undefined : currentCategory}
            preselectedAsset={preselectedAsset}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isToTheMoon && (
          <motion.div
            initial={{ x: "-20vw", y: "110vh", rotate: 45 }}
            animate={{ x: "120vw", y: "-20vh", rotate: 45 }}
            transition={{ duration: 2.5, ease: "easeIn" }}
            className="fixed z-50 text-[10rem] pointer-events-none drop-shadow-2xl flex items-center justify-center"
          >
            🚀
            <div className="absolute top-1/2 right-[80%] w-[150vw] h-12 bg-gradient-to-r from-transparent via-purple-500 to-purple-600 blur-xl opacity-80 -translate-y-1/2 rounded-full"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}