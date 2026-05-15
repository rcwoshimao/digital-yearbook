import Link from "next/link";
import { signOut } from "@/app/auth/actions";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-xl font-bold">
            Digital Yearbook
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-stone-700">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/profile/me">Profile</Link>
            <form action={signOut}>
              <button className="font-medium text-stone-700">Sign out</button>
            </form>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
