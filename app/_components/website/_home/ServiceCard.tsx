/* eslint-disable react-hooks/static-components */
"use client";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { getIcon } from "@/app/helpers/getIcon";
import { FaGlobe } from "react-icons/fa6";

export default function ServiceCard({
  icon,
  title,
  desc,
  metric,
  buttonLabel,
  locale,
  index,
}: {
  icon: string;
  title: string;
  desc: string;
  metric?: { value: number; suffix: string; label: string };
  buttonLabel: string;
  locale: "en" | "ar";
  index: number;
}) {
  const router = useRouter();
  const Icon = getIcon(icon) ?? FaGlobe; // Get the icon component based on the name

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.06,
      }}
      className="group relative flex flex-col bg-white border border-border p-6 transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/8"
    >
      <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-gold to-gold-light rounded-t-[20px] scale-x-0 group-hover:scale-x-100 transition-transform duration-[400ms] ease-out origin-left" />

      <div className="flex items-center justify-between mb-5">
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-gold/10 flex items-center justify-center transition-all duration-300 ease-out group-hover:bg-gold/20 group-hover:scale-105">
          <Icon className="w-6 h-6 text-gold transition-all duration-300 ease-out group-hover:text-green-dark" />
        </div>
        {metric && <MetricDisplay metric={metric} />}
      </div>

      <h3 className="text-lg font-bold text-charcoal mb-2">{title}</h3>

      <p className="text-sm text-muted leading-relaxed line-clamp-3 mb-auto">
        {desc}
      </p>

      <motion.button
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.06 }}
        onClick={() => router.push(`/${locale}/#contact`)}
        className="mt-5 w-full bg-green text-white text-sm font-bold py-3 px-5 rounded-xl transition-all duration-300 hover:bg-green-dark active:scale-[0.97] flex items-center justify-center gap-2"
      >
        <span className="transition-all duration-300 ease-out group-hover:-translate-x-0.5">
          {buttonLabel}
        </span>
        <Icon className="w-4 h-4 shrink-0 transition-all duration-300 ease-out group-hover:translate-x-0.5 opacity-0 -translate-x-1 group-hover:opacity-100" />
      </motion.button>
    </motion.div>
  );
}

function MetricDisplay({
  metric,
}: {
  metric: { value: number; suffix: string; label: string };
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = metric.value;
    const duration = 1000;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const increment = end / totalSteps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.round(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [inView, metric.value]);

  return (
    <div ref={ref} className="leading-tight text-right">
      <span className="text-2xl font-extrabold text-green">
        {count}
        {metric.suffix}
      </span>
      <p className="text-xs text-muted mt-0.5 whitespace-nowrap">
        {metric.label}
      </p>
    </div>
  );
}
