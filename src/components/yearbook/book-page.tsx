import type { ReactNode } from "react";
import {
  fontFamilyByStyle,
  type YearbookPageStyle,
} from "@/lib/yearbook/page-style";

type BookPageProps = {
  children: ReactNode;
  className?: string;
  flat?: boolean;
  styleConfig: YearbookPageStyle;
};

export function BookPage({ children, className = "", flat = false, styleConfig }: BookPageProps) {
  const patternClass =
    styleConfig.pattern === "none" ? "" : `yearbook-pattern-${styleConfig.pattern}`;
  const borderClass =
    styleConfig.border === "none" ? "" : `yearbook-border-${styleConfig.border}`;

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-sm ${patternClass} ${borderClass} ${className}`}
      style={{
        backgroundColor: styleConfig.background_color,
        boxShadow: flat
          ? undefined
          : "0 4px 24px rgba(0, 0, 0, 0.12), 2px 0 8px rgba(0, 0, 0, 0.06)",
        color: styleConfig.ink_color,
        fontFamily: fontFamilyByStyle[styleConfig.font],
      }}
    >
      {styleConfig.border === "corner" ? <CornerMarks /> : null}
      {children}
    </div>
  );
}

function CornerMarks() {
  return (
    <>
      <span className="absolute left-5 top-5 h-12 w-12 border-l-2 border-t-2 border-current/30" />
      <span className="absolute right-5 top-5 h-12 w-12 border-r-2 border-t-2 border-current/30" />
      <span className="absolute bottom-5 left-5 h-12 w-12 border-b-2 border-l-2 border-current/30" />
      <span className="absolute bottom-5 right-5 h-12 w-12 border-b-2 border-r-2 border-current/30" />
    </>
  );
}
