import type { SupabaseClient } from "@supabase/supabase-js";
import type { YearbookEntry } from "@/lib/types/yearbook";
import { normalizeYearbookPageStyle } from "@/lib/yearbook/page-style";

export const ENTRY_SELECT =
  "id, yearbook_id, author_id, author_name, author_university, author_class, content_text, image_urls, pdf_url, page_image_url, style_config, created_at, is_visible_to_owner";

export type EntryRow = {
  id: string;
  yearbook_id: string;
  author_id: string | null;
  author_name: string;
  author_university: string | null;
  author_class: string | null;
  content_text: string | null;
  image_urls: string[] | null;
  pdf_url: string | null;
  page_image_url: string | null;
  style_config: unknown;
  created_at: string;
  is_visible_to_owner: boolean | null;
};

export type SignedEntryAssets = {
  imageUrls: string[];
  pdfUrl: string | null;
  pageImageUrl: string | null;
};

export function mapEntryRow(row: EntryRow, signedAssets?: Partial<SignedEntryAssets>): YearbookEntry {
  return {
    id: row.id,
    yearbookId: row.yearbook_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorUniversity: row.author_university,
    authorClass: row.author_class,
    contentText: row.content_text ?? "",
    imageUrls: signedAssets?.imageUrls ?? row.image_urls ?? [],
    pdfUrl: signedAssets?.pdfUrl ?? row.pdf_url,
    pageImageUrl: signedAssets?.pageImageUrl ?? row.page_image_url,
    styleConfig: normalizeYearbookPageStyle(row.style_config),
    createdAt: new Date(row.created_at),
    isVisibleToOwner: row.is_visible_to_owner ?? true,
  };
}

export async function signEntryRowAssets(
  supabase: SupabaseClient,
  row: EntryRow,
): Promise<SignedEntryAssets> {
  const imagePaths = row.image_urls ?? [];

  const [imageUrls, pdfUrl, pageImageUrl] = await Promise.all([
    imagePaths.length > 0
      ? supabase.storage
          .from("entry-images")
          .createSignedUrls(imagePaths, 60 * 60)
          .then(
            ({ data }) => data?.flatMap((item) => (item.signedUrl ? [item.signedUrl] : [])) ?? [],
          )
      : Promise.resolve([]),
    signStoragePath(supabase, row.pdf_url),
    signStoragePath(supabase, row.page_image_url),
  ]);

  return { imageUrls, pdfUrl, pageImageUrl };
}

async function signStoragePath(supabase: SupabaseClient, path: string | null) {
  if (!path) {
    return null;
  }

  const { data } = await supabase.storage.from("entry-pdfs").createSignedUrl(path, 60 * 60);

  return data?.signedUrl ?? null;
}
