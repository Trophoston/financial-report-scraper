import { FinancialHeader } from "@/components/FinancialHeader";
import { SymbolSearchForm } from "@/components/SymbolSearchForm";
import {
  createSetApiClient,
  createSetSession,
  extractQuoteInfo,
  fetchFinancialHealth,
} from "@/lib/setClient";
import { extractPreservedParams, extractSymbolInput, resolveSymbol } from "@/lib/symbol";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type FinancialHealthValue = {
  asOfDate?: string | null;
  year?: number | null;
  quarter?: string | null;
  amount?: number | null;
  change?: number | null;
};

type FinancialHealthAccount = {
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  displayFormat?: string | null;
  changeType?: string | null;
  changeUnit?: string | null;
  values?: (FinancialHealthValue | null | undefined)[] | null;
};

type FinancialHealthCategory = {
  name?: string | null;
  description?: string | null;
  accounts?: (FinancialHealthAccount | null | undefined)[] | null;
};

type FinancialHealthTheme = {
  name?: string | null;
  categories?: (FinancialHealthCategory | null | undefined)[] | null;
};

type FinancialHealthResponse = {
  remark?: string | null;
  themes?: (FinancialHealthTheme | null | undefined)[] | null;
  periods?: unknown;
};

function isTruthy<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function getFractionDigits(format?: string | null): number {
  if (!format) {
    return 2;
  }
  const parts = format.split(".");
  if (parts.length < 2) {
    return 0;
  }
  return parts[1].replace(/[^0-9]/g, "").length;
}

function formatPeriodLabel(value: { quarter?: string | null; year?: number | null; asOfDate?: string | null }): string {
  const periodLabel = value.quarter ? `${value.quarter} ${value.year ?? ""}`.trim() : value.year?.toString();
  if (value.asOfDate) {
    const dateLabel = new Date(value.asOfDate).toLocaleDateString("th-TH", { year: "numeric", month: "short" });
    return periodLabel ? `${periodLabel} (${dateLabel})` : dateLabel;
  }
  return periodLabel ?? "-";
}

function formatAmount(amount: unknown, fractionDigits: number): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "-";
  }
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return formatter.format(amount);
}

function formatChange(value: unknown, type?: string | null, unit?: string | null, fractionDigits: number = 2): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  const formatted = formatAmount(value, fractionDigits);
  if (type === "P" || unit === "%") {
    return `${formatted}%`;
  }
  if (unit) {
    return `${formatted} ${unit}`.trim();
  }
  return formatted;
}

export default async function FinancialAnalysisPage({ searchParams }: PageProps) {
  const preservedParams = extractPreservedParams(searchParams);
  const initialSymbol = extractSymbolInput(searchParams);
  const symbol = await resolveSymbol(searchParams);

  if (!symbol) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-slate-900">วิเคราะห์งบการเงินบริษัท</h2>
          <p className="text-sm text-slate-500">ระบุสัญลักษณ์หุ้นเพื่อดูมุมมองการวิเคราะห์เชิงลึกจาก SET</p>
        </div>
        <SymbolSearchForm
          key={`hero-${initialSymbol || "blank"}`}
          initialSymbol={initialSymbol}
          preservedParams={preservedParams}
          variant="hero"
        />
      </div>
    );
  }
  const refererPath = `/th/market/product/stock/quote/${symbol}/financial-statement/financial-statements-analysis`;

  let session;
  try {
    session = await createSetSession(refererPath);
  } catch (error) {
    console.error("Failed to create SET session", error);
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
        ไม่สามารถดึงข้อมูลการวิเคราะห์สำหรับสัญลักษณ์ {symbol} ได้ในขณะนี้
      </div>
    );
  }

  const api = createSetApiClient(session);
  const health = await fetchFinancialHealth(api, symbol).catch((error) => {
    console.error("Failed to fetch financial health", error);
    return null;
  });

  const quoteInfo = extractQuoteInfo(session.nuxtState);
  const companyName = quoteInfo?.nameTH?.trim() || quoteInfo?.nameEN?.trim() || symbol;
  const price = typeof quoteInfo?.last === "number" ? quoteInfo.last : null;
  const priceChange = typeof quoteInfo?.change === "number" ? quoteInfo.change : null;
  const percentChange = typeof quoteInfo?.percentChange === "number" ? quoteInfo.percentChange : null;

  const healthData = health as FinancialHealthResponse | null;
  const themes = Array.isArray(healthData?.themes) ? healthData.themes.filter(isTruthy) : [];
  const remark = typeof healthData?.remark === "string" ? healthData.remark : null;
  const hasPeriods = Array.isArray(healthData?.periods) && healthData.periods.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <FinancialHeader
        heading="Financial Statements Analysis"
        companyName={companyName}
        periodLabel={hasPeriods ? "ข้อมูลหลายงวด" : undefined}
        downloadUrl={undefined}
        price={price}
        priceChange={priceChange}
        percentChange={percentChange}
      />

      {remark && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{remark}</p>}

      {themes.length === 0 ? (
        <p className="text-sm text-slate-500">ไม่พบข้อมูลการวิเคราะห์งบการเงิน</p>
      ) : (
        themes.map((theme, themeIndex) => (
          <section
            key={typeof theme?.name === "string" ? theme.name : `theme-${themeIndex}`}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <header className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">{theme.name ?? "หัวข้อ"}</h3>
            </header>
            <div className="space-y-6 px-6 py-6">
              {(() => {
                const categories = Array.isArray(theme.categories)
                  ? theme.categories.filter(isTruthy)
                  : [];
                if (categories.length === 0) {
                  return <p className="text-sm text-slate-500">ไม่มีหมวดข้อมูลในหัวข้อนี้</p>;
                }
                return categories.map((category, categoryIndex) => (
                  <article
                    key={typeof category?.name === "string" ? category.name : `category-${themeIndex}-${categoryIndex}`}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-5"
                  >
                    <div className="flex flex-col gap-2">
                      <h4 className="text-base font-semibold text-slate-900">{category.name ?? "หมวด"}</h4>
                      {category.description && (
                        <p className="text-sm text-slate-600">{category.description}</p>
                      )}
                    </div>
                    <div className="mt-4 space-y-4">
                      {(() => {
                        const accounts = Array.isArray(category.accounts)
                          ? category.accounts.filter(isTruthy)
                          : [];
                        if (accounts.length === 0) {
                          return <p className="text-sm text-slate-500">ไม่มีข้อมูลรายละเอียดในหมวดนี้</p>;
                        }

                        return accounts.map((account, accountIndex) => {
                          const digits = getFractionDigits(account.displayFormat);
                          const values = Array.isArray(account.values)
                            ? account.values.filter(isTruthy)
                            : [];
                          values.sort(
                            (a, b) =>
                              new Date(b?.asOfDate ?? 0).getTime() - new Date(a?.asOfDate ?? 0).getTime(),
                          );
                          const showChange = values.some((value) => typeof value?.change === "number");

                          return (
                            <div
                              key={
                                typeof account?.code === "string"
                                  ? account.code
                                  : typeof account?.name === "string"
                                    ? `${account.name}-${accountIndex}`
                                    : `account-${themeIndex}-${categoryIndex}-${accountIndex}`
                              }
                              className="rounded-lg border border-slate-200 bg-white p-4"
                            >
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-500">{account.unit ?? ""}</span>
                                <h5 className="text-base font-semibold text-slate-900">{account.name ?? ""}</h5>
                              </div>
                              {values.length === 0 ? (
                                <p className="mt-3 text-sm text-slate-500">ไม่มีข้อมูลในหมวดนี้</p>
                              ) : (
                                <div className="mt-3 overflow-x-auto">
                                  <table className="w-full border-collapse text-sm">
                                    <thead>
                                      <tr className="text-left text-slate-500">
                                        <th className="py-2 pr-4 font-medium">งวด</th>
                                        <th className="py-2 pr-4 text-right font-medium">มูลค่า</th>
                                        {showChange && (
                                          <th className="py-2 pr-4 text-right font-medium">การเปลี่ยนแปลง</th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {values.map((value, valueIndex) => (
                                        <tr
                                          key={
                                            typeof value?.asOfDate === "string"
                                              ? `${account?.code ?? accountIndex}-${value.asOfDate}`
                                              : `${account?.code ?? accountIndex}-${value?.year ?? valueIndex}`
                                          }
                                          className="border-t border-slate-100"
                                        >
                                          <td className="py-2 pr-4 text-slate-700">{formatPeriodLabel(value)}</td>
                                          <td className="py-2 pr-4 text-right text-slate-900">
                                            {formatAmount(value?.amount, digits)}
                                          </td>
                                          {showChange && (
                                            <td className="py-2 pr-4 text-right text-slate-900">
                                              {formatChange(value?.change, account.changeType, account.changeUnit, digits)}
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </article>
                ))
              })()}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
