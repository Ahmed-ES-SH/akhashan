"use client";

import { useState } from "react";
import { useTranslation } from "@/app/hooks/useTranslation";

/////////////////////////////////////////////////////////////////////
///////////// Admin Login Form — simple inline fallback /////////////
/////////////////////////////////////////////////////////////////////

interface AdminLoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function AdminLoginForm({
  onLogin,
  isLoading,
  error,
}: AdminLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const adminT = useTranslation("admin");
  const loginSection = (adminT as Record<string, unknown>)?.login as
    | Record<string, string>
    | undefined;

  const titleText =
    typeof loginSection?.title === "string"
      ? loginSection.title
      : "Admin Login";
  const subtitleText =
    typeof loginSection?.subtitle === "string"
      ? loginSection.subtitle
      : "Sign in to access the admin panel";
  const emailLabelText =
    typeof loginSection?.emailLabel === "string"
      ? loginSection.emailLabel
      : "Email";
  const emailPlaceholderText =
    typeof loginSection?.emailPlaceholder === "string"
      ? loginSection.emailPlaceholder
      : "admin@example.com";
  const passwordLabelText =
    typeof loginSection?.passwordLabel === "string"
      ? loginSection.passwordLabel
      : "Password";
  const passwordPlaceholderText =
    typeof loginSection?.passwordPlaceholder === "string"
      ? loginSection.passwordPlaceholder
      : "••••••••";
  const submitText =
    typeof loginSection?.submit === "string" ? loginSection.submit : "Sign In";
  const submittingText =
    typeof loginSection?.submitting === "string"
      ? loginSection.submitting
      : "Signing in...";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-charcoal">{titleText}</h2>
      <p className="mt-1 text-sm text-muted">{subtitleText}</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">
            {emailLabelText}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-green focus:ring-2 focus:ring-green/20"
            placeholder={emailPlaceholderText}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal">
            {passwordLabelText}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-green focus:ring-2 focus:ring-green/20"
            placeholder={passwordPlaceholderText}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-green px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-green/25 transition hover:bg-green-deep disabled:opacity-60"
        >
          {isLoading ? submittingText : submitText}
        </button>
      </form>
    </div>
  );
}
