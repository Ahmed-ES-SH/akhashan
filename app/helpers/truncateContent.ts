export const truncateContent = (text?: string, maxLength = 160) => {
  if (!text || text.trim() === "") return "";

  const cleanText = text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanText.length <= maxLength) return cleanText;

  const truncated = cleanText.slice(0, maxLength);

  return truncated.slice(0, truncated.lastIndexOf(" ")) + "…";
};
