import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Entry creation will be connected after Supabase auth and storage are configured." },
    { status: 501 },
  );
}
