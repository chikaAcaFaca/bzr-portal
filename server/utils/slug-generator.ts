/**
 * Generate a URL-friendly slug from a title
 * @param title The title to convert to a slug
 * @returns A URL-friendly slug string
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD') // Normalize diacritical marks
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/[^\w\s-]/g, '') // Remove special characters except whitespace and dash
    .replace(/\s+/g, '-') // Replace whitespace with dash
    .replace(/-+/g, '-') // Remove consecutive dashes
    .trim() // Remove leading and trailing whitespace
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing dash
}