"use client";

import { useState } from "react";

const KHAN_URL = "https://www.khanacademy.org/math";
const UNLOCK_USER = "Games123";
const UNLOCK_PASS = "123!:1237";
const SESSION_KEY = "mb_unlocked";

type Step = "ask" | "login";

export function AccountGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(SESSION_KEY) === "1" ? true : null;
  });
  const [step, setStep] = useState<Step>("ask");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function handleNoAccount() {
    window.location.href = KHAN_URL;
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (username === UNLOCK_USER && password === UNLOCK_PASS) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      window.location.href = KHAN_URL;
    }
  }

  return (
    <div className="fixed inset-0 bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6">
        {step === "ask" ? (
          <>
            <h2 className="text-lg font-bold text-white">Do you have an account?</h2>
            <p className="mt-1 text-sm text-white/50">Sign in to track your progress.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setStep("login")}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-accent text-white font-semibold hover:scale-[1.02] transition-transform"
              >
                Yes, log in
              </button>
              <button
                onClick={handleNoAccount}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors"
              >
                No account
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleLogin}>
            <h2 className="text-lg font-bold text-white">Log in</h2>
            <div className="mt-4 flex flex-col gap-3">
              <input
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(false);
                }}
                placeholder="Username"
                className="px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-brand-accent/60"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Password"
                className="px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-brand-accent/60"
              />
            </div>
            {error && <p className="mt-2 text-xs text-red-400">Incorrect username or password.</p>}
            <button
              type="submit"
              className="mt-4 w-full px-4 py-2.5 rounded-xl bg-brand-accent text-white font-semibold hover:scale-[1.02] transition-transform"
            >
              Log in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
