import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  iconOnly?: boolean;
  children?: ReactNode;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: readonly SelectOption[];
  hideLabel?: boolean;
}

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export interface ToolbarProps {
  title: string;
  subtitle?: string;
  logo?: ReactNode;
  end?: ReactNode;
  className?: string;
}

export interface PanelProps {
  title?: string;
  headerEnd?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  label?: string;
}

export interface SkipLinkProps {
  href?: string;
  children?: ReactNode;
}

export interface LiveRegionProps {
  children?: ReactNode;
  atomic?: boolean;
  politeness?: "polite" | "assertive" | "off";
}
