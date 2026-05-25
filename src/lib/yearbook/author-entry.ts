import type { SupabaseClient } from "@supabase/supabase-js";
import { entryMutationClient } from "@/lib/supabase/service-role";
import type { YearbookEntry } from "@/lib/types/yearbook";

export type EntryRowForMutation = {
  id: string;
  image_urls: string[] | null;
  page_image_url: string | null;
  pdf_url: string | null;
};

/** Canonical storage path for canvas page exports ({yearbookId}/{authorId}.jpg). */
export function authorEntryPageImagePath(yearbookId: string, authorId: string) {
  return `${yearbookId}/${authorId}.jpg`;
}

/** Remove the author's page image object even when no `entries` row exists (orphan uploads). */
export async function clearAuthorEntryPageImageStorage(
  supabase: SupabaseClient,
  yearbookId: string,
  authorId: string,
) {
  const storage = entryMutationClient(supabase).storage.from("entry-pdfs");
  const path = authorEntryPageImagePath(yearbookId, authorId);
  await storage.remove([path]);
}

export async function fetchAuthorEntriesForYearbook(
  supabase: SupabaseClient,
  yearbookId: string,
  authorId: string,
): Promise<EntryRowForMutation[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("id, page_image_url, pdf_url, image_urls")
    .eq("yearbook_id", yearbookId)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function removeEntryStorageAssets(
  supabase: SupabaseClient,
  rows: EntryRowForMutation[],
) {
  const entryPdfPaths = new Set<string>();
  const entryImagePaths = new Set<string>();

  for (const row of rows) {
    if (row.page_image_url) {
      entryPdfPaths.add(row.page_image_url);
    }

    if (row.pdf_url) {
      entryPdfPaths.add(row.pdf_url);
    }

    for (const path of row.image_urls ?? []) {
      if (!path || path.startsWith("http")) {
        continue;
      }

      entryImagePaths.add(path);
    }
  }

  if (entryPdfPaths.size > 0) {
    await supabase.storage.from("entry-pdfs").remove(Array.from(entryPdfPaths));
  }

  if (entryImagePaths.size > 0) {
    await supabase.storage.from("entry-images").remove(Array.from(entryImagePaths));
  }
}

export async function deleteAuthorEntriesForYearbook(
  supabase: SupabaseClient,
  yearbookId: string,
  authorId: string,
) {
  const db = entryMutationClient(supabase);
  const rows = await fetchAuthorEntriesForYearbook(db, yearbookId, authorId);

  await removeEntryStorageAssets(db, rows);
  await clearAuthorEntryPageImageStorage(supabase, yearbookId, authorId);

  if (rows.length === 0) {
    return { deletedCount: 0 };
  }

  const { error, count } = await db
    .from("entries")
    .delete({ count: "exact" })
    .eq("yearbook_id", yearbookId)
    .eq("author_id", authorId);

  if (error) {
    throw error;
  }

  const deletedCount = count ?? rows.length;
  const remaining = await fetchAuthorEntriesForYearbook(db, yearbookId, authorId);

  if (remaining.length > 0) {
    throw new Error(
      `Entry delete incomplete (${remaining.length} row(s) remain, ${deletedCount} deleted). ` +
        "Apply Supabase migrations 0011 and 0012, or delete the row in the entries table for this yearbook.",
    );
  }

  return { deletedCount };
}

/** True when the stored entry has nothing useful to show in the viewer. */
export function isEntryDisplayEmpty(entry: Pick<YearbookEntry, "pageImageUrl" | "pdfUrl" | "contentText" | "imageUrls">) {
  const hasText = Boolean(entry.contentText?.trim());
  const hasImages = entry.imageUrls.length > 0;

  return !entry.pageImageUrl && !entry.pdfUrl && !hasText && !hasImages;
}
