import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
