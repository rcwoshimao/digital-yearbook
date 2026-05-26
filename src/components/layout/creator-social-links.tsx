import Link from "next/link";

export const CREATOR_LINKS = [
  {
    label: "Website",
    href: "https://rcwoshimaodev.vercel.app/",
    icon: "website" as const,
  },
  {
    label: "GitHub",
    href: "https://github.com/rcwoshimao",
    icon: "github" as const,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/jiaying-chen01/",
    icon: "linkedin" as const,
  },
] as const;

const iconClassName = "h-7 w-7 sm:h-8 sm:w-8";

function SocialIcon({ type }: { type: (typeof CREATOR_LINKS)[number]["icon"] }) {
  if (type === "website") {
    return (
      <svg aria-hidden className={iconClassName} fill="none" viewBox="0 0 24 24">
        <path
          d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M2 12h20M12 2c2.8 3.5 4.2 7.2 4.5 10.5M12 2C9.2 5.5 7.8 9.2 7.5 12.5M12 22c2.8-3.5 4.2-7.2 4.5-10.5M12 22c-2.8-3.5-4.2-7.2-4.5-10.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    );
  }

  if (type === "github") {
    return (
      <svg aria-hidden className={iconClassName} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.021C22 6.484 17.522 2 12 2Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden className={iconClassName} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

type CreatorSocialIconLinksProps = {
  className?: string;
};

export function CreatorSocialIconLinks({ className }: CreatorSocialIconLinksProps) {
  return (
    <nav
      aria-label="Creator links"
      className={["flex flex-row items-center gap-5", className].filter(Boolean).join(" ")}
    >
      {CREATOR_LINKS.map((link) => (
        <Link
          key={link.href}
          aria-label={link.label}
          className="p-1 text-yearbook-ink transition hover:text-yearbook-accent"
          href={link.href}
          rel="noopener noreferrer"
          target="_blank"
          title={link.label}
        >
          <SocialIcon type={link.icon} />
        </Link>
      ))}
    </nav>
  );
}
