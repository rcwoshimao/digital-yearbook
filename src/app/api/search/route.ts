import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return NextResponse.json(
    {
      query: searchParams.get("q") ?? "",
      message: "Entry search will be scoped to the authenticated owner after Supabase is configured.",
    },
    { status: 501 },
  );
}
