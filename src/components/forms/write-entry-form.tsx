import { createEntry } from "@/app/yearbook/[yearbookId]/write/actions";

type WriteEntryFormProps = {
  authorClass: string | null;
  authorName: string;
  authorUniversity: string | null;
  yearbookId: string;
};

export function WriteEntryForm({
  authorClass,
  authorName,
  authorUniversity,
  yearbookId,
}: WriteEntryFormProps) {
  return (
    <form
      action={createEntry}
      className="rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-stone-200"
    >
      <input name="yearbookId" type="hidden" value={yearbookId} />
      <div className="mb-6 rounded-2xl bg-yearbook-paper p-4">
        <p className="text-sm font-semibold text-stone-700">Writing as</p>
        <p className="mt-1 text-lg font-bold">{authorName}</p>
        <p className="text-sm text-stone-600">
          {[authorClass, authorUniversity].filter(Boolean).join(" · ") || "No school details yet"}
        </p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-stone-700" htmlFor="contentText">
          Message
        </label>
        <textarea
          id="contentText"
          name="contentText"
          className="mt-2 min-h-48 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-yearbook-accent"
          placeholder="Write your graduation memory..."
        />
      </div>
      <label className="mt-6 block rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600">
        <span className="font-semibold text-stone-700">Upload images</span>
        <span className="mt-1 block">Maximum 5 images, 5MB each.</span>
        <input
          accept="image/*"
          className="mt-4 w-full text-sm"
          multiple
          name="images"
          type="file"
        />
      </label>
      <button
        className="mt-6 rounded-full bg-yearbook-ink px-5 py-3 text-sm font-semibold text-white"
      >
        Submit Locked Entry
      </button>
    </form>
  );
}
