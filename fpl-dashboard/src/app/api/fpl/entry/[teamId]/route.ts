import { NextResponse } from "next/server";

const FPL_BASE = "https://fantasy.premierleague.com/api";

export async function GET(
  _req: Request,
  { params }: { params: { teamId: string } }
) {
  const { teamId } = params;

  if (!teamId || isNaN(Number(teamId))) {
    return NextResponse.json({ error: "invalid_team_id" }, { status: 400 });
  }

  try {
    const res = await fetch(`${FPL_BASE}/entry/${teamId}/`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FPLDashboard/1.0)" },
      cache: "no-store",
    });

    if (res.status === 404) {
      return NextResponse.json(
        { error: "not_found", message: "Team ID not found. Check your FPL team ID." },
        { status: 404 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream_error", message: `FPL API returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "upstream_error", message }, { status: 502 });
  }
}
