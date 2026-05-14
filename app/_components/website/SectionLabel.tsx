interface SectionLabelProps {
  children: React.ReactNode;
}

export default function SectionLabel({ children }: SectionLabelProps) {
  return (
    <span className="inline-block text-xs font-bold uppercase tracking-[0.12em] text-gold mb-3">
      {children}
    </span>
  );
}
