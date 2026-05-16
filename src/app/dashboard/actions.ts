"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function dashboardError(message: string): never {
  redirect(`/dashboard?dashboard_error=${encodeURIComponent(message)}`);
}

function normalizeUsername(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export async function updateShareMode(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const shareMode = String(formData.get("shareMode") ?? "");

  if (!yearbookId || !["link", "invite_only"].includes(shareMode)) {
    dashboardError("Invalid share mode request.");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("yearbooks")
    .update({ share_mode: shareMode })
    .eq("id", yearbookId);

  if (error) {
    dashboardError(error.message);
  }

  revalidatePath("/dashboard");
}

export async function addInvite(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const username = normalizeUsername(String(formData.get("username") ?? ""));

  if (!yearbookId || !username) {
    dashboardError("Enter a username to invite.");
  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    dashboardError("Usernames can only contain lowercase letters, numbers, and underscores.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: invitedProfile, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle<{ id: string }>();

  if (lookupError) {
    dashboardError(lookupError.message);
  }

  if (!invitedProfile) {
    dashboardError("No user found with that username.");
  }

  const invitedUserId = invitedProfile?.id;

  if (!invitedUserId) {
    dashboardError("No user found with that username.");
  }

  if (invitedUserId === user.id) {
    dashboardError("You cannot invite yourself to your own yearbook.");
  }

  const { error } = await supabase.from("yearbook_invites").insert({
    yearbook_id: yearbookId,
    invited_user_id: invitedUserId,
  });

  if (error) {
    dashboardError(error.message);
  }

  revalidatePath("/dashboard");
}

export async function revokeInvite(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const invitedUserId = String(formData.get("invitedUserId") ?? "");

  if (!yearbookId || !invitedUserId) {
    dashboardError("Invalid invite revoke request.");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("yearbook_invites")
    .delete()
    .eq("yearbook_id", yearbookId)
    .eq("invited_user_id", invitedUserId);

  if (error) {
    dashboardError(error.message);
  }

  revalidatePath("/dashboard");
}
