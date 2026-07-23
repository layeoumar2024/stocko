"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useStock } from "@/context/StockContext";
import { createSale, getLocalStockDelta } from "@/modules/ventes/ventes.service";
import { SaleInput } from "@/modules/ventes/ventes.types";
import { db } from "@/modules/sync/db";
import { 
  ShoppingBag, 
  User, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  AlertTriangle,
  CreditCard,
  Coins,
  Smartphone
} from "lucide-react";

interface CartItem {
  product_id: string;
  name: string;
  qty: number;
  unit_price: number;
  cost_price: number;
}

interface DBClient {
  id: string;
  nom: string;
  telephone?: string;
}

export default function VentesPage() {
  const { products, user, profile } = useStock();
  
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money" | "credit">("cash");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [clients, setClients] = useState<DBClient[]>([]);
  const [sortedProducts, setSortedProducts] = useState<typeof products>([]);
  const [localDeltas, setLocalDeltas] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch local stock deltas from outbox
  const refreshStockDeltas = async () => {
    try {
      const outboxItems = await db.outbox.toArray();
      const deltas: Record<string, number> = {};
      for (const item of outboxItems) {
        if (item.table === "stock_movements" && item.action === "INSERT") {
          const prodId = item.payload.product_id;
          const qty = item.payload.quantity;
          const change = item.payload.type === "Entrée" ? qty : -qty;
          deltas[prodId] = (deltas[prodId] || 0) + change;
        }
      }
      setLocalDeltas(deltas);
    } catch (err) {
      console.error("Error reading deltas:", err);
    }
  };

  // Fetch clients from Supabase (or fallback)
  useEffect(() => {
    async function loadClients() {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data, error } = await supabase
          .from("clients")
          .select("id, nom, telephone")
          .order("nom");
        if (data) {
          setClients(data);
        }
      } catch (err) {
        console.warn("Offline or failed to fetch clients:", err);
      }
    }
    loadClients();
    refreshStockDeltas();
  }, []);

  // Sort products by real sales frequency in the last 30 days (from local movements)
  useEffect(() => {
    async function sortProductsByFrequency() {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const isoString = thirtyDaysAgo.toISOString();

        // Get movements from Dexie
        const movements = await db.stock_movements
          .where("time")
          .aboveOrEqual(isoString)
          .toArray();

        const frequencies: Record<string, number> = {};
        movements.forEach((m) => {
          if (m.type === "Sortie") {
            frequencies[m.product_id] = (frequencies[m.product_id] || 0) + m.quantity;
          }
        });

        const sorted = [...products].sort((a, b) => {
          const freqA = frequencies[a.id] || 0;
          const freqB = frequencies[b.id] || 0;
          return freqB - freqA; // descending order
        });
        setSortedProducts(sorted);
      } catch (err) {
        setSortedProducts(products);
      }
    }

    if (products && products.length > 0) {
      sortProductsByFrequency();
    }
  }, [products]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return sortedProducts;
    const query = searchQuery.toLowerCase();
    return sortedProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [sortedProducts, searchQuery]);

  // Handle adding product to cart
  const addToCart = (product: typeof products[0]) => {
    // Clear message
    setMessage(null);

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product_id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [
          ...prevCart,
          {
            product_id: product.id,
            name: product.name,
            qty: 1,
            unit_price: product.sellPrice,
            cost_price: product.purchasePrice
          }
        ];
      }
    });
  };

  // Update item quantity
  const updateQty = (productId: string, val: number) => {
    if (val <= 0) {
      setCart((prev) => prev.filter((item) => item.product_id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, qty: val } : item
      )
    );
  };

  // Update item unit price (for bargaining)
  const updatePrice = (productId: string, price: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, unit_price: Math.max(0, price) } : item
      )
    );
  };

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
  }, [cart]);

  // Auto-set amount paid on cash/mobile money method changes
  useEffect(() => {
    if (paymentMethod === "cash" || paymentMethod === "mobile_money") {
      setAmountPaid(cartTotal.toString());
    } else if (paymentMethod === "credit" && !amountPaid) {
      setAmountPaid("0");
    }
  }, [paymentMethod, cartTotal]);

  // Finalize Sale Submit
  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cart.length === 0) {
      setMessage({ type: "warning", text: "Le panier est vide." });
      return;
    }

    if (paymentMethod === "credit" && !selectedCustomerId) {
      setMessage({ type: "warning", text: "Veuillez sélectionner un client pour une vente à crédit." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const parsedPaid = parseFloat(amountPaid) || 0;
    
    // Construct transaction details
    const saleInput: SaleInput = {
      customer_id: selectedCustomerId,
      payment_method: paymentMethod,
      amount_paid: paymentMethod === "credit" ? parsedPaid : cartTotal,
      items: cart.map((item) => ({
        product_id: item.product_id,
        qty: item.qty,
        unit_price: item.unit_price,
        cost_price: item.cost_price
      }))
    };

    try {
      const entreprise_id = (profile as any)?.entreprise_id || null;
      
      // Save locally in Dexie & trigger sync worker
      await createSale(saleInput, user?.id || null, entreprise_id);
      
      // Reset interface immediately
      setCart([]);
      setSelectedCustomerId(null);
      setAmountPaid("");
      setSearchQuery("");
      setSearchOpen(false);
      setMessage({ type: "success", text: "Vente enregistrée avec succès !" });
      
      // Refresh local stock deltas
      await refreshStockDeltas();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Une erreur est survenue lors de l'enregistrement de la vente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg pb-12 font-sans select-none p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Top Banner Message */}
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 border animate-slide-up ${
          message.type === "success" 
            ? "bg-[#EDFBF3] border-[#0A8543]/20 text-[#0A8543]" 
            : message.type === "warning"
            ? "bg-[#FFF8E6] border-[#B25E00]/20 text-[#B25E00]"
            : "bg-[#FFF0F0] border-[#D9381E]/20 text-[#D9381E]"
        }`}>
          {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-4 font-normal hover:opacity-75 focus:outline-none">×</button>
        </div>
      )}

      {/* Main Grid: Left (Products), Right (Cart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto items-start">
        
        {/* LEFT COLUMN: Products Grid */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-brand-blue tracking-tight">Vente Rapide</h1>
              <p className="text-xs text-[#8A7F6E]">Tapez sur un produit pour l'ajouter au panier.</p>
            </div>
            
            {/* Secondary Search Button */}
            <button
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (searchOpen) setSearchQuery("");
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                searchOpen 
                  ? "bg-brand-accent border-brand-accent/25 text-[#111E35]" 
                  : "bg-white border-[#E5E0D5]/70 text-[#8A7F6E] hover:border-brand-accent/20 hover:shadow-sm"
              }`}
              aria-label="Rechercher un produit"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Search Field (Hidden by default) */}
          {searchOpen && (
            <div className="relative animate-slide-up">
              <input
                type="text"
                placeholder="Rechercher par nom, catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5E0D5]/80 rounded-xl pl-11 pr-4 py-3.5 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors shadow-sm"
                autoFocus
              />
              <Search className="w-4 h-4 text-[#8A7F6E] absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              // Calculate actual local stock including outbox deltas
              const currentStock = product.stock + (localDeltas[product.id] || 0);
              const isLow = currentStock <= product.threshold;
              const isCritical = currentStock <= product.threshold / 2;

              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white border border-[#E5E0D5]/65 rounded-xl p-4 flex flex-col justify-between text-left hover:border-brand-accent/30 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer min-h-[110px] min-w-[100px] h-full"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-brand-blue line-clamp-2 leading-snug">
                      {product.name}
                    </p>
                    <span className="inline-block text-[10px] font-bold text-[#8A7F6E] bg-[#FAF6EE] px-2 py-0.5 rounded-md">
                      {product.category}
                    </span>
                  </div>

                  <div className="flex items-end justify-between mt-3 pt-2 border-t border-[#FAF6EE]">
                    <span className="text-xs font-extrabold text-brand-blue">
                      {product.sellPrice} F
                    </span>

                    {/* Stock indicator badge */}
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      isCritical 
                        ? "bg-[#FFF0F0] text-[#D9381E]" 
                        : isLow 
                        ? "bg-[#FFF8E6] text-[#B25E00]" 
                        : "bg-[#EDFBF3] text-[#0A8543]"
                    }`}>
                      {currentStock}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="bg-white border border-[#E5E0D5]/50 rounded-2xl p-8 text-center text-xs text-[#8A7F6E]">
              Aucun produit trouvé.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Cart & Checkout Panel */}
        <div className="lg:col-span-5 bg-white border border-[#E5E0D5]/65 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Panel Header */}
          <div className="p-4 border-b border-[#FAF6EE] flex items-center justify-between bg-[#FAF6EE]/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-blue" />
              <span className="font-extrabold text-[#111E35]">Panier</span>
            </div>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])} 
                className="text-xs text-[#D9381E] font-bold hover:underline focus:outline-none flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vider
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3 max-h-[300px] lg:max-h-[400px]">
            {cart.map((item) => {
              const product = products.find(p => p.id === item.product_id);
              const currentStock = product ? product.stock + (localDeltas[item.product_id] || 0) : 0;
              const isInsufficient = currentStock < item.qty;

              return (
                <div 
                  key={item.product_id} 
                  className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                    isInsufficient 
                      ? "bg-[#FFF8E6] border-[#B25E00]/25" 
                      : "bg-[#FAF6EE]/30 border-[#E5E0D5]/50 hover:bg-[#FAF6EE]/50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-brand-blue line-clamp-1">{item.name}</p>
                      {isInsufficient && (
                        <p className="text-[10px] font-extrabold text-[#B25E00] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Stock insuffisant ({currentStock} dispo)
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => updateQty(item.product_id, 0)}
                      className="text-[#8A7F6E] hover:text-[#D9381E] transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#FAF6EE]">
                    {/* Bargain / Unit price Input */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-[#8A7F6E]">Prix:</span>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updatePrice(item.product_id, parseInt(e.target.value) || 0)}
                        className="w-18 bg-white border border-[#E5E0D5] rounded-md px-1.5 py-0.5 text-xs font-bold text-brand-blue text-center focus:outline-none focus:border-brand-accent"
                      />
                      <span className="text-[10px] font-bold text-[#8A7F6E]">F</span>
                    </div>

                    {/* Quantity controls (Target size min 48px combined) */}
                    <div className="flex items-center border border-[#E5E0D5] bg-white rounded-lg overflow-hidden h-9">
                      <button
                        onClick={() => updateQty(item.product_id, item.qty - 1)}
                        className="px-2.5 hover:bg-[#FAF6EE] text-brand-blue transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-brand-blue min-w-[20px] text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.product_id, item.qty + 1)}
                        className="px-2.5 hover:bg-[#FAF6EE] text-brand-blue transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-[#8A7F6E] space-y-2">
                <ShoppingBag className="w-8 h-8 opacity-25 text-brand-blue" />
                <p>Votre panier est vide.</p>
              </div>
            )}
          </div>

          {/* Checkout Area */}
          {cart.length > 0 && (
            <div className="p-4 bg-[#FAF6EE]/50 border-t border-[#E5E0D5]/50 space-y-4">
              
              {/* Total Display */}
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-[#8A7F6E]">TOTAL</span>
                <span className="text-2xl font-black text-brand-blue tracking-tight">
                  {cartTotal} F
                </span>
              </div>

              {/* Payment Methods Tabs (3 side-by-side buttons) */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1 font-bold text-[11px] transition-all cursor-pointer ${
                    paymentMethod === "cash"
                      ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                      : "bg-white text-brand-blue border-[#E5E0D5] hover:bg-brand-blue/5"
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Espèces</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("mobile_money")}
                  className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1 font-bold text-[11px] transition-all cursor-pointer ${
                    paymentMethod === "mobile_money"
                      ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                      : "bg-white text-brand-blue border-[#E5E0D5] hover:bg-brand-blue/5"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>M-Money</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("credit")}
                  className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1 font-bold text-[11px] transition-all cursor-pointer ${
                    paymentMethod === "credit"
                      ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                      : "bg-white text-brand-blue border-[#E5E0D5] hover:bg-brand-blue/5"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Crédit</span>
                </button>
              </div>

              {/* Dynamic Customer / Amount Paid inputs */}
              <div className="space-y-3 pt-2">
                {/* Client Selector (Visible always, but critical for 'credit') */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-[#8A7F6E] uppercase flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Client {paymentMethod === "credit" && <span className="text-[#D9381E]">*</span>}
                  </label>
                  <select
                    value={selectedCustomerId || ""}
                    onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                    className="w-full bg-white border border-[#E5E0D5] rounded-xl px-3 py-2 text-xs font-semibold text-brand-blue focus:outline-none focus:border-brand-accent"
                  >
                    <option value="">-- Client de passage (Anonyme) --</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.nom} {client.telephone ? `(${client.telephone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount Paid input (only for Credit to specify partial payment / deposit) */}
                {paymentMethod === "credit" && (
                  <div className="space-y-1 animate-slide-up">
                    <label className="text-[10px] font-extrabold text-[#8A7F6E] uppercase">
                      Montant Acompte (Payé)
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 500"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full bg-white border border-[#E5E0D5] rounded-xl px-3 py-2 text-xs font-semibold text-brand-blue focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                )}
              </div>

              {/* Final Validation Button (Target size min 48px) */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-brand-accent hover:bg-brand-accent-hover text-brand-blue py-3.5 rounded-xl font-extrabold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:bg-[#E5E0D5]/50 disabled:cursor-not-allowed min-h-[48px]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Enregistrer la Vente</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
