"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, Boxes, ArrowRight } from "lucide-react";
import { useStock } from "@/context/StockContext";

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useStock();

  return (
    <header className="landing-header">
      <div className="landing-header-container">
        {/* Logo */}
        <Link href="/" className="landing-logo">
          <Boxes className="w-8 h-8 text-[#fd761a]" />
          <span>Stocko</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="landing-nav">
          <a href="#features" className="landing-nav-link">Fonctionnalités</a>
          <a href="#pricing" className="landing-nav-link">Tarifs</a>
          <a href="#faq" className="landing-nav-link">FAQ</a>
        </nav>

        {/* Actions */}
        <div className="landing-header-actions">
          {user ? (
            <Link href="/dashboard" className="landing-btn-free flex items-center gap-1.5">
              <span>Mon Espace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link href="/connexion" className="landing-btn-connexion">
                Connexion
              </Link>
              <Link href="/connexion?mode=onboarding" className="landing-btn-free">
                Essayer gratuitement
              </Link>
            </>
          )}

          {/* Burger menu toggler */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="landing-menu-toggle"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop & Panel */}
      {mobileMenuOpen && (
        <>
          <div
            className="landing-mobile-menu-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="landing-mobile-menu-panel">
            <div className="flex flex-col space-y-8">
              {/* Header inside Menu */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <Link href="/" className="landing-logo" onClick={() => setMobileMenuOpen(false)}>
                  <Boxes className="w-7 h-7 text-[#fd761a]" />
                  <span className="text-xl">Stocko</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close Mobile Menu"
                >
                  <X className="w-5 h-5 text-[#0b1c30]" />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="flex flex-col space-y-4">
                <a
                  href="#features"
                  className="text-lg font-semibold text-[#0b1c30] hover:text-[#fd761a] transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Fonctionnalités
                </a>
                <a
                  href="#pricing"
                  className="text-lg font-semibold text-[#0b1c30] hover:text-[#fd761a] transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tarifs
                </a>
                <a
                  href="#faq"
                  className="text-lg font-semibold text-[#0b1c30] hover:text-[#fd761a] transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  FAQ
                </a>
              </nav>
            </div>

            {/* Actions inside Menu */}
            <div className="border-t border-gray-100 pt-6 flex flex-col space-y-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="landing-price-btn-pro w-full flex items-center justify-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Accéder au Tableau de Bord</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    className="landing-price-btn-free w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/connexion?mode=onboarding"
                    className="landing-price-btn-pro w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Essayer gratuitement
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
