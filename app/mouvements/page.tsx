"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeftRight, 
  Search, 
  Plus, 
  Minus,
  CheckCircle,
  Calendar,
  FileText,
  User,
  Package
} from "lucide-react";
import { useStock } from "@/context/StockContext";

export default function MouvementsPage() {
  const { products, movements, addMovement } = useStock();

  // Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [movementType, setMovementType] = useState<"Entrée" | "Sortie">("Sortie");
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  // UI state
  const [showDropdown, setShowDropdown] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Set default date to today (YYYY-MM-DD)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
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

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) return;

    addMovement(selectedProductId, movementType, quantity, note, date);

    // Show Success Toast
    const prodName = selectedProduct ? selectedProduct.name : "Produit";
    setSuccessMessage(`${movementType === "Entrée" ? "Approvisionnement" : "Vente"} de ${quantity} ${prodName} enregistré !`);
    
    // Reset Form
    setSelectedProductId("");
    setSearchQuery("");
    setQuantity(1);
    setNote("");
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  // Get recent 5 movements
  const recentMovements = movements.slice(0, 5);

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-5xl mx-auto flex flex-col space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <div className="text-xs font-bold tracking-widest text-[#8A7F6E] uppercase mb-1">
          Saisie au comptoir
        </div>
        <h1 className="text-3xl font-extrabold text-brand-blue flex items-center gap-2">
          Mouvement de Stock
        </h1>
        <p className="text-sm text-[#8A7F6E] mt-1 font-medium">
          Enregistrez les entrées et sorties de marchandises instantanément.
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
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-[#8A7F6E] uppercase flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Sélectionner le Produit
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F6E]" />
              <input
                required
                type="text"
                placeholder="Rechercher par nom..."
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedProductId(""); // clear selection while typing
                  setShowDropdown(true);
                }}
                className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl pl-11 pr-4 py-3 text-[15px] font-semibold text-brand-blue placeholder-[#8A7F6E]/60 focus:outline-none focus:border-brand-accent transition-colors"
              />
              {selectedProductId && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs bg-[#EDFBF3] text-[#0A8543] px-2 py-0.5 rounded font-bold border border-green-200">
                  Sélectionné
                </span>
              )}
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

          {/* Movement Type Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#8A7F6E] uppercase flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Type de flux
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMovementType("Sortie")}
                className={`py-4 rounded-xl font-bold text-[15px] transition-all duration-300 active:scale-[0.98] ${
                  movementType === "Sortie"
                    ? "bg-[#F6F0FF] text-[#6E3FF3] border-2 border-[#6E3FF3] shadow-md shadow-[#6E3FF3]/5"
                    : "bg-[#FAF6EE] text-[#8A7F6E] border border-[#E5E0D5] hover:bg-[#F0EAE0]"
                }`}
              >
                Sortie (Vente / Perte)
              </button>
              <button
                type="button"
                onClick={() => setMovementType("Entrée")}
                className={`py-4 rounded-xl font-bold text-[15px] transition-all duration-300 active:scale-[0.98] ${
                  movementType === "Entrée"
                    ? "bg-[#EDFBF3] text-[#0A8543] border-2 border-[#0A8543] shadow-md shadow-[#0A8543]/5"
                    : "bg-[#FAF6EE] text-[#8A7F6E] border border-[#E5E0D5] hover:bg-[#F0EAE0]"
                }`}
              >
                Entrée (Réapprovisionnement)
              </button>
            </div>
          </div>

          {/* Quantity Input with adjusters */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#8A7F6E] uppercase">Quantité</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustQty(-1)}
                className="w-12 h-12 bg-[#FAF6EE] hover:bg-[#F0EAE0] border border-[#E5E0D5] rounded-xl flex items-center justify-center font-bold text-brand-blue transition-colors active:scale-95 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <input
                required
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl py-3 text-center text-lg font-bold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
              />

              <button
                type="button"
                onClick={() => adjustQty(1)}
                className="w-12 h-12 bg-[#FAF6EE] hover:bg-[#F0EAE0] border border-[#E5E0D5] rounded-xl flex items-center justify-center font-bold text-brand-blue transition-colors active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quick selectors for fast tablet typing */}
            <div className="flex gap-2 pt-1.5 overflow-x-auto select-none">
              {[+5, +10, +25, +50].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => adjustQty(val)}
                  className="bg-[#FAF6EE] hover:bg-[#F0EAE0] border border-[#E5E0D5]/60 text-xs font-extrabold text-[#8A7F6E] hover:text-brand-blue px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Note Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8A7F6E] uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Date d'effet
              </label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-sm font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8A7F6E] uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Note (Client, Fournisseur...)
              </label>
              <input
                type="text"
                placeholder="Ex: Client Oumar"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-sm font-semibold text-brand-blue placeholder-[#8A7F6E]/50 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </div>

          {/* Validation Button */}
          <button
            type="submit"
            disabled={!selectedProductId}
            className={`w-full py-4 rounded-xl font-extrabold text-[15px] shadow-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${
              selectedProductId 
                ? "bg-brand-blue text-white hover:bg-[#1a2c4e] hover:shadow-md cursor-pointer" 
                : "bg-[#E5E0D5] text-[#8A7F6E]/60 cursor-not-allowed"
            }`}
          >
            Enregistrer le mouvement
          </button>
        </form>

        {/* Right Column: Recent Activity Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col animate-slide-up [animation-delay:50ms]">
            <h3 className="text-lg font-bold text-brand-blue pb-4 border-b border-[#FAF6EE] mb-4">
              Mouvements récents
            </h3>
            
            <div className="divide-y divide-[#FAF6EE] min-h-[300px]">
              {recentMovements.length > 0 ? (
                recentMovements.map((mov) => (
                  <div key={mov.id} className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      {mov.type === "Sortie" ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#F6F0FF] text-[#6E3FF3]">
                          Sortie
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#EDFBF3] text-[#0A8543]">
                          Entrée
                        </span>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-brand-blue text-sm truncate max-w-[150px]">{mov.productName}</span>
                        <span className="text-[10px] text-[#8A7F6E] font-semibold">{mov.note || "Mouvement"}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-extrabold text-sm block ${mov.type === "Sortie" ? "text-brand-blue" : "text-[#0A8543]"}`}>
                        {mov.type === "Sortie" ? `-${mov.quantity}` : `+${mov.quantity}`}
                      </span>
                      <span className="text-[9px] text-[#8A7F6E] font-medium">
                        {new Date(mov.time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-[#8A7F6E] space-y-1.5">
                  <ArrowLeftRight className="w-8 h-8 text-[#8A7F6E]/30" />
                  <span className="font-bold text-sm text-brand-blue">Aucun flux</span>
                  <span className="text-[11px]">Saisissez un mouvement pour le voir ici.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
