import { FinancialHeader } from "@/components/FinancialHeader";
import { StatementTable } from "@/components/StatementTable";
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

export default async function LatestIncomePage({ searchParams }: PageProps) {
  const preservedParams = extractPreservedParams(searchParams);
  const initialSymbol = extractSymbolInput(searchParams);
  const symbol = await resolveSymbol(searchParams);

  if (!symbol) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-slate-900">ค้นหารายได้และกำไรสุทธิ</h2>
          <p className="text-sm text-slate-500">พิมพ์สัญลักษณ์หุ้น SET เพื่อดูงบกำไรขาดทุนล่าสุด</p>
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
  const refererPath = `/th/market/product/stock/quote/${symbol}/financial-statement/latest/income`;

  let session;
  try {
    session = await createSetSession(refererPath);
  } catch (error) {
    console.error("Failed to create SET session", error);
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
        ไม่สามารถดึงงบกำไรขาดทุนสำหรับสัญลักษณ์ {symbol} ได้ในขณะนี้
      </div>
    );
  }

  const api = createSetApiClient(session);
  const statement = await fetchFinancialStatement(api, symbol, "income_statement").catch((error) => {
    console.error("Failed to fetch income statement", error);
    return null;
  });

  const quoteInfo = extractQuoteInfo(session.nuxtState);
  const companyName = quoteInfo?.nameTH?.trim() || quoteInfo?.nameEN?.trim() || symbol;
  const price = typeof quoteInfo?.last === "number" ? quoteInfo.last : null;
  const priceChange = typeof quoteInfo?.change === "number" ? quoteInfo.change : null;
  const percentChange = typeof quoteInfo?.percentChange === "number" ? quoteInfo.percentChange : null;

  const rows = normalizeAccounts(statement?.accounts);

  return (
    <div className="flex flex-col gap-8">
      <FinancialHeader
        heading="Latest Income Statement"
        companyName={companyName}
        periodLabel={typeof statement?.fsTypeDescription === "string" ? statement.fsTypeDescription : undefined}
        periodDate={typeof statement?.endDate === "string" ? statement.endDate : undefined}
        downloadUrl={typeof statement?.downloadUrl === "string" ? statement.downloadUrl : undefined}
        price={price}
        priceChange={priceChange}
        percentChange={percentChange}
      />

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">ไม่พบข้อมูลงบกำไรขาดทุน</p>
      ) : (
        <StatementTable title="งบกำไรขาดทุนเบ็ดเสร็จ" rows={rows} />
      )}
    </div>
  );
}
