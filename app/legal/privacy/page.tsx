// app/legal/privacy/page.tsx
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy — Game Hub",
  description:
    "Game Hub Privacy Policy — how we collect, use, and protect your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      <main className="pt-14">
        {/* ── Hero ── */}
        <section className="relative py-16 px-6 overflow-hidden">
          {/* Background glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px]
                       rounded-full opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse, var(--neon) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />

          <div className="relative max-w-5xl mx-auto text-center">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center gap-2 mb-6 text-xs"
              style={{ color: "var(--muted)" }}>
              <Link href="/" className="legal-back-link transition-colors"
                style={{ color: "var(--muted)" }}>
                Hub
              </Link>
              <span>/</span>
              <span style={{ color: "var(--neon)" }}>Privacy Policy</span>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6">
              <div
                className="px-4 py-1.5 rounded-full text-xs font-semibold
                           tracking-widest uppercase"
                style={{
                  background: "var(--neon-dim)",
                  color: "var(--neon)",
                  border: "1px solid var(--border-neon)",
                }}
              >
                Legal Document
              </div>
            </div>

            <h1
              className="text-4xl md:text-5xl font-black tracking-tight mb-4"
              style={{ color: "var(--primary)" }}
            >
              Privacy{" "}
              <span className="neon-text-glow" style={{ color: "var(--neon)" }}>
                Policy
              </span>
            </h1>

            <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>
              Last Updated:{" "}
              <span style={{ color: "var(--neon)" }}>May 15, 2026</span>
            </p>

            <p
              className="mt-5 max-w-2xl mx-auto text-base leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              This Privacy Policy explains how Game Hub collects, uses, stores,
              and protects your information when you access or use our website,
              games, multiplayer services, and related features.
            </p>

            {/* Nav pills */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <Link
                href="/legal/privacy"
                className="px-4 py-1.5 rounded-full text-xs font-semibold
                           tracking-wide transition-all"
                style={{
                  background: "var(--neon-dim)",
                  color: "var(--neon)",
                  border: "1px solid var(--border-neon)",
                }}
              >
                Privacy Policy
              </Link>
              <Link
                href="/legal/terms"
                className="legal-nav-link px-4 py-1.5 rounded-full text-xs
                           font-semibold tracking-wide"
                style={{ color: "var(--muted)" }}
              >
                Terms of Service
              </Link>
            </div>

            {/* Divider */}
            <div
              className="mt-10 h-px w-full max-w-xl mx-auto"
              style={{
                background:
                  "linear-gradient(to right, transparent, var(--border-neon), transparent)",
              }}
            />
          </div>
        </section>

        {/* ── Content ── */}
        <section className="px-6 pb-24">
          <div className="max-w-3xl mx-auto space-y-8">

            {/* Intro note */}
            <div
              className="rounded-xl p-5 flex gap-4 items-start"
              style={{
                background: "var(--neon-dim)",
                border: "1px solid var(--border-neon)",
              }}
            >
              <span className="text-xl mt-0.5">🔒</span>
              <p className="text-sm leading-relaxed"
                style={{ color: "var(--primary)" }}>
                By using Game Hub, you agree to the practices described in this
                Privacy Policy. We are committed to handling your information
                responsibly.
              </p>
            </div>

            {/* ── Section 1 ── */}
            <PolicySection number="1" title="Information We Collect">
              <SubSection title="1.1 Account Information">
                <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
                  When you create an account, we may collect:
                </p>
                <BulletList
                  items={[
                    "Username",
                    "Display name",
                    "Email address",
                    "Profile avatar",
                    "Authentication provider information (Google OAuth or other providers)",
                    "Account preferences and settings",
                  ]}
                />
              </SubSection>

              <SubSection title="1.2 Gameplay & Platform Data">
                <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
                  We may collect:
                </p>
                <BulletList
                  items={[
                    "Match history",
                    "Scores and rankings",
                    "Achievement progress",
                    "XP and progression data",
                    "Multiplayer room activity",
                    "Friend lists and social interactions",
                    "Gameplay statistics",
                    "Session activity",
                  ]}
                />
              </SubSection>

              <SubSection title="1.3 Technical Information">
                <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
                  We may automatically collect:
                </p>
                <BulletList
                  items={[
                    "Browser type",
                    "Device type",
                    "IP address",
                    "Operating system",
                    "Log data",
                    "Error and crash reports",
                    "Connection and latency information",
                  ]}
                />
              </SubSection>

              <SubSection title="1.4 Cookies & Local Storage">
                <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
                  Game Hub may use:
                </p>
                <BulletList
                  items={["Cookies", "Local storage", "Session storage"]}
                />
                <p className="mt-4 mb-3 text-sm" style={{ color: "var(--muted)" }}>
                  These technologies help:
                </p>
                <BulletList
                  items={[
                    "Maintain login sessions",
                    "Store temporary game progress",
                    "Improve performance",
                    "Remember settings and preferences",
                  ]}
                />
              </SubSection>
            </PolicySection>

            {/* ── Section 2 ── */}
            <PolicySection number="2" title="How We Use Your Information">
              <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
                We use collected information to:
              </p>
              <BulletList
                items={[
                  "Provide multiplayer gameplay services",
                  "Maintain accounts and authentication",
                  "Store rankings and achievements",
                  "Improve gameplay experience",
                  "Monitor platform stability and security",
                  "Detect abuse, cheating, or malicious activity",
                  "Personalize user experience",
                  "Develop new features and improvements",
                ]}
              />
            </PolicySection>

            {/* ── Section 3 ── */}
            <PolicySection number="3" title="Multiplayer & Community Features">
              <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
                When using multiplayer or social features:
              </p>
              <BulletList
                items={[
                  "Your username and profile information may be visible to other users",
                  "Chat messages may be temporarily processed and stored for moderation or service functionality",
                  "Match history and rankings may be publicly visible",
                ]}
              />
              <InfoNote>
                Please avoid sharing sensitive personal information through
                public chat or profile systems.
              </InfoNote>
            </PolicySection>

            {/* ── Section 4 ── */}
            <PolicySection number="4" title="Authentication Providers">
              <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
                Game Hub may support third-party authentication providers
                such as:
              </p>
              <BulletList items={["Google", "GitHub"]} />
              <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
                When using third-party sign-in providers, we may receive
                limited profile information associated with your account. Your
                use of third-party authentication services is also governed by
                their respective privacy policies.
              </p>
            </PolicySection>

            {/* ── Section 5 ── */}
            <PolicySection number="5" title="Data Storage & Security">
              <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
                We implement reasonable security measures to help protect user
                information. However, no online platform can guarantee absolute
                security.
              </p>
              <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
                We may use:
              </p>
              <BulletList
                items={[
                  "Encrypted connections (HTTPS)",
                  "Authentication tokens and sessions",
                  "Access controls",
                  "Database security best practices",
                ]}
              />
            </PolicySection>

            {/* ── Section 6 ── */}
            <PolicySection number="6" title="Guest Users">
              <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
                Some games or features may be accessible without account
                registration. Guest gameplay data may:
              </p>
              <BulletList
                items={[
                  "Be stored locally in your browser",
                  "Be temporary",
                  "Be deleted when browser storage is cleared",
                ]}
              />
              <InfoNote>
                Certain features such as rankings, matchmaking, progression
                systems, and social features may require an account.
              </InfoNote>
            </PolicySection>

            {/* ── Section 7 ── */}
            <PolicySection number="7" title="Children's Privacy">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Game Hub is not intentionally directed toward children under
                the age required by applicable laws in their region. If we
                become aware that personal information has been collected in
                violation of applicable regulations, we may remove such
                information.
              </p>
            </PolicySection>

            {/* ── Section 8 ── */}
            <PolicySection number="8" title="Third-Party Services">
              <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
                Game Hub may use third-party services for:
              </p>
              <BulletList
                items={[
                  "Hosting",
                  "Authentication",
                  "Analytics",
                  "Database services",
                  "Error monitoring",
                  "Deployment infrastructure",
                ]}
              />
              <p className="mt-4 mb-3 text-sm" style={{ color: "var(--muted)" }}>
                Examples may include:
              </p>
              <div className="flex flex-wrap gap-2">
                {["Vercel", "Neon", "Render", "Google OAuth"].map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: "var(--surface)",
                      color: "var(--neon)",
                      border: "1px solid var(--border-neon)",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
                These services may process limited technical information
                necessary for platform functionality.
              </p>
            </PolicySection>

            {/* ── Section 9 ── */}
            <PolicySection number="9" title="User Rights">
              <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
                Depending on your jurisdiction, you may have rights to:
              </p>
              <BulletList
                items={[
                  "Access your personal data",
                  "Request corrections",
                  "Request deletion of your account",
                  "Request export of your data",
                  "Withdraw consent where applicable",
                ]}
              />
              <InfoNote>
                To request account deletion or data inquiries, contact us
                using the information below.
              </InfoNote>
            </PolicySection>

            {/* ── Section 10 ── */}
            <PolicySection number="10" title="Changes to This Privacy Policy">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                We may update this Privacy Policy periodically. Updated
                versions will be posted on this page with a revised "Last
                Updated" date. Continued use of the platform after updates
                constitutes acceptance of the revised policy.
              </p>
            </PolicySection>

            {/* ── Section 11 — Contact ── */}
            <PolicySection number="11" title="Contact">
              <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>
                For questions regarding this Privacy Policy, please contact:
              </p>
              <div
                className="rounded-xl p-6 flex items-center gap-5"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border-neon)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center
                             text-2xl flex-shrink-0"
                  style={{
                    background: "var(--neon-dim)",
                    border: "1px solid var(--border-neon)",
                  }}
                >
                  ✉️
                </div>
                <div>
                  <p className="font-semibold text-sm"
                    style={{ color: "var(--primary)" }}>
                    Game Hub Support
                  </p>
                  <a
                    href="mailto:kiranspradeep2002@gmail.com"
                    className="text-sm transition-colors"
                    style={{ color: "var(--neon)" }}
                  >
                    kiranspradeep2002@gmail.com
                  </a>
                </div>
              </div>
            </PolicySection>

            {/* ── Bottom nav ── */}
            <div
              className="pt-4 flex flex-col sm:flex-row items-center
                         justify-between gap-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                © {new Date().getFullYear()} Game Hub. All rights reserved.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/legal/terms"
                  className="text-xs transition-colors hover:underline"
                  style={{ color: "var(--neon)" }}
                >
                  Terms of Service →
                </Link>
                <Link
                  href="/"
                  className="legal-back-link text-xs transition-colors"
                  style={{ color: "var(--muted)" }}
                >
                  ← Back to Hub
                </Link>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ─── Sub-components — no event handlers, pure RSC safe ─── */

function PolicySection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="px-6 py-4 flex items-center gap-4"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-xs font-black flex-shrink-0"
          style={{
            background: "var(--neon-dim)",
            color: "var(--neon)",
            border: "1px solid var(--border-neon)",
          }}
        >
          {number}
        </div>
        <h2
          className="text-base font-bold tracking-tight"
          style={{ color: "var(--primary)" }}
        >
          {title}
        </h2>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: "var(--neon)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span
            className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: "var(--neon)" }}
          />
          <span style={{ color: "var(--muted)" }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-4 rounded-lg px-4 py-3 flex gap-3 items-start text-sm"
      style={{
        background: "rgba(200,169,126,0.08)",
        border: "1px solid var(--border-gold)",
        color: "var(--gold)",
      }}
    >
      <span className="flex-shrink-0 mt-0.5">⚠️</span>
      <span>{children}</span>
    </div>
  );
}