# SPRINT5_IMPLEMENTATION_PLAN.md
Created: 2026-05-25
Status: PLANNED — begins after Sprint 4 verified complete

## Pre-Condition

Sprint 4 must be verified before Sprint 5 begins:
- [ ] Phase 1: Product Funnel Engine complete (slug, OG, JSON-LD, scheduled publish)
- [ ] Phase 2: PageLayout / section builder functional
- [ ] Phase 3: Visitor intelligence (UTM, geo, scroll depth, IP block)
- [ ] Phase 4: storeId on all models
- [ ] Phase 5: ProductVersion + autosave
- [ ] Phase 6: Beginner/advanced mode
- [ ] QA: PRE_SPRINT5_QA_REPORT.md all pass

---

## What This Builds

One URL in → complete, high-converting, Hebrew DTC store out.

```
Merchant pastes: https://www.aliexpress.com/item/123456.html
                              ↓
         Product Extraction Engine
      (title, images, specs, variants, reviews)
                              ↓
          AI Rewrite Pipeline (Claude claude-sonnet-4-6)
    (Hebrew copy, headline, benefits, FAQ, urgency, bundles)
                              ↓
         Smart Store Generator
    (theme selection → PageLayout sections created in DB)
                              ↓
         Admin preview + edit + publish
```

---

## Existing Infrastructure (Already Built)

| Component | Location | Status |
|-----------|----------|--------|
| AliExpress API client | `src/lib/aliexpress/api.ts` | ✅ HMAC-signed, `getProductDetail()` |
| Import search | `GET /api/admin/import/search` | ✅ |
| Import product | `POST /api/admin/import/product` | ✅ |
| Admin import page | `/admin/import` | ✅ |
| Product model (full) | `Product` | ✅ bundles, pageContent, schema |
| PageLayout model | Sprint 4 | builds in Sprint 4 |
| Claude API | Environment | needs `ANTHROPIC_API_KEY` in Vercel |

---

## Phase 1 — Product Extraction Engine

### 1A — URL Parser
```typescript
// src/lib/import/parseAliexpressUrl.ts
export function extractProductId(url: string): string | null {
  // handles: .../item/1234567890.html
  // handles: ...?productId=1234567890
  // handles: aliexpress.com/i/1234567890.html
}
```

### 1B — Data Extractor
```typescript
// src/lib/import/extractProduct.ts
export async function extractAliexpressProduct(url: string): Promise<RawProduct> {
  const id = extractProductId(url)
  
  // Primary: AliExpress API (uses existing getProductDetail())
  // Fallback: lightweight HTML scrape for public data
  
  const raw = await getProductDetail(id)
  return {
    title: raw.subject,
    images: raw.image_urls[],
    price: raw.target_sale_price,
    originalPrice: raw.target_original_price,
    variants: raw.skus.sku[],
    specs: raw.product_props[],
    description: raw.detail,
    shipping: raw.logistics_info[],
    rating: raw.avg_evaluation_rating,
    reviewCount: raw.evaluate_count,
  }
}
```

### 1C — Data Cleaner
```typescript
// src/lib/import/cleanProduct.ts
export function cleanProduct(raw: RawProduct): CleanProduct {
  return {
    title: removeChinese(removeSpam(raw.title)),
    images: deduplicateImages(filterLowQuality(raw.images)),
    // Remove: logos, watermarks (detect by aspect ratio outliers)
    specs: normalizeSpecs(raw.specs),
    description: stripHtml(removeChinese(raw.description)),
  }
}
```

### DB Changes — Phase 1
No new models. Uses existing Product model.

```
Product.aliexpressData:
  productId:  string  (existing)
  sourceUrl:  string  (existing)
  lastSynced: Date   (existing)
  rawTitle:   string  (add — original for reference)
```

---

## Phase 2 — AI Rewrite Pipeline

### Architecture
```
CleanProduct → Anthropic API (claude-sonnet-4-6) → AIGeneratedContent → DB
```

### API Route
```typescript
// POST /api/admin/import/generate
// Input: { productId, tone: 'dtc'|'premium'|'viral'|'minimal' }
// Output: { nameHe, subtitle, headline, benefits[], faqs[], urgencyText, ... }
// Streams response: SSE (Server-Sent Events) for live UI feedback
```

### AI Prompt Structure
```
System: You are an Israeli DTC copywriter. Write in natural conversational Hebrew. 
        Persuasive but not spammy. Mobile-first. Short sentences.

User: Product: [cleaned title + specs + description]
      Tone: DTC Problem Solver
      
      Generate:
      1. nameHe (short, punchy Hebrew title)
      2. subtitle (one line benefit)
      3. headline (main hook for product page hero)
      4. problemStatement (2-3 sentences: the pain this solves)
      5. benefits[] (5-7 bullet points, Israeli casual tone)
      6. objections[] (3-4 common doubts + rebuttals)
      7. faqs[] (5 Q&A pairs)
      8. urgencyText (one line, e.g. "רק X יחידות נשארו — הזמן עכשיו")
      9. shippingText (realistic Israeli shipping timeline)
      10. guaranteeText (confidence-building)
      11. ctaText (CTA button text, e.g. "קנה עכשיו ←")
      12. bundles[] (3 suggested bundles with psychological prices)
      
      Output: JSON only.
```

### Pricing Intelligence
```typescript
// AI suggests bundle prices based on:
// - source price (cost estimate from AliExpress)
// - product category typical margins
// - Israeli market pricing norms
// - psychological pricing (.90 endings)

// Example for ₪199.90 base:
bundles = [
  { qty: 1, price: 19990, compareAt: 29990 },    // base
  { qty: 3, price: 29990, compareAt: 59970 },    // 3-pack with discount
  { qty: 4, price: 37990, compareAt: 79960 },    // best value
]
```

### DB — Generated Content
```
New model: AIGeneration
{
  productId:   ObjectId
  storeId:     string
  sourceUrl:   string
  tone:        string
  prompt:      string
  response:    object  // full generated content
  model:       string  // claude-sonnet-4-6
  tokensUsed:  number
  createdAt:   Date
  appliedAt:   Date?  // when merchant clicked "Apply to product"
}
```

### Environment Required
```
ANTHROPIC_API_KEY=sk-ant-...  // add to Vercel env vars
```

---

## Phase 3 — Smart Store Generator

### Theme Definitions
Each theme = a PageLayout template (ordered sections with pre-filled config).

```typescript
// src/lib/themes/index.ts
export const THEMES: Record<string, ThemeTemplate> = {
  problem_solver: {
    name: 'פותר בעיות',
    description: 'מתאים למוצרים שפותרים בעיה יומיומית (כמו FindCard)',
    sections: [
      { type: 'hero',        config: { variant: 'split', showBadge: true } },
      { type: 'trust_strip', config: {} },
      { type: 'problem',     config: { showStats: true } },
      { type: 'solution',    config: {} },
      { type: 'benefits',    config: { layout: 'grid_6' } },
      { type: 'bundles',     config: { showRecommended: true } },
      { type: 'reviews',     config: { showCarousel: true, showGrid: true } },
      { type: 'before_after',config: {} },
      { type: 'faq',         config: {} },
      { type: 'guarantee',   config: {} },
      { type: 'urgency',     config: { type: 'stock' } },
    ],
  },
  premium_brand: {
    sections: [/* luxury layout: large hero, minimal copy, brand story */]
  },
  viral_tiktok: {
    sections: [/* video-first, short punchy copy, social proof heavy */]
  },
  gadget_store: {
    sections: [/* specs table, comparison table, tech features grid */]
  },
  minimal: {
    sections: [/* hero + bundles + trust — nothing else */]
  },
}
```

### Generation Flow
```typescript
async function generateStore(productId: string, themeKey: string, aiContent: AIGeneratedContent) {
  // 1. Apply AI content to product fields
  await Product.findByIdAndUpdate(productId, {
    nameHe: aiContent.nameHe,
    subtitle: aiContent.subtitle,
    benefitsList: aiContent.benefits,
    bundles: buildBundles(aiContent.bundles),
    pageContent: {
      features: aiContent.benefits.slice(0,6).map(b => ({ icon: '✓', label: b, desc: '' })),
      faqs: aiContent.faqs,
      urgencyText: aiContent.urgencyText,
      shippingText: aiContent.shippingText,
      guaranteeText: aiContent.guaranteeText,
    },
    ctaText: aiContent.ctaText,
  })
  
  // 2. Create PageLayout from theme template
  const template = THEMES[themeKey]
  await PageLayout.create({
    productId,
    sections: template.sections.map((s, i) => ({ ...s, order: i, enabled: true })),
  })
}
```

### Admin UI: Import Wizard
```
Route: /admin/import (upgrade existing)

Step 1: Paste URL
  → Extract product (progress indicator)
  → Show extracted data (images, title, price)
  
Step 2: Choose tone + theme
  → 4 tone cards (DTC / Premium / Viral / Minimal)
  → "AI Recommended" badge on best match
  → Live preview of theme layout (mockup)
  
Step 3: AI Generation (streaming)
  → Live typing effect of generated Hebrew copy
  → "מייצר כותרת...", "מייצר יתרונות...", "מייצר FAQ..."
  
Step 4: Review + Edit
  → All generated content shown in editable form
  → Quick edit inline
  → "Regenerate section" buttons
  
Step 5: Publish
  → "פרסם חנות" button
  → Redirects to /admin/products/[id]
```

---

## Phase 4 — Visual Customization

Fully handled by Sprint 4's PageLayout editor.

Sprint 5 adds:
- **Color scheme per theme**: `pageContent.colorScheme: { primary, accent, bg }`
- **Font choice**: `pageContent.fontFamily: 'assistant' | 'rubik' | 'heebo'`
- **Theme switcher**: In page layout editor — "החלף ערכת נושא" button

---

## Phase 5 — Product Intelligence

### Intelligence Report
```typescript
// POST /api/admin/import/analyze
// Runs after extraction, before AI rewrite
// Returns: IntelligenceReport

IntelligenceReport {
  marketScore:        number  // 0-100: estimated demand
  competitionScore:   number  // 0-100: AliExpress saturation
  conversionPotential: number // 0-100: product-market fit for IL
  shippingRisk:       'low' | 'medium' | 'high'
  marginEstimate:     { low: number, high: number }  // % range
  upsellOpportunities: string[]
  bundleSuggestions:  string[]
  warnings:           string[]  // e.g. "מוצר מוגבל — בדוק רגולציה"
}
```

### Scoring Logic
```
marketScore:
  - AliExpress order count → scale 0-100
  - Review count → factor
  - Rating → factor

competitionScore:
  - How many sellers → saturation
  - Price variance → margin pressure

shippingRisk:
  - Weight → ePacket eligibility
  - Fragile keywords in title → breakage risk
  - Size → customs threshold (< ₪2000)

marginEstimate:
  - source price × 3 (typical IL dropship markup) = floor
  - category typical retail price = ceiling
```

### UI: Intelligence Dashboard
```
/admin/import — Step 1 (after extraction)
Shows: market score gauge, competition heatmap, margin range, risks
"מוצר בעל פוטנציאל גבוה" or "שקול מוצר אחר" verdict
```

---

## Phase 6 — Automated CRO

### CRO Analyzer
```typescript
// POST /api/admin/products/[id]/cro-analyze
// Analyzes current product config vs. CRO best practices
// Returns: CROReport

CROReport {
  score: number  // 0-100 overall CRO score
  issues: [{
    category: 'pricing' | 'copy' | 'bundles' | 'trust' | 'urgency',
    severity: 'critical' | 'warning' | 'suggestion',
    issue: string,
    fix: string,
    impact: string,
  }]
}
```

### CRO Rules Engine
```
Pricing rules:
  - compareAtPrice missing → "מחיר מחוק חסר — מפחית תחושת עסקה"
  - price ends in .00 → "נסה .90 pricing"
  - gap < 20% → "הנחה קטנה מדי — לקוחות לא מוצאים ערך"

Bundle rules:
  - only 1 bundle → "הוסף חבילות — מגדיל AOV ב-40%"
  - no recommended bundle → "סמן חבילה מומלצת"

Trust rules:
  - no trust badges → "הוסף אייקוני אמון"
  - no guarantee text → "אחריות מגדילה המרות ב-25%"

Copy rules:
  - urgency text empty → "הוסף טקסט דחיפות"
  - no FAQ → "FAQ מוריד נטישה ב-15%"
  - no review stats → "הוסף ציון ממוצע"
```

### UI: CRO Score Card
```
/admin/products/[id] → sidebar widget: "ציון CRO: 74/100"
Click → opens CROReport panel with actionable fixes
"תקן אוטומטית" button for simple fixes (e.g. add missing fields)
```

---

## Phase 7 — Admin Integration

Every generated field is editable from admin.

Data flow:
```
AI generates → stored in AIGeneration.response
Merchant clicks "Apply" → copied to Product fields
Product fields → admin editor (ProductForm, PageLayout editor)
Any field editable → persists to DB → live on storefront
```

No generated content is locked.
No generated content bypasses admin controls.
Full edit + override always available.

---

## DB Changes Summary

| Model | New Fields |
|-------|-----------|
| Product | `subtitle`, `benefitsList[]`, `ctaText`, `addToCartText`, `scheduledAt`, `videoUrl`, `ogImage`, `beforeAfter[]` |
| Product.aliexpressData | `rawTitle` |
| PageLayout (new) | `storeId`, `productId`, `sections[]` |
| AIGeneration (new) | Full model as above |
| IntelligenceReport (new) | Or embedded in AIGeneration |

---

## API Routes Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/import/extract` | POST | Extract product from URL |
| `/api/admin/import/analyze` | POST | Intelligence report |
| `/api/admin/import/generate` | POST | AI content generation (SSE streaming) |
| `/api/admin/import/generate` | PATCH | Apply generated content to product |
| `/api/admin/products/[id]/cro-analyze` | POST | CRO analysis |
| `/api/admin/products/[id]/cro-apply` | POST | Auto-fix simple CRO issues |

---

## Environment Variables Required

| Variable | Purpose | Where to set |
|----------|---------|--------------|
| `ANTHROPIC_API_KEY` | Claude API for AI rewrite | Vercel env vars |
| `ALIEXPRESS_APP_KEY` | Product extraction | Vercel env vars |
| `ALIEXPRESS_APP_SECRET` | API signing | Vercel env vars |

---

## Rollout Order

```
Week 1 (after Sprint 4 verified):
  Phase 1: Extraction engine (URL parser + cleaner)
  Phase 5: Intelligence report (scoring from AliExpress data)
  Environment: ANTHROPIC_API_KEY added to Vercel

Week 2:
  Phase 2: AI rewrite pipeline (Claude integration, streaming)
  Phase 3: Theme definitions + PageLayout generation

Week 3:
  Phase 4: Visual customization (color/font in PageLayout)
  Phase 6: CRO analyzer + score card
  Phase 7: Admin integration + apply flow

Week 4:
  Admin wizard UI (import → extract → analyze → generate → edit → publish)
  E2E testing
  Production deploy + QA report
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AliExpress API rate limits | Medium | High | Cache extracted data in DB, don't re-fetch |
| AI hallucination in Hebrew | Medium | High | Structured JSON output, validation schema |
| AI cost at scale | High | Medium | Cache generated content per sourceUrl, `tokensUsed` tracking |
| AliExpress anti-scrape | High | High | Use official API first, scrape only fallback |
| Hebrew NLP quality | Medium | Medium | System prompt engineering, review loop |
| Theme doesn't fit product | Low | Low | "Regenerate" and "Switch theme" always available |
| Claude API latency (2-5s) | High | Low | SSE streaming — user sees live output |

---

## Scaling Concerns

| Concern | Approach |
|---------|----------|
| Claude API costs | ~$0.003 per generation. At 100 stores/day = $0.30/day. Cheap. |
| AliExpress API quota | 10k calls/day free tier. Cache product details by ID. |
| AIGeneration storage | 100 generations = ~2MB. Non-issue. |
| Concurrent generations | Queue with job ID, SSE updates per client |
| Image processing | Cloudinary handles resize/optimize (Sprint 4 dep) |

---

## Competitive Advantage

What this gives the platform that Shopify/Wix don't have:

1. **Hebrew-first AI copy** — Not a generic translation, but Israeli DTC tone natively
2. **One-click store from URL** — Shopify's import takes days + freelancers
3. **Built-in CRO scoring** — No app needed, it's in the platform
4. **Psychological pricing built-in** — .90/.99 presets, bundle auto-suggest
5. **RTL-native from day 1** — Not bolted on, designed for it
6. **Intelligence before you buy** — Market score, margin estimate before committing

This is the moat.
