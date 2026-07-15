"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter, 
  X, 
  Package, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { useStock } from "@/context/StockContext";

export default function ProduitsPage() {
  const { products, categories, addProduct } = useStock();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    stock: "",
    threshold: "",
    unit: "pièces",
    category: "Alimentation",
    purchasePrice: "",
    sellPrice: "",
  });

  // Filter products based on search and selected category
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Toutes" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle addition
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.stock || !newProduct.threshold || !newProduct.purchasePrice || !newProduct.sellPrice) return;

    addProduct({
      name: newProduct.name,
      stock: parseInt(newProduct.stock),
      threshold: parseInt(newProduct.threshold),
      unit: newProduct.unit,
      category: newProduct.category,
      purchasePrice: parseFloat(newProduct.purchasePrice),
      sellPrice: parseFloat(newProduct.sellPrice),
    });

    setIsAddModalOpen(false);
    setNewProduct({
      name: "",
      stock: "",
      threshold: "",
      unit: "pièces",
      category: categories[0] || "Alimentation",
      purchasePrice: "",
      sellPrice: "",
    });
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto flex flex-col space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-[#8A7F6E] uppercase mb-1">
            Gestion du catalogue
          </div>
          <h1 className="text-3xl font-extrabold text-brand-blue flex items-center gap-2">
            Liste des Produits
          </h1>
          <p className="text-sm text-[#8A7F6E] mt-1 font-medium">
            Consultez, recherchez et gérez les produits de votre espace de travail.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-blue text-white px-5 py-3.5 rounded-xl font-bold text-[14px] hover:bg-[#1a2c4e] hover:shadow-md transition-all duration-200 ease-out active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Ajouter un produit
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F6E]" />
          <input
            type="text"
            placeholder="Rechercher un produit par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-brand-blue placeholder-[#8A7F6E]/60 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#8A7F6E]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-sm font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
          >
            <option value="Toutes">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl shadow-sm overflow-hidden animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF6EE]/50 border-b border-[#E5E0D5]/50 text-xs font-bold text-[#8A7F6E] uppercase tracking-wider">
                <th className="px-6 py-4">Produit</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4">Stock Actuel</th>
                <th className="px-6 py-4">Seuil d'Alerte</th>
                <th className="px-6 py-4">Prix d'Achat</th>
                <th className="px-6 py-4">Prix de Vente</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF6EE]">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod) => (
                  <tr 
                    key={prod.id} 
                    className="hover:bg-[#FAF6EE]/30 transition-colors group cursor-pointer"
                  >
                    {/* Name Link */}
                    <td className="px-6 py-4">
                      <Link href={`/produits/${prod.id}`} className="block">
                        <div className="font-bold text-brand-blue text-[15px] group-hover:text-brand-accent transition-colors">
                          {prod.name}
                        </div>
                        <div className="text-xs text-[#8A7F6E] font-medium mt-0.5">
                          ID: #{prod.id}
                        </div>
                      </Link>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 text-[14px] font-semibold text-brand-blue/80">
                      {prod.category}
                    </td>

                    {/* Current Stock */}
                    <td className="px-6 py-4 text-[15px] font-extrabold text-brand-blue">
                      {prod.stock} <span className="text-xs text-[#8A7F6E] font-semibold ml-0.5">{prod.unit}</span>
                    </td>

                    {/* Threshold */}
                    <td className="px-6 py-4 text-[14px] font-bold text-[#8A7F6E]">
                      {prod.threshold} <span className="text-xs font-medium ml-0.5">{prod.unit}</span>
                    </td>

                    {/* Purchase Price */}
                    <td className="px-6 py-4 text-[14px] font-bold text-brand-blue/80">
                      {prod.purchasePrice.toLocaleString("fr-FR")} F
                    </td>

                    {/* Sale Price */}
                    <td className="px-6 py-4 text-[14px] font-extrabold text-brand-blue">
                      {prod.sellPrice.toLocaleString("fr-FR")} F
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {prod.status === "critical" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF0F0] text-[#D9381E] inline-flex items-center gap-1 shadow-xs border border-[#FFF0F0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D9381E] animate-pulse"></span>
                          Rupture critique
                        </span>
                      )}
                      {prod.status === "low" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF8E6] text-[#B25E00] inline-flex items-center gap-1 shadow-xs border border-[#FFF8E6]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B25E00]"></span>
                          Stock bas
                        </span>
                      )}
                      {prod.status === "stable" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EDFBF3] text-[#0A8543] inline-flex items-center gap-1 shadow-xs border border-[#EDFBF3]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0A8543]"></span>
                          Stable
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/produits/${prod.id}`}
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-[#8A7F6E] hover:text-brand-accent transition-colors bg-[#FAF6EE] px-3 py-1.5 rounded-lg border border-[#E5E0D5]"
                      >
                        Voir fiche
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Package className="w-8 h-8 text-[#8A7F6E]/40" />
                      <div className="font-bold text-brand-blue">Aucun produit trouvé</div>
                      <div className="text-xs text-[#8A7F6E]">Essayez de modifier vos filtres ou d'ajouter un produit.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Ajouter un Produit */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#E5E0D5] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="p-6 border-b border-[#FAF6EE] flex items-center justify-between bg-[#FAF6EE]/50">
              <h3 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-accent animate-wiggle" />
                Nouveau produit
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[#8A7F6E] hover:text-brand-blue" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddProductSubmit} className="p-6 space-y-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8A7F6E] uppercase">Nom du produit</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Riz Basmati 5kg"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Catégorie</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
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
              </div>

              {/* Purchase price & Sell price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Prix d'achat (F)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Ex: 5000"
                    value={newProduct.purchasePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: e.target.value })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Prix de vente (F)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Ex: 6000"
                    value={newProduct.sellPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellPrice: e.target.value })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>

              {/* Initial stock & Alert threshold */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Stock initial</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Ex: 20"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-3 text-[15px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Seuil d'alerte</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Ex: 5"
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-[#FAF6EE] hover:bg-[#F0EAE0] text-[#8A7F6E] py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-blue hover:bg-[#1a2c4e] text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
