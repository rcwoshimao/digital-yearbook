import { format } from "date-fns";
import type { YearbookEntry } from "@/lib/types/yearbook";

type WrittenEntryLogProps = {
  entries: YearbookEntry[];
};

export function WrittenEntryLog({ entries }: WrittenEntryLogProps) {
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
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between" key={entry.id}>
          <div>
            <p className="font-semibold">Yearbook {entry.yearbookId}</p>
            <p className="text-sm text-stone-600">Signed on {format(entry.createdAt, "PPP")}</p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Content hidden
          </p>
        </div>
      ))}
    </div>
  );
}
