import { Suspense } from "react";
import type { ReactNode } from "react";

import { FinancialNav } from "@/components/FinancialNav";

export default function FinancialLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
          <Suspense fallback={<div className="h-16 w-full animate-pulse rounded-full bg-slate-200/70" />}> 
            <FinancialNav />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
