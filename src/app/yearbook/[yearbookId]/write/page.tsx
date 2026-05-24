import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type LegacyWritePageProps = {
  params: Promise<{
    yearbookId: string;
  }>;
};

export default async function LegacyWritePage({ params }: LegacyWritePageProps) {
  const { yearbookId } = await params;

  if (!hasSupabaseEnv) {
    redirect("/write");
  }

  const supabase = await createClient();
  const { data: yearbook } = await supabase
    .from("yearbooks")
    .select("owner_id")
    .eq("id", yearbookId)
    .maybeSingle<{ owner_id: string }>();

  if (!yearbook) {
    redirect("/write");
  }

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", yearbook.owner_id)
    .maybeSingle<{ username: string }>();

  if (!ownerProfile?.username) {
    redirect("/write");
  }

  redirect(`/write/${ownerProfile.username}`);
}
