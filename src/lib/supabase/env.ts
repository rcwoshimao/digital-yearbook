const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
export const isSampleDataMode =
  process.env.NODE_ENV === "development" && process.env.USE_SAMPLE_DATA === "true";

export function getSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}
