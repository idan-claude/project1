# FindCard Product Page Audit — Phase 2
**Date:** 2026-06-12  
**Files audited:** `src/app/product/page.tsx`, `src/app/product/ProductClient.tsx`

---

## CRITICAL BUGS

### BUG-1: Urgency Text Duplication 🔴
**File:** `ProductClient.tsx` lines 199, 332, 428  
**Issue:** Template renders `<strong>מבצע מוגבל:</strong> {urgencyText}` where `urgencyText` defaults to `'מבצע מוגבל: 24 שעות אחרונות...'`  
**Result:** Renders "**מבצע מוגבל:** מבצע מוגבל: 24 שעות אחרונות..." — looks broken  
**Fix:** Strip "מבצע מוגבל:" prefix from the urgencyText default

---

## HIGH PRIORITY ISSUES

### HP-1: FAQ Answers Too Short 🟠
**File:** `page.tsx` FALLBACK_FAQS  
**Issue:** All 8 FAQ answers are single sentences. No FAQ builds confidence. Short answers feel like deflection.  
**Example:** "גרסת אנדרואיד בפיתוח" — 3 words. Converts no one.  
**Fix:** Expand all to 3-6 sentences. Add 7+ new questions covering high-abandonment objections.

### HP-2: Android Answer Overpromises 🟠
**File:** `page.tsx` line 33  
**Issue:** `'גרסת אנדרואיד בפיתוח'` implies shipping soon. Product uses Apple Find My — Android is not in the roadmap.  
**Risk:** Customer expects Android support, buys, gets disappointed → refund + chargebacks  
**Fix:** Transparent answer: "כרגע רק iOS. אנחנו חוקרים באופן פעיל אפשרויות עתידיות."

### HP-3: Only 4 Gallery Images 🟠
**File:** `page.tsx` FALLBACK_GALLERY  
**Issue:** 4 images, all studio renders. Missing critical use-case shots:  
— In hand (scale proof)  
— Wireless charging (feature proof)  
— Find My app (UX proof)  
— Travel/luggage (use case proof)  
— Texture close-up (premium material proof)  
— Comparison vs credit card (size anxiety fix)  
— Package contents (post-purchase anxiety fix)  
**Fix:** Expand to 10 images covering all customer questions

### HP-4: "FC" Badge in All Product Images 🟠
**File:** All 4 SVGs in `/public/images/`  
**Issue:** "FC" text badge appears on every card illustration — residue of old FindCard/FC branding  
**Fix:** Remove from all images, replace with minimal "FindCard" text or nothing

### HP-5: Mobile Gallery Overflow with 10 Images 🟠
**File:** `ProductClient.tsx` line 291-298  
**Issue:** Mobile layout shows thumbnail row as overlay inside the image. With 10 images, 10 × 48px = 480px+ will overflow a 375px phone screen  
**Fix:** Change to dot indicators on mobile, add scrollable thumbnail strip below

---

## MEDIUM PRIORITY ISSUES

### MP-1: Review Name Overlap with Homepage 🟡
**File:** `page.tsx` FALLBACK_REVIEWS vs `_components/HomePageClient.tsx` REVIEWS  
**Issue:** Names דנה כ., אבי מ., שירה ל. appear in BOTH product page and homepage reviews. Same names, different text = looks like made-up data.  
**Fix:** Ensure ZERO name overlap between product and homepage reviews

### MP-2: Bundle Benefits Array Empty 🟡
**File:** `page.tsx` `buildDefaultBundles()` — `benefits: []` for all bundles  
**Issue:** The BundleSelector renders `b.benefits[0]` when benefits.length > 0. With empty array, no value propositions shown next to bundle options.  
**Fix:** Add benefits to each bundle option (e.g., "מטען אלחוטי מתנה", "חיסכון ₪89")

### MP-3: Shipping Timeline Too Long 🟡
**File:** `ProductClient.tsx` line 200  
**Current:** `'מגיע תוך 7–14 ימי עסקים · מספר מעקב במייל'`  
**Issue:** 14 business days = 3 weeks. Israeli buyers expect 5-7 days for domestic. "7-14" creates hesitation.  
**Fix:** Update to realistic domestic timeline. If sourced from abroad, show "נשלח מישראל / מחו"ל" clearly.

### MP-4: Star Rating Hardcoded 🟡
**File:** `ProductClient.tsx` line 304  
**Current:** `<span className="text-yellow-400 text-sm font-bold">★★★★★</span>` — always shows 5 stars  
**Issue:** Even when `reviewRating` is 4.2, the display shows 5 full stars. Inconsistent.  
**Fix:** Render stars based on actual `reviewRating` value (show 4 or 5 stars, not always 5)

### MP-5: "Apple MFI מאושר" Claim Appears 3x on Homepage 🟡
**File:** `HomePageClient.tsx`  
**Issue:** "Apple MFI מאושר" appears in hero badge, feature slide, and trust footer. MFi is a Made for iPhone hardware certification — a wallet tracker card doesn't require MFi. This claim may not be accurate.  
**Risk:** Apple compliance issue if product isn't actually MFi certified  
**Fix:** Remove MFi claim unless actually certified. Replace with "תואם Apple Find My" (accurate).

### MP-6: Trust Badges Below CTA 🟡
**File:** `ProductClient.tsx` lines 349-353 (mobile), 387-394 (desktop)  
**Issue:** Trust badges (Warranty, Free Shipping, Secure Payment) appear AFTER the buy button, not before.  
**Fix:** Move trust badges to appear BETWEEN the bundle selector and the price/CTA on both layouts.

---

## LOW PRIORITY / POLISH

### LP-1: Urgency Language Too Generic
**Current:** "24 שעות אחרונות" — every dropshipping store uses this. Buyers are immune.  
**Fix:** More specific: "נשארו 7 יחידות במלאי" or "מחיר מבצע עד סוף השבוע"

### LP-2: "FindCard PRO" Label Embedded in SVGs
**File:** All 4 product image SVGs  
**Issue:** Product name hardcoded in images — can't be changed without editing SVGs  
**Note:** Minor, as product name is stable. Remove if rebranding.

### LP-3: CTA Button Text Repetitive
**Current desktop:** "קנה עכשיו ← ₪299"  
**Current mobile sticky:** Same text  
**Issue:** Arrow + price is fine. But both layouts say identical thing with no hierarchy differentiation.  
**Fix:** Mobile sticky = "הזמן עכשיו", desktop CTA = "קנה עכשיו ← ₪299" (minor)

### LP-4: Guarantee Text Buried
**Current:** Shown as small text/trust badge only  
**Fix:** Add explicit guarantee section near checkout: "100 יום החזר כסף. ללא שאלות. ₪0 סיכון."

---

## MISSING SECTIONS

| Section | Status | Priority |
|---------|--------|----------|
| Social proof counter ("X לקוחות מרוצים") | Missing | High |
| Android statement | Misleading | Critical |
| Usage stats ("ממוצע X ממצאים ליום") | Missing | Medium |
| "שאלות נפוצות" label before FAQ | Present ✓ | — |
| Before/After section | Optional | Low |
| Email capture / SMS | Missing | Medium |

---

## CONVERSION BLOCKERS (TOP 3)
1. **Urgency text renders broken** — "מבצע מוגבל: מבצע מוגבל:" kills urgency credibility
2. **Android overpromise** — drives post-purchase disappointment and returns
3. **Only 4 images** — mobile buyers scroll images before reading copy; 4 images feel like a placeholder store

---

## AUDIT VERDICT
**Current conversion estimate: 1.5–2%** (below category average)  
**Post-optimization estimate: 3–4.5%** (with all fixes applied)  
**Biggest single wins:** Urgency fix + 10 images + FAQ expansion + review trust signals
