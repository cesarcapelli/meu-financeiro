import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

export function SectionCard({
  title,
  action,
  onClick,
  className = "",
  children,
}: {
  title?: string;
  action?: ReactNode;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { scale: 1.01, translateY: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`bg-card border border-border rounded-2xl p-4 ${onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""} ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
          {action}
        </div>
      )}
      {children}
    </motion.div>
  );
}

export function ProgressBar({
  pct,
  color,
  track = "bg-muted",
  height = "h-1.5",
}: {
  pct: number;
  color: string;
  track?: string;
  height?: string;
}) {
  return (
    <div className={`${height} rounded-full ${track} overflow-hidden`}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: color }}
      />
    </div>
  );
}

export function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
        <Icon size={20} className="text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

// Shared inputs styled with design tokens.
export function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 ${props.className ?? ""}`}
    />
  );
}

export function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary/40 ${props.className ?? ""}`}
    />
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      {...props as any}
      whileHover={!props.disabled ? { scale: 1.01, filter: "brightness(1.05)" } : undefined}
      whileTap={!props.disabled ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      className={`w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-sm transition-transform disabled:opacity-40 ${props.className ?? ""}`}
    >
      {children}
    </motion.button>
  );
}
