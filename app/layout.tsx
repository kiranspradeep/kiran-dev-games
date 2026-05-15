import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import AuthModal from "@/components/auth/AuthModal";
import SettingsModal from "@/components/ui/SettingsModal";
import ToastContainer from "@/components/ui/Toast";
import Providers from "./providers";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant-loaded",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KSP Games — Competitive Browser Gaming Platform",
  description:
    "A next-generation multiplayer game hub featuring competitive strategy games, realtime matchmaking, and immersive browser experiences.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body
        className="min-h-screen"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--primary)",
        }}
      >
        <Providers>
          {children}

          {/* Global modals — always mounted, shown via uiStore */}
          <AuthModal />
          <SettingsModal />

          {/* Global toast layer */}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}