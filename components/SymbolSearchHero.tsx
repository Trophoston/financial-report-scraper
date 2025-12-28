'use client';

import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";

export function SymbolSearchHero({ action }: { action?: string }) {
  const pathname = usePathname();
  const [value, setValue] = useState("");

  const formAction = action ?? pathname ?? "/financial/company-highlights";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!value.trim()) {
      event.preventDefault();
    }
  };

  return (
    <section className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-slate-900">ค้นหาข้อมูลบริษัทใน SET</h2>
        <p className="text-sm text-slate-500">กรอกสัญลักษณ์หุ้น (Ticker) เพื่อดูงบการเงินล่าสุดจากตลาดหลักทรัพย์แห่งประเทศไทย</p>
      </div>
      <form
        action={formAction}
        method="get"
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:gap-2"
      >
        <input
          autoFocus
          aria-label="Stock symbol"
          className="h-14 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-lg uppercase tracking-[0.2em] text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          maxLength={10}
          name="symbol"
          onChange={(event) => setValue(event.target.value)}
          placeholder="เช่น PTT, KBANK"
          required
          value={value}
        />
        <button
          type="submit"
          className="h-14 rounded-xl bg-slate-900 px-8 text-base font-semibold text-white transition hover:bg-slate-700"
        >
          แสดงข้อมูล
        </button>
      </form>
    </section>
  );
}
