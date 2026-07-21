"use client";

import React from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Bolt, 
  Boxes, 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  AlertTriangle, 
  LineChart, 
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useStock } from "@/context/StockContext";

export default function LandingHero() {
  const { user } = useStock();

  return (
    <section className="relative overflow-hidden mesh-gradient pb-20 pt-10 md:pt-20">
      <div className="landing-hero">
        {/* Banner Content */}
        <div className="landing-hero-content">
          <div className="landing-badge">
            <Bolt className="w-4 h-4 text-[#0b513d] animate-pulse" />
            <span>Gestion optimisée pour l'Afrique</span>
          </div>
          
          <h1 className="landing-title">
            Dites adieu aux <span className="landing-title-highlight">ruptures de stock</span> imprévues.
          </h1>
          
          <p className="landing-hero-desc">
            Stocko est la solution intelligente pour les commerçants africains. Suivez vos ventes, gérez vos fournisseurs et recevez des alertes automatiques même avec une connexion 2G.
          </p>

          <div className="landing-hero-buttons">
            {user ? (
              <Link href="/dashboard" className="landing-btn-hero-primary group">
                <span>Accéder à mon tableau de bord</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link href="/connexion?mode=onboarding" className="landing-btn-hero-primary group">
                  <span>Créer un compte gratuitement</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/connexion" className="landing-btn-hero-secondary">
                  Se connecter
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Dashboard Mockup (Full Width Below) */}
        <div className="landing-mockup-wrapper landing-animate-slide-up">
          <div className="landing-mockup-bg-blur"></div>
          
          <div className="landing-mockup-container">
            {/* Sidebar Mockup */}
            <aside className="landing-mockup-sidebar">
              <div className="space-y-8 flex-grow">
                {/* Brand */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#fd761a] rounded-lg flex items-center justify-center shadow-sm">
                    <Boxes className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-bold text-lg">Stocko</span>
                </div>
                
                {/* Menu */}
                <div className="space-y-4">
                  <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold px-3">
                    Espace de travail
                  </div>
                  <nav className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 bg-[#fd761a]/95 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs">
                      <LayoutDashboard className="w-4 h-4 text-white" />
                      <span>Tableau de bord</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-white/60 hover:bg-white/5 hover:text-white rounded-lg text-xs transition-colors cursor-pointer">
                      <Package className="w-4 h-4" />
                      <span>Produits</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-white/60 hover:bg-white/5 hover:text-white rounded-lg text-xs transition-colors cursor-pointer">
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>Mouvements</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 text-white/60 hover:bg-white/5 hover:text-white rounded-lg text-xs transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Alertes</span>
                      </div>
                      <span className="bg-[#ba1a1a] text-white text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold">
                        3
                      </span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-white/60 hover:bg-white/5 hover:text-white rounded-lg text-xs transition-colors cursor-pointer">
                      <LineChart className="w-4 h-4" />
                      <span>Rapport</span>
                    </div>
                  </nav>
                </div>
              </div>

              {/* Bottom store info */}
              <div className="pt-4 border-t border-white/5 text-left">
                <p className="text-white font-bold text-xs truncate">Distributions Faso</p>
                <p className="text-white/40 text-[10px] truncate mt-0.5">Grossiste — Ouagadougou</p>
              </div>
            </aside>

            {/* Dashboard Content Mockup */}
            <div className="landing-mockup-content">
              {/* Header */}
              <div className="mb-6">
                <p className="text-[9px] uppercase tracking-widest text-[#404944]/55 font-bold">
                  Vue d'ensemble
                </p>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b1c30] mt-1">
                  Bonjour, Aminata 👋
                </h2>
                <p className="text-[#404944] text-[11px] mt-0.5 font-medium">
                  Voici l'état de votre stock aujourd'hui, mercredi 12 juillet.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="landing-mockup-stats-grid">
                <div className="landing-mockup-stat-card">
                  <p className="text-[10px] text-[#404944]/75 mb-2 font-medium">Produits en stock</p>
                  <p className="text-xl font-extrabold text-[#0b1c30]">128</p>
                  <p className="text-[8px] text-[#064e3b] mt-1.5 font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />
                    <span>+4 cette semaine</span>
                  </p>
                </div>
                <div className="landing-mockup-stat-card">
                  <p className="text-[10px] text-[#404944]/75 mb-2 font-medium">Valeur du stock</p>
                  <p className="text-xl font-extrabold text-[#0b1c30] truncate">4 250 000 F</p>
                  <p className="text-[8px] text-[#404944]/55 mt-1.5 font-medium">Actif net valorisé</p>
                </div>
                <div className="landing-mockup-stat-card">
                  <p className="text-[10px] text-[#404944]/75 mb-2 font-medium">Alertes rupture</p>
                  <p className="text-xl font-extrabold text-[#ba1a1a]">3</p>
                  <p className="text-[8px] text-[#ba1a1a] mt-1.5 font-bold flex items-center gap-0.5">
                    <AlertCircle className="w-2.5 h-2.5 animate-pulse" />
                    <span>à traiter</span>
                  </p>
                </div>
                <div className="landing-mockup-stat-card">
                  <p className="text-[10px] text-[#404944]/75 mb-2 font-medium">Flux du jour</p>
                  <p className="text-xl font-extrabold text-[#0b1c30]">17</p>
                  <p className="text-[8px] text-[#404944]/55 mt-1.5 font-medium">12 sorties • 5 entrées</p>
                </div>
              </div>

              {/* Core sections */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Column 1: Products to watch */}
                <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-black/5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-2">
                      <h3 className="font-bold text-xs text-[#0b1c30]">Produits à surveiller</h3>
                      <span className="text-[#fd761a] text-[10px] font-bold flex items-center cursor-pointer">
                        Voir tout <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-50/50">
                        <span className="font-medium text-gray-700">Riz parfumé 25kg</span>
                        <span className="bg-[#ffdad6] text-[#ba1a1a] text-[9px] px-2 py-0.5 rounded-full font-bold">
                          4 sacs restants
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-50/50">
                        <span className="font-medium text-gray-700">Huile végétale 20L</span>
                        <span className="bg-[#ffdad6] text-[#ba1a1a] text-[9px] px-2 py-0.5 rounded-full font-bold">
                          2 bidons restants
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="font-medium text-gray-700">Savon (carton)</span>
                        <span className="bg-[#ffdbca] text-[#9d4300] text-[9px] px-2 py-0.5 rounded-full font-bold">
                          9 cartons restants
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                    <button className="flex-1 bg-[#0b1c30] text-white py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                      <Plus className="w-3 h-3 text-[#fd761a]" />
                      Nouveau mouvement
                    </button>
                    <button className="flex-1 border border-[#0b1c30] text-[#0b1c30] py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                      <Plus className="w-3 h-3 text-[#0b1c30]" />
                      Produit
                    </button>
                  </div>
                </div>

                {/* Column 2: Recent activity */}
                <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-black/5 shadow-xs">
                  <h3 className="font-bold text-xs text-[#0b1c30] pb-3 border-b border-gray-100 mb-2">
                    Activité récente
                  </h3>
                  <div className="space-y-3 text-[11px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#ffdad6] text-[#ba1a1a] text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">
                          Sortie
                        </span>
                        <span className="font-medium text-gray-700 truncate max-w-[80px]">Ciment 50kg</span>
                      </div>
                      <span className="font-bold text-[#ba1a1a]">-10</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#b0f0d6]/50 text-[#0b513d] text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">
                          Entrée
                        </span>
                        <span className="font-medium text-gray-700 truncate max-w-[80px]">Youki 24x33cl</span>
                      </div>
                      <span className="font-bold text-[#0b513d]">+40</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#ffdad6] text-[#ba1a1a] text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">
                          Sortie
                        </span>
                        <span className="font-medium text-gray-700 truncate max-w-[80px]">Riz 25kg</span>
                      </div>
                      <span className="font-bold text-[#ba1a1a]">-6</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
