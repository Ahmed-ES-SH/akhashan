import ar from "@/translations/ar.json";
import en from "@/translations/en.json";

type Locale = "ar" | "en";
type Messages = typeof ar;
type Namespace = keyof Messages;

export function getServerTranslation<N extends Namespace>(
  locale: Locale = "ar",
  namespace: N,
) {
  const messages: Messages = locale === "en" ? en : ar;
  return messages[namespace];
}
