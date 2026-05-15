import { NextResponse } from "next/server";

type RouteContext = {
  params: {
    invitedUserId: string;
  };
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  return NextResponse.json(
    {
      invitedUserId: params.invitedUserId,
      message: "Invite revocation will be connected after Supabase auth is configured.",
    },
    { status: 501 },
  );
}
