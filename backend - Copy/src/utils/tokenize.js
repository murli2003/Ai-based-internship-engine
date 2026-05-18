/**
 * Simple tokenization and normalization for skills/domains.
 */
export function tokenize(str) {
  if (!str || typeof str !== 'string') return [];
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function normalizeSkill(s) {
  return (s || '').toString().toLowerCase().trim();
}
