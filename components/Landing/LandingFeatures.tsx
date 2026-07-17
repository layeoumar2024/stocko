"use client";

import React from "react";
import { Clock, BellRing, Users, TrendingUp, History, Store } from "lucide-react";

export default function LandingFeatures() {
  const featuresList = [
    {
      title: "Suivi temps réel",
      desc: "Chaque vente est déduite instantanément de votre inventaire global. Plus besoin d'attendre la fin de journée.",
      icon: Clock,
      colorClass: "bg-[#b0f0d6]/30 text-[#0b513d]"
    },
    {
      title: "Alertes auto",
      desc: "Recevez des notifications WhatsApp dès qu'un produit atteint son seuil critique pour éviter de rater des clients.",
      icon: BellRing,
      colorClass: "bg-[#ffdbca]/30 text-[#9d4300]"
    },
    {
      title: "Multi-vendeurs",
      desc: "Gerez les droits d'accès de vos employés et suivez leurs performances individuelles en toute transparence.",
      icon: Users,
      colorClass: "bg-[#c9e6ff]/30 text-[#00496a]"
    },
    {
      title: "Rapports simplifiés",
      desc: "Visualisez vos bénéfices, vos marges et vos meilleures ventes d'un simple coup d'œil, sans calculatrice.",
      icon: TrendingUp,
      colorClass: "bg-[#b0f0d6]/30 text-[#0b513d]"
    },
    {
      title: "Historique complet",
      desc: "Ne perdez plus la trace d'aucune opération. Tout est archivé, horodaté et sécurisé en cas de litige.",
      icon: History,
      colorClass: "bg-[#ffdbca]/30 text-[#9d4300]"
    },
    {
      title: "Multi-boutiques",
      desc: "Centralisez la gestion de plusieurs points de vente depuis votre mobile, même si vous êtes en déplacement.",
      icon: Store,
      colorClass: "bg-[#c9e6ff]/30 text-[#00496a]"
    }
  ];

  return (
    <section className="landing-features" id="features">
      {/* Header */}
      <div className="landing-features-header">
        <h2 className="landing-features-title">
          Conçu pour votre quotidien
        </h2>
        <p className="landing-features-subtitle">
          Tout ce dont vous avez besoin pour piloter votre activité commerciale avec précision.
        </p>
      </div>

      {/* Grid */}
      <div className="landing-features-grid">
        {featuresList.map((feat, index) => {
          const Icon = feat.icon;
          return (
            <div key={index} className="landing-feature-card group">
              <div className={`landing-feature-icon-wrapper ${feat.colorClass}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="landing-feature-card-title">
                {feat.title}
              </h3>
              <p className="landing-feature-card-desc">
                {feat.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
