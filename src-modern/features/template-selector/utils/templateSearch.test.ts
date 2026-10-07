import { describe, expect, it } from 'vitest';

import { filterTemplates, matchesTemplateSearch } from './templateSearch';

describe('matchesTemplateSearch', () => {
  it('matches everything when the query is empty', () => {
    expect(matchesTemplateSearch('Development', '')).toBe(true);
    expect(matchesTemplateSearch('Development', '   ')).toBe(true);
  });

  it('ignores case and accents', () => {
    expect(matchesTemplateSearch('Recette Développement', 'recette')).toBe(true);
    expect(matchesTemplateSearch('Recette Développement', 'DEVELOPPEMENT')).toBe(true);
    expect(matchesTemplateSearch('Recette Developpement', 'développement')).toBe(true);
  });

  it('requires every word of the query, in any order', () => {
    expect(matchesTemplateSearch('Recette - Développement', 'dev rec')).toBe(true);
    expect(matchesTemplateSearch('Recette - Développement', 'dev bug')).toBe(false);
  });
});

describe('filterTemplates', () => {
  it('keeps the original order of matching templates', () => {
    expect(
      filterTemplates(['Bug fix', 'Development', 'Dev ops', 'Testing'], 'dev')
    ).toEqual(['Development', 'Dev ops']);
  });
});
