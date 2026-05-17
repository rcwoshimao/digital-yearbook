"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsername } from "@/lib/username";

function ownerRedirect(formData: FormData, message: string): never {
  const returnPath = String(formData.get("returnPath") ?? "/dashboard");
  const safePath = returnPath.startsWith("/profile/") || returnPath === "/dashboard" ? returnPath : "/dashboard";
  const param = safePath.startsWith("/profile/") ? "profile_error" : "dashboard_error";
  const separator = safePath.includes("?") ? "&" : "?";
  redirect(`${safePath}${separator}${param}=${encodeURIComponent(message)}`);
}

async function revalidateOwnerViews(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle<{ username: string }>();

    revalidatePath("/dashboard");
    if (profile?.username) {
      revalidatePath(`/profile/${profile.username}`);
    }
  } else {
    revalidatePath("/dashboard");
  }
}

export async function updateShareMode(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const shareMode = String(formData.get("shareMode") ?? "");

  if (!yearbookId || !["link", "invite_only"].includes(shareMode)) {
    ownerRedirect(formData, "Invalid share mode request.");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("yearbooks")
    .update({ share_mode: shareMode })
    .eq("id", yearbookId);

  if (error) {
    ownerRedirect(formData, error.message);
  }

  await revalidateOwnerViews(supabase);
}

export async function addInvite(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const username = normalizeUsername(String(formData.get("username") ?? ""));

  if (!yearbookId || !username) {
    ownerRedirect(formData, "Enter a username to invite.");
  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    ownerRedirect(formData, "Usernames can only contain lowercase letters, numbers, and underscores.");
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
    ownerRedirect(formData, lookupError.message);
  }

  if (!invitedProfile) {
    ownerRedirect(formData, "No user found with that username.");
  }

  const invitedUserId = invitedProfile?.id;

  if (!invitedUserId) {
    ownerRedirect(formData, "No user found with that username.");
  }

  if (invitedUserId === user.id) {
    ownerRedirect(formData, "You cannot invite yourself to your own yearbook.");
  }

  const { error } = await supabase.from("yearbook_invites").insert({
    yearbook_id: yearbookId,
    invited_user_id: invitedUserId,
  });

  if (error) {
    ownerRedirect(formData, error.message);
  }

  await revalidateOwnerViews(supabase);
}

export async function revokeInvite(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const invitedUserId = String(formData.get("invitedUserId") ?? "");

  if (!yearbookId || !invitedUserId) {
    ownerRedirect(formData, "Invalid invite revoke request.");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("yearbook_invites")
    .delete()
    .eq("yearbook_id", yearbookId)
    .eq("invited_user_id", invitedUserId);

  if (error) {
    ownerRedirect(formData, error.message);
  }

  await revalidateOwnerViews(supabase);
}
