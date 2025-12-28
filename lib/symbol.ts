type SearchValue = string | string[] | undefined;

function normalizeCandidate(value: SearchValue): string | null {
  if (Array.isArray(value)) {
    return value.length > 0 ? value[0] ?? null : null;
  }
  if (typeof value === "string") {
    return value;
  }
  return null;
}

type SearchParamsRecord = Record<string, SearchValue | undefined>;

function isPromise<T>(value: unknown): value is Promise<T> {
  return !!value && typeof (value as Promise<unknown>).then === "function";
}

export async function unwrapSearchParams(
  searchParams: SearchParamsRecord | Promise<SearchParamsRecord> | undefined,
): Promise<SearchParamsRecord | undefined> {
  if (isPromise<SearchParamsRecord>(searchParams)) {
    return await searchParams;
  }
  return searchParams;
}

export async function resolveSymbol(
  searchParams: SearchParamsRecord | Promise<SearchParamsRecord> | undefined,
  fallback?: string,
): Promise<string | null> {
  const fallbackUpper = fallback ? fallback.trim().toUpperCase() : null;
  const resolvedParams = await unwrapSearchParams(searchParams);
  const priorities = ["symbol", "id", "ticker", "code"];

  for (const key of priorities) {
    const candidate = normalizeCandidate(resolvedParams?.[key]);
    if (candidate) {
      const sanitized = candidate
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9.]/g, "");
      if (sanitized) {
        return sanitized;
      }
    }
  }

  return fallbackUpper;
}

export function extractPreservedParams(
  searchParams?: SearchParamsRecord,
  exclude: string[] = ["symbol", "id"],
): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  if (!searchParams) {
    return entries;
  }

  const excluded = new Set(exclude.map((key) => key.toLowerCase()));

  for (const [rawKey, rawValue] of Object.entries(searchParams)) {
    if (excluded.has(rawKey.toLowerCase())) {
      continue;
    }

    if (Array.isArray(rawValue)) {
      rawValue.forEach((value) => {
        if (typeof value === "string" && value.length > 0) {
          entries.push([rawKey, value]);
        }
      });
      continue;
    }

    if (typeof rawValue === "string" && rawValue.length > 0) {
      entries.push([rawKey, rawValue]);
    }
  }

  return entries;
}

export function extractSymbolInput(searchParams?: SearchParamsRecord): string {
  const candidate = normalizeCandidate(searchParams?.symbol);
  return candidate ? candidate.toUpperCase() : "";
}
