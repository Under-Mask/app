import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function signInWithEmail(email, password) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase 환경 변수가 설정되지 않았어요.") };
  }
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password, metadata = {}) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase 환경 변수가 설정되지 않았어요.") };
  }
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
}

export async function getAuthSession() {
  if (!supabase) return { data: { session: null }, error: null };
  return supabase.auth.getSession();
}

export async function resetPassword(email) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase 환경 변수가 설정되지 않았어요.") };
  }
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
}
