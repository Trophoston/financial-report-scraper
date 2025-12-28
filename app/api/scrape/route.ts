import axios from "axios";
import * as cheerio from "cheerio";
import { NextResponse } from "next/server";

export async function GET() {
  const url = "https://example.com";

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const $ = cheerio.load(data);

  const title = $("title").text();
  const headings = $("h1")
    .map((_, el) => $(el).text())
    .get();

  return NextResponse.json({
    title,
    headings
  });
}