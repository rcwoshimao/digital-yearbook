import { NextResponse } from "next/server";

type RouteContext = {
  params: {
    ownerId: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  return NextResponse.json(
    {
      ownerId: params.ownerId,
      message: "Yearbook fetching will be connected after Supabase auth is configured.",
    },
    { status: 501 },
  );
}
