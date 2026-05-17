"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type UserMenuProps = {
  profileUsername?: string;
  userName?: string;
  signOutAction: () => Promise<void>;
};

export function UserMenu({ profileUsername, userName, signOutAction }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = userName?.slice(0, 1).toUpperCase() ?? "Y";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm transition hover:bg-stone-50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-yearbook-accent text-xs font-bold text-white">
          {initial}
        </span>
        <span>{userName ?? "Graduate"}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 min-w-[10rem] overflow-hidden rounded-2xl bg-white py-1 shadow-lg ring-1 ring-stone-200"
        >
          {profileUsername ? (
            <Link
              href={`/profile/${profileUsername}`}
              role="menuitem"
              className="block px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
          ) : null}
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      className={`h-4 w-4 text-stone-500 transition ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
