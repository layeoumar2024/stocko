"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  Send, 
  MessageSquare, 
  CheckCircle,
  X,
  Package,
  ArrowRight,
  TrendingDown,
  ShoppingBag,
  Plus,
  Minus,
  EyeOff,
  Printer,
  ChevronRight,
  Clock,
  Sparkles
} from "lucide-react";
import { useStock, Product, Movement } from "@/context/StockContext";

export default function AlertesPage() {
  const { products, movements, addMovement, profile } = useStock();

  // Session state to ignore alerts temporarily
  const [ignoredProductIds, setIgnoredProductIds] = useState<string[]>([]);
  
  // Custom quantities adjusted by user
  const [customOrderQuantities, setCustomOrderQuantities] = useState<Record<string, number>>({});

  // Filter active alerts (stock <= threshold) and not ignored
  const activeAlerts = products.filter(
    (p) => p.stock <= p.threshold && !ignoredProductIds.includes(p.id)
  );

  // Define critical (<= 40% threshold) and low alerts (> 40% and <= threshold)
  const isCritical = (p: Product) => p.stock <= p.threshold * 0.4;
  const isLow = (p: Product) => p.stock > p.threshold * 0.4 && p.stock <= p.threshold;

  const criticalProducts = activeAlerts.filter(isCritical);
  const lowProducts = activeAlerts.filter(isLow);

  // Tab Filtering state: "all" | "critical" | "low"
  const [activeTab, setActiveTab] = useState<"all" | "critical" | "low">("all");

  // Selected action states for modals
  const [selectedProductForInput, setSelectedProductForInput] = useState<Product | null>(null);
  const [quickInputQty, setQuickInputQty] = useState<number>(0);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Helper to determine extra design information (code) deteministically
  const getProductExtraInfo = (prod: Product) => {
    const nameLower = prod.name.toLowerCase();
    if (nameLower.includes("sucre")) {
      return { code: "SUC-010" };
    }
    if (nameLower.includes("eau")) {
      return { code: "EAU-015" };
    }
    if (nameLower.includes("huile")) {
      return { code: "HUI-022" };
    }
    if (nameLower.includes("riz")) {
      return { code: "RIZ-004" };
    }
    if (nameLower.includes("savon")) {
      return { code: "SAV-088" };
    }
    
    // Deterministic fallback based on id
    const prefix = prod.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "PRD");
    const num = Math.abs(prod.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) * 17) % 900 + 100;
    return {
      code: `${prefix}-${num}`
    };
  };

  // Helper for dynamic consumption, coverage and recommendation calculations
  const getProductStats = (product: Product) => {
    const productMovements = movements.filter(
      (m) => m.productId === product.id && m.type === "Sortie"
    );
    
    // Default consumption: 10% of threshold per day if no data available
    let dailyConsumption = product.threshold / 10;
    
    if (productMovements.length > 0) {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      const recentMovements = productMovements.filter((m) => {
        const mDate = new Date(m.time);
        return mDate >= thirtyDaysAgo;
      });
      
      const totalQty = recentMovements.reduce((acc, m) => acc + m.quantity, 0);
      if (totalQty > 0) {
        dailyConsumption = totalQty / 30;
      }
    }

    const coverage = dailyConsumption > 0 ? product.stock / dailyConsumption : 999;
    
    let coverageText = "";
    if (product.stock === 0 || coverage <= 1) {
      coverageText = "rupture imminente";
    } else {
      coverageText = `≈ ${Math.round(coverage)} j de couverture`;
    }
    
    // Recommended reorder quantity: target roughly 3x threshold to cover 2-4 weeks of stock
    const rawReorderQty = product.threshold * 2.8 - product.stock;
    const reorderQty = Math.max(product.threshold * 2, Math.ceil(rawReorderQty / 5) * 5);
    
    return {
      dailyConsumption,
      coverageText,
      reorderQty,
    };
  };

  // Helper to retrieve personalized order quantity or fallback to recommended one
  const getOrderQtyForProduct = (prodId: string, recommendedQty: number) => {
    return customOrderQuantities[prodId] !== undefined ? customOrderQuantities[prodId] : recommendedQty;
  };

  const updateOrderQty = (prodId: string, val: number) => {
    setCustomOrderQuantities(prev => ({
      ...prev,
      [prodId]: val
    }));
  };

  // Calculate total reorder value
  const totalReorderValue = activeAlerts.reduce((acc, prod) => {
    const { reorderQty } = getProductStats(prod);
    const orderQty = getOrderQtyForProduct(prod.id, reorderQty);
    return acc + (orderQty * prod.purchasePrice);
  }, 0);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("fr-FR").format(val) + " F";
  };

  // Format capitalized names
  const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Handle Quick Order simulation
  const handleQuickOrder = (product: Product, qty: number) => {
    showToast(`Commande de ${qty} ${product.unit} de ${capitalize(product.name)} planifiée.`);
  };

  // Handle Quick Stock Entry
  const openQuickInput = (product: Product) => {
    const { reorderQty } = getProductStats(product);
    const orderQty = getOrderQtyForProduct(product.id, reorderQty);
    setSelectedProductForInput(product);
    setQuickInputQty(orderQty);
  };

  const handleQuickInputSubmit = async () => {
    if (!selectedProductForInput || quickInputQty <= 0) return;
    
    try {
      await addMovement(
        selectedProductForInput.id, 
        "Entrée", 
        quickInputQty, 
        "Réapprovisionnement rapide depuis Alertes"
      );
      showToast(`Entrée de ${quickInputQty} ${selectedProductForInput.unit} enregistrée pour ${capitalize(selectedProductForInput.name)}.`);
      setSelectedProductForInput(null);
    } catch (e) {
      showToast("Erreur lors de l'enregistrement de l'entrée.");
    }
  };

  // Handle Ignore action
  const handleIgnoreProduct = (productId: string, productName: string) => {
    setIgnoredProductIds([...ignoredProductIds, productId]);
    showToast(`Alerte pour ${capitalize(productName)} masquée pour cette session.`);
  };

  // Reset ignored alerts
  const handleResetIgnored = () => {
    setIgnoredProductIds([]);
    showToast("Toutes les alertes ignorées ont été restaurées.");
  };

  // Show toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Generate WhatsApp order message
  const getWhatsAppMessage = () => {
    const companyName = profile?.name ? profile.name.toUpperCase() : "MA BOUTIQUE";
    let text = `📋 *BON DE COMMANDE DE RÉAPPROVISIONNEMENT - ${companyName}* 📋\n`;
    text += `Généré le : ${new Date().toLocaleDateString("fr-FR")}\n\n`;
    
    activeAlerts.forEach((p, idx) => {
      const { reorderQty } = getProductStats(p);
      const orderQty = getOrderQtyForProduct(p.id, reorderQty);
      const { code } = getProductExtraInfo(p);
      text += `${idx + 1}. *${capitalize(p.name)}* (${code})\n`;
      text += `   - Quantité souhaitée : *${orderQty} ${p.unit}*\n`;
      text += `   - Prix d'achat approx. : ${formatCurrency(p.purchasePrice)} / unité\n\n`;
    });
    
    text += `*Valeur totale estimée : ${formatCurrency(totalReorderValue)}*\n\n`;
    text += `Merci de valider et de lancer la commande auprès des fournisseurs. 🚀`;
    return text;
  };

  const handleSendWhatsApp = () => {
    const msg = getWhatsAppMessage();
    const encodedText = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
    showToast("Redirection vers WhatsApp...");
  };

  const handleCopyToClipboard = () => {
    const msg = getWhatsAppMessage();
    navigator.clipboard.writeText(msg);
    showToast("Bon de commande copié dans le presse-papiers !");
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter products based on selected tab
  const displayedProducts = activeAlerts.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "critical") return isCritical(p);
    if (activeTab === "low") return isLow(p);
    return true;
  });

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto flex flex-col space-y-8 animate-fade-in print:p-0">
      
      {/* Dynamic CSS Print Styles Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Masquer sidebar, header, navigation, toasts, boutons d'actions et boutons +/- */
          aside, nav, button, .print-hidden, .mobile-nav-bar, header, .fixed, .toast-container {
            display: none !important;
          }
          
          /* Ajustements de la structure principale */
          main, .min-h-screen {
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
            background: white !important;
          }
          
          /* Centrer et styliser le modal pour l'impression */
          .print-modal-backdrop {
            position: relative !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            z-index: auto !important;
            inset: auto !important;
          }
          
          .print-document-container {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }
          
          body {
            background: white !important;
            color: #111E35 !important;
          }
        }
      `}} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-brand-blue border border-white/10 text-white px-5 py-3.5 rounded-xl font-bold text-[13px] shadow-2xl z-50 flex items-center gap-3 animate-slide-up max-w-md print-hidden">
          <div className="w-2 h-2 rounded-full bg-brand-accent animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print-hidden">
        <div>
          <div className="text-xs font-bold tracking-widest text-[#8A7F6E] uppercase mb-1">
            Niveaux critiques
          </div>
          <h1 className="text-3xl font-extrabold text-brand-blue tracking-tight flex items-center gap-2">
            Alertes de stock
          </h1>
          <p className="text-sm text-[#8A7F6E] mt-1 font-medium">
            Produits en rupture ou proches du seuil de commande.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {ignoredProductIds.length > 0 && (
            <button
              onClick={handleResetIgnored}
              className="bg-white border-2 border-dashed border-[#E5E0D5] text-[#8A7F6E] hover:text-brand-blue hover:border-brand-blue px-4 py-3 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              Restaurer ({ignoredProductIds.length})
            </button>
          )}
          {activeAlerts.length > 0 && (
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="bg-brand-blue text-white px-5 py-3.5 rounded-xl font-bold text-[14px] hover:bg-[#1a2c4e] hover:shadow-md transition-all duration-200 ease-out active:scale-[0.97] flex items-center justify-center gap-2.5 cursor-pointer shadow-sm w-full sm:w-auto"
            >
              <Printer className="w-4 h-4 text-brand-accent" />
              Générer un bon de commande
            </button>
          )}
        </div>
      </div>

      {/* Grid of Alert Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:hidden">
        {/* Critical Alerts KPI */}
        <div 
          onClick={() => setActiveTab("critical")}
          className={`border rounded-2xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col justify-between relative group ${
            activeTab === "critical" 
              ? "bg-[#FFF0F0] border-[#D9381E]/30 ring-2 ring-[#D9381E]/10" 
              : "bg-[#FFF0F0]/40 border-[#D9381E]/10 hover:bg-[#FFF0F0]/70"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D9381E] tracking-wider uppercase">Ruptures critiques</span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#D9381E] animate-pulse-ring" />
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-black text-[#D9381E]">
              {criticalProducts.length}
            </span>
            <span className="text-xs text-[#D9381E]/80 font-bold">stock ≤ 40 % du seuil</span>
          </div>
          {activeTab === "critical" && (
            <div className="absolute bottom-2 right-4 text-[10px] font-extrabold text-[#D9381E]/60 flex items-center gap-0.5">
              Filtre actif <ChevronRight className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Low Alerts KPI */}
        <div 
          onClick={() => setActiveTab("low")}
          className={`border rounded-2xl p-6 shadow-xs hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col justify-between relative group ${
            activeTab === "low" 
              ? "bg-[#FFF8E6] border-[#B25E00]/30 ring-2 ring-[#B25E00]/10" 
              : "bg-[#FFF8E6]/40 border-[#B25E00]/10 hover:bg-[#FFF8E6]/70"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#B25E00] tracking-wider uppercase">Stocks bas</span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#B25E00] opacity-80" />
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-black text-[#B25E00]">
              {lowProducts.length}
            </span>
            <span className="text-xs text-[#B25E00]/80 font-bold">sous le seuil</span>
          </div>
          {activeTab === "low" && (
            <div className="absolute bottom-2 right-4 text-[10px] font-extrabold text-[#B25E00]/60 flex items-center gap-0.5">
              Filtre actif <ChevronRight className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Value to Reorder KPI */}
        <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8A7F6E] tracking-wider uppercase">Valeur à réapprovisionner</span>
            <ShoppingBag className="w-4 h-4 text-[#8A7F6E] opacity-75" />
          </div>
          <div className="flex flex-col mt-4">
            <span className="text-3xl font-black text-brand-blue tracking-tight">
              {formatCurrency(totalReorderValue)}
            </span>
            <span className="text-xs text-[#8A7F6E] font-bold mt-1">estimation totale</span>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-[#E5E0D5]/65 overflow-x-auto no-scrollbar gap-2 pb-0.5 scroll-smooth print-hidden">
        <button
          onClick={() => setActiveTab("all")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "all"
              ? "border-brand-blue text-brand-blue"
              : "border-transparent text-[#8A7F6E] hover:text-brand-blue"
          }`}
        >
          Toutes <span className="ml-1 px-2 py-0.5 rounded-full bg-[#FAF6EE] text-xs font-black">{activeAlerts.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("critical")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "critical"
              ? "border-[#D9381E] text-[#D9381E]"
              : "border-transparent text-[#8A7F6E] hover:text-[#D9381E]"
          }`}
        >
          Ruptures critiques <span className="ml-1 px-2 py-0.5 rounded-full bg-[#FFF0F0] text-xs font-black text-[#D9381E]">{criticalProducts.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("low")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "low"
              ? "border-[#B25E00] text-[#B25E00]"
              : "border-transparent text-[#8A7F6E] hover:text-[#B25E00]"
          }`}
        >
          Stocks bas <span className="ml-1 px-2 py-0.5 rounded-full bg-[#FFF8E6] text-xs font-black text-[#B25E00]">{lowProducts.length}</span>
        </button>
      </div>

      {/* Alert Cards Container */}
      <div className="space-y-5 print-hidden">
        {displayedProducts.length > 0 ? (
          displayedProducts.map((prod) => {
            const { coverageText, reorderQty } = getProductStats(prod);
            const { code } = getProductExtraInfo(prod);
            const critical = isCritical(prod);
            
            // Custom quantity to purchase
            const orderQty = getOrderQtyForProduct(prod.id, reorderQty);
            
            // Jauge percentage (stock relative to threshold)
            const fillPercentage = Math.min(100, Math.max(0, (prod.stock / prod.threshold) * 100));

            return (
              <div 
                key={prod.id} 
                className={`bg-white border rounded-2xl p-5 md:p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col space-y-5 animate-slide-up relative overflow-hidden group ${
                  critical 
                    ? "border-l-4 border-l-[#D9381E] border-[#E5E0D5]/50" 
                    : "border-l-4 border-l-[#E5A93C] border-[#E5E0D5]/50"
                }`}
              >
                {/* Product Meta Info Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                      critical ? "bg-[#FFF0F0] text-[#D9381E]" : "bg-[#FFF8E6] text-[#B25E00]"
                    }`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-brand-blue text-base leading-tight">
                        {capitalize(prod.name)}
                      </span>
                      <span className="text-xs text-[#8A7F6E] font-bold mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="bg-[#FAF6EE] px-2 py-0.5 rounded-md border border-[#E5E0D5]/40">{code}</span>
                        <span className="w-1 h-1 rounded-full bg-[#E5E0D5] hidden sm:inline" />
                        <span className="text-[11px] bg-[#FAF6EE] text-brand-blue/80 px-2 py-0.5 rounded-md border border-[#E5E0D5]/40 hidden sm:inline">{capitalize(prod.category)}</span>
                      </span>
                    </div>
                  </div>

                  <span className={`px-3.5 py-1 rounded-full text-xs font-black tracking-wide shrink-0 ${
                    critical 
                      ? "bg-[#FFF0F0] text-[#D9381E] border border-[#D9381E]/10 animate-pulse-ring" 
                      : "bg-[#FFF8E6] text-[#B25E00] border border-[#B25E00]/10"
                  }`}>
                    {critical ? "Rupture critique" : "Stock bas"}
                  </span>
                </div>

                {/* Stock Gauge Section */}
                <div className="bg-[#FAF6EE]/45 rounded-xl p-4 border border-[#E5E0D5]/35 flex flex-col space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    {/* Current Stock */}
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-xl font-extrabold tracking-tight ${critical ? "text-[#D9381E]" : "text-[#B25E00]"}`}>
                        {prod.stock}
                      </span>
                      <span className={`text-[13px] font-bold ${critical ? "text-[#D9381E]/80" : "text-[#B25E00]/80"}`}>
                        {prod.unit}
                      </span>
                    </div>

                    {/* Coverage text */}
                    <span className={`text-xs font-black tracking-wide flex items-center gap-1.5 ${
                      critical ? "text-[#D9381E] bg-[#FFF0F0]" : "text-[#B25E00] bg-[#FFF8E6]"
                    } px-2.5 py-1 rounded-lg border border-current/5`}>
                      <Clock className="w-3.5 h-3.5" />
                      {capitalize(coverageText)}
                    </span>
                  </div>

                  {/* Visual progress bar */}
                  <div className="relative w-full h-2.5 bg-[#FAF6EE] rounded-full overflow-hidden border border-[#E5E0D5]/30">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        critical ? "bg-[#D9381E]" : "bg-[#E5A93C]"
                      }`}
                      style={{ width: `${fillPercentage}%` }}
                    />
                    
                    {/* Threshold visual marker */}
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-0.5 bg-black/25 z-10" 
                      title="Seuil de commande"
                    />
                  </div>

                  {/* Gauge labels */}
                  <div className="flex justify-between text-[10px] font-extrabold text-[#8A7F6E]/80">
                    <span>0</span>
                    <span className="flex items-center gap-1">
                      <span>Seuil de commande :</span>
                      <span className="text-brand-blue font-black bg-white px-1.5 py-0.5 rounded border border-[#E5E0D5]/50">{prod.threshold} {prod.unit}</span>
                    </span>
                  </div>
                </div>

                {/* Recommendation and Actions */}
                <div className="flex flex-col space-y-4 pt-1">
                  {/* Recommended stock quantity banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-brand-blue bg-[#FAF6EE]/30 p-2.5 rounded-lg border border-[#E5E0D5]/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-accent animate-wiggle shrink-0" />
                      <span>
                        Réappro conseillé : <strong className="text-brand-blue font-extrabold">{reorderQty} {prod.unit}</strong> pour couvrir ~2 semaines
                      </span>
                    </div>
                    
                    {customOrderQuantities[prod.id] !== undefined && (
                      <span className="text-[10px] bg-brand-accent/15 text-brand-blue px-2 py-0.5 rounded font-black border border-brand-accent/25 self-start sm:self-auto">
                        Quantité personnalisée
                      </span>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    
                    {/* Interactive Quantity Selector */}
                    <div className="flex items-center justify-between border-2 border-brand-blue/15 hover:focus-within:border-brand-blue rounded-xl bg-[#FAF6EE]/50 p-1 w-full sm:w-[130px] shrink-0">
                      <button
                        onClick={() => updateOrderQty(prod.id, Math.max(1, orderQty - 5))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-[#E5E0D5]/50 hover:bg-[#FAF6EE] text-brand-blue font-extrabold cursor-pointer active:scale-95 transition-transform text-xs"
                        title="Diminuer la commande de 5"
                      >
                        -5
                      </button>
                      
                      <input
                        type="number"
                        value={orderQty}
                        onChange={(e) => updateOrderQty(prod.id, Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-10 text-center font-black text-xs bg-transparent border-none outline-none text-brand-blue focus:ring-0"
                      />
                      
                      <button
                        onClick={() => updateOrderQty(prod.id, orderQty + 5)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-[#E5E0D5]/50 hover:bg-[#FAF6EE] text-brand-blue font-extrabold cursor-pointer active:scale-95 transition-transform text-xs"
                        title="Augmenter la commande de 5"
                      >
                        +5
                      </button>
                    </div>

                    <button
                      onClick={() => handleQuickOrder(prod, orderQty)}
                      className="flex-1 bg-brand-blue text-white py-3 px-4 rounded-xl font-bold text-xs hover:bg-[#1a2c4e] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-brand-accent" />
                      Commander {orderQty}
                    </button>

                    <button
                      onClick={() => openQuickInput(prod)}
                      className="flex-1 bg-white border border-brand-blue text-brand-blue py-3 px-4 rounded-xl font-bold text-xs hover:bg-brand-blue/5 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-brand-accent" />
                      Entrée de stock
                    </button>

                    <button
                      onClick={() => handleIgnoreProduct(prod.id, prod.name)}
                      className="bg-white border border-[#E5E0D5] text-[#8A7F6E] hover:text-[#D9381E] hover:border-[#D9381E]/30 py-3 px-4 rounded-xl font-bold text-xs transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      title="Masquer l'alerte"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span className="sm:hidden lg:inline">Ignorer</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#EDFBF3] flex items-center justify-center text-[#0A8543] border border-[#0A8543]/15">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="flex flex-col space-y-1">
              <h3 className="font-extrabold text-brand-blue text-lg">Aucune rupture de stock</h3>
              <p className="text-xs text-[#8A7F6E] max-w-sm">
                Tous vos niveaux de stocks sont stables et supérieurs à vos seuils d'alertes configurés.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Quick Stock Entry */}
      {selectedProductForInput && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in print-hidden">
          <div className="bg-white border border-[#E5E0D5] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="p-5 border-b border-[#FAF6EE] flex items-center justify-between bg-[#FAF6EE]/50">
              <h3 className="text-[16px] font-black text-brand-blue flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-accent" />
                Entrée de stock rapide
              </h3>
              <button 
                onClick={() => setSelectedProductForInput(null)}
                className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer text-[#8A7F6E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FAF6EE] border border-[#E5E0D5]/50 flex items-center justify-center text-brand-blue font-black shrink-0">
                  📦
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-[15px] text-brand-blue">{capitalize(selectedProductForInput.name)}</span>
                  <span className="text-xs text-[#8A7F6E] font-medium">Stock actuel: {selectedProductForInput.stock} {selectedProductForInput.unit}</span>
                </div>
              </div>

              {/* Counter Input */}
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-bold text-[#8A7F6E] uppercase">Quantité à ajouter</label>
                <div className="flex items-center justify-between border-2 border-brand-blue/15 hover:border-brand-blue/30 focus-within:border-brand-blue rounded-xl p-1 bg-[#FAF6EE]/35">
                  <button
                    type="button"
                    onClick={() => setQuickInputQty(Math.max(1, quickInputQty - 5))}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-[#E5E0D5]/50 hover:bg-[#FAF6EE] text-brand-blue font-extrabold cursor-pointer active:scale-95 transition-transform"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickInputQty(Math.max(1, quickInputQty - 1))}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-[#E5E0D5]/50 hover:bg-[#FAF6EE] text-brand-blue font-extrabold cursor-pointer active:scale-95 transition-transform"
                  >
                    -1
                  </button>
                  
                  <input
                    type="number"
                    value={quickInputQty}
                    onChange={(e) => setQuickInputQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 text-center font-black text-lg bg-transparent border-none outline-none text-brand-blue"
                  />

                  <button
                    type="button"
                    onClick={() => setQuickInputQty(quickInputQty + 1)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-[#E5E0D5]/50 hover:bg-[#FAF6EE] text-brand-blue font-extrabold cursor-pointer active:scale-95 transition-transform"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickInputQty(quickInputQty + 5)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-[#E5E0D5]/50 hover:bg-[#FAF6EE] text-brand-blue font-extrabold cursor-pointer active:scale-95 transition-transform"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Recommended Action Helper */}
              <div className="text-xs text-[#B25E00] bg-[#FFF8E6] px-3.5 py-2.5 rounded-lg border border-[#B25E00]/10 font-bold flex items-center gap-2">
                <span>💡 Quantité suggérée pour couvrir le seuil : {getOrderQtyForProduct(selectedProductForInput.id, getProductStats(selectedProductForInput).reorderQty)} {selectedProductForInput.unit}</span>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductForInput(null)}
                  className="flex-1 bg-white border-2 border-[#E5E0D5] text-[#8A7F6E] hover:bg-[#FAF6EE] py-3 rounded-xl font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleQuickInputSubmit}
                  className="flex-1 bg-brand-blue hover:bg-[#1a2c4e] text-white py-3 rounded-xl font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  Valider l'entrée
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Generate Purchase Order / Share */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in print-modal-backdrop">
          <div className="bg-white border border-[#E5E0D5] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up print-document-container">
            {/* Header */}
            <div className="p-5 border-b border-[#FAF6EE] flex items-center justify-between bg-[#FAF6EE]/50 print-hidden">
              <h3 className="text-base font-black text-brand-blue flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-brand-accent" />
                Génération de Bon de Commande
              </h3>
              <button 
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer text-[#8A7F6E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Friendly Layout & Preview */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] print:max-h-none print:p-0">
              
              {/* Document Header (For print and display) */}
              <div className="border-b-2 border-brand-blue pb-4 flex flex-col md:flex-row md:justify-between md:items-end gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-brand-accent tracking-wider uppercase">Fiche de Réapprovisionnement</div>
                  <h2 className="text-2xl font-black text-brand-blue">
                    {profile?.name ? profile.name.toUpperCase() : "MA BOUTIQUE"}
                  </h2>
                  <div className="text-xs text-[#8A7F6E] font-medium">
                    {profile?.city ? `${profile.city}` : "Ouagadougou"} · {profile?.sector ? `${profile.sector}` : "Secteur d'activité"}
                  </div>
                </div>
                <div className="text-left md:text-right text-xs text-[#8A7F6E] font-bold">
                  <div>Date : {new Date().toLocaleDateString("fr-FR")}</div>
                  <div>Statut : En attente de validation</div>
                </div>
              </div>

              {/* Purchase Order Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E0D5] text-[11px] font-extrabold uppercase text-[#8A7F6E]">
                      <th className="py-2.5">Produit</th>
                      <th className="py-2.5">Référence</th>
                      <th className="py-2.5 text-right">Qte souhaitée</th>
                      <th className="py-2.5 text-right">P. Achat Unit.</th>
                      <th className="py-2.5 text-right">Montant Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D5]/40 text-xs font-bold text-brand-blue">
                    {activeAlerts.map((prod) => {
                      const { reorderQty } = getProductStats(prod);
                      const orderQty = getOrderQtyForProduct(prod.id, reorderQty);
                      const { code } = getProductExtraInfo(prod);
                      const totalCost = orderQty * prod.purchasePrice;

                      return (
                        <tr key={prod.id} className="hover:bg-[#FAF6EE]/30">
                          <td className="py-3 font-extrabold">{capitalize(prod.name)}</td>
                          <td className="py-3">
                            <div className="font-bold text-[10px] text-brand-blue bg-[#FAF6EE] px-1.5 py-0.5 rounded border border-[#E5E0D5]/50 inline-block">{code}</div>
                          </td>
                          <td className="py-3 text-right">
                            
                            {/* Interactive Quantity Control directly inside the PO table */}
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => updateOrderQty(prod.id, Math.max(1, orderQty - 5))}
                                className="w-6 h-6 rounded bg-white border border-[#E5E0D5]/50 hover:bg-[#FAF6EE] text-brand-blue font-extrabold flex items-center justify-center text-[10px] cursor-pointer print:hidden select-none active:scale-95 transition-transform"
                                title="Diminuer la commande de 5"
                              >
                                -
                              </button>
                              
                              <span className="min-w-[40px] text-center font-black">{orderQty} {prod.unit}</span>
                              
                              <button
                                onClick={() => updateOrderQty(prod.id, orderQty + 5)}
                                className="w-6 h-6 rounded bg-white border border-[#E5E0D5]/50 hover:bg-[#FAF6EE] text-brand-blue font-extrabold flex items-center justify-center text-[10px] cursor-pointer print:hidden select-none active:scale-95 transition-transform"
                                title="Augmenter la commande de 5"
                              >
                                +
                              </button>
                            </div>
                            
                          </td>
                          <td className="py-3 text-right">{formatCurrency(prod.purchasePrice)}</td>
                          <td className="py-3 text-right font-black">{formatCurrency(totalCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Card */}
              <div className="bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl p-4 flex justify-between items-center">
                <span className="text-xs font-black text-[#8A7F6E] uppercase">Valeur totale estimée du bon</span>
                <span className="text-xl font-black text-brand-blue">{formatCurrency(totalReorderValue)}</span>
              </div>

              {/* WhatsApp Share Text Preview */}
              <div className="space-y-2 print:hidden">
                <span className="text-xs font-bold text-[#8A7F6E] uppercase">Aperçu du message de notification</span>
                <pre className="w-full bg-[#FAF6EE]/80 border border-[#E5E0D5] rounded-xl p-3.5 text-[11px] font-bold text-brand-blue whitespace-pre-wrap font-mono max-h-40 overflow-y-auto leading-relaxed">
                  {getWhatsAppMessage()}
                </pre>
              </div>

              {/* Actions panel for print view (hidden in print) */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[#E5E0D5]/40 print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 bg-white border-2 border-brand-blue text-brand-blue py-3 rounded-xl font-bold text-xs hover:bg-brand-blue/5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-brand-accent" />
                  Imprimer le bon
                </button>
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="flex-1 bg-white border-2 border-brand-blue text-brand-blue py-3 rounded-xl font-bold text-xs hover:bg-brand-blue/5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-brand-accent" />
                  Copier le texte
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex-1 bg-brand-blue hover:bg-[#1a2c4e] text-white py-3 rounded-xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4 text-brand-accent" />
                  Notifier par WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple custom icons not included or to ensure consistency
function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
