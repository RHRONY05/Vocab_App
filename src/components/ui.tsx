import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ==========================================================================
   Button
   ========================================================================== */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "danger"
    | "success-soft"
    | "danger-soft"
    | "saved";
  size?: "sm" | "default" | "lg";
  block?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "default", block, children, ...props }, ref) => {
    const variantClass =
      variant === "primary"
        ? "btn-primary"
        : variant === "secondary"
        ? "btn-secondary"
        : variant === "ghost"
        ? "btn-ghost"
        : variant === "danger"
        ? "btn-danger"
        : variant === "success-soft"
        ? "btn-success-soft"
        : variant === "danger-soft"
        ? "btn-danger-soft"
        : variant === "saved"
        ? "btn-saved"
        : "";

    const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
    const blockClass = block ? "btn-block" : "";

    return (
      <button
        ref={ref}
        className={cn("btn", variantClass, sizeClass, blockClass, className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

/* ==========================================================================
   Kbd
   ========================================================================== */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={className}>{children}</kbd>;
}

/* ==========================================================================
   Chip
   ========================================================================== */
export function Chip({
  children,
  outline = false,
  className,
  onClick,
}: {
  children: React.ReactNode;
  outline?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const Component = onClick ? "button" : "span";
  return (
    <Component
      onClick={onClick}
      className={cn("chip", outline && "chip-outline", className)}
    >
      {children}
    </Component>
  );
}

/* ==========================================================================
   Segmented
   ========================================================================== */
export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  count?: number;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  full = false,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  full?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("seg", full && "full", className)} role="tablist">
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={isSelected ? "on" : ""}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={cn("count", !isSelected && "soft", "ml-1.5")}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   Switch
   ========================================================================== */
export function Switch({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <label
      className={cn("switch", checked && "on", className)}
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    >
      <i aria-hidden="true" />
      {label && <span>{label}</span>}
    </label>
  );
}

/* ==========================================================================
   Banner
   ========================================================================== */
export function Banner({
  variant = "neutral",
  icon,
  children,
  className,
}: {
  variant?: "accent" | "warn" | "danger" | "neutral";
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const variantClass =
    variant === "accent"
      ? "banner-accent"
      : variant === "warn"
      ? "banner-warn"
      : variant === "danger"
      ? "banner-danger"
      : "banner-neutral";

  return (
    <div className={cn("banner", variantClass, className)} role="alert">
      {icon}
      <div className="grow">{children}</div>
    </div>
  );
}

/* ==========================================================================
   Skeleton
   ========================================================================== */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("sk", className)} aria-hidden="true" />;
}

/* ==========================================================================
   StatusDot
   ========================================================================== */
export function StatusDot({
  status,
  className,
}: {
  status: "new" | "learning" | "mastered";
  className?: string;
}) {
  return (
    <span
      role="img"
      className={cn("dot", status, className)}
      title={`Status: ${status}`}
      aria-label={`Status: ${status}`}
    />
  );
}

/* ==========================================================================
   BoxMeter
   ========================================================================== */
export function BoxMeter({
  box,
  className,
}: {
  box: number; // 0..5
  className?: string;
}) {
  const isMastered = box >= 4;
  return (
    <div
      className={cn("pips", isMastered && "mastered", className)}
      title={`Box ${box} of 5`}
      aria-label={`Box ${box} of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= box ? "f" : ""} aria-hidden="true" />
      ))}
    </div>
  );
}
