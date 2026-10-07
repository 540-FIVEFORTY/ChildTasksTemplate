/**
 * Template name search - case and accent insensitive
 */

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * True when every word of the query appears in the template name,
 * e.g. "dev rec" matches "Recette - Développement".
 */
export function matchesTemplateSearch(name: string, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return true;
  }

  const normalizedName = normalize(name);
  return words.every((word) => normalizedName.includes(word));
}

export function filterTemplates(templates: string[], query: string): string[] {
  return templates.filter((name) => matchesTemplateSearch(name, query));
}
