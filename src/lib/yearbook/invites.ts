import type { SupabaseClient } from "@supabase/supabase-js";
import type { YearbookInvite } from "@/lib/types/yearbook";

type InviteRow = {
  id: string;
  yearbook_id: string;
  invited_user_id: string;
  invited_at: string;
};

export async function loadYearbookInvites(
  supabase: SupabaseClient,
  yearbookId: string,
): Promise<YearbookInvite[]> {
  const { data: inviteRows } = await supabase
    .from("yearbook_invites")
    .select("id, yearbook_id, invited_user_id, invited_at")
    .eq("yearbook_id", yearbookId)
    .order("invited_at", { ascending: false })
    .returns<InviteRow[]>();

  const invitedUserIds = Array.from(
    new Set((inviteRows ?? []).map((invite) => invite.invited_user_id)),
  );

  if (invitedUserIds.length === 0) {
    return [];
  }

  const { data: invitedProfiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", invitedUserIds)
    .returns<{ id: string; username: string }[]>();

  const invitedUsernamesById = new Map(
    (invitedProfiles ?? []).map((profile) => [profile.id, profile.username]),
  );

  return (inviteRows ?? []).map((row) => ({
    id: row.id,
    yearbookId: row.yearbook_id,
    invitedUserId: row.invited_user_id,
    invitedUsername: invitedUsernamesById.get(row.invited_user_id) ?? "unknown",
    invitedAt: new Date(row.invited_at),
  }));
}
