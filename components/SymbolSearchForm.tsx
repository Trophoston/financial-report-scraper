'use client';

import { FormEvent, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type SymbolSearchFormProps = {
  initialSymbol?: string | null;
  preservedParams?: Array<[string, string]>;
  variant?: "compact" | "hero";
  className?: string;
};

const VARIANT_STYLES: Record<NonNullable<SymbolSearchFormProps["variant"]>, {
  container: string;
  input: string;
  button: string;
  clear: string;
}> = {
  compact: {
    container:
      "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-slate-300",
    input: "w-36 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400",
    button:
      "rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-slate-700",
    clear:
      "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium uppercase tracking-wider text-slate-500 transition hover:bg-slate-200",
  },
  hero: {
    container:
      "flex w-full max-w-xl items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-4 text-lg shadow-xl transition focus-within:border-slate-300",
    input: "flex-1 bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-400",
    button:
      "rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-700",
    clear:
      "rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 transition hover:bg-slate-200",
  },
};

export function SymbolSearchForm({
  initialSymbol,
  preservedParams = [],
  variant = "compact",
  className = "",
}: SymbolSearchFormProps) {
  const pathname = usePathname();
  const [value, setValue] = useState(() => (initialSymbol ?? "").toUpperCase());
  const inputRef = useRef<HTMLInputElement>(null);

  const classes = useMemo(() => VARIANT_STYLES[variant], [variant]);

  const handleClear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  const handleChange = (event: FormEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    setValue(target.value.toUpperCase());
  };

  const action = pathname ?? "/financial/company-highlights";

  return (
    <form action={action} method="get" className={`${classes.container} ${className}`}>
      {preservedParams.map(([key, paramValue], index) => (
        <input key={`${key}-${index}`} type="hidden" name={key} value={paramValue} />
      ))}
      <input ref={inputRef} name="symbol" value={value} onChange={handleChange} placeholder="Search symbol" className={classes.input} />
      {value && (
        <button type="button" onClick={handleClear} className={classes.clear} aria-label="Clear symbol">
          ×
        </button>
      )}
      <button type="submit" className={classes.button}>
        Search
      </button>
    </form>
  );
}
