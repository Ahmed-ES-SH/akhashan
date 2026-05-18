"use client";

import { useState } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { useLogin } from "@/app/hooks/useLogin";
import { useTranslation } from "@/app/hooks/useTranslation";

///////////////////////////////////////////////////////////////////////
/////////////// Login Form — fields, validation, submit ///////////////
///////////////////////////////////////////////////////////////////////

export default function LoginForm() {
  const t = useTranslation("login");
  const {
    email,
    password,
    error,
    isSubmitting,
    fieldErrors,
    setEmail,
    setPassword,
    handleSubmit,
    clearError,
  } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="w-full"
      noValidate
    >
      {/* ── Error banner ───────────────────────────────────────────── */}
      {error && (
        <div
          data-testid="login-error"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {(t.errors as Record<string, string>)[error] || error}
        </div>
      )}

      {/* ── Email field ────────────────────────────────────────────── */}
      <div className="mb-5">
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-sm font-semibold text-charcoal"
        >
          {t.form.emailLabel}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            <FiMail className="h-4 w-4" />
          </span>
          <input
            id="login-email"
            type="email"
            data-testid="login-email-input"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) clearError();
            }}
            placeholder={t.form.emailPlaceholder}
            disabled={isSubmitting}
            autoComplete="email"
            className={`w-full rounded-xl border bg-surface py-3.5 pl-11 pr-4 text-sm text-charcoal placeholder:text-muted transition-all duration-200 focus:border-green focus:ring-2 focus:ring-green/20 ${
              fieldErrors.email
                ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                : "border-border"
            }`}
          />
        </div>
        {fieldErrors.email && (
          <p data-testid="login-email-error" className="mt-1 text-xs text-red-500">
            {(t.errors as Record<string, string>)[fieldErrors.email]}
          </p>
        )}
      </div>

      {/* ── Password field ─────────────────────────────────────────── */}
      <div className="mb-5">
        <label
          htmlFor="login-password"
          className="mb-1.5 block text-sm font-semibold text-charcoal"
        >
          {t.form.passwordLabel}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            <FiLock className="h-4 w-4" />
          </span>
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            data-testid="login-password-input"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) clearError();
            }}
            placeholder={t.form.passwordPlaceholder}
            disabled={isSubmitting}
            autoComplete="current-password"
            className={`w-full rounded-xl border bg-surface py-3.5 pl-11 pr-12 text-sm text-charcoal placeholder:text-muted transition-all duration-200 focus:border-green focus:ring-2 focus:ring-green/20 ${
              fieldErrors.password
                ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                : "border-border"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition hover:text-charcoal"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <FiEyeOff className="h-4 w-4" />
            ) : (
              <FiEye className="h-4 w-4" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p
            data-testid="login-password-error"
            className="mt-1 text-xs text-red-500"
          >
            {(t.errors as Record<string, string>)[fieldErrors.password]}
          </p>
        )}
      </div>

      {/* ── Remember me ────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-2">
        <input
          id="login-remember"
          type="checkbox"
          className="h-4 w-4 rounded border-border text-green focus:ring-green/30"
        />
        <label
          htmlFor="login-remember"
          className="text-sm text-muted cursor-pointer select-none"
        >
          {t.form.rememberMe}
        </label>
      </div>

      {/* ── Gold accent divider ────────────────────────────────────── */}
      <div className="mb-6 h-px w-16 bg-gold" />

      {/* ── Submit button ──────────────────────────────────────────── */}
      <button
        type="submit"
        data-testid="login-submit-button"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-green/25 transition-all duration-300 hover:bg-green-deep hover:shadow-xl hover:shadow-green/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <svg
              className="h-5 w-5 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {t.form.submittingButton}
          </>
        ) : (
          t.form.submitButton
        )}
      </button>
    </form>
  );
}
