import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number | undefined | null,
  isPrivacyMode: boolean,
  fractionDigits = 2,
) {
  if (value === undefined || value === null) return "0";
  if (isPrivacyMode) return "****";
  return value.toLocaleString("fr-FR", {
    maximumFractionDigits: fractionDigits,
  });
}
