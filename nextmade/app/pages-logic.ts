// Offer page helpers shared by the editor, the API and tests.
export const slugPattern = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/;
const reserved = new Set(['admin', 'api', 'login', 'nextmade', 'support', 'help', 'official', 'bank', 'paypal', 'stripe', 'interac', 'cra', 'canada', 'gov', 'verify', 'account', 'secure', 'password']);

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}
/** Slugs must be 3-48 characters and avoid words that could pass as an official or payment page. */
export function slugProblem(slug: string) {
  if (!slugPattern.test(slug)) return 'Use 3 to 48 lowercase letters, numbers and dashes.';
  if (slug.split('-').some((w) => reserved.has(w))) return 'Pick a different address; that word is reserved.';
  return '';
}
export const emailOk = (e: string) => e.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
