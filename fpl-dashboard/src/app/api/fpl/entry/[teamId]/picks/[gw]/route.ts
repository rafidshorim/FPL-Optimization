import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FPL_BASE = "https://fantasy.premierleague.com/api";

export async function GET(
  _req: Request,
  { params }: { params: { teamId: string; gw: string } }
) {
  const { teamId, gw } = params;

  try {
    const res = await fetch(`${FPL_BASE}/entry/${teamId}/event/${gw}/picks/`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FPLDashboard/1.0)" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream_error", message: `FPL API returned ${res.status}` },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "upstream_error", message }, { status: 502 });
  }
}
