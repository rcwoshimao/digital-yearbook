"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function DevModeBanner() {
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    setHost(window.location.hostname);
  }, []);

  if (process.env.NODE_ENV !== "development" || !host) {
    return null;
  }

  const isLocal = host === "localhost" || host === "127.0.0.1";

  return (
    <div
      className={`border-b px-4 py-2 text-center text-xs font-semibold ${
        isLocal
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-amber-300 bg-amber-100 text-amber-950"
      }`}
    >
      {isLocal ? (
        <span>
          Local dev — use this tab only. Google sign-in returns to{" "}
          <code className="font-mono">localhost:3000</code> (not the Workers URL).
        </span>
      ) : (
        <span>
          Sign-in will redirect to production if you stay on <strong>{host}</strong>. Open{" "}
          <Link className="underline" href="http://localhost:3000/login">
            http://localhost:3000/login
          </Link>{" "}
          for local dev.
        </span>
      )}
    </div>
  );
}
