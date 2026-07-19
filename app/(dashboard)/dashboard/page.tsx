"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";

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
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle, 
  Calendar,
  X,
  Package,
  Layers,
  ArrowLeftRight
} from "lucide-react";
import { useStock, InsufficientStockError } from "@/context/StockContext";

const formatRelativeTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays} j`;
  } catch (e) {
    return isoString;
  }
};

const formatWeekdayFrench = (date: Date) => {
  const weekdays = [
    "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"
  ];
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin", 
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];
  const weekday = weekdays[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${weekday} ${day} ${month}`;
};

const formatDateFrench = (date: Date) => {
  const day = date.getDate();
  const year = date.getFullYear();
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const month = months[date.getMonth()];
  return `${day} ${month} ${year}`;
};

export default function Home() {
  const { products, movements, addProduct, addMovement, profile, syncStatus } = useStock();
  const [mounted, setMounted] = useState(false);
  const [validationError, setValidationError] = useState<{
    productName: string;
    availableStock: number;
    requestedQty: number;
    missingQty: number;
  } | null>(null);

  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineStatusSnapshot,
    getOnlineStatusServerSnapshot
  );

  const renderConnectionStatus = () => {
    if (isOnline) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EDFBF3] text-[#0A8543] border border-[#0A8543]/20 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0A8543]" />
          En ligne
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF0F0] text-[#D9381E] border border-[#D9381E]/20 shadow-xs animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9381E]" />
          Hors ligne
        </span>
      );
    }
  };

  const renderSyncStatusBadge = () => {
    switch (syncStatus) {
      case "synced":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EDFBF3] text-[#0A8543] border border-[#0A8543]/20 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A8543]" />
            Synchronisé
          </span>
        );
      case "syncing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF8E6] text-[#B25E00] border border-[#B25E00]/20 shadow-xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B25E00]" />
            Sync en cours...
          </span>
        );
      case "offline-pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF0F0] text-[#D9381E] border border-[#D9381E]/20 shadow-xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9381E]" />
            Hors ligne (Attente)
          </span>
        );
      case "offline":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF0F0] text-[#D9381E] border border-[#D9381E]/20 shadow-xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9381E]" />
            Hors ligne
          </span>
        );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Derived stats
  const totalProducts = products.length;
  const stockValue = products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0);
  const alertsCount = products.filter((p) => p.stock <= p.threshold).length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMovs = movements.filter((m) => new Date(m.time) >= todayStart);
  const todayMovements = todayMovs.length;
  const todaySorties = todayMovs.filter((m) => m.type === "Sortie").length;
  const todayEntrees = todayMovs.filter((m) => m.type === "Entrée").length;

  // Modals state
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Form states
  const [newMovement, setNewMovement] = useState({
    productId: "",
    type: "Sortie" as "Entrée" | "Sortie",
    quantity: "",
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    stock: "",
    threshold: "",
    unit: "pièces",
    purchasePrice: "",
  });

  // Handlers
  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovement.productId || !newMovement.quantity) return;

    const qty = parseInt(newMovement.quantity);

    try {
      await addMovement(newMovement.productId, newMovement.type, qty, "Saisie rapide Dashboard");
      setIsMovementModalOpen(false);
      setNewMovement({ productId: "", type: "Sortie", quantity: "" });
      setValidationError(null);
    } catch (err: unknown) {
      const isStockError = err instanceof InsufficientStockError || 
        (err instanceof Error && err.name === "InsufficientStockError") ||
        (err && typeof err === "object" && (err as any).isInsufficientStockError === true);

      if (isStockError) {
        const stockErr = err as any;
        setIsMovementModalOpen(false);
        setValidationError({
          productName: stockErr.productName,
          availableStock: stockErr.availableStock,
          requestedQty: stockErr.requestedQty,
          missingQty: stockErr.missingQty,
        });
      } else {
        console.error("Erreur de mouvement:", err);
      }
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.stock || !newProduct.threshold) return;

    const stockVal = parseInt(newProduct.stock);
    const thresholdVal = parseInt(newProduct.threshold);
    const priceVal = parseInt(newProduct.purchasePrice || "0");
    const sellVal = Math.round(priceVal * 1.15); // default 15% markup

    addProduct({
      name: newProduct.name,
      stock: stockVal,
      threshold: thresholdVal,
      unit: newProduct.unit,
      category: "Divers",
      purchasePrice: priceVal,
      sellPrice: sellVal,
    });

    setIsProductModalOpen(false);
    setNewProduct({ name: "", stock: "", threshold: "", unit: "pièces", purchasePrice: "" });
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto flex flex-col space-y-10">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-[#8A7F6E] uppercase mb-1">
            Vue d'ensemble
          </div>
          <h1 className="text-3xl font-extrabold text-brand-blue flex flex-wrap items-center gap-2">
            Bonjour, {profile.userName} <span className="animate-wiggle inline-block">👋</span>
            {mounted && (
              <span className="inline-flex items-center gap-2 ml-1">
                {renderConnectionStatus()}
                {renderSyncStatusBadge()}
              </span>
            )}
          </h1>
          <p className="text-sm text-[#8A7F6E] mt-1 font-medium">
            Voici l'état de votre stock aujourd'hui{mounted ? `, ${formatWeekdayFrench(new Date())}` : ""}.
          </p>
        </div>

        {/* Date Selector Badge */}
        <div className="flex items-center gap-2 bg-[#F0EAE0]/50 border border-[#E5E0D5] px-4 py-2 rounded-xl text-sm font-semibold text-brand-blue/80 self-start md:self-auto">
          <Calendar className="w-4 h-4 text-[#8A7F6E]" />
          <span>{mounted ? formatDateFrench(new Date()) : "..."}</span>
        </div>
      </div>

      {/* Grid of 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Produits en stock */}
        <div className="animate-slide-up bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-brand-accent/20 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer">
          <div>
            <div className="text-sm font-bold text-[#8A7F6E]">Produits en stock</div>
            <div className="text-3xl font-extrabold text-brand-blue mt-2">{totalProducts}</div>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0A8543] mt-4">
            <TrendingUp className="w-4 h-4" />
            <span>+4 cette semaine</span>
          </div>
        </div>

        {/* Card 2: Valeur du stock */}
        <div className="animate-slide-up [animation-delay:50ms] bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-brand-accent/20 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer">
          <div>
            <div className="text-sm font-bold text-[#8A7F6E]">Valeur du stock</div>
            <div className="text-3xl font-extrabold text-brand-blue mt-2">
              {stockValue.toLocaleString("fr-FR")} F
            </div>
          </div>
          <div className="text-xs text-[#8A7F6E] mt-4 font-semibold">
            Actif net valorisé
          </div>
        </div>

        {/* Card 3: Alertes rupture */}
        <div className="animate-slide-up [animation-delay:100ms] bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-brand-accent/20 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer">
          <div>
            <div className="text-sm font-bold text-[#8A7F6E]">Alertes rupture</div>
            <div className="text-3xl font-extrabold text-[#D9381E] mt-2">{alertsCount}</div>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[#D9381E] mt-4">
            <AlertCircle className="w-4 h-4 animate-pulse" />
            <span>à traiter</span>
          </div>
        </div>

        {/* Card 4: Mouvements aujourd'hui */}
        <div className="animate-slide-up [animation-delay:150ms] bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-brand-accent/20 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer">
          <div>
            <div className="text-sm font-bold text-[#8A7F6E]">Mouvements aujourd'hui</div>
            <div className="text-3xl font-extrabold text-brand-blue mt-2">{todayMovements}</div>
          </div>
          <div className="text-sm font-semibold text-[#8A7F6E] mt-4">
            <span className="text-[#6E3FF3]">{todaySorties} sorties</span>
            {" · "}
            <span className="text-[#0A8543]">{todayEntrees} entrées</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Column 1: Produits à surveiller */}
        <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-[#FAF6EE] mb-2">
            <h2 className="text-lg font-bold text-brand-blue">Produits à surveiller</h2>
            <Link href="/alertes" className="text-xs font-bold text-[#8A7F6E] hover:text-brand-blue flex items-center gap-1 transition-colors">
              Voir tout →
            </Link>
          </div>

          <div className="flex-1 divide-y divide-[#FAF6EE]">
            {products.map((prod) => (
              <div key={prod.id} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-[#FAF6EE]/50 hover:translate-x-1.5 transition-all duration-300 ease-out cursor-pointer">
                <span className="font-semibold text-brand-blue text-[15px]">{prod.name}</span>
                
                {prod.status === "critical" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF0F0] text-[#D9381E] shadow-xs">
                    {prod.stock} {prod.unit} restantes
                  </span>
                )}
                {prod.status === "low" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF8E6] text-[#B25E00] shadow-xs">
                    {prod.stock} {prod.unit} restantes
                  </span>
                )}
                {prod.status === "stable" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EDFBF3] text-[#0A8543] shadow-xs">
                    {prod.stock} {prod.unit} — stable
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons at bottom */}
          <div className="mt-8 pt-4 border-t border-[#FAF6EE] flex flex-wrap gap-4">
            <button
              onClick={() => setIsMovementModalOpen(true)}
              className="group flex-1 min-w-[160px] bg-brand-blue text-white px-5 py-3.5 rounded-xl font-bold text-[14px] hover:bg-[#1a2c4e] hover:shadow-md transition-all duration-200 ease-out active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
              Nouveau mouvement
            </button>
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="group flex-1 min-w-[160px] bg-white border-2 border-brand-blue text-brand-blue px-5 py-3 rounded-xl font-bold text-[14px] hover:bg-brand-blue/5 hover:shadow-sm transition-all duration-200 ease-out active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
              Ajouter un produit
            </button>
          </div>
        </div>

        {/* Column 2: Activité récente */}
        <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col h-full">
          <div className="pb-4 border-b border-[#FAF6EE] mb-2">
            <h2 className="text-lg font-bold text-brand-blue">Activité récente</h2>
          </div>

          <div className="flex-1 divide-y divide-[#FAF6EE]">
            {movements.map((mov) => (
              <div key={mov.id} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-[#FAF6EE]/50 hover:translate-x-1.5 transition-all duration-300 ease-out cursor-pointer">
                <div className="flex items-center gap-3">
                  {mov.type === "Sortie" ? (
                    <span className="px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#F6F0FF] text-[#6E3FF3] shadow-xs">
                      Sortie
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#EDFBF3] text-[#0A8543] shadow-xs">
                      Entrée
                    </span>
                  )}
                  <div className="flex flex-col">
                    <span className="font-semibold text-brand-blue text-[15px]">{mov.productName}</span>
                    <span className="text-[11px] text-[#8A7F6E] font-medium">{formatRelativeTime(mov.time)}</span>
                  </div>
                </div>

                <span className={`font-bold text-[16px] ${mov.type === "Sortie" ? "text-brand-blue" : "text-[#0A8543]"}`}>
                  {mov.type === "Sortie" ? `-${mov.quantity}` : `+${mov.quantity}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL 1: Nouveau Mouvement */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#E5E0D5] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-[#FAF6EE] flex items-center justify-between bg-[#FAF6EE]/50">
              <h3 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-brand-accent" />
                Nouveau mouvement
              </h3>
              <button 
                onClick={() => setIsMovementModalOpen(false)}
                className="text-[#8A7F6E] hover:text-brand-blue transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMovement} className="p-6 space-y-4">
              {/* Product Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8A7F6E] uppercase">Produit</label>
                <select
                  required
                  value={newMovement.productId}
                  onChange={(e) => setNewMovement({ ...newMovement, productId: e.target.value })}
                  className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                >
                  <option value="">Sélectionner un produit...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock actuel : {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8A7F6E] uppercase">Type de mouvement</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewMovement({ ...newMovement, type: "Sortie" })}
                    className={`py-3 rounded-xl font-bold text-sm transition-all duration-150 ${
                      newMovement.type === "Sortie"
                        ? "bg-[#F6F0FF] text-[#6E3FF3] ring-2 ring-[#6E3FF3]"
                        : "bg-[#FAF6EE] text-[#8A7F6E] border border-[#E5E0D5]"
                    }`}
                  >
                    Sortie (Vente / Casse)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMovement({ ...newMovement, type: "Entrée" })}
                    className={`py-3 rounded-xl font-bold text-sm transition-all duration-150 ${
                      newMovement.type === "Entrée"
                        ? "bg-[#EDFBF3] text-[#0A8543] ring-2 ring-[#0A8543]"
                        : "bg-[#FAF6EE] text-[#8A7F6E] border border-[#E5E0D5]"
                    }`}
                  >
                    Entrée (Approvisionnement)
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8A7F6E] uppercase">Quantité</label>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="Ex: 5"
                  value={newMovement.quantity}
                  onChange={(e) => setNewMovement({ ...newMovement, quantity: e.target.value })}
                  className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="flex-1 bg-[#FAF6EE] hover:bg-[#F0EAE0] text-[#8A7F6E] py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Ajouter un Produit */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#E5E0D5] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-[#FAF6EE] flex items-center justify-between bg-[#FAF6EE]/50">
              <h3 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-accent" />
                Ajouter un produit
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="text-[#8A7F6E] hover:text-brand-blue transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8A7F6E] uppercase">Nom du produit</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Sucre Blond 50kg"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Unit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Unité de mesure</label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  >
                    <option value="sacs">sacs</option>
                    <option value="bidons">bidons</option>
                    <option value="cartons">cartons</option>
                    <option value="pièces">pièces</option>
                    <option value="kg">kg</option>
                  </select>
                </div>

                {/* Purchase price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Prix d'achat (F)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 15000"
                    value={newProduct.purchasePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: e.target.value })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Initial stock */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Stock initial</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Ex: 50"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>

                {/* Stock alert threshold */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Seuil d'alerte</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Ex: 10"
                    value={newProduct.threshold}
                    onChange={(e) => setNewProduct({ ...newProduct, threshold: e.target.value })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 bg-[#FAF6EE] hover:bg-[#F0EAE0] text-[#8A7F6E] py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {validationError && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#E5E0D5] rounded-2xl shadow-2xl w-full max-w-md animate-slide-up flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-3 text-[#D9381E] mb-2">
                <AlertCircle className="w-6 h-6 text-[#D9381E] shrink-0" />
                <h3 className="text-base font-bold">Opération impossible : le stock disponible est insuffisant.</h3>
              </div>
              <div className="space-y-2.5 text-sm text-brand-blue/80 font-medium bg-[#FAF6EE] p-4 rounded-xl border border-[#E5E0D5]/50">
                <div><strong>Produit concerné :</strong> {validationError.productName}</div>
                <div><strong>Stock disponible :</strong> {validationError.availableStock}</div>
                <div><strong>Quantité demandée :</strong> {validationError.requestedQty}</div>
                <div className="text-[#D9381E]"><strong>Quantité manquante :</strong> {validationError.missingQty}</div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setValidationError(null)}
                  className="bg-brand-blue text-white px-5 py-2.5 rounded-xl font-bold text-[14px] hover:bg-[#1a2c4e] transition-all active:scale-[0.97] cursor-pointer w-full sm:w-auto"
                >
                  Fermer et Ajuster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
