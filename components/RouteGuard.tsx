"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStock } from "@/context/StockContext";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user } = useStock();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && pathname === "/connexion") {
      router.push("/dashboard");
    } else if (!user && pathname !== "/connexion") {
      router.push("/connexion");
    }
  }, [user, pathname, router]);

  // If not logged in and not on login page, display loading redirect screen
  if (!user && pathname !== "/connexion") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center font-sans">
        <span className="text-[#8A7F6E] font-semibold">Redirection vers la connexion...</span>
      </div>
    );
  }

  // If logged in and on login page, display redirection
  if (user && pathname === "/connexion") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center font-sans">
        <span className="text-[#8A7F6E] font-semibold">Redirection vers le tableau de bord...</span>
      </div>
    );
  }

  return <>{children}</>;
}
