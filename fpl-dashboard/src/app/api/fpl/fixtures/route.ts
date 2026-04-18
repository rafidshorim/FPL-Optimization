import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FPL_BASE = "https://fantasy.premierleague.com/api";

export async function GET() {
  try {
    const res = await fetch(`${FPL_BASE}/fixtures/`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FPLDashboard/1.0)" },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream_error", message: `FPL API returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "upstream_error", message }, { status: 502 });
  }
}
