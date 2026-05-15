"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateShareMode(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const shareMode = String(formData.get("shareMode") ?? "");

  if (!yearbookId || !["link", "invite_only"].includes(shareMode)) {
    redirect("/dashboard?dashboard_error=Invalid share mode request.");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("yearbooks")
    .update({ share_mode: shareMode })
    .eq("id", yearbookId);

  if (error) {
    redirect(`/dashboard?dashboard_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
}

export async function addInvite(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const invitedUserId = String(formData.get("invitedUserId") ?? "");

  if (!yearbookId || !invitedUserId) {
    redirect("/dashboard?dashboard_error=Enter a user ID to invite.");
  }

  const supabase = createClient();
  const { error } = await supabase.from("yearbook_invites").insert({
    yearbook_id: yearbookId,
    invited_user_id: invitedUserId,
  });

  if (error) {
    redirect(`/dashboard?dashboard_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
}

export async function revokeInvite(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const invitedUserId = String(formData.get("invitedUserId") ?? "");

  if (!yearbookId || !invitedUserId) {
    redirect("/dashboard?dashboard_error=Invalid invite revoke request.");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("yearbook_invites")
    .delete()
    .eq("yearbook_id", yearbookId)
    .eq("invited_user_id", invitedUserId);

  if (error) {
    redirect(`/dashboard?dashboard_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
}
