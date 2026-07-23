"use client";

import React from "react";
import { Quote } from "lucide-react";

export default function LandingTestimonial() {
  return (
    <section className="landing-testimonial">
      <div className="landing-testimonial-container">
        <div className="landing-testimonial-card">
          {/* Portrait Image */}
          <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 mx-auto md:mx-0">
            <img 
              className="landing-testimonial-img" 
              alt="Portrait de Moussa Diop, commerçant sénégalais souriant" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxCRvj6Jejp7hoqHcDtHjWgnov5LYXyYpYwvOXobdFSkNuIR3uHmiTUr2pxAAhwjMxNWeQ0yVaeHvyUzFaSBpPs9AjcYrarulG8Mk0G1sGgp_EhR_VtSa_yLS_5ACsCaiNjqiOJwkM69WbKJlegNaBT_q_40aEWXj8gGsLjt6OYNDyqtSzJnIG5_KRgNf7Jptk1cJkEq2MslaTyZwgalI_jifJ2uWvQeE6Ylvgjpx-pdigoNfZSF81DgZ1fy87JuCmFn2A-Cfgs-g"
            />
          </div>
          
          {/* Quote details */}
          <div className="space-y-6 text-center md:text-left flex-1">
            <Quote className="w-10 h-10 text-[#fd761a] mx-auto md:mx-0 transform rotate-180" />
            <p className="landing-testimonial-quote">
              "Depuis que j'utilise Denka, j'ai réduit mes pertes de 40%. Je peux voyager tout en surveillant mes trois boutiques depuis mon téléphone. C'est l'outil que chaque commerçant sénégalais devrait avoir."
            </p>
            <div>
              <p className="font-extrabold text-lg text-[#003527]">Moussa Diop</p>
              <p className="text-[#404944] text-xs font-semibold">
                Gérant de 'Quincaillerie du Futur', Dakar
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
