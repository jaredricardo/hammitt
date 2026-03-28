# 🚀 HAMMITT THEME - COMPREHENSIVE OPTIMIZATION AUDIT
## Executive Summary
**Audit Date:** March 28, 2026  
**Auditor:** AI Performance Specialist  
**Severity Levels:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 📊 PERFORMANCE IMPACT ANALYSIS

### Current Issues Identified:
- **190 CSS files** - Potential for significant consolidation
- **60 JavaScript files** - High fragmentation, duplicate code likely
- **Multiple render-blocking resources** in critical path
- **Inefficient resource loading** strategy
- **No apparent code splitting** or lazy loading strategy
- **Duplicate font loading** (WOFF + WOFF2)

---

## 🔴 CRITICAL PRIORITY FIXES

### 1. THEME.LIQUID - Performance Killers

#### Issue: Critical CSS Not Inlined (Line 45)
**Current:**
```liquid
<link rel="stylesheet" href="{{ 'critical.css' | asset_url }}" fetchPriority="high">
```

**Problem:** External stylesheet = extra HTTP request = render blocking  
**Impact:** ~200-500ms delay on FCP/LCP  
**Fix:**
```liquid
<style>{{ 'critical.css' | asset_url | asset_content }}</style>
```

#### Issue: Duplicate async/defer (Line 54)
**Current:**
```liquid
<script async src="..." defer></script>
```

**Problem:** Both `async` and `defer` - defer is ignored  
**Impact:** Unpredictable script execution order  
**Fix:** Choose ONE - use `defer` for ordered execution

#### Issue: Duplicate Font Formats (Lines 69-73)
**Current:**
```liquid
<link rel="preload" href="{{ 'SofiaProLight.woff2' | asset_url }}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{{ 'SofiaProLight.woff' | asset_url }}" as="font" type="font/woff" crossorigin>
```

**Problem:** Browsers only need WOFF2 (97%+ support)  
**Impact:** Wasted preload, unnecessary bytes downloaded  
**Fix:** Remove all .woff preloads, keep only .woff2

#### Issue: Google Fonts Render Blocking (Line 76)
**Current:**
```liquid
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:..." rel="stylesheet">
```

**Problem:** Blocks rendering, FOIT/FOUT flash  
**Impact:** Major LCP delay  
**Fix:**
```liquid
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Nunito+Sans..." as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="..."></noscript>
```

---

### 2. JAVASCRIPT OPTIMIZATION PRIORITIES

#### Issue: Global.js - Massive File Size
**Location:** `/assets/global.js` (2000+ lines)  
**Problems:**
- Mixed concerns (cart, UI, analytics, GWP logic)
- No code splitting
- Loads on ALL pages regardless of need
- Duplicate Shopify.formatMoney implementation

**Actions Required:**
1. Split into modular files:
   - `cart-logic.js` (cart operations only)
   - `gwp-manager.js` (GWP auto-add/remove)
   - `ui-components.js` (sliders, modals, etc.)
   - `analytics-helpers.js` (tracking functions)

2. Lazy load non-critical modules
3. Remove duplicate Shopify utilities (use native)

#### Issue: Duplicate Scripts
**Found:** Multiple files loaded twice in theme.liquid  
**Example:** share.js, pickup-availability.js appear twice in file listings  
**Impact:** Wasted bandwidth, potential conflicts  
**Fix:** Audit and remove duplicates

---

### 3. CSS OPTIMIZATION PRIORITIES

#### Issue: 190 CSS Files - Over-fragmentation
**Current State:**
- Separate files for every component
- Likely duplicate selectors across files
- No CSS purging/tree-shaking
- Critical CSS not extracted properly

**Action Plan:**
1. **Audit for duplicates:**
   - Search for duplicate font-family declarations
   - Find repeated color/spacing values
   - Identify common utility classes

2. **Consolidate:**
   - Create `_variables.css` for design tokens
   - Merge related component styles
   - Target: Reduce to <50 CSS files

3. **Implement CSS Purging:**
   - Remove unused Shopify Dawn base styles
   - Eliminate dead selectors
   - Expected: 30-40% size reduction

#### Specific Files to Audit:
- `base.css` - Likely contains unused framework styles
- `critical.css` - Verify it's actually critical-path only
- `component-*.css` - Check for duplication across components

---

## 🟠 HIGH PRIORITY FIXES

### 4. Resource Loading Strategy

#### Issue: No Proper Resource Hints
**Missing:**
- `dns-prefetch` for third-party domains
- `preconnect` for critical third-party resources
- `modulepreload` for ES modules

**Recommended Additions:**
```liquid
<link rel="dns-prefetch" href="//cdn.shopify.com">
<link rel="dns-prefetch" href="//www.googletagmanager.com">
<link rel="dns-prefetch" href="//static.klaviyo.com">
<link rel="preconnect" href="https://cdn.shopify.com" crossorigin>
```

#### Issue: Third-Party Script Bloat
**Found in theme.liquid:**
- Google Ads (gtag.js)
- Yotpo reviews
- Klaviyo
- Swym wishlist
- AccessiBe
- MS Clarity
- Multiple tracking pixels

**Impact:** Each script = 100-300ms delay  
**Fix Strategy:**
1. Load all analytics via GTM (single script)
2. Defer non-essential widgets
3. Use facades for heavy embeds (reviews, chat)

---

### 5. Image Optimization

#### Issue: SVG Icon Inline Bloat (Line ~540 in theme.liquid)
**Current:**
```liquid
<img src="data:image/svg+xml;base64,PD94bWw..." width="1400" height="1400">
```

**Problem:** Massive base64 SVG inline (99999px × 99999px!)  
**Impact:** Bloats HTML by several KB  
**Purpose:** Unknown - appears to be placeholder/hack  
**Fix:** Remove entirely or replace with 1px transparent GIF

---

## 🟡 MEDIUM PRIORITY FIXES

### 6. Liquid Template Optimization

#### Issue: Inefficient Liquid Logic
**Example from theme.liquid (lines 96-120):**
```liquid
{% liquid
  if request.page_type == "product"
    assign final_pdp_title = page_title
    assign silhoutte = product.metafields.custom.product_title_type
    # ... complex title logic
  endif
%}
```

**Problem:** Heavy metafield lookups in `<head>`  
**Impact:** Slower TTFB  
**Fix:** Cache computed values, simplify logic

#### Issue: Excessive Comments
**Found:** Large commented-out code blocks throughout theme  
**Impact:** Increased file sizes, slower parsing  
**Fix:** Remove dead code, use version control for history

---

### 7. Font Loading Optimization

#### Current Font Stack Issues:
1. Preloading both .woff and .woff2 (redundant)
2. Google Fonts loaded synchronously
3. Custom fonts (Adobe Carlson, Sofia Pro) not optimized
4. No font-display strategy

**Recommended Font Strategy:**
```css
@font-face {
  font-family: 'Sofia Pro Light';
  src: url('SofiaProLight.woff2') format('woff2');
  font-display: swap; /* or 'optional' for performance */
  font-weight: 300;
}
```

**Preload Strategy:**
```liquid
<!-- Only preload fonts actually used above-fold -->
<link rel="preload" href="{{ 'SofiaProLight.woff2' | asset_url }}" as="font" type="font/woff2" crossorigin>
```

---

## 🟢 LOW PRIORITY / BEST PRACTICES

### 8. Code Quality & Maintainability

#### JavaScript Issues:
- Inconsistent code style (some ES6, some ES5)
- No apparent module bundler/build process
- Missing error boundaries
- Console.logs left in production code

#### CSS Issues:
- Mixed BEM and non-BEM naming
- !important overuse (check critical.css)
- Vendor prefixes manually added (use autoprefixer)

#### Accessibility:
- AccessiBe loaded (good) but adds 200KB+ overhead
- Manual ARIA may conflict with AccessiBe
- Audit for redundancy

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Quick Wins (1-2 hours)
- [ ] Inline critical.css
- [ ] Remove duplicate font preloads (.woff files)
- [ ] Fix async/defer conflicts
- [ ] Remove giant SVG placeholder
- [ ] Add resource hints for third-party domains
- [ ] Defer Google Fonts loading

### Phase 2: JavaScript Optimization (4-6 hours)
- [ ] Audit global.js for duplicates
- [ ] Split global.js into modules
- [ ] Remove duplicate Shopify utility functions
- [ ] Implement lazy loading for non-critical features
- [ ] Minify and compress all JS files
- [ ] Remove console.logs and dead code

### Phase 3: CSS Optimization (4-6 hours)
- [ ] Audit all 190 CSS files
- [ ] Create CSS variables file
- [ ] Merge component styles
- [ ] Run CSS purge/unused removal
- [ ] Implement critical CSS extraction properly
- [ ] Verify critical.css contains ONLY above-fold styles

### Phase 4: Third-Party Optimization (2-3 hours)
- [ ] Consolidate tracking via GTM
- [ ] Lazy load review widgets (Yotpo)
- [ ] Defer chat widget (Gladly)
- [ ] Optimize Klaviyo loading
- [ ] Review AccessiBe necessity/alternatives

### Phase 5: Testing & Validation (2-3 hours)
- [ ] Run Lighthouse audits
- [ ] Test on 3G/slow connections
- [ ] Verify no visual regressions
- [ ] Check cart/checkout functionality
- [ ] Validate ADA compliance
- [ ] Cross-browser testing

---

## 🎯 EXPECTED PERFORMANCE GAINS

### Before (Estimated Current):
- **FCP:** ~2.5-3.5s
- **LCP:** ~4-6s  
- **TBT:** ~800-1200ms
- **CLS:** ~0.15-0.25
- **Lighthouse Score:** 40-60

### After (Projected):
- **FCP:** ~0.8-1.2s (-60%)
- **LCP:** ~1.5-2.5s (-60%)
- **TBT:** ~200-400ms (-70%)
- **CLS:** ~0.05-0.10 (-60%)
- **Lighthouse Score:** 85-95 (+40-50 points)

---

## ⚠️ RISKS & CONSIDERATIONS

1. **Third-Party Dependencies:** Many scripts are business-critical (analytics, reviews, wishlist)
2. **Shopify Theme Updates:** Changes may conflict with future Shopify updates
3. **A/B Tests:** Existing ab-test.css must be preserved
4. **Gift With Purchase Logic:** Complex GWP system needs careful testing after refactor
5. **Backward Compatibility:** Ensure old browsers still function

---

## 🛠️ TOOLS REQUIRED

- **CSS:** PurgeCSS, cssnano
- **JS:** ESLint, Terser, webpack/rollup
- **Performance:** Lighthouse CI, WebPageTest
- **Monitoring:** SpeedCurve or similar
- **Version Control:** Git branches for each phase

---

## 📊 SUCCESS METRICS

Track these KPIs before/after:
1. Core Web Vitals (LCP, FID, CLS)
2. Time to Interactive (TTI)
3. Total Blocking Time (TBT)
4. Lighthouse Performance Score
5. Page Weight (HTML, CSS, JS, Fonts)
6. Number of HTTP Requests
7. Conversion Rate (ensure no negative impact)

---

## 🎬 NEXT STEPS

**Ready to proceed?** I recommend:

1. **Start with Phase 1** (quick wins) for immediate 20-30% improvement
2. **Create backup branch** before any changes
3. **Implement in staging** environment first
4. **A/B test** performance changes against live
5. **Monitor analytics** for any conversion impact

Would you like me to begin implementing Phase 1 optimizations now?
