import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Authored entries will be connected after Supabase auth is configured." },
    { status: 501 },
  );
}
