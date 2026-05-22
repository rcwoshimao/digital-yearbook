import { format } from "date-fns";

export type SignedPageMetadataProps = {
  authorName: string;
  authorUniversity?: string | null;
  authorClass?: string | null;
  /** Omit in the editor hint to show today's date as a preview. */
  createdAt?: Date | null;
  className?: string;
};

export function SignedPageMetadata({
  authorName,
  authorUniversity,
  authorClass,
  createdAt,
  className = "",
}: SignedPageMetadataProps) {
  const meta = [authorClass, authorUniversity].filter(Boolean).join(" · ");
  const dateLine = createdAt
    ? `Written on ${format(createdAt, "PPP")}`
    : `Written on ${format(new Date(), "PPP")}`;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-2 text-xs text-yearbook-ink ${className}`}
    >
      <p className="signed-page-metadata-text font-semibold">{authorName}</p>
      {meta ? <p className="signed-page-metadata-text">{meta}</p> : null}
      <p className="signed-page-metadata-text">{dateLine}</p>
    </div>
  );
}
