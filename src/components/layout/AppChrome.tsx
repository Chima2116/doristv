"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { Toast } from "@/components/layout/Toast";
import { PaymentSheet } from "@/components/layout/PaymentSheet";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const fullScreen = pathname.startsWith("/watch/") || pathname.startsWith("/studio");

  if (fullScreen) {
    return (
      <>
        {children}
        <Toast />
        <PaymentSheet />
      </>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-ui)", color: "var(--text-primary)", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <NavBar />
      {children}
      <Toast />
      <PaymentSheet />
    </div>
  );
}
