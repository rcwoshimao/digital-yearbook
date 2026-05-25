import { redirect } from "next/navigation";
import { LoginFeatures } from "@/components/login/login-features";
import { LoginHero } from "@/components/login/login-hero";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main
      className="relative overflow-x-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/assets/background.jpg)" }}
    >
      <LoginHero isConfigured={hasSupabaseEnv} />
      <div id="features">
        <LoginFeatures />
      </div>
    </main>
  );
}
