"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import RouteGuard from "@/components/RouteGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
