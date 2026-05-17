import { BookPage } from "@/components/yearbook/book-page";
import { EntryPageContent } from "@/components/yearbook/entry-page-content";
import type { YearbookEntry } from "@/lib/types/yearbook";
import { normalizeYearbookPageStyle } from "@/lib/yearbook/page-style";

type EntryCardProps = {
  entry: YearbookEntry;
};

export function EntryCard({ entry }: EntryCardProps) {
  const styleConfig = normalizeYearbookPageStyle(entry.styleConfig);

  return (
    <BookPage className="rounded-2xl" styleConfig={styleConfig}>
      <EntryPageContent entry={entry} />
    </BookPage>
  );
}
