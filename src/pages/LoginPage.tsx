import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import type { User } from "@supabase/supabase-js";
import {
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
} from "../lib/googleAuth";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type LoginMode = "register" | "signin";

type LoginPageProps = {
  initialMode?: LoginMode;
};

export function LoginPage({ initialMode = "register" }: LoginPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void supabase.auth
      .getUser()
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  const google = async () => {
    setBusy(true);
    const error = await signInWithGoogle();
    setBusy(false);
    if (error) setMessage(error);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const error =
      mode === "register"
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);
    setBusy(false);
    setMessage(
      error ||
        (mode === "register"
          ? "Account created. Check your email if confirmation is enabled."
          : "Welcome back!"),
    );
  };
  const logout = async () => {
    const error = await signOut();
    if (error) setMessage(error);
  };
  return (
    <main className="login-page">
      <section className="login-card">
        <Link href="/game">← BACK TO GAME</Link>
        <p>NEON OUTPOST ACCOUNT</p>
        <h1>
          JOIN
          <br />
          <i>THE UNIT</i>
        </h1>
        {user ? (
          <>
            <b>Signed in as {user.email ?? "operator"}</b>
            <Link className="account-play" href="/game">
              RETURN TO OUTPOST
            </Link>
            <button onClick={() => void logout()}>SIGN OUT</button>
          </>
        ) : (
          <>
            <b>
              {mode === "register"
                ? "Create your operator account and defend the outpost."
                : "Welcome back, operator."}
            </b>
            <button
              className="google-button"
              disabled={busy || !isSupabaseConfigured}
              onClick={() => void google()}
            >
              <span>G</span>
              {busy
                ? "CONNECTING…"
                : mode === "register"
                  ? "REGISTER WITH GOOGLE"
                  : "SIGN IN WITH GOOGLE"}
            </button>
            <div className="auth-divider">
              <span>OR</span>
            </div>
            <form
              className="account-form"
              onSubmit={(event) => void submit(event)}
            >
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password (6+ characters)"
                minLength={6}
                required
              />
              <button disabled={busy || !isSupabaseConfigured} type="submit">
                {busy
                  ? "PLEASE WAIT…"
                  : mode === "register"
                    ? "CREATE ACCOUNT"
                    : "SIGN IN"}
              </button>
            </form>
            <button
              className="mode-button"
              onClick={() => {
                setMode((current) =>
                  current === "register" ? "signin" : "register",
                );
                setMessage("");
              }}
            >
              {mode === "register"
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
            {!isSupabaseConfigured && (
              <small>Add Supabase variables to enable registration.</small>
            )}
            {message && <small>{message}</small>}
          </>
        )}
      </section>
    </main>
  );
}
