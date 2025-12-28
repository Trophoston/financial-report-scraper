import { FinancialHeader } from "@/components/FinancialHeader";
import { StatementTable, type StatementRow } from "@/components/StatementTable";
import { SymbolSearchForm } from "@/components/SymbolSearchForm";
import { normalizeAccounts } from "@/lib/financialStatements";
import {
  createSetApiClient,
  createSetSession,
  extractQuoteInfo,
  fetchFinancialStatement,
} from "@/lib/setClient";
import { extractPreservedParams, extractSymbolInput, resolveSymbol } from "@/lib/symbol";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const CATEGORY_LABELS: Record<string, string> = {
  "1": "สินทรัพย์",
  "2": "หนี้สิน",
  "3": "ส่วนของผู้ถือหุ้น",
};

const CATEGORY_ORDER = ["1", "2", "3", "other"] as const;

type Category = {
  key: (typeof CATEGORY_ORDER)[number];
  title: string;
  rows: StatementRow[];
};

function createCategories(rows: StatementRow[]): Category[] {
  const buckets: Record<Category["key"], StatementRow[]> = {
    "1": [],
    "2": [],
    "3": [],
    other: [],
  };

  rows.forEach((row) => {
    const key = row.code.charAt(0);
    const bucketKey = (CATEGORY_LABELS[key] ? key : "other") as Category["key"];
    buckets[bucketKey].push(row);
  });

  return CATEGORY_ORDER
    .map((key) => ({
      key,
      title: CATEGORY_LABELS[key] ?? "หมวดอื่น ๆ",
      rows: buckets[key],
    }))
    .filter((category) => category.rows.length > 0);
}

export default async function LatestBalancePage({ searchParams }: PageProps) {
  const preservedParams = extractPreservedParams(searchParams);
  const initialSymbol = extractSymbolInput(searchParams);
  const symbol = await resolveSymbol(searchParams);

  if (!symbol) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-slate-900">ค้นหางบดุลบริษัทที่ต้องการ</h2>
          <p className="text-sm text-slate-500">ระบุสัญลักษณ์หุ้นเพื่อดูงบดุลล่าสุดจากตลาดหลักทรัพย์</p>
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
  const refererPath = `/th/market/product/stock/quote/${symbol}/financial-statement/latest/balance`;

  let session;
  try {
    session = await createSetSession(refererPath);
  } catch (error) {
    console.error("Failed to create SET session", error);
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
        ไม่สามารถดึงงบดุลสำหรับสัญลักษณ์ {symbol} ได้ในขณะนี้
      </div>
    );
  }

  const api = createSetApiClient(session);
  const statement = await fetchFinancialStatement(api, symbol, "balance_sheet").catch((error) => {
    console.error("Failed to fetch balance sheet", error);
    return null;
  });

  const quoteInfo = extractQuoteInfo(session.nuxtState);
  const companyName = quoteInfo?.nameTH?.trim() || quoteInfo?.nameEN?.trim() || symbol;
  const price = typeof quoteInfo?.last === "number" ? quoteInfo.last : null;
  const priceChange = typeof quoteInfo?.change === "number" ? quoteInfo.change : null;
  const percentChange = typeof quoteInfo?.percentChange === "number" ? quoteInfo.percentChange : null;

  const rows = normalizeAccounts(statement?.accounts);
  const categories = createCategories(rows);

  return (
    <div className="flex flex-col gap-8">
      <FinancialHeader
        heading="Latest Balance Sheet"
        companyName={companyName}
        periodLabel={typeof statement?.fsTypeDescription === "string" ? statement.fsTypeDescription : undefined}
        periodDate={typeof statement?.endDate === "string" ? statement.endDate : undefined}
        downloadUrl={typeof statement?.downloadUrl === "string" ? statement.downloadUrl : undefined}
        price={price}
        priceChange={priceChange}
        percentChange={percentChange}
      />

      {categories.length === 0 ? (
        <p className="text-sm text-slate-500">ไม่พบข้อมูลงบดุลล่าสุด</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {categories.map((category) => (
            <StatementTable key={category.key} title={category.title} rows={category.rows} />
          ))}
        </div>
      )}
    </div>
  );
}
