import { BookPage } from "@/components/yearbook/book-page";
import { backCoverStyleConfig, coverStyleConfig } from "@/lib/yearbook/cover-styles";

type CoverPageProps = {
  classLabel: string;
  flat?: boolean;
  ownerName: string;
  ownerUniversity?: string | null;
};

export function CoverPage({ classLabel, flat, ownerName, ownerUniversity }: CoverPageProps) {
  return (
    <BookPage flat={flat} styleConfig={coverStyleConfig}>
      <div className="flex h-full flex-col items-center justify-center gap-4 px-12 text-center">
        <p className="text-sm uppercase tracking-[0.3em] opacity-60">{classLabel}</p>
        <h1 className="text-4xl font-bold leading-tight">{ownerName}</h1>
        <p className="text-base opacity-70">{ownerUniversity ?? "Graduation Memories"}</p>
        <div className="mt-8 h-px w-16 bg-current opacity-30" />
        <p className="mt-2 text-xs opacity-40">Your Yearbook</p>
      </div>
    </BookPage>
  );
}

type BackCoverPageProps = {
  flat?: boolean;
  ownerName: string;
};

export function BackCoverPage({ flat, ownerName }: BackCoverPageProps) {
  return (
    <BookPage flat={flat} styleConfig={backCoverStyleConfig}>
      <div className="flex h-full flex-col items-center justify-center gap-3 px-12 text-center">
        <p className="text-3xl font-bold">The End</p>
        <p className="text-sm uppercase tracking-[0.24em] opacity-60">{ownerName}&apos;s yearbook</p>
      </div>
    </BookPage>
  );
}
