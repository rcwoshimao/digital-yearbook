import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { DashboardNav } from "@/components/layout/dashboard-nav";
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
          <div className="flex flex-wrap items-center gap-3">
            <DashboardNav />
            <UserMenu profileUsername={profileUsername} signOutAction={signOut} userName={userName} />
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
