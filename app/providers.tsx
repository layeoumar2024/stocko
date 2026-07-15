"use client";

import React from "react";
import { StockProvider } from "@/context/StockContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <StockProvider>{children}</StockProvider>;
}
