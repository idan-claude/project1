export function slugify(text: string): string {
  // For Hebrew text, transliterate to latin or use UUID-based slug
  const latin = text
    .toLowerCase()
    .replace(/[֐-׿]/g, '') // strip Hebrew chars
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  if (latin.length > 3) return latin

  // Fallback: timestamp-based slug
  return `product-${Date.now()}`
}
