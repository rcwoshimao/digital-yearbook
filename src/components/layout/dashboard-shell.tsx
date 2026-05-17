import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { UserMenu } from "@/components/layout/user-menu";

type DashboardShellProps = {
  children: React.ReactNode;
  profileUsername?: string;
  userName?: string;
};

export function DashboardShell({ children, profileUsername, userName }: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-yearbook-paper to-yearbook-paper-deep px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard" className="text-xl font-black tracking-tight">
            Digital Yearbook
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-stone-700">
            <Link className="rounded-full bg-white px-4 py-2 shadow-sm" href="/dashboard">
              My Yearbook
            </Link>
            <Link className="rounded-full px-4 py-2 hover:bg-white/70" href="/write">
              Sign Yearbooks
            </Link>
            <UserMenu profileUsername={profileUsername} signOutAction={signOut} userName={userName} />
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
