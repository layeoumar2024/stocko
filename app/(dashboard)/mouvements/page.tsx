"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeftRight, 
  Search, 
  Plus, 
  Minus,
  CheckCircle,
  Calendar,
  FileText,
  User,
  Package,
  AlertCircle,
  X,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Check
} from "lucide-react";
import { useStock, InsufficientStockError } from "@/context/StockContext";

export default function MouvementsPage() {
  const { products, movements, addMovement } = useStock();

  // Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [movementType, setMovementType] = useState<"Entrée" | "Sortie">("Sortie");
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  // UI state
  const [showDropdown, setShowDropdown] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationError, setValidationError] = useState<{
    productName: string;
    availableStock: number;
    requestedQty: number;
    missingQty: number;
  } | null>(null);

  // Set default date to today (YYYY-MM-DD)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const timer = setTimeout(() => {
      setDate(today);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Filter products for autocomplete selection
  const searchedProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Quick increment/decrement helper
  const adjustQty = (amount: number) => {
    setQuantity((prev) => Math.max(1, prev + amount));
  };

  const handleSelectProduct = (id: string, name: string) => {
    setSelectedProductId(id);
    setSearchQuery(name);
    setShowDropdown(false);
  };

  // Submit Handler - intercept to show confirmation first
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) return;
    setShowConfirmModal(true);
  };

  // Actual Save Handler
  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    try {
      await addMovement(selectedProductId, movementType, quantity, note, date);

      // Show Success Toast
      const prodName = selectedProduct ? selectedProduct.name : "Produit";
      setSuccessMessage(`${movementType === "Entrée" ? "Approvisionnement" : "Vente"} de ${quantity} ${prodName} enregistré !`);
      setValidationError(null);
      
      // Reset Form
      setSelectedProductId("");
      setSearchQuery("");
      setQuantity(1);
      setNote("");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: unknown) {
      const isStockError = err instanceof InsufficientStockError || 
        (err instanceof Error && err.name === "InsufficientStockError") ||
        (err && typeof err === "object" && (err as any).isInsufficientStockError === true);

      if (isStockError) {
        const stockErr = err as any;
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

  // Get recent 5 movements
  const recentMovements = movements.slice(0, 5);

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-6xl mx-auto flex flex-col space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <div className="text-xs font-bold tracking-widest text-[#8A7F6E] uppercase mb-1">
          Gestion du stock
        </div>
        <h1 className="text-3xl font-extrabold text-brand-blue flex items-center gap-2">
          Nouveau mouvement
        </h1>
        <p className="text-sm text-[#8A7F6E] mt-1 font-medium">
          Enregistrez une entrée ou une sortie de marchandise.
        </p>
      </div>

      {/* Success Notification Toast */}
      {successMessage && (
        <div className="bg-[#EDFBF3] border border-green-200 text-[#0A8543] p-4 rounded-xl font-bold text-sm flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle className="w-5 h-5 text-[#0A8543] animate-bounce" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Two Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Left Column: Form (3 cols) */}
        <form 
          onSubmit={handleSubmit} 
          className="lg:col-span-3 bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm space-y-6 animate-slide-up"
        >
          {/* Product Autocomplete Selection */}
          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-[#8A7F6E] uppercase flex items-center gap-1.5 select-none">
              <Package className="w-3.5 h-3.5 text-[#8A7F6E]" />
              Produit
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F6E]" />
              <input
                required
                type="text"
                placeholder="Rechercher par nom ou référence"
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedProductId(""); // clear selection while typing
                  setShowDropdown(true);
                }}
                className="w-full bg-white border border-[#E5E0D5] rounded-xl pl-11 pr-24 py-3.5 text-[15px] font-semibold text-brand-blue placeholder-[#8A7F6E]/50 focus:outline-none focus:border-brand-accent transition-colors"
              />
              {selectedProductId ? (
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedProductId("");
                    setSearchQuery("");
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-blue font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Changer
                </button>
              ) : null}
            </div>

            {/* Dropdown list of matching products */}
            {showDropdown && searchQuery.length >= 0 && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E5E0D5] rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-[#FAF6EE]">
                  {searchedProducts.length > 0 ? (
                    searchedProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p.id, p.name)}
                        className="w-full text-left px-4 py-3 hover:bg-[#FAF6EE] text-[14px] font-semibold text-brand-blue flex justify-between items-center transition-colors"
                      >
                        <span>{p.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          p.status === "critical" ? "bg-[#FFF0F0] text-[#D9381E]" :
                          p.status === "low" ? "bg-[#FFF8E6] text-[#B25E00]" :
                          "bg-[#EDFBF3] text-[#0A8543]"
                        }`}>
                          Stock: {p.stock} {p.unit}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3.5 text-xs text-[#8A7F6E] font-medium">Aucun produit ne correspond.</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Type de flux */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#8A7F6E] uppercase flex items-center gap-1.5 select-none">
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#8A7F6E]" />
              Type de flux
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Sortie */}
              <button
                type="button"
                onClick={() => setMovementType("Sortie")}
                className={`flex flex-col items-center justify-center py-4 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  movementType === "Sortie"
                    ? "bg-[#FFF0F0] text-[#D9381E] border-2 border-[#D9381E] ring-1 ring-[#D9381E]/20"
                    : "bg-white text-brand-blue border border-[#E5E0D5] hover:bg-[#FAF6EE]/50"
                }`}
              >
                <ArrowDownRight className="w-5 h-5 mb-1" />
                <span className="font-bold text-[15px]">Sortie</span>
                <span className="text-[11px] opacity-75 font-semibold mt-0.5">Vente, perte</span>
              </button>
              {/* Entrée */}
              <button
                type="button"
                onClick={() => setMovementType("Entrée")}
                className={`flex flex-col items-center justify-center py-4 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  movementType === "Entrée"
                    ? "bg-[#EDFBF3] text-[#0A8543] border-2 border-[#0A8543] ring-1 ring-[#0A8543]/20"
                    : "bg-white text-brand-blue border border-[#E5E0D5] hover:bg-[#FAF6EE]/50"
                }`}
              >
                <ArrowUpRight className="w-5 h-5 mb-1" />
                <span className="font-bold text-[15px]">Entrée</span>
                <span className="text-[11px] opacity-75 font-semibold mt-0.5">Réapprovisionnement</span>
              </button>
            </div>
          </div>

          {/* Quantité */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#8A7F6E] uppercase select-none">Quantité</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustQty(-1)}
                className="w-14 h-14 bg-white hover:bg-[#FAF6EE] border border-[#E5E0D5] text-brand-blue font-bold rounded-xl flex items-center justify-center cursor-pointer transition-colors select-none shadow-xs active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <div className="flex-1 bg-white border border-[#E5E0D5] rounded-xl flex items-center justify-between px-6 h-14 focus-within:border-brand-accent transition-colors">
                <input
                  required
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center text-xl font-extrabold text-brand-blue bg-transparent focus:outline-none"
                />
                <span className="flex items-center gap-1 border-l border-[#E5E0D5] pl-4 text-xs font-semibold text-[#8A7F6E] uppercase select-none whitespace-nowrap h-5">
                  {selectedProduct?.unit || "unités"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => adjustQty(1)}
                className="w-14 h-14 bg-white hover:bg-[#FAF6EE] border border-[#E5E0D5] text-brand-blue font-bold rounded-xl flex items-center justify-center cursor-pointer transition-colors select-none shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quick selectors */}
            <div className="flex gap-2 pt-1.5 overflow-x-auto select-none">
              {[5, 10, 25, 50].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => adjustQty(val)}
                  className="bg-[#FAF6EE] hover:bg-[#F0EAE0] border border-[#E5E0D5]/60 text-xs font-extrabold text-[#8A7F6E] hover:text-brand-blue px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion collapsible details section */}
          <div className="border-t border-[#FAF6EE] pt-4">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between py-2 text-sm font-bold text-[#8A7F6E] hover:text-brand-blue transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Date, note et détails
              </span>
            </button>

            {showDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 animate-slide-up">
                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8A7F6E]" />
                    Date d'effet
                  </label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3.5 text-sm font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>

                {/* Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#8A7F6E]" />
                    Note (Client, Fournisseur...)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Client Oumar"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3.5 text-sm font-semibold text-brand-blue placeholder-[#8A7F6E]/50 focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Validation Button */}
          <div>
            <button
              type="submit"
              disabled={!selectedProductId}
              className={`w-full py-4 rounded-xl font-extrabold text-[15px] shadow-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${
                selectedProductId 
                  ? "bg-brand-blue text-white hover:bg-[#1a2c4e] hover:shadow-md cursor-pointer" 
                  : "bg-[#EAE5D9] text-[#8A7F6E]/55 cursor-not-allowed border border-[#E5E0D5]/50"
              }`}
            >
              <Check className="w-4 h-4" />
              Enregistrer le mouvement
            </button>
            {!selectedProductId && (
              <div className="text-center text-[13px] text-[#8A7F6E] font-medium mt-3 select-none">
                Sélectionnez d'abord un produit
              </div>
            )}
          </div>
        </form>

        {/* Right Column: Recent Activity Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full animate-slide-up [animation-delay:50ms]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#FAF6EE] mb-4">
                <h3 className="text-base sm:text-lg font-bold text-brand-blue">
                  Mouvements récents
                </h3>
                <Link href="/mouvements" className="text-xs font-bold text-[#8A7F6E] hover:text-brand-blue flex items-center gap-1 transition-colors">
                  Historique →
                </Link>
              </div>

              <div className="text-[10px] font-bold text-[#8A7F6E]/80 tracking-wider mb-3 select-none uppercase">
                Aujourd'hui
              </div>
              
              <div className="divide-y divide-[#FAF6EE]">
                {recentMovements.length > 0 ? (
                  recentMovements.map((mov) => {
                    const timeStr = new Date(mov.time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                    const userStr = mov.user || "Oumar";
                    const noteStr = mov.note || (mov.type === "Sortie" ? "Vente comptoir" : "Livraison");

                    return (
                      <div key={mov.id} className="flex items-center justify-between py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Circular arrow badges */}
                          {mov.type === "Sortie" ? (
                            <div className="w-9 h-9 rounded-full bg-[#FFF0F0] text-[#D9381E] flex items-center justify-center shrink-0 shadow-xs">
                              <ArrowDownRight className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#EDFBF3] text-[#0A8543] flex items-center justify-center shrink-0 shadow-xs">
                              <ArrowUpRight className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-brand-blue text-sm truncate max-w-[170px]">{mov.productName}</span>
                            <span className="text-[10px] text-[#8A7F6E] font-semibold mt-0.5 truncate max-w-[200px]">
                              {mov.type} · {timeStr} · {userStr} · {noteStr}
                            </span>
                          </div>
                        </div>

                        <span className={`font-extrabold text-[15px] block pl-2 shrink-0 ${mov.type === "Sortie" ? "text-[#D9381E]" : "text-[#0A8543]"}`}>
                          {mov.type === "Sortie" ? `-${mov.quantity}` : `+${mov.quantity}`}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-[#8A7F6E] space-y-1.5">
                    <ArrowLeftRight className="w-8 h-8 text-[#8A7F6E]/30" />
                    <span className="font-bold text-sm text-brand-blue">Aucun flux</span>
                    <span className="text-[11px]">Saisissez un mouvement pour le voir ici.</span>
                  </div>
                )}
              </div>
            </div>

            {recentMovements.length > 0 && (
              <div className="text-center pt-4 border-t border-[#FAF6EE] mt-6">
                <Link href="/mouvements" className="text-xs font-bold text-brand-blue/70 hover:text-brand-blue transition-colors">
                  Voir les {movements.length} mouvements de la semaine
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in animate-duration-200">
          <div className="bg-white border border-[#E5E0D5] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#FAF6EE] flex items-center justify-between bg-[#FAF6EE]/50">
              <h3 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-brand-accent animate-pulse" />
                Confirmer le mouvement
              </h3>
              <button 
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-[#8A7F6E] hover:text-brand-blue transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-brand-blue/80 font-medium">
                Êtes-vous sûr de vouloir enregistrer ce mouvement de stock ?
              </p>
              
              <div className="bg-[#FAF6EE] border border-[#E5E0D5]/50 rounded-xl p-4 space-y-2.5 text-sm font-semibold text-brand-blue">
                <div><span className="text-[#8A7F6E]">Produit :</span> {selectedProduct?.name}</div>
                <div>
                  <span className="text-[#8A7F6E]">Type de flux :</span>{" "}
                  {movementType === "Entrée" ? (
                    <span className="text-[#0A8543]">Entrée (Réapprovisionnement)</span>
                  ) : (
                    <span className="text-[#6E3FF3]">Sortie (Vente / Perte)</span>
                  )}
                </div>
                <div><span className="text-[#8A7F6E]">Quantité :</span> {quantity} {selectedProduct?.unit || "pièces"}</div>
                {note && <div><span className="text-[#8A7F6E]">Note :</span> {note}</div>}
                {date && <div><span className="text-[#8A7F6E]">Date d'effet :</span> {date}</div>}
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-[#FAF6EE] hover:bg-[#F0EAE0] text-[#8A7F6E] py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="flex-1 bg-brand-blue hover:bg-[#1a2c4e] text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97] cursor-pointer"
                >
                  Confirmer
                </button>
              </div>
            </div>
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
