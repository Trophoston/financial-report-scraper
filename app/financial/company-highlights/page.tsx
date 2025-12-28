import { FinancialHeader } from "@/components/FinancialHeader";
import { SymbolSearchForm } from "@/components/SymbolSearchForm";
import {
  createSetApiClient,
  createSetSession,
  extractQuoteInfo,
  fetchFinancialHighlights,
  fetchLatestFinancialSummary,
} from "@/lib/setClient";
import { extractPreservedParams, extractSymbolInput, resolveSymbol } from "@/lib/symbol";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type HighlightRecord = {
  asOfDate?: string;
  endDate?: string;
  quarter?: string;
  year?: number;
  totalAsset?: number | null;
  totalLiability?: number | null;
  equity?: number | null;
  totalRevenue?: number | null;
  netProfit?: number | null;
  ebitda?: number | null;
  eps?: number | null;
  roa?: number | null;
  roe?: number | null;
  netProfitMargin?: number | null;
  currentRatio?: number | null;
  deRatio?: number | null;
};

type MetricKey =
  | "totalAsset"
  | "totalLiability"
  | "equity"
  | "totalRevenue"
  | "netProfit"
  | "ebitda"
  | "eps"
  | "roa"
  | "roe"
  | "netProfitMargin"
  | "currentRatio"
  | "deRatio";

type MetricFormat = "amount" | "decimal" | "percent";

type MetricConfig = {
  key: MetricKey;
  label: string;
  format: MetricFormat;
};

const METRICS: MetricConfig[] = [
  { key: "totalAsset", label: "Total Assets", format: "amount" },
  { key: "totalLiability", label: "Total Liabilities", format: "amount" },
  { key: "equity", label: "Shareholders' Equity", format: "amount" },
  { key: "totalRevenue", label: "Total Revenue", format: "amount" },
  { key: "netProfit", label: "Net Profit", format: "amount" },
  { key: "ebitda", label: "EBITDA", format: "amount" },
  { key: "eps", label: "Earnings Per Share", format: "decimal" },
  { key: "roa", label: "ROA", format: "percent" },
  { key: "roe", label: "ROE", format: "percent" },
  { key: "netProfitMargin", label: "Net Profit Margin", format: "percent" },
  { key: "currentRatio", label: "Current Ratio", format: "decimal" },
  { key: "deRatio", label: "Debt to Equity", format: "decimal" },
];

function formatPeriod(record: HighlightRecord): string {
  const isoDate = record.asOfDate ?? record.endDate;
  if (isoDate) {
    return new Date(isoDate).toLocaleDateString("th-TH", { year: "numeric", month: "short" });
  }
  if (typeof record.year === "number") {
    return `FY ${record.year}`;
  }
  return "-";
}

function formatMetricValue(record: HighlightRecord, config: MetricConfig): string {
  const rawValue = record[config.key];
  if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
    return "-";
  }

  switch (config.format) {
    case "amount":
      return amountFormatter.format(rawValue);
    case "percent":
      return `${decimalFormatter.format(rawValue)}%`;
    case "decimal":
    default:
      return decimalFormatter.format(rawValue);
  }
}

export default async function CompanyHighlightsPage({ searchParams }: PageProps) {
  const preservedParams = extractPreservedParams(searchParams);
  const initialSymbol = extractSymbolInput(searchParams);
  const symbol = await resolveSymbol(searchParams);

  if (!symbol) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-slate-900">ค้นหาหุ้นในตลาดหลักทรัพย์</h2>
          <p className="text-sm text-slate-500">กรอกสัญลักษณ์หุ้น (เช่น AOT, SCC, KBANK) เพื่อดูข้อมูลไฮไลท์</p>
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
  const refererPath = `/th/market/product/stock/quote/${symbol}/financial-statement/company-highlights`;

  let session;
  try {
    session = await createSetSession(refererPath);
  } catch (error) {
    console.error("Failed to create SET session", error);
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
        ไม่สามารถดึงข้อมูลสำหรับสัญลักษณ์ {symbol} ได้ในขณะนี้
      </div>
    );
  }

  const api = createSetApiClient(session);

  const [latestSummary, highlightData] = await Promise.all([
    fetchLatestFinancialSummary(api, symbol).catch((error) => {
      console.error("Failed to fetch latest summary", error);
      return null;
    }),
    fetchFinancialHighlights(api, symbol).catch((error) => {
      console.error("Failed to fetch financial highlights", error);
      return [];
    }),
  ]);

  const quoteInfo = extractQuoteInfo(session.nuxtState);
  const companyName = quoteInfo?.nameTH?.trim() || quoteInfo?.nameEN?.trim() || symbol;
  const price = typeof quoteInfo?.last === "number" ? quoteInfo.last : null;
  const priceChange = typeof quoteInfo?.change === "number" ? quoteInfo.change : null;
  const percentChange = typeof quoteInfo?.percentChange === "number" ? quoteInfo.percentChange : null;

  const highlights: HighlightRecord[] = Array.isArray(highlightData)
    ? [...highlightData]
    : [];

  highlights.sort((a, b) => {
    const dateA = new Date(a.asOfDate ?? a.endDate ?? 0).getTime();
    const dateB = new Date(b.asOfDate ?? b.endDate ?? 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className="flex flex-col gap-8">
      <FinancialHeader
        heading="Company Highlights"
        companyName={companyName}
        periodLabel={typeof latestSummary?.fsTypeDescription === "string" ? latestSummary.fsTypeDescription : undefined}
        periodDate={typeof latestSummary?.endDate === "string" ? latestSummary.endDate : undefined}
        downloadUrl={typeof latestSummary?.downloadUrl === "string" ? latestSummary.downloadUrl : undefined}
        price={price}
        priceChange={priceChange}
        percentChange={percentChange}
      />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-1 border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Key Metrics Overview</h3>
          <p className="text-xs text-slate-500">ตัวเลขจากงบการเงินรวม (หน่วย: ล้านบาท)</p>
        </header>
        {highlights.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-500">ไม่พบข้อมูลไฮไลท์ของบริษัท</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-6 py-3 font-medium">รายการ</th>
                  {highlights.map((record, index) => (
                    <th key={index} className="px-6 py-3 text-right font-medium">
                      {formatPeriod(record)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric) => (
                  <tr key={metric.key} className="border-t border-slate-100">
                    <td className="px-6 py-3 text-slate-700">{metric.label}</td>
                    {highlights.map((record, index) => (
                      <td key={index} className="px-6 py-3 text-right text-slate-900">
                        {formatMetricValue(record, metric)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
