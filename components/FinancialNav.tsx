'use client';

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SymbolSearchForm } from "@/components/SymbolSearchForm";

const NAV_ITEMS = [
  { href: "/financial/company-highlights", label: "Company Highlights" },
  { href: "/financial/latest/balance", label: "Latest Balance" },
  { href: "/financial/latest/income", label: "Latest Income" },
  { href: "/financial/latest/cashflow", label: "Latest Cash Flow" },
  { href: "/financial/analysis", label: "Financial Analysis" },
];

export function FinancialNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  const preservedEntries = useMemo(() => {
    if (!searchParams) {
      return [] as Array<[string, string]>;
    }
    return Array.from(searchParams.entries()).filter(([key]) => key !== "symbol" && key !== "id");
  }, [searchParams]);

  const currentSymbol = useMemo(() => {
    if (!searchParams) {
      return "";
    }
    const explicitSymbol = searchParams.get("symbol") ?? searchParams.get("id");
    return explicitSymbol ? explicitSymbol.trim().toUpperCase().replace(/[^A-Z0-9.]/g, "") : "";
  }, [searchParams]);

  const hasSymbol = currentSymbol.length > 0;

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
    };
  }, []);

  const handleShare = useCallback(async () => {
    if (!hasSymbol || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams();
    params.set("symbol", currentSymbol);
    preservedEntries.forEach(([key, value]) => {
      params.append(key, value);
    });

    const url = `${window.location.origin}${pathname ?? "/financial/company-highlights"}?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
      resetTimer.current = window.setTimeout(() => {
        setCopied(false);
        resetTimer.current = null;
      }, 1600);
    } catch (error) {
      console.error("Failed to copy share link", error);
    }
  }, [currentSymbol, hasSymbol, pathname, preservedEntries]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">SET Financial Report</h1>
          <p className="text-sm text-slate-500">Symbol: {hasSymbol ? currentSymbol : "—"}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleShare}
            disabled={!hasSymbol}
            className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition duration-300 ${
              hasSymbol
                ? copied
                  ? "scale-95 border-emerald-300 bg-emerald-500 text-white shadow-sm animate-pulse"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
            }`}
          >
            {copied ? "Link Copied!" : "Share Link"}
          </button>

          <SymbolSearchForm
            key={`nav-${currentSymbol || "blank"}`}
            initialSymbol={currentSymbol}
            preservedParams={preservedEntries}
            variant="compact"
          />
        </div>
      </div>

      <nav className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const linkHref = hasSymbol ? { pathname: item.href, query: { symbol: currentSymbol } } : item.href;
          return (
            <Link
              key={item.href}
              href={linkHref}
              className={`rounded-full border px-4 py-1.5 transition ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
