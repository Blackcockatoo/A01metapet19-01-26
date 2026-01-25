"use client";

import { useEffect } from "react";
import { QuickNav } from "@/components/QuickNav";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    registerServiceWorker();
  }, []);

  return (
    <div className="antialiased min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {children}
      <QuickNav />
    </div>
  );
}
