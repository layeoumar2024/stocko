import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Stocko — Gestion de stock intelligente pour l'Afrique",
  description: "Solution moderne de gestion de stock pour PME et grossistes en Afrique francophone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="bg-brand-bg text-brand-blue min-h-full font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

