type FinancialHeaderProps = {
  heading: string;
  companyName: string;
  periodLabel?: string;
  periodDate?: string;
  downloadUrl?: string;
  price?: number | null;
  priceChange?: number | null;
  percentChange?: number | null;
};

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function FinancialHeader({
  heading,
  companyName,
  periodLabel,
  periodDate,
  downloadUrl,
  price,
  priceChange,
  percentChange,
}: FinancialHeaderProps) {
  const formattedDate = periodDate ? new Date(periodDate).toLocaleDateString("th-TH") : null;
  const showPrice = typeof price === "number" && Number.isFinite(price);
  const showChange =
    showPrice && typeof priceChange === "number" && Number.isFinite(priceChange) && typeof percentChange === "number" && Number.isFinite(percentChange);

  return (
    <header className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-300">{heading}</p>
      <h2 className="mt-2 text-3xl font-semibold leading-tight">{companyName}</h2>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          {showPrice && (
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-300">ราคาปัจจุบัน</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-semibold">{currencyFormatter.format(price)}</span>
                {showChange && (
                  <span
                    className={`text-sm font-medium ${
                      (priceChange ?? 0) > 0
                        ? "text-emerald-300"
                        : (priceChange ?? 0) < 0
                          ? "text-rose-300"
                          : "text-slate-200"
                    }`}
                  >
                    {priceChange! > 0 ? "+" : ""}
                    {priceChange!.toFixed(2)} ({percentChange! > 0 ? "+" : ""}
                    {percentChange!.toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
            {periodLabel && <span className="rounded-full bg-white/10 px-3 py-1">{periodLabel}</span>}
            {formattedDate && <span className="rounded-full bg-white/10 px-3 py-1">{formattedDate}</span>}
          </div>
        </div>

        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            ดาวน์โหลดรายงาน
          </a>
        )}
      </div>
    </header>
  );
}
