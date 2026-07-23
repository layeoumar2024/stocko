"use client";

import React from "react";
import Link from "next/link";
import { Boxes } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      {/* Grid container */}
      <div className="landing-footer-grid">
        {/* Col 1: Branding */}
        <div className="landing-footer-col">
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-[#fd761a]" />
            <span className="font-extrabold text-xl text-[#003527]">Denka</span>
          </div>
          <p className="landing-footer-desc">
            La gestion de stock intelligente, pensée pour les commerçants, détaillants et grossistes du continent africain.
          </p>
        </div>

        {/* Col 2: Site links */}
        <div className="landing-footer-links-grid">
          {/* List 1 */}
          <div className="landing-footer-links-col">
            <p className="landing-footer-col-title">Produit</p>
            <ul className="landing-footer-link-list">
              <li><a href="#features" className="landing-footer-link">Fonctionnalités</a></li>
              <li><a href="#pricing" className="landing-footer-link">Tarifs</a></li>
              <li><Link href="/connexion" className="landing-footer-link">Démo</Link></li>
            </ul>
          </div>

          {/* List 2 */}
          <div className="landing-footer-links-col">
            <p className="landing-footer-col-title">Entreprise</p>
            <ul className="landing-footer-link-list">
              <li><a href="#pricing" className="landing-footer-link">Témoignages</a></li>
              <li><a href="#faq" className="landing-footer-link">FAQ</a></li>
              <li><a href="#" className="landing-footer-link">iziFacture</a></li>
            </ul>
          </div>

          {/* List 3 */}
          <div className="landing-footer-links-col">
            <p className="landing-footer-col-title">Légal</p>
            <ul className="landing-footer-link-list">
              <li><a href="#" className="landing-footer-link">Confidentialité</a></li>
              <li><a href="#" className="landing-footer-link">Conditions</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="landing-footer-bottom">
        <p>© 2026 Denka. Fait avec fierté en Afrique.</p>
        <div className="landing-footer-socials">
          <a href="#" className="landing-footer-social-link">Twitter</a>
          <a href="#" className="landing-footer-social-link">LinkedIn</a>
          <a href="#" className="landing-footer-social-link">Facebook</a>
        </div>
      </div>
    </footer>
  );
}
