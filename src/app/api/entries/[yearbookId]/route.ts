import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    yearbookId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { yearbookId } = await params;

  return NextResponse.json(
    {
      yearbookId,
      message: "Received entries will be connected after Supabase auth is configured.",
    },
    { status: 501 },
  );
}
