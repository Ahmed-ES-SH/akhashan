"use client";

import { motion, type Variants } from "framer-motion";
import { ReactNode } from "react";
import SectionLabel from "./SectionLabel";

interface SectionWrapperProps {
  id?: string;
  label?: string;
  heading?: string;
  description?: string;
  variant?: "default" | "dark" | "sand";
  children: ReactNode;
  className?: string;
}

const bgVariants: Record<string, string> = {
  default: "bg-bg",
  dark: "bg-green-dark text-white",
  sand: "bg-sand",
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function SectionWrapper({
  id,
  label,
  heading,
  description,
  variant = "default",
  children,
  className = "",
}: SectionWrapperProps) {
  return (
    <motion.section
      id={id}
      className={`py-[clamp(72px,10vw,140px)] ${bgVariants[variant]} ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={sectionVariants}
    >
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        {label && <SectionLabel>{label}</SectionLabel>}
        {heading && (
          <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-charcoal [.section-dark_&]:text-white">
            {heading}
          </h2>
        )}
        {description && (
          <p className="text-lg text-muted max-w-145 mb-12 leading-relaxed in-[.section-dark]:text-white/65">
            {description}
          </p>
        )}
        {children}
      </div>
    </motion.section>
  );
}
