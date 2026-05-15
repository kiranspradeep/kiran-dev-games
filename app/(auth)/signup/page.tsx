import { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Account — KSP Games",
};

export default function SignupPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--background)" }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(0,168,255,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--neon-dim), transparent)",
                border: "1px solid var(--border-neon)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--neon)"
                strokeWidth="1.5"
              >
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" />
              </svg>
            </div>
            <span
              className="font-inter text-sm font-bold tracking-wider uppercase"
              style={{ color: "var(--primary)" }}
            >
              KSP<span style={{ color: "var(--neon)" }}> Games</span>
            </span>
          </Link>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="h-[1px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--neon), transparent)",
              opacity: 0.6,
            }}
          />
          <div className="p-6">
            <h1
              className="font-inter text-xl font-black mb-1"
              style={{ color: "var(--primary)" }}
            >
              Create account
            </h1>
            <p
              className="font-inter text-sm mb-6"
              style={{ color: "var(--muted)" }}
            >
              Join KSP Games for free
            </p>
            <SignupForm
              onSwitchToLogin={() => {}}
            />
          </div>
        </div>

        <p
          className="text-center font-inter text-xs mt-4"
          style={{ color: "var(--muted)" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold"
            style={{ color: "var(--neon)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}