# SPRINT4_IMPLEMENTATION_PLAN.md
Created: 2026-05-25
Status: APPROVED — building now

## Pre-Sprint Verification

| Check | Status |
|-------|--------|
| Admin → storefront sync | ✅ < 1s latency, x-vercel-cache: MISS |
| Bundle management | ✅ 3 bundles: ₪199.90 / ₪299.90 / ₪379.90 |
| Psychological pricing | ✅ HTML contains ₪199.90, ₪299.90, ₪379.90 |
| Image gallery | ✅ 4 images, admin/storefront count match |
| Persistence survives refresh | ✅ server-rendered on every request |
| Fake data | ✅ reviews from DB (fallback samples if none approved) |

---

## Architecture Vision

```
CommerceOS Platform
│
├── Store Layer (multi-tenant)
│   ├── storeId isolated across ALL collections
│   ├── Domain → storeId routing (middleware)
│   └── Store switching in admin header
│
├── Product Funnel Engine
│   ├── Full DB control of every visible element
│   ├── Section-based page builder
│   ├── A/B experiment slots
│   └── Scheduled publish
│
├── Visitor Intelligence
│   ├── Session flow + scroll depth + click tracking
│   ├── UTM capture and attribution
│   ├── City-level geo (IP lookup, no street address)
│   └── IP block/whitelist
│
├── System Safety
│   ├── Product version history (rollback)
│   ├── Autosave in all forms
│   └── Full admin audit log
│
└── Admin UX
    ├── Beginner / Advanced mode
    └── Hebrew-first, RTL-perfect
```

---

## Phase 1 — Product Funnel Engine Completion

### What's already done ✅
- title, description, features, FAQ, urgency text, shipping text, guarantee text
- trust badges, inventory, bundles (full), recommended bundle
- draft/live status, images (unlimited, drag reorder)
- .90/.99/round pricing presets, compareAtPrice, bundle pricing
- SEO: metaTitle, metaDescription

### What still needs to be built

#### 1A — Product Schema additions
```
Product.subtitle          string  — shown under title
Product.benefitsList      string[] — bullet points above bundles  
Product.ctaText           string  — "קנה עכשיו" override
Product.addToCartText     string  — "הוסף לסל" override
Product.scheduledAt       Date?   — publish at this time
Product.videoUrl          string  — YouTube/Vimeo embed
Product.ogImage           string  — OG image URL (defaults to images[0])
Product.beforeAfter       [{before,after,label}]  — image pairs
```

#### 1B — Slug editor
- Admin edits product slug with collision check
- PUT /api/admin/products/[id] → validate slug uniqueness
- Redirect old slug → new slug (301 in storefront route)

#### 1C — Schema markup (JSON-LD)
- Product page emits JSON-LD Product schema in <head>
- Fields: name, description, image, offers (price, currency, availability)
- Generated server-side in page.tsx from DB data

#### 1D — OG/Social meta tags
- <meta og:title>, <meta og:description>, <meta og:image>
- og:image = product.ogImage || product.images[0].url

#### 1E — Scheduled publish
- Product with scheduledAt date in the future → status='draft'
- Cron job (every 5 min): find products where scheduledAt <= now AND status=draft → set active
- Admin UI: datetime picker in product form

### DB Changes — Phase 1
```
Product model additions:
  subtitle:        { type: String, default: '' }
  benefitsList:    [String]
  ctaText:         { type: String, default: '' }
  addToCartText:   { type: String, default: '' }
  scheduledAt:     { type: Date, default: null }
  videoUrl:        { type: String, default: '' }
  ogImage:         { type: String, default: '' }
  beforeAfter:     [{ before: String, after: String, label: String }]
```

---

## Phase 2 — Visual Store Builder

### Concept
Each product page has an ordered list of sections. Admin reorders, enables/disables, edits content per section. Storefront renders sections in DB order.

### Section types
```
hero          — main image, title, subtitle, CTA
benefits      — icon grid (reuses pageContent.features)
bundles       — tier selector (uses product.bundles)
reviews       — review carousel + grid
faq           — accordion
trust         — trust badge row
urgency       — countdown or text banner
video         — embed player
before_after  — image comparison slider
guarantee     — guarantee block
shipping      — shipping info block
custom_text   — free HTML/text block
```

### DB Model: PageLayout
```typescript
interface ISection {
  type: SectionType
  enabled: boolean
  order: number
  config: Record<string, unknown>  // section-specific settings
}

PageLayout {
  storeId:   string
  productId: ObjectId (null = global default)
  device:    'all' | 'mobile' | 'desktop'
  sections:  ISection[]
  updatedAt: Date
}
```

### Admin editor
- Route: /admin/products/[id]/layout
- Left panel: section list with toggle + drag handles
- Right panel: live preview iframe of /product?preview=1
- Click section to open config panel
- Autosave on every change (debounced 500ms)

### Storefront rendering
- page.tsx fetches PageLayout for product
- Renders sections in order, skipping disabled
- Falls back to default layout if no layout saved

### Dependencies
- Needs Phase 1 complete first (all content fields in DB)
- Preview mode: add ?preview=1 param that bypasses auth check in storefront
- DnD: @hello-pangea/dnd (already installed? check first)

---

## Phase 3 — Real Visitor Intelligence

### Existing VisitorEvent model
Already tracks: pageview, product_view, add_to_cart, checkout_start, checkout_complete
Already has: sessionId, event, metadata, createdAt

### Additions needed

#### 3A — Enhanced tracking payload
```
VisitorEvent additions:
  utm: { source, medium, campaign, content, term }
  geo: { country, city, region }  // IP lookup, city-level only
  scroll: number  // max scroll % reached (for product_view events)
  clicks: [{ selector, timestamp }]  // tracked click targets
  ip: string  // hashed for privacy
  isp: string
```

#### 3B — UTM capture
- middleware.ts reads utm_* from URL params
- Stores in cookie for session duration
- Attaches to every VisitorEvent

#### 3C — Geo lookup
- IP → city using MaxMind GeoLite2 free DB (offline) OR ip-api.com (free tier, 1000/day)
- ONLY city + country (no street, no house number)
- Respects GDPR: no PII stored

#### 3D — Scroll depth
- Client-side tracker fires VisitorEvent update at 25%/50%/75%/100% scroll
- POST /api/track with event: 'scroll_depth', metadata: { depth: 75 }

#### 3E — IP Management
New model: IpBlock
```
IpBlock {
  storeId: string
  ip: string
  type: 'block' | 'whitelist' | 'temp_block'
  expiresAt: Date?
  reason: string
  createdAt: Date
}
```
- Middleware checks IpBlock on every request
- Admin UI: /admin/security (enhance existing page)

#### 3F — Visitor timeline
- Admin: /admin/analytics/visitors/[sessionId]
- Timeline of all events for a session
- Shows: pages visited, actions, time per page, device

### DB Changes — Phase 3
```
VisitorEvent: add utm{}, geo{}, scroll, ip, isp fields
New model: IpBlock
New index: VisitorEvent.ip, VisitorEvent.utm.source
```

---

## Phase 4 — Multi-Store Architecture

### Current state
storeId exists on: Product ✅, Order ✅
storeId missing on: Settings, Coupon, EmailCampaign, Automation, Review, Category, CommLog, VisitorEvent, IpBlock

### Changes needed

#### 4A — Add storeId to all models
```
Settings, Coupon, EmailCampaign, Automation, Review, 
Category, CommLog, VisitorEvent
→ storeId: { type: String, default: 'default', index: true }
```

#### 4B — Store model (new)
```typescript
Store {
  ownerId:    string  // future: user account
  name:       string
  domain:     string  // custom domain
  subdomain:  string  // *.commerceos.co.il
  plan:       'free' | 'pro' | 'enterprise'
  status:     'active' | 'suspended'
  settings:   { currency, locale, timezone }
  createdAt:  Date
}
```

#### 4C — Domain routing middleware
```
Request to store.domain → resolve storeId → attach to request context
All API routes read storeId from context (not hardcoded 'default')
```

#### 4D — Admin store switcher
- Header dropdown shows current store name
- One click to switch stores
- Separate data per store (no cross-contamination)

### Implementation strategy
- All existing data remains under storeId='default'
- New stores get unique storeId
- No migration needed — MongoDB is schemaless
- API routes: `const storeId = req.headers['x-store-id'] || 'default'`

### Risks
- Forgetting to add storeId filter to a query = data leak across stores
- Mitigation: create `withStore(query)` helper that auto-injects storeId

---

## Phase 5 — System Safety

### 5A — Product version history
```typescript
ProductVersion {
  productId:  ObjectId
  version:    number
  snapshot:   Object  // full product document at save time
  savedBy:    string
  note:       string
  createdAt:  Date
}
```
- Saved automatically on every PUT /api/admin/products/[id]
- Keep last 20 versions
- Admin UI: /admin/products/[id]/history
  - List versions with timestamp + author
  - "Restore" button → sets current product to snapshot

### 5B — Autosave in ProductForm
- Debounced 2s after any field change
- POST to /api/admin/products/[id]/draft (no-validation endpoint)
- Status indicator: "שמור אוטומטית ✓" / "שומר..."
- Never overwrites published data without explicit "שמור מוצר" button

### 5C — Enhanced audit log
- Already have AuditLog model (from Sprint 2 team page)
- Enhance: log every admin action with before/after snapshot
- Route: /admin/activity (already exists)

### 5D — Recovery architecture
- All PUT requests are idempotent (findByIdAndUpdate with { new: true })
- Re-deploy is safe: no state in server memory
- MongoDB Atlas: point-in-time recovery available (Atlas feature)
- Auto-backup script already pushes to GitHub (code safety)

### DB Changes — Phase 5
```
New model: ProductVersion
AuditLog: add beforeSnapshot, afterSnapshot fields
```

---

## Phase 6 — Admin UX

### 6A — Beginner / Advanced mode
```
Settings: adminMode: 'beginner' | 'advanced'  (stored in localStorage)
Beginner: shows only essential fields, hides advanced tabs
Advanced: shows everything
Toggle in admin header (תצוגה פשוטה / תצוגה מתקדמת)
```

### 6B — Contextual help
- Every form field already has `<p className="text-xs text-gray-600">` hints
- Add "?" tooltip button on complex fields
- Tooltip content: what this field does, example value, impact on conversion

### 6C — Onboarding checklist
- First-time admin sees checklist: Add product image / Set price / Add bundle / Configure shipping
- Stored in Settings.onboarding.completedSteps[]
- Dismissed once all steps done

### 6D — Recommended settings badges
- Fields that have "recommended" values show a subtle indicator
- Example: "משלוח חינם" toggle shows "מגדיל המרות ב-30% ↑"

---

## Rollout Order (Dependency Graph)

```
Week 1:
  Phase 1A-1D  (schema + slug + OG + JSON-LD)     ← no deps
  Phase 4A     (add storeId to models)             ← no deps
  Phase 5A     (ProductVersion model)              ← no deps

Week 2:
  Phase 5B     (autosave)                          ← needs Phase 1 complete
  Phase 3A-3E  (visitor intelligence)              ← needs VisitorEvent
  Phase 6A     (beginner/advanced mode)            ← no deps

Week 3:
  Phase 2      (visual store builder)              ← needs Phase 1
  Phase 4B-4D  (Store model + routing)             ← needs 4A
  Phase 5C     (enhanced audit)                    ← needs 5A

Week 4:
  Phase 1E     (scheduled publish)                 ← needs cron
  Phase 6B-6D  (UX polish)                         ← needs Phase 1-2
  Integration testing + production deploy
```

---

## Scaling Considerations

| Concern | Approach |
|---------|----------|
| VisitorEvent volume | Index on (sessionId, createdAt), TTL index after 90 days |
| ProductVersion storage | Keep last 20 per product, auto-prune older |
| PageLayout per product | Cache in edge KV store (future) |
| Multi-store queries | storeId compound index on all collections |
| Image storage | Cloudinary (credentials pending) |
| Session tracking | Redis for active sessions (future) |

---

## Current DB State (Before Sprint 4)

| Collection | storeId? | Bundles? | pageContent? | Versions? |
|------------|----------|----------|--------------|-----------|
| Product    | ✅       | ✅       | ✅           | ❌ → build |
| Order      | ✅       | —        | —            | — |
| Settings   | ❌ → add | —        | —            | — |
| Coupon     | ❌ → add | —        | —            | — |
| EmailCampaign | ❌ → add | —     | —            | — |
| Automation | ❌ → add | —        | —            | — |
| Review     | ❌ → add | —        | —            | — |
| Category   | ❌ → add | —        | —            | — |
| VisitorEvent | ❌ → add | —      | —            | — |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PageLayout editor complexity | High | High | Build section renderer first, editor second |
| storeId missing from a query | Medium | High | withStore() helper + grep audit |
| IP geolocation accuracy | Low | Low | City-level only, non-critical |
| ProductVersion storage growth | Medium | Low | Auto-prune, 20-version cap |
| Autosave race condition | Medium | Medium | Debounce + optimistic locking on version |
| Scheduled publish cron gaps | Low | Low | Re-check on page load as fallback |

---

## Build Sequence (This Session)

1. Phase 1A-1D: Schema additions + slug editor + OG tags + JSON-LD ← START
2. Phase 5A: ProductVersion model + history API
3. Phase 5B: Autosave in ProductForm
4. Phase 4A: storeId on all missing models
5. Phase 3A-3E: Enhanced visitor tracking + IP block
6. Phase 2: PageLayout model + basic section editor
7. Phase 6A: Beginner/advanced mode
8. Deploy + QA
