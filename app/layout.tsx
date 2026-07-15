import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Providers from "./providers";
import RouteGuard from "@/components/RouteGuard";

export const metadata: Metadata = {
  title: "Stocko — Tableau de bord de gestion de stock",
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
          <RouteGuard>
            <div className="flex min-h-screen flex-col lg:flex-row">
              {/* Sidebar */}
              <Sidebar />

              {/* Main content wrapper */}
              <main className="flex-1 pl-0 lg:pl-72 pt-16 lg:pt-0 min-h-screen">
                <div className="w-full h-full">
                  {children}
                </div>
              </main>
            </div>
          </RouteGuard>
        </Providers>
      </body>
    </html>
  );
}
