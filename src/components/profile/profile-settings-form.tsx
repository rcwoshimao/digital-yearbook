import { updateDisplayName, updateSchool, updateUsername } from "@/app/profile/actions";

type ProfileSettingsFormProps = {
  authLabel: string;
  displayName: string;
  googleDisplayName: string | null;
  graduationClass: string | null;
  returnUsername: string;
  signInEmail: string;
  university: string | null;
  userId: string;
  usesGoogle: boolean;
  username: string;
};

export function ProfileSettingsForm({
  authLabel,
  displayName,
  googleDisplayName,
  graduationClass,
  returnUsername,
  signInEmail,
  university,
  userId,
  usesGoogle,
  username,
}: ProfileSettingsFormProps) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yearbook-accent">Account</p>
        <h1 className="mt-2 text-3xl font-bold">Your profile</h1>
        <p className="mt-2 max-w-2xl text-stone-700">
          Update how you appear to friends. You sign in with {authLabel}.
        </p>
      </div>

      <div className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-sm">
        <p className="text-sm font-semibold text-stone-700">Sign-in</p>
        {usesGoogle ? (
          <p className="mt-2 text-sm text-stone-600">
            You use <span className="font-semibold">Google</span> ({signInEmail}). To use a
            different Google account, sign out and choose another account on the login screen.
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone-600">
            Dev account ({signInEmail}). Real users sign in with Google only.
          </p>
        )}
      </div>

      <form
        action={updateDisplayName}
        className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-sm"
      >
        <input name="returnUsername" type="hidden" value={returnUsername} />
        <input name="userId" type="hidden" value={userId} />
        <p className="text-sm font-semibold text-stone-700">Display name</p>
        <p className="mt-1 text-xs text-stone-600">
          How your name appears on signed yearbook pages and to friends.
          {usesGoogle && googleDisplayName ? (
            <>
              {" "}
              Defaults to your Google name ({googleDisplayName}).
            </>
          ) : null}
        </p>
        <label className="mt-4 block text-sm font-semibold text-stone-700">
          Name
          <input
            className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 text-sm"
            defaultValue={displayName}
            maxLength={80}
            name="displayName"
            placeholder={googleDisplayName ?? "Your name"}
            required
            type="text"
          />
        </label>
        <button
          className="mt-4 rounded-full bg-yearbook-accent px-5 py-2.5 text-sm font-semibold text-white"
          type="submit"
        >
          Save name
        </button>
      </form>

      <form
        action={updateUsername}
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
          className="mt-4 rounded-full bg-yearbook-accent px-5 py-2.5 text-sm font-semibold text-white"
          type="submit"
        >
          Save username
        </button>
      </form>

      <form
        action={updateSchool}
        className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-sm"
      >
        <input name="returnUsername" type="hidden" value={returnUsername} />
        <input name="userId" type="hidden" value={userId} />
        <p className="text-sm font-semibold text-stone-700">School</p>
        <p className="mt-1 text-xs text-stone-600">
          Shown on yearbook pages you sign and on your own yearbook.
        </p>
        <label className="mt-4 block text-sm font-semibold text-stone-700">
          University
          <input
            className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 text-sm"
            defaultValue={university ?? ""}
            name="university"
            placeholder="UC San Diego"
            type="text"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-stone-700">
          Graduation class
          <input
            className="mt-2 w-full rounded-full border border-stone-300 px-4 py-3 text-sm"
            defaultValue={graduationClass ?? ""}
            inputMode="numeric"
            maxLength={4}
            name="graduationClass"
            pattern="[0-9]{4}"
            placeholder="2026"
            title="Enter a 4-digit year (e.g. 2026)"
            type="text"
          />
          <p className="mt-1.5 text-xs text-stone-500">4-digit graduation year (e.g. 2026).</p>
        </label>
        <button
          className="mt-4 rounded-full bg-yearbook-accent px-5 py-2.5 text-sm font-semibold text-white"
          type="submit"
        >
          Save school
        </button>
      </form>
    </section>
  );
}
