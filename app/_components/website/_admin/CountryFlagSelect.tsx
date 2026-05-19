"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import allCountries from "world-countries";

/////////////////////////////////////////////////////////////////////
///////////// Searchable country flag select for admin form /////////
/////////////////////////////////////////////////////////////////////

interface CountryFlagSelectProps {
  value: string;
  onChange: (emoji: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  locale: "en" | "ar";
}

interface CountryOption {
  emoji: string;
  name: string;
  cca2: string;
}

export default function CountryFlagSelect({
  value,
  onChange,
  disabled = false,
  hasError = false,
  locale,
}: CountryFlagSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const options: CountryOption[] = useMemo(
    () =>
      allCountries.map((c) => ({
        emoji: c.flag,
        name: locale === "ar" ? c.translations?.ara?.common || c.name.common : c.name.common,
        cca2: c.cca2,
      })),
    [locale],
  );

  const filtered = useMemo(
    () =>
      search.trim()
        ? options.filter(
            (o) =>
              o.name.toLowerCase().includes(search.toLowerCase()) ||
              o.cca2.toLowerCase().includes(search.toLowerCase()),
          )
        : options,
    [options, search],
  );

  const selected = options.find((o) => o.emoji === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const baseClasses =
    "w-full rounded-xl border px-4 py-3 text-sm text-gray-900 transition bg-gray-50 focus:outline-none disabled:opacity-50 cursor-pointer flex items-center gap-3";
  const borderClasses = hasError
    ? "border-red-300"
    : isOpen
      ? "border-gold ring-2 ring-gold/20"
      : "border-gray-200 hover:border-gray-300";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setSearch("");
          }
        }}
        disabled={disabled}
        className={`${baseClasses} ${borderClasses}`}
      >
        {selected ? (
          <>
            <span className="text-xl leading-none">{selected.emoji}</span>
            <span className="text-gray-900">{selected.name}</span>
          </>
        ) : (
          <span className="text-gray-400">
            {locale === "ar" ? "اختر دولة..." : "Select a country..."}
          </span>
        )}
        <FiChevronDown
          className={`ml-auto w-4 h-4 text-gray-400 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <FiSearch className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === "ar" ? "بحث..." : "Search..."}
              className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              autoFocus
              dir={locale === "ar" ? "rtl" : "ltr"}
            />
          </div>
          <ul className="max-h-60 overflow-y-auto" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">
                {locale === "ar" ? "لا توجد نتائج" : "No results found"}
              </li>
            ) : (
              filtered.map((country) => (
                <li
                  key={country.cca2}
                  role="option"
                  aria-selected={country.emoji === value}
                  onClick={() => {
                    onChange(country.emoji);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition ${
                    country.emoji === value
                      ? "bg-gold/10 text-gold-deep"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl leading-none">{country.emoji}</span>
                  <span>{country.name}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
