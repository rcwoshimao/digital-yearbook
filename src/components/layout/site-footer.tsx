import Link from "next/link";

const LINKS = [
  { label: "Website", href: "https://rcwoshimaodev.vercel.app/" },
  { label: "GitHub", href: "https://github.com/rcwoshimao" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jiaying-chen01/" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-yearbook-ink/10 px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center text-sm text-stone-600">
        <p>
          © 2026 
            rcwoshimao, 
           All rights reserved.
        </p>
        <nav
          aria-label="Creator links"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              className="font-medium text-yearbook-accent underline-offset-2 hover:text-yearbook-ink hover:underline"
              href={link.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
