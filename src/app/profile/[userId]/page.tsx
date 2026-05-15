type ProfilePageProps = {
  params: {
    userId: string;
  };
};

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yearbook-accent">
        Public Profile
      </p>
      <h1 className="mt-2 text-3xl font-bold">Graduate Profile</h1>
      <div className="mt-8 rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm text-stone-600">User ID</p>
        <p className="mt-1 font-mono text-sm">{params.userId}</p>
        <p className="mt-6 text-stone-700">
          Profile details will be loaded from Supabase after auth is connected.
          Yearbook entries are intentionally not visible on public profiles.
        </p>
      </div>
    </main>
  );
}
