import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a consistent color for company avatars based on company ID
 * Uses a hash function to deterministically map company IDs to colors
 * @param companyId - The unique company identifier
 * @returns A hex color string
 */
export function getCompanyAvatarColor(companyId: string): string {
  const colors = [
    '#4A90E2', // Blue
    '#7B68EE', // Medium Slate Blue
    '#48C774', // Green
    '#F39C12', // Orange
    '#E74C3C', // Red
    '#1ABC9C', // Turquoise
    '#9B59B6', // Purple
    '#34495E', // Dark Blue Gray
  ];

  // Simple hash function for consistent color assignment
  let hash = 0;
  for (let i = 0; i < companyId.length; i++) {
    hash = companyId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}