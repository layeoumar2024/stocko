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
  ArrowRight
} from "lucide-react";
import { useStock } from "@/context/StockContext";

export default function AlertesPage() {
  const { products } = useStock();

  // Filter products in alert
  const alertProducts = products.filter((p) => p.stock <= p.threshold);
  const criticalProducts = alertProducts.filter((p) => p.status === "critical");
  const lowProducts = alertProducts.filter((p) => p.status === "low");

  // Modal / Toast State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareText, setShareText] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Prepare notification text for WhatsApp
  const prepareNotification = () => {
    let text = `🚨 *RAPPORT DE RUPTURES - DISTRIBUTIONS FASO* 🚨\n\n`;
    text += `Bonjour, voici l'état d'alerte des stocks aujourd'hui :\n\n`;
    
    if (criticalProducts.length > 0) {
      text += `*⚠️ RUPTURES CRITIQUES :*\n`;
      criticalProducts.forEach((p) => {
        text += `- ${p.name} : *${p.stock}* ${p.unit} restante(s) (Seuil : ${p.threshold})\n`;
      });
      text += `\n`;
    }

    if (lowProducts.length > 0) {
      text += `*🔸 STOCKS BAS :*\n`;
      lowProducts.forEach((p) => {
        text += `- ${p.name} : *${p.stock}* ${p.unit} restante(s) (Seuil : ${p.threshold})\n`;
      });
      text += `\n`;
    }

    text += `Merci de lancer les réapprovisionnements rapidement. 🙏`;
    setShareText(text);
    setIsShareModalOpen(true);
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    setToastMessage("Texte copié ! Prêt à être collé dans WhatsApp.");
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Open WhatsApp Web API
  const handleOpenWhatsApp = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
    setToastMessage("Redirection vers WhatsApp...");
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto flex flex-col space-y-8 animate-fade-in">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-brand-blue border border-white/10 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-2xl z-50 flex items-center gap-2.5 animate-slide-up">
          <CheckCircle className="w-5 h-5 text-brand-accent animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-[#8A7F6E] uppercase mb-1">
            Niveaux critiques
          </div>
          <h1 className="text-3xl font-extrabold text-brand-blue flex items-center gap-2">
            Alertes de Stock
          </h1>
          <p className="text-sm text-[#8A7F6E] mt-1 font-medium">
            Surveillez les produits en rupture ou proches du seuil de commande.
          </p>
        </div>

        {alertProducts.length > 0 && (
          <button
            onClick={prepareNotification}
            className="bg-brand-blue text-white px-5 py-3.5 rounded-xl font-bold text-[14px] hover:bg-[#1a2c4e] hover:shadow-md transition-all duration-200 ease-out active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Send className="w-4 h-4 text-brand-accent" />
            Notifier le gérant (WhatsApp)
          </button>
        )}
      </div>

      {/* Grid of Alert Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total alerts */}
        <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <span className="text-sm font-bold text-[#8A7F6E]">Total alertes</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-4xl font-extrabold ${alertProducts.length > 0 ? "text-[#D9381E]" : "text-brand-blue"}`}>
              {alertProducts.length}
            </span>
            <span className="text-xs text-[#8A7F6E] font-bold">produits</span>
          </div>
        </div>

        {/* Critical alerts */}
        <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <span className="text-sm font-bold text-[#8A7F6E]">Ruptures critiques</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-[#D9381E]">{criticalProducts.length}</span>
            <span className="text-xs text-[#D9381E]/80 font-bold">seuil &lt; 50%</span>
          </div>
        </div>

        {/* Low alerts */}
        <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <span className="text-sm font-bold text-[#8A7F6E]">Stocks bas</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-[#B25E00]">{lowProducts.length}</span>
            <span className="text-xs text-[#B25E00]/80 font-bold">seuil atteint</span>
          </div>
        </div>
      </div>

      {/* Alert Lists Card */}
      <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col space-y-6 animate-slide-up [animation-delay:50ms]">
        <div className="pb-4 border-b border-[#FAF6EE] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#D9381E] animate-pulse" />
          <h2 className="text-lg font-bold text-brand-blue">Liste des alertes actives</h2>
        </div>

        <div className="flex-1 divide-y divide-[#FAF6EE]">
          {alertProducts.length > 0 ? (
            alertProducts.map((prod) => (
              <div 
                key={prod.id} 
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4 hover:translate-x-1.5 transition-transform duration-300 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    prod.status === "critical" ? "bg-[#FFF0F0] text-[#D9381E] border border-red-200" : "bg-[#FFF8E6] text-[#B25E00] border border-orange-200"
                  }`}>
                    ⚠️
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-brand-blue text-[15px]">{prod.name}</span>
                    <span className="text-xs text-[#8A7F6E] font-medium mt-0.5">Catégorie: {prod.category}</span>
                  </div>
                </div>

                {/* Stock info */}
                <div className="flex items-center gap-6 sm:justify-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#8A7F6E] uppercase">Stock actuel</span>
                    <span className={`text-[15px] font-extrabold ${prod.status === "critical" ? "text-[#D9381E]" : "text-[#B25E00]"}`}>
                      {prod.stock} / {prod.threshold} {prod.unit}
                    </span>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    prod.status === "critical" ? "bg-[#FFF0F0] text-[#D9381E] animate-pulse" : "bg-[#FFF8E6] text-[#B25E00]"
                  }`}>
                    {prod.status === "critical" ? "Rupture critique" : "Stock bas"}
                  </span>

                  <Link
                    href={`/produits/${prod.id}`}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-[#8A7F6E] hover:text-brand-accent transition-colors bg-[#FAF6EE] px-3 py-1.5 rounded-lg border border-[#E5E0D5]"
                  >
                    Voir fiche
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <Package className="w-10 h-10 text-green-200" />
              <div className="font-bold text-brand-blue">Aucune rupture de stock</div>
              <div className="text-xs text-[#8A7F6E]">Tous vos niveaux de stocks sont stables et supérieurs à vos seuils d'alertes. 👍</div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Notifier le Gérant via WhatsApp */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#E5E0D5] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="p-6 border-b border-[#FAF6EE] flex items-center justify-between bg-[#FAF6EE]/50">
              <h3 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-accent" />
                Alerter le Gérant (WhatsApp/SMS)
              </h3>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[#8A7F6E]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="text-xs text-[#8A7F6E] font-medium leading-relaxed">
                Voici le message formaté contenant les alertes actuelles. Vous pouvez l'envoyer directement ou le copier dans votre presse-papiers.
              </div>

              {/* Message Box */}
              <textarea
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                rows={10}
                className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-sm font-semibold text-brand-blue focus:outline-none focus:border-brand-accent resize-none font-mono"
              />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="flex-1 bg-white border-2 border-brand-blue text-brand-blue py-3.5 rounded-xl font-bold text-sm hover:bg-brand-blue/5 transition-all active:scale-[0.98] cursor-pointer"
                >
                  Copier le texte
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 bg-brand-blue hover:bg-[#1a2c4e] text-white py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-brand-accent" />
                  Envoyer par WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
