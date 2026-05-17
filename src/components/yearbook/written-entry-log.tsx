import { format } from "date-fns";
import type { YearbookEntry } from "@/lib/types/yearbook";

type WrittenEntryLogProps = {
  entries: YearbookEntry[];
  recipientNamesByYearbookId?: Record<string, string>;
};

export function WrittenEntryLog({ entries, recipientNamesByYearbookId = {} }: WrittenEntryLogProps) {
  if (entries.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-600">
        You haven&apos;t signed anyone&apos;s yearbook yet.
      </p>
    );
  }

  return (
    <div className="mt-6 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-yearbook-paper">
      {entries.map((entry) => (
        <div className="p-4" key={entry.id}>
          <div>
            <p className="font-semibold">
              To {recipientNamesByYearbookId[entry.yearbookId] ?? "this graduate"}
            </p>
            <p className="text-sm text-stone-600">Signed on {format(entry.createdAt, "PPP")}</p>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-800">
            {entry.pdfUrl ? "Signed canvas page (PDF entry)" : entry.contentText}
          </p>
        </div>
      ))}
    </div>
  );
}
