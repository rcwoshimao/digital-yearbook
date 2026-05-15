import { NextResponse } from "next/server";

type RouteContext = {
  params: {
    yearbookId: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  return NextResponse.json(
    {
      yearbookId: params.yearbookId,
      message: "Received entries will be connected after Supabase auth is configured.",
    },
    { status: 501 },
  );
}
