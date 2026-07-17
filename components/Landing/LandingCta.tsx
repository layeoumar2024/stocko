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
          Rejoignez plus de 2 000 commerçants et grossistes qui font confiance à Stocko pour optimiser leur gestion quotidienne.
        </p>
        <div className="landing-cta-final-buttons">
          <Link href="/connexion?mode=onboarding" className="landing-btn-cta-primary">
            Créer mon compte gratuitement
          </Link>
          <a href="https://wa.me/22600000000" target="_blank" rel="noopener noreferrer" className="landing-btn-cta-secondary">
            Contacter un conseiller
          </a>
        </div>
      </div>
    </section>
  );
}
