import { BookPage } from "@/components/yearbook/book-page";
import {
  coverStyleToPageStyle,
  type YearbookCoverStyle,
} from "@/lib/yearbook/cover-styles";

type CoverPageProps = {
  classLabel: string;
  coverStyle: YearbookCoverStyle;
  flat?: boolean;
  ownerName: string;
  ownerUniversity?: string | null;
};

export function CoverPage({
  classLabel,
  coverStyle,
  flat,
  ownerName,
  ownerUniversity,
}: CoverPageProps) {
  const pageStyle = coverStyleToPageStyle(coverStyle);
  const showDamask = coverStyle.pattern === "damask";

  return (
    <BookPage coverDamask={showDamask} flat={flat} styleConfig={pageStyle}>
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-12 text-center">
        <p className="text-sm uppercase tracking-[0.3em] opacity-60">{classLabel}</p>
        <h1 className="text-4xl font-bold leading-tight">{ownerName}</h1>
        <p className="text-base opacity-70">{ownerUniversity ?? "Graduation Memories"}</p>
        <div className="mt-8 h-px w-16 bg-current opacity-30" />
        <p className="mt-2 text-xs opacity-40">Yearbook</p>
      </div>
    </BookPage>
  );
}

type BackCoverPageProps = {
  coverStyle: YearbookCoverStyle;
  flat?: boolean;
  ownerName: string;
};

export function BackCoverPage({ coverStyle, flat, ownerName }: BackCoverPageProps) {
  const pageStyle = coverStyleToPageStyle(coverStyle);
  const showDamask = coverStyle.pattern === "damask";

  return (
    <BookPage coverDamask={showDamask} flat={flat} styleConfig={pageStyle}>
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 px-12 text-center">
        <p className="text-3xl font-bold">A collection of moments for yours to keep.</p>
        <p className="text-sm uppercase tracking-[0.24em] opacity-60">{ownerName}&apos;s yearbook</p>
      </div>
    </BookPage>
  );
}
