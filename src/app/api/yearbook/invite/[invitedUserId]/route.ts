import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    invitedUserId: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { invitedUserId } = await params;

  return NextResponse.json(
    {
      invitedUserId,
      message: "Invite revocation will be connected after Supabase auth is configured.",
    },
    { status: 501 },
  );
}
