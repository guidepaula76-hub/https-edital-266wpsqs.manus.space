import { motion, type HTMLMotionProps } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { type ComponentPropsWithoutRef, type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { playClick, useProgress } from "@/lib/progress";

export const frogAssets = {
  cheer: "/manus-storage/async-images/OPRiOpqGIfOEDimlD6Luu5/image-1.webp",
  study: "/manus-storage/async-images/97cUKmlsmkjNmLpF2bSZxM/image-1.webp",
  support: "/manus-storage/async-images/97cUKmlsmkjNmLpF2bSZxM/image-2.webp",
  icon: "/manus-storage/async-images/97cUKmlsmkjNmLpF2bSZxM/image-3.webp",
};
export function Frog({
  pose = "study",
  className = "",
  decorative = false,
}: {
  pose?: "study" | "cheer" | "support";
  className?: string;
  decorative?: boolean;
}) {
  const description = {
    study: "Sapo verde de moletom vermelho estudando com livros",
    cheer: "Sapo verde de moletom vermelho comemorando",
    support: "Sapo verde de moletom vermelho incentivando com um gesto gentil",
  };
  return (
    <motion.img
      className={`frog ${className}`}
      src={frogAssets[pose]}
      alt={decorative ? "" : description[pose]}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    />
  );
}
type ButtonProps = Omit<HTMLMotionProps<"button">, "color"> & {
  color?: "green" | "purple" | "white" | "coral" | "navy";
  small?: boolean;
};
export function MechButton({
  children,
  color = "green",
  className = "",
  small = false,
  onClick,
  ...props
}: ButtonProps) {
  const { state } = useProgress();
  return (
    <motion.button
      {...props}
      className={`mech-button mech-${color} ${small ? "mech-small" : ""} ${className}`}
      whileHover={props.disabled ? undefined : { y: -2 }}
      whileTap={props.disabled ? undefined : { y: 4 }}
      onClick={e => {
        playClick(state.sound);
        onClick?.(e);
      }}
    >
      {children}
    </motion.button>
  );
}
export function Card({
  children,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section className={`ultra-card ${className}`} {...props}>
      {children}
    </section>
  );
}
export function Tag({
  children,
  tone = "purple",
}: {
  children: ReactNode;
  tone?: "purple" | "green" | "coral" | "muted";
}) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}
export function ProgressBar({
  value,
  color = "green",
  label,
}: {
  value: number;
  color?: "green" | "purple" | "coral";
  label?: string;
}) {
  return (
    <div
      className={`progress-track progress-${color}`}
      role="progressbar"
      aria-label={label ?? "Progresso"}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.7 }}
      />
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="ultra-tabs" role="tablist">
      {items.map(item => (
        <button
          key={item.id}
          role="tab"
          aria-selected={value === item.id}
          className={value === item.id ? "active" : ""}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="ultra-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>
        {children}
      </motion.div>
    </div>
  );
}
export function Brand({ compact = false }: { compact?: boolean }) {
  const [, navigate] = useLocation();
  return (
    <button
      className="brand"
      aria-label="UltraConcursos IA — início"
      onClick={() => navigate("/")}
    >
      <span className="brand-mark">
        <img src={frogAssets.icon} alt="" />
      </span>
      {!compact && (
        <span>
          ultra<span className="brand-light">concursos</span>
          <small>IA</small>
        </span>
      )}
    </button>
  );
}
export function DemoNote({ children }: { children?: ReactNode }) {
  return (
    <div className="demo-note">
      <Sparkles size={14} />
      <span>
        {children ??
          "Ambiente demonstrativo. Seu progresso é salvo somente neste dispositivo."}
      </span>
    </div>
  );
}
