export type StatementRow = {
  code: string;
  name: string;
  level: number;
  amount: number | null;
  format: string;
};

type StatementTableProps = {
  title?: string;
  rows: StatementRow[];
  unitLabel?: string;
};

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function StatementTable({ title, rows, unitLabel = "จำนวน (บาท)" }: StatementTableProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {title && (
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{rows.length} รายการ</span>
        </header>
      )}
      <div className="px-2 pb-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-slate-500">
              <th className="py-3 pl-4 text-left font-medium">บัญชี</th>
              <th className="py-3 pr-4 text-right font-medium">{unitLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const amountDisplay = typeof row.amount === "number" && Number.isFinite(row.amount)
                ? numberFormatter.format(row.amount)
                : "-";

              return (
                <tr key={row.code} className="border-t border-slate-100">
                  <td
                    className="py-2 pl-4 pr-3 text-slate-700"
                    style={{
                      paddingLeft: `${Math.max(0, row.level) * 16 + 16}px`,
                      fontWeight: row.format.includes("B") ? 600 : 400,
                    }}
                  >
                    {row.name}
                  </td>
                  <td className="py-2 pr-4 text-right text-slate-900">{amountDisplay}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
