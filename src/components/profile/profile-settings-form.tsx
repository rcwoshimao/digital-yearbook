import { resendEmailVerification, updateEmail, updateUsername } from "@/app/profile/actions";

type ProfileSettingsFormProps = {
  email: string;
  emailConfirmed: boolean;
  pendingEmail?: string | null;
  returnUsername: string;
  userId: string;
  username: string;
};

export function ProfileSettingsForm({
  email,
  emailConfirmed,
  pendingEmail,
  returnUsername,
  userId,
  username,
}: ProfileSettingsFormProps) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yearbook-accent">Account</p>
        <h1 className="mt-2 text-3xl font-bold">Your profile</h1>
        <p className="mt-2 max-w-2xl text-stone-700">
          Update how you appear to friends. Sign in with your email or @{username}.
        </p>
      </div>

      <form action={updateUsername}
        className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-sm"
      >
        <input name="returnUsername" type="hidden" value={returnUsername} />
        <input name="userId" type="hidden" value={userId} />
        <label className="block text-sm font-semibold text-stone-700">
          Username
          <input
            className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 text-sm"
            defaultValue={username}
            name="username"
            placeholder="your_username"
          />
        </label>
        <p className="mt-2 text-xs text-stone-600">
          Friends can find you with @{username}. Use lowercase letters, numbers, and underscores only.
        </p>
        <button
          className="mt-4 rounded-full bg-yearbook-accent px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
        >
          Save username
        </button>
      </form>

      <div className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-stone-700">Email</p>
          {emailConfirmed ? (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800 ring-1 ring-green-200">
              Verified
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
              Not verified
            </span>
          )}
          {pendingEmail ? (
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900 ring-1 ring-sky-200">
              Change pending
            </span>
          ) : null}
        </div>

        {pendingEmail ? (
          <p className="mt-3 rounded-2xl bg-sky-50 p-4 text-sm text-sky-950 ring-1 ring-sky-200">
            Confirm <span className="font-semibold">{pendingEmail}</span> from your inbox to finish
            updating your sign-in email. Until then, you will still sign in with{" "}
            <span className="font-semibold">{email}</span>.
          </p>
        ) : null}

        {!emailConfirmed ? (
          <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200">
            Your email is not verified yet. Some account changes may be limited until you confirm
            {pendingEmail ? ` ${pendingEmail}` : ` ${email}`}.
          </p>
        ) : null}

        <form action={updateEmail} className="mt-4">
          <input name="returnUsername" type="hidden" value={returnUsername} />
          <input name="userId" type="hidden" value={userId} />
          <label className="block text-sm font-semibold text-stone-700">
            Sign-in email
            <input
              className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 text-sm"
              defaultValue={pendingEmail ?? email}
              name="email"
              placeholder="you@school.edu"
              type="email"
            />
          </label>
          <p className="mt-2 text-xs text-stone-600">
            Changing your email sends a confirmation link. Your current email stays active until you
            confirm the new one.
          </p>
          <button
            className="mt-4 rounded-full bg-yearbook-ink px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
          >
            Update email
          </button>
        </form>

        {!emailConfirmed || pendingEmail ? (
          <form action={resendEmailVerification} className="mt-4">
            <input name="returnUsername" type="hidden" value={returnUsername} />
            <input name="userId" type="hidden" value={userId} />
            <button
              className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              type="submit"
            >
              Resend confirmation email
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
