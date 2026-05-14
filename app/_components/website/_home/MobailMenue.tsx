import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

interface MobailMenueProps {
  mobileOpen: boolean;
  links: { href: string; label: { en: string; ar: string } }[];
  locale: "en" | "ar";
  setMobileOpen: (open: boolean) => void;
}

export default function MobailMenue({
  mobileOpen,
  links,
  locale,
  setMobileOpen,
}: MobailMenueProps) {
  return (
    <AnimatePresence>
      {(mobileOpen || undefined) && (
        <motion.ul
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`${mobileOpen ? "absolute top-20 left-0 right-0 flex flex-col gap-0 bg-green-dark p-5 border-b border-gold/15 shadow-lg" : "hidden"}
                md:flex md:items-center md:gap-[clamp(16px,2.5vw,36px)] md:static md:bg-transparent md:p-0 md:border-none md:shadow-none list-none`}
          id="navLinks"
        >
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={`/${locale}${link.href}`}
                className="text-white/70 hover:text-white text-sm font-medium transition-colors duration-250 whitespace-nowrap relative py-3.5 md:py-0 block md:inline border-b md:border-b-0 border-white/6 no-underline
                      after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-gold after:transition-all after:duration-300 after:rounded-full hover:after:w-full"
                onClick={() => setMobileOpen(false)}
              >
                {link.label[locale]}
              </Link>
            </li>
          ))}
        </motion.ul>
      )}
    </AnimatePresence>
  );
}
