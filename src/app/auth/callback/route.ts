import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") ?? "/dashboard";
  const authError =
    requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");

  if (authError) {
    const params = new URLSearchParams({ auth_error: authError });
    return NextResponse.redirect(new URL(`/login?${params.toString()}`, requestUrl.origin));
  }

  if (!code || !hasSupabaseEnv) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const safeNext = nextPath.startsWith("/") ? nextPath : "/dashboard";
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  let response = NextResponse.redirect(new URL(safeNext, requestUrl.origin));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("auth_error", error.message);
    response = NextResponse.redirect(loginUrl);
  }

  return response;
}
