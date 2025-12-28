import axios, { type AxiosInstance } from "axios";
import vm from "vm";

const BASE_URL = "https://www.set.or.th";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

type NuxtState = Record<string, unknown>;

type QuoteState = {
  info?: Record<string, unknown>;
};

export type QuoteInfo = {
  nameTH?: string;
  nameEN?: string;
  last?: number;
  change?: number;
  percentChange?: number;
};

export type SetSession = {
  cookies: string;
  referer: string;
  nuxtState: NuxtState;
};

export async function createSetSession(relativePath: string): Promise<SetSession> {
  const normalizedPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const url = `${BASE_URL}${normalizedPath}`;

  const pageResponse = await axios.get<string>(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  const rawCookies = pageResponse.headers["set-cookie"];
  const cookies = Array.isArray(rawCookies)
    ? rawCookies.map((cookie) => cookie.split(";")[0]).join("; ")
    : "";

  if (!cookies) {
    throw new Error("SET session cookie unavailable");
  }

  const nuxtMatch = pageResponse.data.match(/window\.__NUXT__=([\s\S]*?)<\/script>/);
  if (!nuxtMatch) {
    throw new Error("Nuxt state not found in page payload");
  }

  const sandbox = {
    window: {} as { __NUXT__?: { state?: NuxtState } },
    self: {},
    location: { href: BASE_URL },
  } satisfies Record<string, unknown>;

  vm.createContext(sandbox);
  vm.runInContext(`window.__NUXT__=${nuxtMatch[1]}`, sandbox);

  const nuxtState = sandbox.window.__NUXT__?.state ?? {};

  return {
    cookies,
    referer: url,
    nuxtState,
  };
}

export function extractQuoteInfo(state: NuxtState): QuoteInfo | null {
  const quoteState = state.quote;
  if (!quoteState || typeof quoteState !== "object") {
    return null;
  }

  const info = (quoteState as QuoteState).info;
  if (!info || typeof info !== "object") {
    return null;
  }

  return {
    nameTH: typeof info.nameTH === "string" ? info.nameTH : undefined,
    nameEN: typeof info.nameEN === "string" ? info.nameEN : undefined,
    last: typeof info.last === "number" ? info.last : undefined,
    change: typeof info.change === "number" ? info.change : undefined,
    percentChange: typeof info.percentChange === "number" ? info.percentChange : undefined,
  };
}

export function createSetApiClient(session: SetSession): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: session.referer,
      "X-Requested-With": "XMLHttpRequest",
      Cookie: session.cookies,
    },
  });
}

export type FinancialStatementType = "balance_sheet" | "income_statement" | "cash_flow";

export async function fetchFinancialStatement(
  client: AxiosInstance,
  symbol: string,
  accountType: FinancialStatementType,
  lang: string = "th",
) {
  const { data } = await client.get(`/api/set/stock/${symbol}/financialstatement`, {
    params: { accountType, lang },
  });
  return data;
}

export async function fetchLatestFinancialSummary(
  client: AxiosInstance,
  symbol: string,
  lang: string = "th",
) {
  const { data } = await client.get(`/api/set/stock/${symbol}/financialstatement/latest-full-financialstatement`, {
    params: { lang },
  });
  return data;
}

export async function fetchFinancialHighlights(
  client: AxiosInstance,
  symbol: string,
  lang: string = "th",
) {
  const { data } = await client.get(`/api/set/stock/${symbol}/company-highlight/financial-data`, {
    params: { lang },
  });
  return data;
}

export async function fetchFinancialHealth(
  client: AxiosInstance,
  symbol: string,
  lang: string = "th",
) {
  const { data } = await client.get(`/api/set/stock/${symbol}/financial-health`, {
    params: { lang },
  });
  return data;
}
