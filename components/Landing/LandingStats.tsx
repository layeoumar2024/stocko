"use client";

import React from "react";
import { MessageCircle, FileSpreadsheet, Signal, Coins, Waves } from "lucide-react";

export default function LandingStats() {
  return (
    <section className="landing-trust-band select-none">
      <div className="landing-trust-container">
        <p className="landing-trust-title">
          Intégré avec vos outils préférés
        </p>
        <div className="landing-trust-logos">
          {/* Orange Money */}
          <div className="landing-trust-item">
            <Coins className="w-6 h-6 text-[#fd761a]" />
            <span>Orange Money</span>
          </div>

          {/* Wave */}
          <div className="landing-trust-item">
            <Waves className="w-6 h-6 text-[#00a2e8]" />
            <span>Wave</span>
          </div>

          {/* WhatsApp */}
          <div className="landing-trust-item">
            <MessageCircle className="w-6 h-6 text-[#25d366]" />
            <span>WhatsApp</span>
          </div>

          {/* Excel */}
          <div className="landing-trust-item">
            <FileSpreadsheet className="w-6 h-6 text-[#107c41]" />
            <span>Excel</span>
          </div>

          {/* 2G/3G Network */}
          <div className="landing-trust-item text-[#0b513d]">
            <Signal className="w-6 h-6 text-[#0b513d] animate-pulse" />
            <span>Mode hors-ligne 2G/3G</span>
          </div>
        </div>
      </div>
    </section>
  );
}
