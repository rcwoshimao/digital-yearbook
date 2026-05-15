import { signIn, signUp } from "@/app/auth/actions";

type AuthFormProps = {
  authError?: string;
  authMessage?: string;
  isConfigured: boolean;
};

export function AuthForm({ authError, authMessage, isConfigured }: AuthFormProps) {
  return (
    <div className="rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-stone-200">
      {!isConfigured ? (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          Add Supabase environment variables in `.env.local` to enable sign in and sign up.
        </p>
      ) : null}
      {authError ? (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{authError}</p>
      ) : null}
      {authMessage ? (
        <p className="rounded-2xl bg-green-50 p-4 text-sm text-green-700">{authMessage}</p>
      ) : null}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form action={signIn} className="space-y-4">
          <h2 className="text-xl font-bold">Sign in</h2>
          <AuthField label="Email" name="email" type="email" />
          <AuthField label="Password" name="password" type="password" />
          <button
            className="w-full rounded-full bg-yearbook-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isConfigured}
          >
            Sign In
          </button>
        </form>
        <form action={signUp} className="space-y-4">
          <h2 className="text-xl font-bold">Sign up</h2>
          <AuthField label="Display name" name="displayName" type="text" />
          <AuthField label="Email" name="email" type="email" />
          <AuthField label="Password" name="password" type="password" />
          <button
            className="w-full rounded-full bg-yearbook-accent px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isConfigured}
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

type AuthFieldProps = {
  label: string;
  name: string;
  type: string;
};

function AuthField({ label, name, type }: AuthFieldProps) {
  return (
    <label className="block text-sm font-semibold text-stone-700">
      {label}
      <input
        className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-yearbook-accent"
        name={name}
        required
        type={type}
      />
    </label>
  );
}
