"use client";

import React from "react";
import LandingHeader from "@/components/Landing/LandingHeader";
import LandingHero from "@/components/Landing/LandingHero";
import LandingStats from "@/components/Landing/LandingStats";
import LandingFeatures from "@/components/Landing/LandingFeatures";
import LandingWorkflow from "@/components/Landing/LandingWorkflow";
import LandingPricing from "@/components/Landing/LandingPricing";
import LandingTestimonial from "@/components/Landing/LandingTestimonial";
import LandingFaq from "@/components/Landing/LandingFaq";
import LandingCta from "@/components/Landing/LandingCta";
import LandingFooter from "@/components/Landing/LandingFooter";
import "./landing.css";

export default function LandingPage() {
  return (
    <div className="landing-page-root min-h-screen flex flex-col">
      {/* Header section */}
      <LandingHeader />

      {/* Main marketing content */}
      <main className="flex-1">
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingWorkflow />
        <LandingPricing />
        <LandingTestimonial />
        <LandingFaq />
        <LandingCta />
      </main>

      {/* Footer section */}
      <LandingFooter />
    </div>
  );
}
