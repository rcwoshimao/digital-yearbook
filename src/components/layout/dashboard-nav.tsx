"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const activeClass = "rounded-full bg-white px-4 py-2 shadow-sm text-stone-900";
const inactiveClass = "rounded-full px-4 py-2 text-stone-700 transition hover:bg-white/70";

export function DashboardNav() {
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";
  const onWrite = pathname === "/write" || pathname.startsWith("/write/");

  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
      <Link className={onDashboard ? activeClass : inactiveClass} href="/dashboard">
        My Yearbook
      </Link>
      <Link className={onWrite ? activeClass : inactiveClass} href="/write">
        Sign Yearbooks
      </Link>
    </nav>
  );
}
