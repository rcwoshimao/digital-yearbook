import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function redirectDevToLocalhost(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const host = request.nextUrl.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  const url = request.nextUrl.clone();
  url.protocol = "http:";
  url.hostname = "localhost";
  url.port = "3000";

  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const devRedirect = redirectDevToLocalhost(request);
  if (devRedirect) {
    return devRedirect;
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/callback).*)"],
};
