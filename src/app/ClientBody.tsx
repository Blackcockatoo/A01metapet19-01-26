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

  return (
    <div className="antialiased min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {children}
      <QuickNav />
    </div>
  );
}
