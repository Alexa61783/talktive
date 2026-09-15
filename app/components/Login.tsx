"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function Login() {
const router = useRouter();

const [isSignUp, setIsSignUp] = useState(false);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const handleEmailAuth = async () => {
if (!email.trim() || !password.trim()) {
setError("Please enter your email and password.");
return;
}


setLoading(true);
setError("");

try {
  if (isSignUp) {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    setError(
      "Account created! Please check your email to verify your account."
    );
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    router.push("/");
    router.refresh();
  }
} catch (error: any) {
  console.error("Authentication error:", error);

  setError(
    error?.message || "Something went wrong. Please try again."
  );
} finally {
  setLoading(false);
}


};

const handleGoogleLogin = async () => {
setLoading(true);
setError("");


try {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
} catch (error: any) {
  console.error("Google authentication error:", error);

  setError(
    error?.message || "Google sign-in failed. Please try again."
  );

  setLoading(false);
}


};

return ( <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-8 relative overflow-hidden">


  {/* Background glow */}
  <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[430px] h-[430px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

  <div className="relative z-10 w-full max-w-[430px]">

    {/* Robot Logo */}
    <div className="flex justify-center mb-5">
      <div className="w-20 h-20 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] flex items-center justify-center shadow-[0_0_45px_rgba(37,99,235,0.12)]">
        <img
          src="/ChatGPT Image Sep 13, 2026, 09_07_41 AM.png"
          alt="Talktive"
          className="w-14 h-14 object-contain"
        />
      </div>
    </div>

    {/* Heading */}
    <div className="text-center mb-7">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
        Talk<span className="text-blue-500">tive</span>
      </h1>

      <p className="text-white/45 mt-2 text-sm sm:text-base">
        {isSignUp
          ? "Create your space with Talktive."
          : "Welcome back. Let’s talk."}
      </p>
    </div>

    {/* Login Card */}
    <div className="rounded-3xl border border-blue-500/15 bg-[#080b12]/90 backdrop-blur-xl p-5 sm:p-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">

      {/* Google */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.05] text-white flex items-center justify-center gap-3 text-sm font-semibold hover:bg-white/[0.09] hover:border-blue-500/30 transition disabled:opacity-50"
      >
        <span className="text-lg font-bold">G</span>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="h-px bg-white/10 flex-1" />

        <span className="text-[10px] uppercase tracking-[0.2em] text-white/25">
          or continue with email
        </span>

        <div className="h-px bg-white/10 flex-1" />
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-white/60 mb-2">
          Email
        </label>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-12 rounded-xl border border-white/10 bg-black/70 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition"
        />
      </div>

      {/* Password */}
      <div className="mt-4">
        <label className="block text-xs font-semibold text-white/60 mb-2">
          Password
        </label>

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-12 rounded-xl border border-white/10 bg-black/70 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
          <p className="text-red-400 text-xs leading-relaxed break-words">
            {error}
          </p>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={handleEmailAuth}
        disabled={loading}
        className="w-full h-12 rounded-xl bg-blue-600 text-white text-sm font-bold mt-5 hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.25)] transition disabled:opacity-50"
      >
        {loading
          ? "Please wait..."
          : isSignUp
          ? "Create account"
          : "Sign in"}
      </button>

      {/* Switch Login / Signup */}
      <button
        onClick={() => {
          setIsSignUp(!isSignUp);
          setError("");
        }}
        className="w-full text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium mt-5 transition"
      >
        {isSignUp
          ? "Already have an account? Sign in"
          : "Don’t have an account? Create one"}
      </button>
    </div>

    {/* Brand Credit */}
    <div className="text-center mt-6">

      <p className="text-[11px] text-white/25">
        Talktive by{" "}
        <span className="text-blue-400 font-semibold">
          LEXVAIN
        </span>
      </p>

      <p className="text-[10px] text-white/15 mt-1">
        Sataish Jamshaid · CEO · Founder & Visionary
      </p>

      <p className="text-[10px] text-white/20 italic mt-1">
        Officially known as “Miss Worship”
      </p>

      <p className="text-[9px] text-white/10 mt-1">
        © 2026 LEXVAIN
      </p>

    </div>

  </div>
</main>


);
}
