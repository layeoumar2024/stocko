"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";

export default function LandingPricing() {
  return (
    <section className="landing-pricing" id="pricing">
      <div className="landing-pricing-header">
        <h2 className="landing-pricing-title">
          Un tarif juste pour chaque business
        </h2>
        <p className="landing-pricing-subtitle">
          Commencez gratuitement et évoluez quand vous êtes prêt.
        </p>
      </div>

      <div className="landing-pricing-grid">
        {/* Free Plan */}
        <div className="landing-price-card-free">
          <h3 className="landing-price-title">Gratuit</h3>
          <p className="landing-price-desc">
            Pour les petits commerces débutants.
          </p>
          <div className="landing-price-amount">
            <span>0 FCFA</span>
            <span className="landing-price-period">/mois</span>
          </div>

          <ul className="landing-price-list">
            <li className="landing-price-item">
              <CheckCircle className="w-5 h-5 text-[#064e3b] shrink-0" />
              <span>Jusqu'à 50 articles</span>
            </li>
            <li className="landing-price-item">
              <CheckCircle className="w-5 h-5 text-[#064e3b] shrink-0" />
              <span>1 point de vente</span>
            </li>
            <li className="landing-price-item">
              <CheckCircle className="w-5 h-5 text-[#064e3b] shrink-0" />
              <span>Alertes par email</span>
            </li>
            <li className="landing-price-item-disabled">
              <XCircle className="w-5 h-5 text-gray-300 shrink-0" />
              <span>Pas de rapports avancés</span>
            </li>
          </ul>

          <Link href="/connexion?mode=onboarding" className="landing-price-btn-free">
            S'inscrire gratuitement
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="landing-price-card-pro">
          <div className="landing-price-badge">Recommandé</div>
          <h3 className="landing-price-title">Pro</h3>
          <p className="landing-price-desc">
            Pour les boutiques en pleine croissance.
          </p>
          <div className="landing-price-amount">
            <span>15 000 FCFA</span>
            <span className="landing-price-period">/mois</span>
          </div>

          <ul className="landing-price-list">
            <li className="landing-price-item">
              <CheckCircle className="w-5 h-5 text-[#fd761a] shrink-0" />
              <span>Articles illimités</span>
            </li>
            <li className="landing-price-item">
              <CheckCircle className="w-5 h-5 text-[#fd761a] shrink-0" />
              <span>Multi-boutiques (jusqu'à 5)</span>
            </li>
            <li className="landing-price-item">
              <CheckCircle className="w-5 h-5 text-[#fd761a] shrink-0" />
              <span>Alertes WhatsApp &amp; SMS</span>
            </li>
            <li className="landing-price-item">
              <CheckCircle className="w-5 h-5 text-[#fd761a] shrink-0" />
              <span>Rapports de profit avancés</span>
            </li>
            <li className="landing-price-item">
              <CheckCircle className="w-5 h-5 text-[#fd761a] shrink-0" />
              <span>Support prioritaire 7j/7</span>
            </li>
          </ul>

          <Link href="/connexion?mode=onboarding" className="landing-price-btn-pro">
            Essayer Pro gratuitement
          </Link>
        </div>
      </div>
    </section>
  );
}
