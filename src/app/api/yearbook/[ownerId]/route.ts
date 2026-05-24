import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    ownerId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { ownerId } = await params;

  return NextResponse.json(
    {
      ownerId,
      message: "Yearbook fetching will be connected after Supabase auth is configured.",
    },
    { status: 501 },
  );
}
