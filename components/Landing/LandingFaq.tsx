"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function LandingFaq() {
  const [openId, setOpenId] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: "Puis-je utiliser Denka sans connexion internet ?",
      answer: "Oui, Denka possède un mode hors-ligne complet. Vous pouvez continuer à enregistrer vos ventes et mouvements de stock au comptoir. L'application synchronisera automatiquement vos données en arrière-plan dès que vous retrouverez un accès réseau (même faible comme la 2G)."
    },
    {
      id: 2,
      question: "Mes données sont-elles sécurisées ?",
      answer: "Absolument. Vos données sont cryptées lors des transferts et stockées de manière hautement sécurisée. Nous effectuons des sauvegardes automatiques quotidiennes pour vous assurer de ne jamais perdre vos données de stock, même en cas de panne de téléphone."
    },
    {
      id: 3,
      question: "Quels moyens de paiement acceptez-vous ?",
      answer: "Nous facilitons les règlements via les services mobiles locaux très répandus tels que Wave, Orange Money, MTN MoMo, Free Money, ainsi que par carte bancaire classique (Visa, Mastercard)."
    },
    {
      id: 4,
      question: "Proposez-vous une formation ?",
      answer: "Oui ! Une fois inscrit, vous disposez d'un accès illimité à des capsules vidéo d'aide courtes et didactiques en français et en wolof. De plus, notre service d'assistance client est joignable directement par message WhatsApp pour vous guider au quotidien."
    },
    {
      id: 5,
      question: "Puis-je exporter mes données vers Excel ?",
      answer: "Tout à fait. Vous pouvez exporter l'intégralité de vos rapports d'activité, votre historique de mouvements, et votre catalogue d'articles au format Excel (ou CSV) d'un simple clic à tout moment pour vos besoins comptables."
    }
  ];

  const handleToggle = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="landing-faq" id="faq">
      <h2 className="landing-faq-title">
        Questions Fréquentes
      </h2>

      <div className="landing-faq-list">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className="landing-faq-card">
              <button
                className="landing-faq-button"
                onClick={() => handleToggle(faq.id)}
                aria-expanded={isOpen}
              >
                <span className="landing-faq-question">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 landing-faq-icon ${isOpen ? "transform rotate-180 text-[#fd761a]" : ""}`} 
                />
              </button>
              
              {isOpen && (
                <div className="landing-faq-answer">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
