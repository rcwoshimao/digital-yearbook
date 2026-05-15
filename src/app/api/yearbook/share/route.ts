import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Share mode updates will be connected after Supabase auth is configured." },
    { status: 501 },
  );
}
