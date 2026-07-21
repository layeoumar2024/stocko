"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter, 
  X, 
  Package, 
  Layers, 
  AlertTriangle,
  Download,
  ArrowUpDown,
  ChevronRight,
  Boxes,
  TrendingUp,
  CheckSquare,
  Square,
  ChevronLeft
} from "lucide-react";
import { useStock } from "@/context/StockContext";

function getProductSKU(name: string, id: string): string {
  if (!name) return "PRD-000";
  const cleanName = name.trim().toUpperCase();
  const prefix = cleanName.substring(0, 3).replace(/[^A-Z]/g, "PRD");
  const idNum = id.replace(/\D/g, "").slice(-3) || "010";
  return `${prefix}-${idNum.padStart(3, "0")}`;
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return "Aucun";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `il y a ${Math.max(1, diffMins)} min`;
  if (diffHours < 24) return `il y a ${diffHours} h`;
  if (diffDays === 1) return "hier";
  if (diffDays < 30) return `il y a ${diffDays} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function ProduitsPage() {
  const { products, movements, categories, profile, addProduct } = useStock();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [sortField, setSortField] = useState<"name" | "stock" | "value">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const lastMovementsMap = useMemo(() => {
    const map: Record<string, string> = {};
    movements.forEach((m) => {
      if (!map[m.productId]) {
        map[m.productId] = m.time;
      }
    });
    return map;
  }, [movements]);

  const stats = useMemo(() => {
    const totalCount = products.length;
    const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
    const totalValue = products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0);
    const lowStockCount = products.filter((p) => p.stock <= p.threshold).length;

    return { totalCount, totalUnits, totalValue, lowStockCount };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const sku = getProductSKU(p.name, p.id);
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sku.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory =
          selectedCategory === "Toutes" || p.category === selectedCategory;

        const matchesLowStock = onlyLowStock ? p.stock <= p.threshold : true;

        return matchesSearch && matchesCategory && matchesLowStock;
      })
      .sort((a, b) => {
        let valA: any = a.name;
        let valB: any = b.name;

        if (sortField === "stock") {
          valA = a.stock;
          valB = b.stock;
        } else if (sortField === "value") {
          valA = a.stock * a.purchasePrice;
          valB = b.stock * b.purchasePrice;
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, onlyLowStock, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const toggleSelectAll = () => {
    if (selectedProductIds.length === paginatedProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(paginatedProducts.map((p) => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((item) => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) return;

    const headers = ["ID", "Code SKU", "Nom Produit", "Catégorie", "Stock Actuel", "Unité", "Seuil Alerte", "Prix Achat (F)", "Prix Vente (F)", "Valeur Stock (F)", "Statut"];
    const rows = filteredProducts.map((p) => [
      p.id,
      getProductSKU(p.name, p.id),
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.stock,
      p.unit,
      p.threshold,
      p.purchasePrice,
      p.sellPrice,
      p.stock * p.purchasePrice,
      p.status === "critical" ? "Rupture critique" : p.status === "low" ? "Stock bas" : "Stable",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stocko_catalogue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.stock || !newProduct.threshold || !newProduct.purchasePrice || !newProduct.sellPrice) return;

    await addProduct({
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
    <div className="min-h-screen pb-24 md:pb-12 bg-brand-bg/60">
      <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        
        {/* MOBILE VIEW HEADER (< md) */}
        <div className="md:hidden space-y-4 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-brand-blue tracking-tight flex items-center gap-2">
                Produits
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200/70 text-[#404944]">
                  {stats.totalCount}
                </span>
              </h1>
            </div>

            <button
              onClick={() => { setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}
              className="p-2.5 bg-white border border-[#E5E0D5] rounded-xl shadow-xs text-brand-blue hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              title="Trier la liste"
            >
              <ArrowUpDown className="w-5 h-5 text-[#404944]" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F6E]" />
              <input
                type="text"
                placeholder="Rechercher un produit"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5E0D5] rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-brand-blue placeholder-[#8A7F6E]/60 focus:outline-none focus:border-brand-accent shadow-xs transition-all"
              />
            </div>
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`p-2.5 border rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer ${
                onlyLowStock
                  ? "bg-[#FFF0F0] border-[#D9381E]/30 text-[#D9381E]"
                  : "bg-white border-[#E5E0D5] text-[#404944]"
              }`}
              title="Filtrer"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar select-none">
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                onlyLowStock
                  ? "bg-[#FFF0F0] text-[#D9381E] border-[#D9381E]/40 shadow-xs"
                  : "bg-[#FFF0F0]/70 text-[#D9381E] border-[#FFF0F0] hover:bg-[#FFF0F0]"
              }`}
            >
              <span>Stock bas</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9381E]" />
              <span>{stats.lowStockCount}</span>
            </button>

            <button
              onClick={() => { setSelectedCategory("Toutes"); setOnlyLowStock(false); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === "Toutes" && !onlyLowStock
                  ? "bg-[#111E35] text-white border-[#111E35] shadow-xs"
                  : "bg-white text-brand-blue border-[#E5E0D5] hover:bg-gray-50"
              }`}
            >
              Tous
            </button>

            {categories.map((cat) => {
              const isActive = selectedCategory === cat && !onlyLowStock;
              return (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setOnlyLowStock(false); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? "bg-[#111E35] text-white border-[#111E35] shadow-xs"
                      : "bg-white text-brand-blue border-[#E5E0D5] hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-[#E5E0D5]/70 rounded-2xl shadow-xs overflow-hidden divide-y divide-[#E5E0D5]/40">
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((p) => {
                const sku = getProductSKU(p.name, p.id);
                const isCritical = p.status === "critical";
                const isLow = p.status === "low";
                
                const barColorClass = isCritical
                  ? "bg-[#D9381E]"
                  : isLow
                  ? "bg-[#E5A93C]"
                  : "bg-[#0A8543]";

                const textColorClass = isCritical
                  ? "text-[#D9381E]"
                  : isLow
                  ? "text-[#B25E00]"
                  : "text-[#0A8543]";

                return (
                  <Link
                    key={p.id}
                    href={`/produits/${p.id}`}
                    className="flex items-center justify-between p-4 hover:bg-[#FAF6EE]/40 active:bg-gray-50 transition-colors relative group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                      <div className={`w-1.5 h-10 rounded-full shrink-0 ${barColorClass}`} />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-brand-blue text-[15px] truncate leading-tight">
                          {p.name}
                        </h3>
                        <div className="text-xs text-[#8A7F6E] font-medium mt-1 truncate">
                          {sku} · {p.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div>
                        <div className={`text-lg font-extrabold leading-none ${textColorClass}`}>
                          {p.stock}
                        </div>
                        <div className="text-[11px] text-[#8A7F6E] font-medium mt-0.5">
                          {p.unit}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-2">
                <Package className="w-8 h-8 text-[#8A7F6E]/40 mx-auto" />
                <div className="font-bold text-brand-blue text-sm">Aucun produit trouvé</div>
                <p className="text-xs text-[#8A7F6E]">Essayez de modifier votre recherche ou vos filtres.</p>
              </div>
            )}
          </div>
        </div>

        {/* DESKTOP VIEW HEADER & KPI CARDS (>= md) */}
        <div className="hidden md:flex flex-col space-y-6 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-brand-blue tracking-tight">
                Produits
              </h1>
              <p className="text-sm text-[#8A7F6E] mt-1 font-medium">
                Catalogue de {profile.name || "Distributions Faso"} — mis à jour il y a 5 minutes
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="bg-white border border-[#E5E0D5] text-brand-blue hover:bg-gray-50 px-4 py-2.5 rounded-xl font-bold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4 text-[#8A7F6E]" />
                <span>Exporter</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#fd761a] hover:bg-[#9d4300] text-white px-5 py-2.5 rounded-xl font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un produit</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E5E0D5]/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8A7F6E] uppercase tracking-wider">
                <Boxes className="w-4 h-4 text-[#8A7F6E]" />
                <span>Références</span>
              </div>
              <div>
                <div className="text-3xl font-black text-brand-blue tracking-tight">{stats.totalCount}</div>
                <div className="text-xs text-[#8A7F6E] font-medium mt-1">au catalogue</div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D5]/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8A7F6E] uppercase tracking-wider">
                <Layers className="w-4 h-4 text-[#8A7F6E]" />
                <span>Unités en stock</span>
              </div>
              <div>
                <div className="text-3xl font-black text-brand-blue tracking-tight">{stats.totalUnits.toLocaleString("fr-FR")}</div>
                <div className="text-xs text-[#8A7F6E] font-medium mt-1">toutes catégories</div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D5]/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8A7F6E] uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-[#8A7F6E]" />
                <span>Valeur du stock</span>
              </div>
              <div>
                <div className="text-3xl font-black text-brand-blue tracking-tight">{stats.totalValue.toLocaleString("fr-FR")} F</div>
                <div className="text-xs text-[#8A7F6E] font-medium mt-1">actif net valorisé</div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D5]/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8A7F6E] uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-[#D9381E]" />
                <span>Ruptures</span>
              </div>
              <div>
                <div className="text-3xl font-black text-[#D9381E] tracking-tight">{stats.lowStockCount}</div>
                <div className="text-xs text-[#D9381E]/80 font-medium mt-1">à traiter</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D5]/70 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F6E]" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou référence"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-brand-blue placeholder-[#8A7F6E]/60 focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
              >
                <option value="Toutes">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                  onlyLowStock
                    ? "bg-[#FFF0F0] text-[#D9381E] border-[#D9381E]/30 shadow-xs"
                    : "bg-[#FFF0F0]/60 text-[#D9381E] border-[#FFF0F0] hover:bg-[#FFF0F0]"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Stock bas uniquement</span>
              </button>
            </div>

            <div className="text-xs font-bold text-[#8A7F6E]">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""}
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D5]/70 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF6EE]/40 border-b border-[#E5E0D5]/60 text-[11px] font-extrabold text-[#8A7F6E] uppercase tracking-wider select-none">
                    <th className="p-4 w-10 text-center">
                      <button onClick={toggleSelectAll} className="cursor-pointer">
                        {selectedProductIds.length > 0 && selectedProductIds.length === paginatedProducts.length ? (
                          <CheckSquare className="w-4 h-4 text-brand-blue" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3.5 cursor-pointer hover:text-brand-blue" onClick={() => { setSortField("name"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                      PRODUIT <ArrowUpDown className="w-3 h-3 inline ml-0.5" />
                    </th>
                    <th className="px-4 py-3.5">CATÉGORIE</th>
                    <th className="px-4 py-3.5 cursor-pointer hover:text-brand-blue" onClick={() => { setSortField("stock"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                      STOCK ACTUEL <ArrowUpDown className="w-3 h-3 inline ml-0.5" />
                    </th>
                    <th className="px-4 py-3.5 cursor-pointer hover:text-brand-blue" onClick={() => { setSortField("value"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                      VALEUR <ArrowUpDown className="w-3 h-3 inline ml-0.5" />
                    </th>
                    <th className="px-4 py-3.5">DERNIER MVT</th>
                    <th className="px-4 py-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D5]/40 text-sm">
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map((p) => {
                      const sku = getProductSKU(p.name, p.id);
                      const isSelected = selectedProductIds.includes(p.id);
                      const lastMvt = lastMovementsMap[p.id];
                      const formattedTime = formatRelativeTime(lastMvt);
                      const itemValue = p.stock * p.purchasePrice;

                      const isCritical = p.status === "critical";
                      const isLow = p.status === "low";

                      const dotColor = isCritical ? "bg-[#D9381E]" : isLow ? "bg-[#E5A93C]" : "bg-[#0A8543]";
                      const textColor = isCritical ? "text-[#D9381E]" : isLow ? "text-[#B25E00]" : "text-brand-blue";

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-[#FAF6EE]/40 transition-colors group cursor-pointer ${
                            isSelected ? "bg-brand-accent/5" : ""
                          }`}
                        >
                          <td className="p-4 text-center">
                            <button onClick={() => toggleSelectProduct(p.id)} className="cursor-pointer">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-brand-blue" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                              )}
                            </button>
                          </td>

                          <td className="px-4 py-3.5">
                            <Link href={`/produits/${p.id}`} className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gray-100/80 border border-gray-200/60 flex items-center justify-center text-[#8A7F6E] shrink-0 group-hover:border-brand-accent/40 transition-colors">
                                <Package className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-brand-blue group-hover:text-[#fd761a] transition-colors">
                                  {p.name}
                                </div>
                                <div className="text-xs text-[#8A7F6E] font-medium mt-0.5">
                                  {sku}
                                </div>
                              </div>
                            </Link>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF6EE] text-[#404944] border border-[#E5E0D5]">
                              {p.category}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 font-bold">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                              <span className={textColor}>
                                {p.stock} <span className="text-xs font-normal text-[#8A7F6E]">{p.unit}</span>
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 font-bold text-brand-blue">
                            {itemValue.toLocaleString("fr-FR")} F
                          </td>

                          <td className="px-4 py-3.5 text-xs text-[#8A7F6E] font-medium">
                            {formattedTime}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <Link
                              href={`/produits/${p.id}`}
                              className="text-xs font-bold text-[#8A7F6E] hover:text-[#fd761a] transition-colors"
                            >
                              Voir fiche →
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-[#8A7F6E]">
                        Aucun produit ne correspond à votre recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-[#E5E0D5]/50 bg-[#FAF6EE]/30 flex items-center justify-between text-xs text-[#8A7F6E] font-medium">
              <div>
                Affichage de {filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)} sur {filteredProducts.length} produits
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="p-1.5 rounded-lg border border-[#E5E0D5] bg-white disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        currentPage === page
                          ? "bg-brand-blue text-white"
                          : "bg-white border border-[#E5E0D5] text-brand-blue hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="p-1.5 rounded-lg border border-[#E5E0D5] bg-white disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE FLOATING ACTION BUTTON (FAB) */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-40 bg-[#fd761a] text-white px-5 py-3.5 rounded-full font-extrabold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border-2 border-white/20"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter</span>
        </button>

      </div>

      {/* MODAL: Ajouter un Produit (Shared Mobile & Desktop) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#E5E0D5] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-[#FAF6EE] flex items-center justify-between bg-[#FAF6EE]/50">
              <h3 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                <Package className="w-5 h-5 text-[#fd761a]" />
                Nouveau produit
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[#8A7F6E] hover:text-brand-blue" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8A7F6E] uppercase">Nom du produit</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Riz Basmati 5kg"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Catégorie</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Unité</label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
                  >
                    <option value="sacs">sacs</option>
                    <option value="bidons">bidons</option>
                    <option value="cartons">cartons</option>
                    <option value="pièces">pièces</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Prix d'achat (F)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Ex: 5000"
                    value={newProduct.purchasePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: e.target.value })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
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
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Stock initial</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Ex: 20"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
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
                    className="w-full bg-[#FAF6EE] border border-[#E5E0D5] rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-[#FAF6EE] hover:bg-[#F0EAE0] text-[#8A7F6E] py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#fd761a] hover:bg-[#9d4300] text-white py-2.5 rounded-xl font-extrabold text-sm transition-colors cursor-pointer shadow-md"
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
