import slugify from "slugify";

type SupportedLocale = "en" | "ar";

export const formatTitle = (
  title?: string,
  locale: SupportedLocale = "en",
  options?: { fallback?: string },
) => {
  if (!title || title.trim() === "") {
    return options?.fallback ?? "untitled";
  }

  const isArabic = locale === "ar";

  return slugify(title, {
    lower: true,
    trim: true,
    locale,
    strict: !isArabic,
    remove: isArabic ? undefined : /[*+~.()'"!:@]/g,
  });
};
