import type { YearbookEntry } from "@/lib/types/yearbook";

type EntryListProps = {
  entries: YearbookEntry[];
};

export function EntryList({ entries }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-600">
        No entries yet.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-2xl border border-stone-200 bg-yearbook-paper p-4">
          <p className="font-semibold">{entry.authorName}</p>
          <p className="mt-1 line-clamp-2 text-sm text-stone-600">
            {entry.pdfUrl ? "Signed canvas page (PDF)" : entry.contentText}
          </p>
        </div>
      ))}
    </div>
  );
}
