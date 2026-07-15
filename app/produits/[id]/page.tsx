"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  Save, 
  Package, 
  ArrowLeftRight, 
  X,
  AlertTriangle
} from "lucide-react";
import { useStock, Product } from "@/context/StockContext";

export default function FicheProduitPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { products, movements, categories, updateProduct, deleteProduct } = useStock();

  // Find product
  const product = products.find((p) => p.id === productId);

  // States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center space-y-4 p-4 font-sans">
        <Package className="w-12 h-12 text-[#8A7F6E]/40" />
        <h1 className="text-xl font-bold text-brand-blue">Produit non trouvé</h1>
        <p className="text-sm text-[#8A7F6E]">Le produit avec l'identifiant #{productId} n'existe pas.</p>
        <Link 
          href="/produits" 
          className="bg-brand-blue text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#1a2c4e] transition-colors"
        >
          Retour au catalogue
        </Link>
      </div>
    );
  }

  // Filter movements for this product
  const productMovements = movements.filter((m) => m.productId === product.id);

  // Enter edit mode
  const handleStartEdit = () => {
    setEditForm({
      name: product.name,
      category: product.category,
      purchasePrice: product.purchasePrice,
      sellPrice: product.sellPrice,
      threshold: product.threshold,
      unit: product.unit,
    });
    setIsEditing(true);
  };

  // Save changes
  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct(product.id, {
      name: editForm.name,
      category: editForm.category,
      purchasePrice: editForm.purchasePrice,
      sellPrice: editForm.sellPrice,
      threshold: editForm.threshold,
      unit: editForm.unit,
    });
    setIsEditing(false);
  };

  // Delete product
  const handleDeleteConfirm = () => {
    deleteProduct(product.id);
    setIsDeleteModalOpen(false);
    router.push("/produits");
  };

  // Calculate markup percentage
  const markup = product.purchasePrice > 0 
    ? Math.round(((product.sellPrice - product.purchasePrice) / product.purchasePrice) * 100) 
    : 0;

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto flex flex-col space-y-8 animate-fade-in">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <Link 
          href="/produits" 
          className="inline-flex items-center gap-2 text-sm font-bold text-[#8A7F6E] hover:text-brand-blue transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Retour au catalogue
        </Link>

        <div className="flex gap-3">
          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="bg-white border-2 border-brand-blue text-brand-blue px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-brand-blue/5 transition-all active:scale-[0.97] flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              Modifier la fiche
            </button>
          )}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="bg-red-50 text-[#D9381E] border border-red-200 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[#FFF0F0] transition-all active:scale-[0.97] flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer le produit
          </button>
        </div>
      </div>

      {/* Main product card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Main Info Details Card */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col space-y-6 animate-slide-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl flex items-center justify-center font-bold text-brand-blue text-lg">
                📦
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7F6E]">Fiche Technique</span>
                <h2 className="text-xl font-extrabold text-brand-blue truncate mt-0.5">{product.name}</h2>
                <span className="inline-block mt-1 text-[11px] font-bold bg-[#FAF6EE] text-brand-blue border border-[#E5E0D5]/50 px-2.5 py-1 rounded-md">
                  ID: #{product.id}
                </span>
              </div>
            </div>

            <div className="border-t border-[#FAF6EE] pt-4 space-y-4">
              {/* Category */}
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-[#8A7F6E]">Catégorie</span>
                <span className="text-brand-blue">{product.category}</span>
              </div>

              {/* Purchase Price */}
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-[#8A7F6E]">Prix d'achat</span>
                <span className="text-brand-blue">{product.purchasePrice.toLocaleString("fr-FR")} F</span>
              </div>

              {/* Selling Price */}
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-[#8A7F6E]">Prix de vente</span>
                <span className="text-brand-blue flex items-center gap-1.5">
                  {product.sellPrice.toLocaleString("fr-FR")} F
                  <span className="text-xs bg-[#EDFBF3] text-[#0A8543] px-1.5 py-0.5 rounded-md font-bold">
                    +{markup}%
                  </span>
                </span>
              </div>

              {/* Current Stock */}
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-[#8A7F6E]">Quantité en stock</span>
                <span className="text-brand-blue text-[15px] font-extrabold">
                  {product.stock} {product.unit}
                </span>
              </div>

              {/* Threshold */}
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-[#8A7F6E]">Seuil d'alerte</span>
                <span className="text-brand-blue">{product.threshold} {product.unit}</span>
              </div>
            </div>

            {/* Status Card Indicator */}
            <div className="pt-2">
              {product.status === "critical" && (
                <div className="p-4 rounded-xl bg-[#FFF0F0] border border-red-200 text-[#D9381E] flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                  <div className="text-xs font-bold leading-snug">
                    Rupture de stock imminente ou critique ! Seuil à {product.threshold} {product.unit}.
                  </div>
                </div>
              )}
              {product.status === "low" && (
                <div className="p-4 rounded-xl bg-[#FFF8E6] border border-orange-200 text-[#B25E00] flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" />
                  <div className="text-xs font-bold leading-snug">
                    Attention : Le niveau de stock est inférieur au seuil d'alerte.
                  </div>
                </div>
              )}
              {product.status === "stable" && (
                <div className="p-4 rounded-xl bg-[#EDFBF3] border border-green-200 text-[#0A8543] flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0A8543] animate-pulse"></span>
                  <div className="text-xs font-bold leading-snug">
                    Le niveau de stock est stable et suffisant.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Editable Details or Movements History */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          {isEditing ? (
            /* Editing form panel */
            <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm animate-slide-up">
              <div className="flex items-center justify-between pb-4 border-b border-[#FAF6EE] mb-6">
                <h3 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-brand-accent" />
                  Modifier le produit
                </h3>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-1 hover:bg-[#FAF6EE] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#8A7F6E]" />
                </button>
              </div>

              <form onSubmit={handleSaveChanges} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Nom du produit</label>
                  <input
                    required
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8A7F6E] uppercase">Catégorie</label>
                    <select
                      value={editForm.category || ""}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8A7F6E] uppercase">Unité</label>
                    <select
                      value={editForm.unit || ""}
                      onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                      className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                    >
                      <option value="sacs">sacs</option>
                      <option value="bidons">bidons</option>
                      <option value="cartons">cartons</option>
                      <option value="pièces">pièces</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8A7F6E] uppercase">Prix d'achat (F)</label>
                    <input
                      required
                      type="number"
                      value={editForm.purchasePrice || 0}
                      onChange={(e) => setEditForm({ ...editForm, purchasePrice: parseFloat(e.target.value) })}
                      className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8A7F6E] uppercase">Prix de vente (F)</label>
                    <input
                      required
                      type="number"
                      value={editForm.sellPrice || 0}
                      onChange={(e) => setEditForm({ ...editForm, sellPrice: parseFloat(e.target.value) })}
                      className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 w-1/2">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Seuil d'alerte</label>
                  <input
                    required
                    type="number"
                    value={editForm.threshold || 0}
                    onChange={(e) => setEditForm({ ...editForm, threshold: parseInt(e.target.value) })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-[#FAF6EE] hover:bg-[#F0EAE0] text-[#8A7F6E] py-3.5 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-brand-blue hover:bg-[#1a2c4e] text-white py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Movements history list */
            <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm flex flex-col min-h-[300px] animate-slide-up">
              <div className="pb-4 border-b border-[#FAF6EE] mb-4 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-brand-blue/70" />
                <h3 className="text-lg font-bold text-brand-blue">Historique des mouvements</h3>
              </div>

              <div className="flex-1 divide-y divide-[#FAF6EE]">
                {productMovements.length > 0 ? (
                  productMovements.map((mov) => (
                    <div key={mov.id} className="flex items-center justify-between py-4 hover:translate-x-1 transition-transform duration-300">
                      <div className="flex items-center gap-3">
                        {mov.type === "Sortie" ? (
                          <span className="px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#F6F0FF] text-[#6E3FF3]">
                            Sortie
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#EDFBF3] text-[#0A8543]">
                            Entrée
                          </span>
                        )}
                        <div className="flex flex-col">
                          <span className="font-semibold text-brand-blue text-[15px]">{mov.note || "Mouvement de stock"}</span>
                          <span className="text-[11px] text-[#8A7F6E] font-medium">
                            {new Date(mov.time).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>

                      <span className={`font-bold text-[16px] ${mov.type === "Sortie" ? "text-brand-blue" : "text-[#0A8543]"}`}>
                        {mov.type === "Sortie" ? `-${mov.quantity}` : `+${mov.quantity}`}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-[#8A7F6E] space-y-1">
                    <ArrowLeftRight className="w-8 h-8 text-[#8A7F6E]/30" />
                    <span className="font-bold text-brand-blue">Aucun mouvement</span>
                    <span className="text-xs">Les flux d'entrées et de sorties s'afficheront ici.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Confirmation de Suppression */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#E5E0D5] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up p-6 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-[#FFF0F0] border border-red-200 text-[#D9381E] rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-blue">Supprimer le produit ?</h3>
              <p className="text-xs text-[#8A7F6E] leading-relaxed">
                Êtes-vous sûr de vouloir supprimer <strong>{product.name}</strong> ? Cette action est irréversible et effacera également son historique de mouvements.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 bg-[#FAF6EE] text-[#8A7F6E] py-3 rounded-xl font-bold text-sm hover:bg-[#F0EAE0] transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-[#D9381E] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#c02f18] transition-colors cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
