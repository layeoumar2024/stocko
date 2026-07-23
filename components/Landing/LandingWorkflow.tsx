"use client";

import React from "react";

export default function LandingWorkflow() {
  const steps = [
    {
      num: 1,
      title: "Inscrivez-vous",
      desc: "Créez votre compte gratuit en quelques clics avec votre adresse email."
    },
    {
      num: 2,
      title: "Ajoutez vos articles",
      desc: "Scannez vos produits ou importez-les directement depuis un fichier Excel."
    },
    {
      num: 3,
      title: "Commencez à vendre",
      desc: "Enregistrez vos premières ventes et laissez Denka s'occuper du reste."
    }
  ];

  return (
    <section className="landing-workflow">
      <div className="landing-workflow-container">
        <div className="landing-workflow-header">
          <h2 className="landing-workflow-title">
            Mise en place en 3 minutes
          </h2>
          <p className="landing-workflow-subtitle">
            Aucune compétence technique requise.
          </p>
        </div>

        <div className="landing-workflow-steps">
          {/* Connector dashed line */}
          <div className="landing-workflow-line" />

          {steps.map((step, idx) => (
            <div key={idx} className="landing-step-card">
              <div className="landing-step-num">
                {step.num}
              </div>
              <h3 className="landing-step-title">
                {step.title}
              </h3>
              <p className="landing-step-desc">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
