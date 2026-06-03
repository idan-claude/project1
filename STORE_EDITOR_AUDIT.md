# Store Editor Audit
Sprint 5 — Store Experience Evolution
Date: 2026-06-03

---

## Current Editor Capabilities

### Working Controls
- Color tokens: primary, secondary, accent, background, surface, text, textSecondary, border (7 pickers)
- 6 preset color schemes (blue, green, purple, red, orange, pink)
- Font family: 6 Hebrew Google Fonts
- Button radius: 5 presets (0 → pill)
- Card radius: 5 presets
- Logo upload + URL paste
- Hero image upload + URL paste
- 11 sections: toggle + reorder (up/down)
- Draft / Publish workflow with version increment
- 3-device preview (desktop / tablet / mobile)

### Stored But Never Exposed in UI
| Field | Model | UI |
|---|---|---|
| faviconUrl | ✅ StoreTheme | ❌ No UI |
| customCss | ✅ StoreTheme | ❌ No UI |
| fontSize | ✅ tokens.fontSize | ❌ Read-only "16px" |
| spacing | ✅ tokens.spacing | ❌ No UI |
| section.settings | ✅ generic Record | ❌ No UI |
| store.customDomain | ✅ Store model | ❌ No UI |

### Hardcoded in Storefront (Not Theme-Driven)
| Element | Location | Value |
|---|---|---|
| Announcement bar text | Header.tsx:59 | "מבצע מוגבל: קנה 2..." |
| Brand name | Header.tsx + Footer.tsx | "FindCard" |
| Navigation links | Header.tsx | hero/features/product/reviews/faq |
| Footer description | Footer.tsx:13 | Product-specific description |
| Social links | Footer.tsx | Placeholder emojis, no actual links |
| Contact email | Footer.tsx | findcardsupport@gmail.com |
| Contact phone | Footer.tsx | +972 052-588-4463 |
| Feature slides | page.tsx | 6 hardcoded Apple Find My features |
| Customer reviews | page.tsx | 10+ hardcoded testimonials |
| CTA button text | Multiple | "הזמן עכשיו" |
| Hero headline | page.tsx | Hardcoded product headline |

---

## Missing Controls (Sprint 5 Target)

### Phase 1 — Extended Design Tokens
- [ ] Heading font size (sm/md/lg/xl)
- [ ] Body font size
- [ ] Font weight (normal/medium/bold)
- [ ] Line height (tight/normal/relaxed)
- [ ] Letter spacing
- [ ] Shadow intensity (none/sm/md/lg)
- [ ] Container width (narrow/normal/wide/full)
- [ ] Animation intensity (none/subtle/moderate)
- [ ] Favicon upload
- [ ] Custom CSS textarea

### Phase 2 — Header Builder
- [ ] Announcement bar text (editable)
- [ ] Announcement bar background color
- [ ] Announcement bar enable/disable
- [ ] CTA button text
- [ ] CTA button show/hide
- [ ] Sticky header toggle
- [ ] Phone number
- [ ] WhatsApp number
- [ ] Store name display

### Phase 3 — Footer Builder
- [ ] Brand tagline/description
- [ ] Instagram URL
- [ ] TikTok URL
- [ ] WhatsApp URL
- [ ] Facebook URL
- [ ] Contact email
- [ ] Contact phone
- [ ] Copyright text
- [ ] Show/hide payment icons
- [ ] Show/hide trust badges

### Phase 4 — Section Content Editing
- [ ] Hero headline text
- [ ] Hero subheadline text
- [ ] Hero CTA text
- [ ] Benefits list (add/edit/remove items)
- [ ] Features list (custom icons + text)
- [ ] Testimonials management (from Reviews collection → editor)
- [ ] Section background color per-section

### Phase 5 — UX Improvements
- [ ] Drag-and-drop section reorder
- [ ] Duplicate section
- [ ] Section-level color override
- [ ] Undo/redo

---

## Architecture Decision

Current storefront (page.tsx, Header.tsx, Footer.tsx) reads zero data from StoreTheme.
Design tokens are stored but never applied to actual pages.

**Fix**: Header and Footer must read from StoreTheme.headerConfig / StoreTheme.footerConfig via API call or server-side fetch.

**Implementation approach for Sprint 5**:
1. Extend StoreTheme model with headerConfig + footerConfig
2. Add new editor tabs: Header, Footer, Advanced
3. Update Header.tsx + Footer.tsx to fetch config from DB
4. Store health engine checks if config has been customized

---

## Store Health Score Breakdown (Target)

| Check | Weight |
|---|---|
| Logo uploaded | 10% |
| Announcement bar customized | 5% |
| Footer contact info set | 10% |
| Payment connected | 20% |
| Product added | 20% |
| Pixel connected | 15% |
| Custom domain | 10% |
| Policies written | 10% |

---

## Customer Account System — Gap Analysis

The User model exists (`/src/lib/db/models/User.ts`) with:
- storeId, email, passwordHash, name, phone, addresses, role

But zero customer-facing routes exist:
- No /account/login
- No /account/register
- No /account/orders
- No /api/account/* routes
- No session management for customers

**Estimate**: 8-10 new files needed for full customer account system.
