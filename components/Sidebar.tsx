"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useSyncExternalStore } from "react";
import { 
  Lock, 
  Grid, 
  Package, 
  ArrowLeftRight, 
  AlertTriangle, 
  LineChart,
  Menu,
  X,
  LogOut
} from "lucide-react";

import { useStock } from "@/context/StockContext";
import { supabase } from "@/lib/supabase";

const subscribeOnlineStatus = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

const getOnlineStatusSnapshot = () => {
  return navigator.onLine;
};

const getOnlineStatusServerSnapshot = () => {
  return true;
};

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { products, profile, user, syncStatus, lastSynced } = useStock();
  const [syncLabel, setSyncLabel] = useState("Synchronisé");

  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineStatusSnapshot,
    getOnlineStatusServerSnapshot
  );

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Dynamic relative sync time label
  useEffect(() => {
    if (!lastSynced) {
      setSyncLabel("Synchronisé");
      return;
    }

    const updateLabel = () => {
      const diffMs = Date.now() - new Date(lastSynced).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) {
        setSyncLabel("Synchronisé à l'instant");
      } else if (diffMins < 60) {
        setSyncLabel(`Synchronisé il y a ${diffMins} min`);
      } else if (diffHours < 24) {
        setSyncLabel(`Synchronisé il y a ${diffHours}h`);
      } else {
        setSyncLabel("Synchronisé");
      }
    };

    updateLabel();
    const interval = setInterval(updateLabel, 30000); // 30s update
    return () => clearInterval(interval);
  }, [lastSynced]);

  const getInitials = (name: string) => {
    if (!name) return "S";
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const renderSingleSyncStatus = () => {
    if (!isOnline) {
      return (
        <div className="flex items-center gap-1.5 text-red-400 text-[11px] font-semibold select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9381E] animate-pulse" />
          <span>Hors ligne</span>
        </div>
      );
    }

    if (syncStatus === "syncing") {
      return (
        <div className="flex items-center gap-1.5 text-[#E5A93C] text-[11px] font-semibold select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E5A93C] animate-pulse" />
          <span>Synchronisation...</span>
        </div>
      );
    }

    if (syncStatus === "offline-pending") {
      return (
        <div className="flex items-center gap-1.5 text-red-400 text-[11px] font-semibold select-none animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9381E]" />
          <span>En attente de réseau</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0A8543]" />
        <span>{syncLabel}</span>
      </div>
    );
  };

  const alertCount = products.filter((p) => p.stock <= p.threshold).length;

  const menuItems = [
    {
      name: "Tableau de bord",
      href: "/dashboard",
      icon: Grid,
    },
    {
      name: "Produits",
      href: "/produits",
      icon: Package,
    },
    {
      name: "Mouvement de stock",
      href: "/mouvements",
      icon: ArrowLeftRight,
    },
    {
      name: "Alertes",
      href: "/alertes",
      icon: AlertTriangle,
      badge: alertCount > 0 ? alertCount : undefined,
    },
    {
      name: "Rapport",
      href: "/rapport",
      icon: LineChart,
    },
  ];

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-brand-blue text-white flex items-center justify-between px-5 z-30 border-b border-white/10 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center font-extrabold text-[#111E35] text-lg shadow-sm">
            S
          </div>
          <span className="text-lg font-bold tracking-wide">Stocko</span>
          <div className="ml-2">
            {renderSingleSyncStatus()}
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 -mr-2 hover:bg-white/5 rounded-xl transition-all duration-200 focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`w-72 bg-brand-blue text-white flex flex-col h-screen fixed left-0 top-0 border-r border-brand-blue/10 z-50 select-none transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}>
        {/* Brand Header */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-accent rounded-lg flex items-center justify-center font-extrabold text-[#111E35] text-xl shadow-md">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wide leading-tight">Stocko</span>
              <div className="mt-1">
                {renderSingleSyncStatus()}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 -mr-2 hover:bg-white/5 rounded-xl transition-all duration-200 focus:outline-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Scrollable menu content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 lg:py-6 space-y-5 lg:space-y-7">
          {/* Connexion Link (Only if not logged in) */}
          {!user && (
            <div>
              <Link
                href="/connexion"
                className={`flex items-center gap-3 px-4 py-2 lg:py-3 rounded-xl transition-all duration-200 text-white/80 hover:text-white hover:bg-white/5 text-sm font-medium ${
                  pathname === "/connexion" ? "bg-white/10 text-white" : ""
                }`}
              >
                <Lock className="w-4 h-4 text-brand-accent" />
                <span>Connexion</span>
              </Link>
            </div>
          )}

          {/* Workspace section */}
          <div className="space-y-2">
            <div className="px-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">
              Espace de travail
            </div>
            
            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                // Active check: matches path exactly or starts with href for subpages
                const isActive = item.href === "/dashboard" 
                  ? pathname === "/dashboard" 
                  : pathname.startsWith(item.href);
                
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-2.5 lg:py-3.5 rounded-xl transition-all duration-300 ease-out text-[15px] font-semibold ${
                      isActive
                        ? "bg-brand-accent text-brand-blue shadow-lg shadow-brand-accent/20 scale-[1.02]"
                        : "text-white/70 hover:text-white hover:bg-white/5 hover:translate-x-1.5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "text-brand-blue scale-110" : "text-white/60 group-hover:text-white group-hover:scale-110"}`} />
                      <span>{item.name}</span>
                    </div>
                    
                    {item.badge && (
                      <span className={`flex items-center justify-center text-[11px] font-bold w-5 h-5 rounded-full animate-pulse-ring bg-[#D9381E] text-white`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-white/5 bg-black/15 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Circular Avatar */}
            <div className="w-10 h-10 rounded-full bg-brand-accent/25 border border-brand-accent/30 text-brand-accent flex items-center justify-center font-bold text-sm shrink-0">
              {getInitials(profile.name)}
            </div>
            
            {/* Info */}
            <div className="min-w-0">
              <div className="font-bold text-white/95 text-[14px] truncate leading-tight" title={profile.name}>
                {profile.name}
              </div>
              <div className="text-[11px] text-white/45 font-medium truncate mt-0.5" title={profile.city}>
                {profile.city}
              </div>
            </div>
          </div>
          
          {user && (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/connexion";
              }}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-transparent transition-all duration-200 ease-out active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
