// app/legal/terms/page.tsx
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service — Game Hub",
  description:
    "Game Hub Terms of Service — rules and guidelines for using the platform.",
};

export default function TermsOfServicePage() {
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
                "radial-gradient(ellipse, var(--gold) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />

          <div className="relative max-w-5xl mx-auto text-center">
            {/* Breadcrumb */}
            <div
              className="flex items-center justify-center gap-2 mb-6 text-xs"
              style={{ color: "var(--muted)" }}
            >
              <Link
                href="/"
                className="legal-back-link transition-colors"
                style={{ color: "var(--muted)" }}
              >
                Hub
              </Link>
              <span>/</span>
              <span style={{ color: "var(--gold)" }}>Terms of Service</span>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6">
              <div
                className="px-4 py-1.5 rounded-full text-xs font-semibold
                           tracking-widest uppercase"
                style={{
                  background: "var(--gold-dim)",
                  color: "var(--gold)",
                  border: "1px solid var(--border-gold)",
                }}
              >
                Legal Document
              </div>
            </div>

            <h1
              className="text-4xl md:text-5xl font-black tracking-tight mb-4"
              style={{ color: "var(--primary)" }}
            >
              Terms of{" "}
              <span
                style={{
                  color: "var(--gold)",
                  textShadow: "0 0 20px rgba(200,169,126,0.6)",
                }}
              >
                Service
              </span>
            </h1>

            <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>
              Last Updated:{" "}
              <span style={{ color: "var(--gold)" }}>May 15, 2026</span>
            </p>

            <p
              className="mt-5 max-w-2xl mx-auto text-base leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              These Terms of Service govern your use of Game Hub, including
              all games, multiplayer systems, profiles, rankings, and related
              services.
            </p>

            {/* Nav pills */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <Link
                href="/legal/privacy"
                className="legal-nav-link px-4 py-1.5 rounded-full text-xs
                           font-semibold tracking-wide"
                style={{ color: "var(--muted)" }}
              >
                Privacy Policy
              </Link>
              <Link
                href="/legal/terms"
                className="px-4 py-1.5 rounded-full text-xs font-semibold
                           tracking-wide transition-all"
                style={{
                  background: "var(--gold-dim)",
                  color: "var(--gold)",
                  border: "1px solid var(--border-gold)",
                }}
              >
                Terms of Service
              </Link>
            </div>

            {/* Divider */}
            <div
              className="mt-10 h-px w-full max-w-xl mx-auto"
              style={{
                background:
                  "linear-gradient(to right, transparent, var(--border-gold), transparent)",
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
                background: "var(--gold-dim)",
                border: "1px solid var(--border-gold)",
              }}
            >
              <span className="text-xl mt-0.5">📋</span>
              <p className="text-sm leading-relaxed"
                style={{ color: "var(--primary)" }}>
                By accessing or using Game Hub, you agree to these Terms.
                Please read them carefully before using the platform.
              </p>
            </div>

            {/* ── Section 1 ── */}
            <TermsSection number="1" title="Eligibility">
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                You must comply with all applicable laws and regulations when
                using Game Hub. You are responsible for ensuring that your use
                of the platform is permitted in your jurisdiction.
              </p>
            </TermsSection>

            {/* ── Section 2 ── */}
            <TermsSection number="2" title="User Accounts">
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                You may create an account using supported authentication
                methods. You are responsible for:
              </p>
              <BulletList
                items={[
                  "Maintaining account security",
                  "Protecting your credentials",
                  "Activities performed under your account",
                ]}
              />
              <p className="text-sm mt-4" style={{ color: "var(--muted)" }}>
                You agree not to impersonate others or create accounts for
                abusive or fraudulent purposes.
              </p>
            </TermsSection>

            {/* ── Section 3 ── */}
            <TermsSection number="3" title="Acceptable Use">
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                You agree{" "}
                <span style={{ color: "var(--gold)", fontWeight: 600 }}>
                  NOT
                </span>{" "}
                to:
              </p>
              <ProhibitedList
                items={[
                  "Cheat or exploit gameplay systems",
                  "Abuse matchmaking systems",
                  "Use bots or automation tools",
                  "Harass or threaten other users",
                  "Attempt unauthorized access to systems or accounts",
                  "Distribute malicious software",
                  "Exploit vulnerabilities intentionally",
                  "Use the service for unlawful purposes",
                ]}
              />
            </TermsSection>

            {/* ── Section 4 ── */}
            <TermsSection number="4" title="Multiplayer Conduct">
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                While using multiplayer systems, users must:
              </p>
              <BulletList
                items={[
                  "Respect other players",
                  "Avoid abusive language",
                  "Avoid harassment or hate speech",
                  "Avoid disruptive or malicious behavior",
                ]}
              />
              <InfoNote>
                We reserve the right to restrict or terminate access for
                users violating these rules.
              </InfoNote>
            </TermsSection>

            {/* ── Section 5 ── */}
            <TermsSection number="5" title="Rankings & Competitive Systems">
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                Game Hub may include:
              </p>
              <BulletList
                items={[
                  "Rankings",
                  "Matchmaking",
                  "XP systems",
                  "Achievements",
                  "Competitive gameplay modes",
                ]}
              />
              <p className="text-sm mt-4 mb-3" style={{ color: "var(--muted)" }}>
                We reserve the right to:
              </p>
              <BulletList
                items={[
                  "Reset rankings",
                  "Modify progression systems",
                  "Remove fraudulent scores",
                  "Suspend accounts involved in cheating or exploitation",
                ]}
              />
            </TermsSection>

            {/* ── Section 6 ── */}
            <TermsSection number="6" title="Intellectual Property">
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                All platform content including:
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  "UI designs",
                  "Branding",
                  "Logos",
                  "Graphics",
                  "Game systems",
                  "Code",
                  "Animations",
                  "Platform assets",
                ].map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: "var(--surface)",
                      color: "var(--gold)",
                      border: "1px solid var(--border-gold)",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                …remain the property of Game Hub and its creators unless
                otherwise stated. Users may not reproduce, redistribute, or
                commercially exploit platform content without permission.
              </p>
            </TermsSection>

            {/* ── Section 7 ── */}
            <TermsSection number="7" title="Service Availability">
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                Game Hub is provided on an{" "}
                <span style={{ color: "var(--primary)", fontWeight: 500 }}>
                  "as available"
                </span>{" "}
                basis. We do not guarantee:
              </p>
              <BulletList
                items={[
                  "Continuous uptime",
                  "Error-free service",
                  "Permanent availability of specific features",
                ]}
              />
              <p className="text-sm mt-4" style={{ color: "var(--muted)" }}>
                Features may be modified, removed, or updated at any time.
              </p>
            </TermsSection>

            {/* ── Section 8 ── */}
            <TermsSection number="8" title="Account Suspension & Termination">
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                We reserve the right to:
              </p>
              <BulletList
                items={[
                  "Suspend accounts",
                  "Remove content",
                  "Restrict platform access",
                  "Terminate services",
                ]}
              />
              <InfoNote>
                These actions may be taken for violations of these Terms or
                activities harmful to the platform or its users.
              </InfoNote>
            </TermsSection>

            {/* ── Section 9 ── */}
            <TermsSection number="9" title="Third-Party Services">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Game Hub may rely on third-party services including hosting,
                authentication, and infrastructure providers. We are not
                responsible for outages or issues caused by third-party
                services.
              </p>
            </TermsSection>

            {/* ── Section 10 ── */}
            <TermsSection number="10" title="Limitation of Liability">
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                To the maximum extent permitted by applicable law, Game Hub
                and its creators shall not be liable for:
              </p>
              <BulletList
                items={[
                  "Data loss",
                  "Service interruptions",
                  "Gameplay losses",
                  "Indirect damages",
                  "Technical failures",
                  "Unauthorized account access",
                ]}
              />
              <div
                className="mt-5 rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "rgba(200,169,126,0.08)",
                  border: "1px solid var(--border-gold)",
                  color: "var(--gold)",
                }}
              >
                ⚖️ Users access and use the platform at their own risk.
              </div>
            </TermsSection>

            {/* ── Section 11 ── */}
            <TermsSection number="11" title="Changes to These Terms">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                We may update these Terms periodically. Continued use of the
                platform after changes constitutes acceptance of the updated
                Terms.
              </p>
            </TermsSection>

            {/* ── Section 12 — Contact ── */}
            <TermsSection number="12" title="Contact">
              <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>
                For questions regarding these Terms, contact:
              </p>
              <div
                className="rounded-xl p-6 flex items-center gap-5"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-gold)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center
                             text-2xl flex-shrink-0"
                  style={{
                    background: "var(--gold-dim)",
                    border: "1px solid var(--border-gold)",
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
                    style={{ color: "var(--gold)" }}
                  >
                    kiranspradeep2002@gmail.com
                  </a>
                </div>
              </div>
            </TermsSection>

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
                  href="/legal/privacy"
                  className="text-xs transition-colors hover:underline"
                  style={{ color: "var(--neon)" }}
                >
                  ← Privacy Policy
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

function TermsSection({
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
            background: "var(--gold-dim)",
            color: "var(--gold)",
            border: "1px solid var(--border-gold)",
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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span
            className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: "var(--gold)" }}
          />
          <span style={{ color: "var(--muted)" }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ProhibitedList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-sm rounded-lg px-3 py-2"
          style={{
            background: "rgba(255,60,60,0.05)",
            border: "1px solid rgba(255,60,60,0.1)",
          }}
        >
          <span
            className="flex-shrink-0 mt-0.5 text-xs font-bold"
            style={{ color: "#f87171" }}
          >
            ✕
          </span>
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