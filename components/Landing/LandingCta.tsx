"use client";

import React from "react";
import Link from "next/link";

export default function LandingCta() {
  return (
    <section className="landing-cta-final">
      <div className="landing-cta-final-container">
        <h2 className="landing-cta-final-title">
          Prêt à transformer votre business ?
        </h2>
        <p className="landing-cta-final-desc">
          Rejoignez plus de 2 000 commerçants et grossistes qui font confiance à Denka pour optimiser leur gestion quotidienne.
        </p>
        <div className="landing-cta-final-buttons">
          <Link href="/connexion?mode=onboarding" className="landing-btn-cta-primary">
            Créer mon compte gratuitement
          </Link>
          <Link href="/connexion" className="landing-btn-cta-secondary">
            Se connecter
          </Link>
        </div>
      </div>
    </section>
  );
}
