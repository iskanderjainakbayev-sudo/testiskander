import { isSupabaseConfigured, supabase } from "./supabase";

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) return "Supabase is not connected yet.";
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/login` },
  });
  return error?.message ?? "";
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return error?.message ?? "";
}

export async function signUpWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) return "Supabase is not connected yet.";
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/login` },
  });
  return error?.message ?? "";
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) return "Supabase is not connected yet.";
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error?.message ?? "";
}
