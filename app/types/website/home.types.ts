export interface NavLink {
  href: string;
  label: { en: string; ar: string };
}

export interface StatItem {
  icon: string;
  target: number;
  suffix: string;
  label: { en: string; ar: string };
}

export interface ServiceItem {
  icon: string;
  title: { en: string; ar: string };
  desc: { en: string; ar: string };
  buttonLabel?: { en: string; ar: string };
}

export interface ProcessStep {
  num: number;
  title: { en: string; ar: string };
  desc: { en: string; ar: string };
}

export interface CountryItem {
  flag: string;
  name: { en: string; ar: string };
  specialty: string;
  region: "asia" | "africa";
  workersLabel: string;
}

export interface BadgeItem {
  icon: string;
  title: { en: string; ar: string };
  desc: { en: string; ar: string };
  tag: { en: string; ar: string };
}

export interface SocialLink {
  label: string;
  icon: string;
  href: string;
}

export interface ContactItem {
  icon: string;
  text: string;
}

export interface FooterColumn {
  title: { en: string; ar: string };
  links: NavLink[];
}

export type LocaleString = {
  en: string;
  ar: string;
};

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  country: string;
  message: string;
}

export interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  country?: string;
}
