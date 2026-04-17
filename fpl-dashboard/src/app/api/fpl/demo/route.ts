import { NextResponse } from "next/server";
import { demoBootstrap, demoFixtures, demoPicksResponse, demoEntry, DEMO_GW } from "@/lib/demo/demo-data";

export async function GET() {
  return NextResponse.json(
    {
      bootstrap: demoBootstrap,
      fixtures: demoFixtures,
      picks: demoPicksResponse,
      entry: demoEntry,
      currentGW: DEMO_GW,
    },
    {
      headers: { "Cache-Control": "public, max-age=86400" },
    }
  );
}
