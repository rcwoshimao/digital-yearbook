import { defaultCoverStyle, normalizeCoverStyle } from "@/lib/yearbook/cover-styles";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type OwnerYearbookRow = {
  id: string;
  owner_id: string;
  share_mode: "link" | "invite_only";
  created_at: string;
  cover_style_config?: unknown;
};

export type LoadedOwnerYearbook = {
  coverStyleMigrationNeeded: boolean;
  row: OwnerYearbookRow;
  coverStyle: ReturnType<typeof normalizeCoverStyle>;
};

function isMissingCoverStyleColumn(error: { message?: string; code?: string } | null) {
  if (!error) {
    return false;
  }

  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42703" ||
    message.includes("cover_style_config") ||
    message.includes("schema cache")
  );
}

export async function loadOwnerYearbook(
  supabase: SupabaseServerClient,
  ownerId: string,
): Promise<{ data: LoadedOwnerYearbook | null; error: { message?: string } | null }> {
  const withCover = await supabase
    .from("yearbooks")
    .select("id, owner_id, share_mode, cover_style_config, created_at")
    .eq("owner_id", ownerId)
    .maybeSingle<OwnerYearbookRow>();

  if (!withCover.error && withCover.data) {
    return {
      data: {
        row: withCover.data,
        coverStyle: normalizeCoverStyle(withCover.data.cover_style_config),
        coverStyleMigrationNeeded: false,
      },
      error: null,
    };
  }

  if (!isMissingCoverStyleColumn(withCover.error)) {
    return { data: null, error: withCover.error };
  }

  const withoutCover = await supabase
    .from("yearbooks")
    .select("id, owner_id, share_mode, created_at")
    .eq("owner_id", ownerId)
    .maybeSingle<OwnerYearbookRow>();

  if (withoutCover.error || !withoutCover.data) {
    return { data: null, error: withoutCover.error ?? withCover.error };
  }

  return {
    data: {
      row: withoutCover.data,
      coverStyle: defaultCoverStyle,
      coverStyleMigrationNeeded: true,
    },
    error: null,
  };
}
