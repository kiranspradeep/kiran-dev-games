"use client";

import { useUiStore } from "@/store/uiStore";
import Modal from "@/components/ui/Modal";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthModal() {
  const { activeModal, authModalTab, closeModal, openModal } = useUiStore();
  const isOpen = activeModal === "auth";

  const handleSuccess = () => {
    closeModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      size="sm"
      showClose
    >
      {/* Tab switcher */}
      <div
        className="flex rounded-xl p-1 mb-5"
        style={{ background: "var(--card)" }}
      >
        {(["login", "signup"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => openModal("auth", tab)}
            className="flex-1 py-2 rounded-lg font-inter text-xs font-semibold
                       capitalize transition-all duration-200 cursor-pointer"
            style={{
              background:
                authModalTab === tab
                  ? "rgba(0,168,255,0.12)"
                  : "transparent",
              color:
                authModalTab === tab ? "var(--neon)" : "var(--muted)",
              border:
                authModalTab === tab
                  ? "1px solid rgba(0,168,255,0.2)"
                  : "1px solid transparent",
            }}
          >
            {tab === "login" ? "Sign In" : "Create Account"}
          </button>
        ))}
      </div>

      {/* Forms */}
      <AnimatePresence mode="wait">
        <motion.div
          key={authModalTab}
          initial={{ opacity: 0, x: authModalTab === "login" ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: authModalTab === "login" ? 10 : -10 }}
          transition={{ duration: 0.18 }}
        >
          {authModalTab === "login" ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToSignup={() => openModal("auth", "signup")}
            />
          ) : (
            <SignupForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => openModal("auth", "login")}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
}