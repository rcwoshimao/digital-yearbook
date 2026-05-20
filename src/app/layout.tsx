import type { Metadata } from "next";
import {
  canvasFontGoogleStylesheetHref,
  canvasFontVariables,
  EXTERNAL_FONT_FAMILIES,
} from "@/lib/yearbook/canvas-fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Graduation Yearbook",
  description: "Write and collect permanent graduation yearbook entries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {EXTERNAL_FONT_FAMILIES.length > 0 ? (
          <link rel="stylesheet" href={canvasFontGoogleStylesheetHref} />
        ) : null}
      </head>
      <body className={canvasFontVariables}>{children}</body>
    </html>
  );
}
