"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, Boxes, ArrowRight } from "lucide-react";
import { useStock } from "@/context/StockContext";

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useStock();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
      <header className="landing-header">
        <div className="landing-header-container">
          {/* Logo */}
          <Link href="/" className="landing-logo">
            <Boxes className="w-7 h-7 sm:w-8 sm:h-8 text-[#fd761a]" />
            <span>Denka</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="landing-nav">
            <a href="#features" onClick={(e) => scrollToSection(e, "features")} className="landing-nav-link">Fonctionnalités</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, "pricing")} className="landing-nav-link">Tarifs</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, "faq")} className="landing-nav-link">FAQ</a>
          </nav>

          {/* Actions */}
          <div className="landing-header-actions">
            {user ? (
              <Link href="/dashboard" className="landing-btn-free flex items-center gap-1.5 active:scale-95 transition-transform">
                <span>Mon Espace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/connexion" className="landing-btn-connexion">
                  Connexion
                </Link>
                <Link href="/connexion?mode=onboarding" className="landing-btn-free">
                  <span>Créer un compte</span>
                </Link>
              </>
            )}

            {/* Burger menu toggler */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="landing-menu-toggle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd761a]"
              aria-label="Toggle Mobile Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop & Panel */}
      {mobileMenuOpen && (
        <>
          <div
            className="landing-mobile-menu-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="landing-mobile-menu-panel">
            {/* Header inside Menu */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 shrink-0">
              <Link 
                href="/" 
                className="landing-logo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd761a] rounded-lg" 
                onClick={() => setMobileMenuOpen(false)}
              >
                <Boxes className="w-7 h-7 text-[#fd761a]" />
                <span className="text-xl">Denka</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-black/5 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd761a] active:scale-95"
                aria-label="Close Mobile Menu"
              >
                <X className="w-5 h-5 text-[#0b1c30]" />
              </button>
            </div>

            {/* Navigation links & Actions content flow */}
            <div className="flex flex-col justify-start pt-4 space-y-4">
              {/* Navigation links */}
              <nav className="flex flex-col space-y-1">
                <a
                  href="#features"
                  className="text-base font-semibold text-[#0b1c30] hover:text-[#fd761a] transition-colors py-3 px-3.5 min-h-[44px] rounded-xl hover:bg-gray-50/80 active:bg-gray-100 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd761a]"
                  onClick={(e) => scrollToSection(e, "features")}
                >
                  Fonctionnalités
                </a>
                <a
                  href="#pricing"
                  className="text-base font-semibold text-[#0b1c30] hover:text-[#fd761a] transition-colors py-3 px-3.5 min-h-[44px] rounded-xl hover:bg-gray-50/80 active:bg-gray-100 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd761a]"
                  onClick={(e) => scrollToSection(e, "pricing")}
                >
                  Tarifs
                </a>
                <a
                  href="#faq"
                  className="text-base font-semibold text-[#0b1c30] hover:text-[#fd761a] transition-colors py-3 px-3.5 min-h-[44px] rounded-xl hover:bg-gray-50/80 active:bg-gray-100 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd761a]"
                  onClick={(e) => scrollToSection(e, "faq")}
                >
                  FAQ
                </a>
              </nav>

              {/* Actions inside Menu */}
              <div className="border-t border-gray-100/80 pt-4 flex flex-col space-y-3">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="landing-price-btn-pro w-full min-h-[48px] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd761a] active:scale-95"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Accéder au Tableau de Bord</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/connexion"
                      className="landing-price-btn-free w-full min-h-[48px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd761a] active:scale-95"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Se connecter
                    </Link>
                    <Link
                      href="/connexion?mode=onboarding"
                      className="landing-price-btn-pro w-full min-h-[48px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd761a] active:scale-95"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Essayer gratuitement
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
