/**
 * Locale utilities for handling number formats
 */

/**
 * Get user's locale
 */
export function getUserLocale(): string {
  return navigator.language || 'en-US';
}

/**
 * Check if user is in French locale
 */
export function isFrenchLocale(): boolean {
  const locale = getUserLocale();
  return locale.startsWith('fr') || locale.includes('-FR');
}

/**
 * Preserve field value as string with appropriate locale formatting
 */
export function preserveFieldValue(value: unknown): string {
  if (value == null) {
    return '';
  }

  if (typeof value === 'number') {
    const str = value.toString();
    return isFrenchLocale() ? str.replace('.', ',') : str;
  }

  return String(value);
}
