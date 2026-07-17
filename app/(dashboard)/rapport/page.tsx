"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  FileText, 
  Send, 
  Download, 
  Printer, 
  BarChart3, 
  DollarSign, 
  CheckCircle,
  Package
} from "lucide-react";
import { useStock } from "@/context/StockContext";

export default function RapportPage() {
  const { products, movements, categories } = useStock();

  // Filter Period State
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [toastMessage, setToastMessage] = useState("");

  const daysLimit = period === "weekly" ? 7 : 30;
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - daysLimit);

  // Filter movements for selected period
  const periodMovements = movements.filter((m) => new Date(m.time) >= limitDate);

  // Stats Calculations
  const totalStockValue = products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0);

  // Sales (Sorties) quantity and value estimation
  const sorties = periodMovements.filter((m) => m.type === "Sortie");
  const salesQty = sorties.reduce((acc, m) => acc + m.quantity, 0);
  
  const estimatedSalesValue = sorties.reduce((acc, m) => {
    const prod = products.find((p) => p.id === m.productId);
    const price = prod ? prod.sellPrice : 0;
    return acc + m.quantity * price;
  }, 0);

  // Best selling products (Top 3)
  const productSortiesMap: Record<string, { name: string; qty: number; unit: string }> = {};
  sorties.forEach((m) => {
    if (!productSortiesMap[m.productId]) {
      productSortiesMap[m.productId] = { name: m.productName, qty: 0, unit: "unités" };
      // find unit
      const prod = products.find((p) => p.id === m.productId);
      if (prod) productSortiesMap[m.productId].unit = prod.unit;
    }
    productSortiesMap[m.productId].qty += m.quantity;
  });

  const bestSellers = Object.values(productSortiesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3);

  // Stock value distribution by Category
  const categoryValueMap: Record<string, number> = {};
  categories.forEach((cat) => {
    categoryValueMap[cat] = 0;
  });

  products.forEach((p) => {
    const cat = p.category || "Divers";
    if (categoryValueMap[cat] !== undefined) {
      categoryValueMap[cat] += p.stock * p.purchasePrice;
    } else {
      categoryValueMap["Divers"] = (categoryValueMap["Divers"] || 0) + p.stock * p.purchasePrice;
    }
  });

  const maxCatValue = Math.max(...Object.values(categoryValueMap), 1);

  // Prepare Whatsapp message
  const handleShareWhatsapp = () => {
    let text = `📊 *RAPPORT DE STOCK - ${period === "weekly" ? "HEBDOMADAIRE" : "MENSUEL"}* 📊\n\n`;
    text += `*Établissement :* Distributions Faso\n`;
    text += `*Période :* Derniers ${daysLimit} jours\n\n`;
    text += `*INDICATEURS CLÉS :*\n`;
    text += `- Valeur totale du stock : *${totalStockValue.toLocaleString("fr-FR")} F*\n`;
    text += `- Ventes estimées : *${estimatedSalesValue.toLocaleString("fr-FR")} F* (${salesQty} articles sortis)\n\n`;
    
    if (bestSellers.length > 0) {
      text += `*🔥 TOP VENTES :*\n`;
      bestSellers.forEach((item, index) => {
        text += `${index + 1}. ${item.name} : *${item.qty}* ${item.unit}\n`;
      });
      text += `\n`;
    }

    text += `Rapport généré le ${new Date().toLocaleDateString("fr-FR")} via Stocko. 🚀`;
    
    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
    setToastMessage("Rapport prêt sur WhatsApp !");
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto flex flex-col space-y-8 animate-fade-in">
      
      {/* Print styles injection */}
      <style>{`
        @media print {
          aside, nav, button, .print-hidden, .mobile-nav-bar { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; min-height: auto !important; }
          body { background: white !important; color: #111E35 !important; }
          .print-container { padding: 20px !important; }
          .card-print { border: 1px solid #E5E0D5 !important; box-shadow: none !important; page-break-inside: avoid; }
        }
      `}</style>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-brand-blue border border-white/10 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-2xl z-50 flex items-center gap-2.5 animate-slide-up">
          <CheckCircle className="w-5 h-5 text-brand-accent animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print-hidden">
        <div>
          <div className="text-xs font-bold tracking-widest text-[#8A7F6E] uppercase mb-1">
            Analyses et exports
          </div>
          <h1 className="text-3xl font-extrabold text-brand-blue flex items-center gap-2">
            Rapport d'Activité
          </h1>
          <p className="text-sm text-[#8A7F6E] mt-1 font-medium">
            Analysez les ventes, la valorisation du stock et partagez les bilans.
          </p>
        </div>

        {/* Action button triggers */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleShareWhatsapp}
            className="bg-white border-2 border-brand-blue text-brand-blue px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-brand-blue/5 transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 text-brand-accent" />
            WhatsApp
          </button>
          
          <button
            onClick={handlePrint}
            className="bg-brand-blue text-white px-5 py-3 rounded-xl font-bold text-xs hover:bg-[#1a2c4e] transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-brand-accent" />
            Exporter PDF / Imprimer
          </button>
        </div>
      </div>

      {/* Print header (visible only in print mode) */}
      <div className="hidden print:block border-b-2 border-brand-blue pb-4 mb-6">
        <h1 className="text-2xl font-extrabold text-brand-blue">Distributions Faso — Rapport d'Activité</h1>
        <p className="text-xs text-[#8A7F6E] font-medium mt-1">
          Généré le {new Date().toLocaleDateString("fr-FR")} · Période : {period === "weekly" ? "Hebdomadaire (7 jours)" : "Mensuel (30 jours)"}
        </p>
      </div>

      {/* Weekly/Monthly Period Selector Switcher */}
      <div className="flex bg-[#FAF6EE] border border-[#E5E0D5] p-1.5 rounded-xl self-start print-hidden">
        <button
          onClick={() => setPeriod("weekly")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            period === "weekly"
              ? "bg-white text-brand-blue shadow-sm"
              : "text-[#8A7F6E] hover:text-brand-blue"
          }`}
        >
          Hebdomadaire (7j)
        </button>
        <button
          onClick={() => setPeriod("monthly")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            period === "monthly"
              ? "bg-white text-brand-blue shadow-sm"
              : "text-[#8A7F6E] hover:text-brand-blue"
          }`}
        >
          Mensuel (30j)
        </button>
      </div>

      {/* Performance KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total stock value */}
        <div className="card-print bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#8A7F6E]">Valorisation Stock</span>
            <span className="text-xs bg-[#FAF6EE] border border-[#E5E0D5]/50 px-2 py-0.5 rounded text-[#8A7F6E] font-bold">Actif</span>
          </div>
          <div className="text-3xl font-extrabold text-brand-blue mt-4">
            {totalStockValue.toLocaleString("fr-FR")} F
          </div>
          <span className="text-[10px] text-[#8A7F6E] font-semibold mt-1">Basé sur le prix d'achat initial</span>
        </div>

        {/* Estimated Sales Value */}
        <div className="card-print bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#8A7F6E]">Ventes Estimées ({period === "weekly" ? "7j" : "30j"})</span>
            <span className="text-xs bg-[#EDFBF3] px-2 py-0.5 rounded text-[#0A8543] font-bold">Sorties</span>
          </div>
          <div className="text-3xl font-extrabold text-[#0A8543] mt-4">
            {estimatedSalesValue.toLocaleString("fr-FR")} F
          </div>
          <span className="text-[10px] text-[#8A7F6E] font-semibold mt-1">Estimé sur le prix de vente</span>
        </div>

        {/* Volume of articles sold */}
        <div className="card-print bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#8A7F6E]">Volume d'Articles</span>
            <span className="text-xs bg-[#F6F0FF] px-2 py-0.5 rounded text-[#6E3FF3] font-bold">Flux</span>
          </div>
          <div className="text-3xl font-extrabold text-brand-blue mt-4">
            {salesQty} <span className="text-sm text-[#8A7F6E] font-bold">articles</span>
          </div>
          <span className="text-[10px] text-[#8A7F6E] font-semibold mt-1">Somme de toutes les sorties enregistrées</span>
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Card: Best Selling Products (Top 3) */}
        <div className="card-print bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col space-y-6 animate-slide-up [animation-delay:50ms]">
          <div className="pb-4 border-b border-[#FAF6EE] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0A8543]" />
            <h2 className="text-lg font-bold text-brand-blue">Top 3 des Ventes ({period === "weekly" ? "7j" : "30j"})</h2>
          </div>

          <div className="flex-1 divide-y divide-[#FAF6EE]">
            {bestSellers.length > 0 ? (
              bestSellers.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-brand-accent/20 border border-brand-accent/20 flex items-center justify-center font-extrabold text-brand-blue text-xs">
                      {index + 1}
                    </span>
                    <span className="font-extrabold text-brand-blue text-[15px]">{item.name}</span>
                  </div>
                  <span className="font-extrabold text-brand-blue text-sm">
                    {item.qty} {item.unit} vendus
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-[#8A7F6E] space-y-1.5">
                <Package className="w-8 h-8 text-[#8A7F6E]/30" />
                <span className="font-bold text-sm text-brand-blue">Aucune vente</span>
                <span className="text-[11px]">Aucun mouvement de type Sortie sur cette période.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Category Distribution Chart (CSS Progress bars) */}
        <div className="card-print bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col space-y-6 animate-slide-up [animation-delay:100ms]">
          <div className="pb-4 border-b border-[#FAF6EE] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-blue/70" />
            <h2 className="text-lg font-bold text-brand-blue">Répartition Valeur Stock par Catégorie</h2>
          </div>

          <div className="space-y-4">
            {categories.map((cat) => {
              const value = categoryValueMap[cat] || 0;
              const percentage = maxCatValue > 0 ? Math.round((value / maxCatValue) * 100) : 0;
              
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-brand-blue">
                    <span>{cat}</span>
                    <span>{value.toLocaleString("fr-FR")} F ({percentage}%)</span>
                  </div>
                  
                  {/* CSS progress bar */}
                  <div className="w-full h-3 bg-[#FAF6EE] border border-[#E5E0D5]/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-accent rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
