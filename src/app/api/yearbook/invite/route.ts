import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Invite creation will be connected after Supabase auth is configured." },
    { status: 501 },
  );
}
