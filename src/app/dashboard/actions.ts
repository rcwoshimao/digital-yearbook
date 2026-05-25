"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyErrorMessage } from "@/lib/errors/friendly-message";
import { normalizeCoverStyle, type YearbookCoverStyle } from "@/lib/yearbook/cover-styles";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsername } from "@/lib/username";

function ownerRedirect(formData: FormData, message: string): never {
  const returnPath = String(formData.get("returnPath") ?? "/dashboard");
  const safePath = returnPath.startsWith("/profile/") || returnPath === "/dashboard" ? returnPath : "/dashboard";
  const param = safePath.startsWith("/profile/") ? "profile_error" : "dashboard_error";
  const separator = safePath.includes("?") ? "&" : "?";
  redirect(`${safePath}${separator}${param}=${encodeURIComponent(message)}`);
}

async function revalidateOwnerViews(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  revalidatePath("/dashboard");

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle<{ username: string }>();

    if (profile?.username) {
      revalidatePath(`/profile/${profile.username}`);
    }
  }
}

export async function updateCoverStyle(
  yearbookId: string,
  style: YearbookCoverStyle,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!yearbookId) {
    return { ok: false, message: "Missing yearbook." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sign in to update your cover." };
  }

  const coverStyleConfig = normalizeCoverStyle(style);
  const { error } = await supabase
    .from("yearbooks")
    .update({ cover_style_config: coverStyleConfig })
    .eq("id", yearbookId)
    .eq("owner_id", user.id);

  if (error) {
    return { ok: false, message: friendlyErrorMessage(error, "cover_style") };
  }

  await revalidateOwnerViews(supabase);
  return { ok: true };
}

export async function updateShareMode(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const shareMode = String(formData.get("shareMode") ?? "");

  if (!yearbookId || !["link", "invite_only"].includes(shareMode)) {
    ownerRedirect(formData, "Invalid share mode request.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("yearbooks")
    .update({ share_mode: shareMode })
    .eq("id", yearbookId);

  if (error) {
    ownerRedirect(formData, friendlyErrorMessage(error, "share_mode"));
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

  const supabase = await createClient();
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
    ownerRedirect(formData, friendlyErrorMessage(lookupError, "invite"));
  }

  if (!invitedProfile?.id) {
    ownerRedirect(formData, "No user found with that username.");
  }

  const invitedUserId = invitedProfile.id;

  if (invitedUserId === user.id) {
    ownerRedirect(formData, "You cannot invite yourself to your own yearbook.");
  }

  const { error } = await supabase.from("yearbook_invites").insert({
    yearbook_id: yearbookId,
    invited_user_id: invitedUserId,
  });

  if (error) {
    ownerRedirect(formData, friendlyErrorMessage(error, "invite"));
  }

  await revalidateOwnerViews(supabase);
}

export async function revokeInvite(formData: FormData) {
  const yearbookId = String(formData.get("yearbookId") ?? "");
  const invitedUserId = String(formData.get("invitedUserId") ?? "");

  if (!yearbookId || !invitedUserId) {
    ownerRedirect(formData, "Invalid invite revoke request.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("yearbook_invites")
    .delete()
    .eq("yearbook_id", yearbookId)
    .eq("invited_user_id", invitedUserId);

  if (error) {
    ownerRedirect(formData, friendlyErrorMessage(error, "revoke_invite"));
  }

  await revalidateOwnerViews(supabase);
}
