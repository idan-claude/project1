/**
 * AI Content Generation Engine
 * Uses Anthropic Claude API to generate Hebrew ecommerce content.
 * Falls back to template-based generation if API key not set.
 */
import type { ExtractedProduct } from './extractor'

export interface GeneratedContent {
  nameHe: string
  subtitle: string
  descriptionHe: string
  descriptionShort: string
  benefitsList: string[]
  ctaText: string
  addToCartText: string
  features: Array<{ icon: string; label: string; desc: string }>
  faqs: Array<{ q: string; a: string }>
  guaranteeText: string
  shippingText: string
  urgencyText: string
  trustBadges: Array<{ icon: string; text: string }>
  suggestedPrice: number | null  // in agorot (ILS)
  suggestedCompareAtPrice: number | null
  seoTitle: string
  seoDescription: string
}

const DEFAULT_TRUST_BADGES = [
  { icon: '🔒', text: 'תשלום מאובטח' },
  { icon: '✅', text: 'אחריות מלאה' },
  { icon: '🚚', text: 'משלוח מהיר' },
  { icon: '↩️', text: 'החזרה קלה' },
]

async function callClaude(prompt: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      console.error('[generator] Claude API error:', res.status)
      return null
    }

    const data = await res.json() as { content: Array<{ type: string; text: string }> }
    return data.content?.[0]?.text ?? null
  } catch (err) {
    console.error('[generator] Claude call failed:', err)
    return null
  }
}

function templateGenerate(product: ExtractedProduct): GeneratedContent {
  const name = product.title || 'מוצר חדש'
  const price = product.price
  const priceILS = price ? Math.round(price * 3.7) : null  // rough USD→ILS

  return {
    nameHe: name,
    subtitle: `${name} — המוצר הטוב ביותר בקטגוריה`,
    descriptionHe: product.description || `${name} — מוצר איכותי שיעשה לך את החיים קלים יותר. מעוצב בקפידה עם תשומת לב לכל פרט.`,
    descriptionShort: `${name} — חובה לכל בית`,
    benefitsList: [
      'איכות גבוהה ועמידות מוכחת',
      'קל לשימוש — מתאים לכולם',
      'משלוח מהיר ישירות לדלת',
      'אחריות מלאה ושירות לקוחות',
    ],
    ctaText: 'הזמן עכשיו',
    addToCartText: 'הוסף לסל',
    features: [
      { icon: '⭐', label: 'איכות מוכחת', desc: 'בדוק ומאושר על ידי לקוחות מרוצים' },
      { icon: '🚀', label: 'משלוח מהיר', desc: 'משלוח לכל הארץ תוך 2-5 ימי עסקים' },
      { icon: '🔒', label: 'תשלום מאובטח', desc: 'כל העסקאות מאובטחות ומוגנות' },
      { icon: '✅', label: 'אחריות מלאה', desc: 'אחריות 30 יום ללא שאלות' },
    ],
    faqs: [
      { q: 'כמה זמן לוקח המשלוח?', a: '2-5 ימי עסקים לכל הארץ. משלוח אקספרס זמין.' },
      { q: 'מה מדיניות ההחזרות?', a: 'ניתן להחזיר תוך 30 יום לקבלת החזר מלא ללא שאלות.' },
      { q: 'האם המוצר כולל אחריות?', a: 'כן! כל המוצרים מגיעים עם אחריות יצרן מלאה.' },
    ],
    guaranteeText: 'אחריות 30 יום — לא מרוצה? קבל החזר מלא',
    shippingText: 'משלוח חינם בהזמנה מעל ₪149',
    urgencyText: 'מלאי מוגבל — הזמן עכשיו',
    trustBadges: DEFAULT_TRUST_BADGES,
    suggestedPrice: priceILS ? priceILS * 100 * 2.5 : null,
    suggestedCompareAtPrice: priceILS ? priceILS * 100 * 3.5 : null,
    seoTitle: `${name} | קנה עכשיו במחיר הטוב ביותר`,
    seoDescription: `${name} — ${product.description?.slice(0, 140) || 'המוצר המומלץ ביותר'}`,
  }
}

export async function generateProductContent(product: ExtractedProduct): Promise<GeneratedContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return templateGenerate(product)

  const priceILS = product.price ? Math.round(product.price * 3.7) : null
  const suggestedPrice = priceILS ? priceILS * 2.5 : null

  const prompt = `אתה מומחה שיווק ישראלי לאיקומרס. צור תוכן שיווקי בעברית לדף מוצר.

פרטי המוצר:
- שם: ${product.title}
- תיאור: ${product.description?.slice(0, 500) || 'לא זמין'}
- מחיר מקור: ${product.price ? `${product.price} ${product.currency}` : 'לא ידוע'}
- דירוג: ${product.rating ? `${product.rating}/5 (${product.reviewCount} ביקורות)` : 'לא ידוע'}
- פלטפורמה: ${product.sourcePlatform}

צור JSON בלבד (ללא הסבר) בפורמט הזה:
{
  "nameHe": "שם מוצר קצר ומושך בעברית (3-6 מילים)",
  "subtitle": "כותרת משנה שמסבירה את הערך העיקרי (8-12 מילים)",
  "descriptionShort": "תיאור קצר ומושך (20-30 מילים)",
  "descriptionHe": "תיאור ארוך ומשכנע (50-80 מילים)",
  "benefitsList": ["יתרון 1", "יתרון 2", "יתרון 3", "יתרון 4", "יתרון 5"],
  "ctaText": "טקסט כפתור ראשי (3-4 מילים, ישיר ואינטנסיבי)",
  "addToCartText": "טקסט הוסף לסל (2-3 מילים)",
  "features": [
    {"icon": "אמוג'י", "label": "כותרת קצרה", "desc": "הסבר קצר"},
    {"icon": "אמוג'י", "label": "כותרת קצרה", "desc": "הסבר קצר"},
    {"icon": "אמוג'י", "label": "כותרת קצרה", "desc": "הסבר קצר"},
    {"icon": "אמוג'י", "label": "כותרת קצרה", "desc": "הסבר קצר"}
  ],
  "faqs": [
    {"q": "שאלה נפוצה 1?", "a": "תשובה ברורה"},
    {"q": "שאלה נפוצה 2?", "a": "תשובה ברורה"},
    {"q": "שאלה נפוצה 3?", "a": "תשובה ברורה"}
  ],
  "guaranteeText": "טקסט אחריות קצר",
  "shippingText": "טקסט משלוח קצר",
  "urgencyText": "טקסט דחיפות קצר (אם רלוונטי)",
  "seoTitle": "כותרת SEO",
  "seoDescription": "תיאור SEO (150 תווים)"
}

כתוב כמו Shopify ישראל. פשוט, ברור, מניע לפעולה.`

  const raw = await callClaude(prompt)
  if (!raw) return templateGenerate(product)

  try {
    const jsonMatch = raw.match(/\{[\s\S]+\}/)
    if (!jsonMatch) return templateGenerate(product)
    const parsed = JSON.parse(jsonMatch[0]) as Partial<GeneratedContent>

    return {
      nameHe: parsed.nameHe || product.title,
      subtitle: parsed.subtitle || '',
      descriptionHe: parsed.descriptionHe || product.description || '',
      descriptionShort: parsed.descriptionShort || '',
      benefitsList: parsed.benefitsList || [],
      ctaText: parsed.ctaText || 'הזמן עכשיו',
      addToCartText: parsed.addToCartText || 'הוסף לסל',
      features: parsed.features || [],
      faqs: parsed.faqs || [],
      guaranteeText: parsed.guaranteeText || 'אחריות 30 יום',
      shippingText: parsed.shippingText || 'משלוח חינם מעל ₪149',
      urgencyText: parsed.urgencyText || '',
      trustBadges: DEFAULT_TRUST_BADGES,
      suggestedPrice: suggestedPrice ? Math.round(suggestedPrice) * 100 : null,
      suggestedCompareAtPrice: suggestedPrice ? Math.round(suggestedPrice * 1.4) * 100 : null,
      seoTitle: parsed.seoTitle || parsed.nameHe || product.title,
      seoDescription: parsed.seoDescription || '',
    }
  } catch {
    return templateGenerate(product)
  }
}
