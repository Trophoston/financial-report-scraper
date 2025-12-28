import type { StatementRow } from "@/components/StatementTable";

type RawAccount = {
  accountCode?: string;
  accountName?: string;
  amount?: number | null;
  divider?: number | null;
  level?: number | null;
  format?: string | null;
};

function toNumber(value: number | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

export function normalizeAccounts(accounts: RawAccount[] | null | undefined): StatementRow[] {
  if (!accounts || !Array.isArray(accounts)) {
    return [];
  }

  return accounts
    .filter((account) => account.amount !== null && account.amount !== undefined)
    .map((account) => {
      const rawAmount = toNumber(account.amount);
      const divider = typeof account.divider === "number" && Number.isFinite(account.divider) ? account.divider : 1;
      const amount = rawAmount === null ? null : rawAmount * divider;

      return {
        code: account.accountCode ?? "",
        name: account.accountName ?? "",
        level: typeof account.level === "number" ? account.level : 0,
        amount,
        format: account.format ?? "",
      } satisfies StatementRow;
    })
    .filter((row) => row.code !== "" && row.name !== "");
}
