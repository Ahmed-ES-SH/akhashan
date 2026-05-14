export const getSharedMetadata = (title: string, description: string) => ({
  keywords: [
    "recruitment",
    "manpower services",
    "Saudi Arabia recruitment",
    "استقدام",
    "عمالة",
    "شركة استقدام",
    "Abdullah Khashan",
    "Al-Shammari Recruitment",
    "Musaned",
    "HRDF",
    "domestic worker",
    "corporate workforce",
  ],
  openGraph: {
    title,
    description,
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://ak-shr.com",
    siteName: "Abdullah Khashan Al-Shammari Recruitment",
    type: "website",
    locale: "ar_SA",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://ak-shr.com"}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Abdullah Khashan Al-Shammari Recruitment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [
      `${process.env.NEXT_PUBLIC_BASE_URL || "https://ak-shr.com"}/og-image.png`,
    ],
  },
});
