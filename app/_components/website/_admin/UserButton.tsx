"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useLocale } from "@/app/hooks/useLocale";
import {
  FiLayout,
  FiMessageSquare,
  FiGlobe,
  FiLogOut,
  FiChevronDown,
} from "react-icons/fi";

// ///////////////////////////////////////////////////////////////////////
// ///////////// UserButton — avatar + dropdown for admin header //////////
// ///////////// Shows initials fallback when no avatar ///////////////////
// ///////////////////////////////////////////////////////////////////////

export default function UserButton() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const t = useTranslation("userButton");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // /////////////////////////////////////////////////////////////////
  // ///////////// Close dropdown on outside click ////////////////////
  // /////////////////////////////////////////////////////////////////

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // /////////////////////////////////////////////////////////////////
  // ///////////// Close dropdown on Escape key ///////////////////////
  // /////////////////////////////////////////////////////////////////

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // /////////////////////////////////////////////////////////////////
  // ///////////// Loading state — skeleton ////////////////////////////
  // /////////////////////////////////////////////////////////////////

  if (isLoading) {
    return (
      <div className="flex animate-pulse items-center gap-3" aria-busy="true">
        <div className="h-9 w-9 rounded-full bg-gray-200" />
        <div className="hidden h-4 w-24 rounded bg-gray-200 md:block" />
      </div>
    );
  }

  // Not authenticated — nothing to render
  if (!isAuthenticated || !user) return null;

  // Generate initials from user name
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const dropdownPosition =
    locale === "ar"
      ? "left-0 origin-top-left"
      : "right-0 origin-top-right";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Trigger button ──────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="user-button-trigger"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-green text-xs font-bold text-white"
            data-testid="user-button-avatar"
          >
            {initials}
          </span>
        )}
        <span className="hidden md:inline">{user.name}</span>
        <FiChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ── Dropdown menu ───────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`absolute top-full z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-lg ${dropdownPosition}`}
          role="menu"
          data-testid="user-dropdown"
        >
          {/* User info header */}
          <div
            className="border-b border-gray-100 px-4 py-3"
            data-testid="user-dropdown-info"
          >
            <p className="truncate text-sm font-semibold text-gray-900">
              {user.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {user.email}
            </p>
          </div>

          {/* Navigation links */}
          <div className="py-1" role="none">
            <Link
              href={`/${locale}/admin/services`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
              role="menuitem"
              data-testid="user-dropdown-services"
            >
              <FiLayout className="h-4 w-4 text-gray-400" />
              {t.adminServices}
            </Link>
            <Link
              href={`/${locale}/admin/contact-messages`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
              role="menuitem"
              data-testid="user-dropdown-contact-messages"
            >
              <FiMessageSquare className="h-4 w-4 text-gray-400" />
              {t.adminContactMessages}
            </Link>
            <Link
              href={`/${locale}/admin/countries`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
              role="menuitem"
              data-testid="user-dropdown-countries"
            >
              <FiGlobe className="h-4 w-4 text-gray-400" />
              {t.adminCountries}
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-1" role="none">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
              role="menuitem"
              data-testid="user-dropdown-logout"
            >
              <FiLogOut className="h-4 w-4" />
              {t.logout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
