# 🗑️ Unused Files Analysis - Should We Delete These?
## Hammitt Shopify Theme

**Date:** March 28, 2026  
**Analysis:** theme.alternate.liquid, __opt files, and .sl-* templates

---

## 📋 SUMMARY

| File/Pattern | Status | Recommendation |
|-------------|--------|----------------|
| `layout/theme.alternate.liquid` | ✅ **IN USE** | ⚠️ Keep (used by landing pages) |
| `snippets/__opt-theme-*.liquid` | ⚠️ **LEGACY PERFORMANCE HACK** | 🗑️ Consider removing |
| `templates/index.sl-*.json` | ✅ **IN USE** | ✅ Keep (Shogun landing pages) |

---

## 1. `layout/theme.alternate.liquid`

### Status: ✅ **ACTIVELY USED**

**Used By:**
- `templates/index.sl-6D5566D8.json` (Shogun landing page)
- Other `.sl-*` template files (6 different variations)

**Purpose:**
- Alternate layout for **Shogun Page Builder** landing pages
- Provides different styling/structure than main theme
- Likely used for marketing campaigns, seasonal pages, special promos

**Evidence:**
```json
// templates/index.sl-6D5566D8.json
{
  "layout": "theme.alternate",
  "sections": { ... }
}
```

### Recommendation: ⚠️ **KEEP BUT SYNC WITH MAIN THEME**

**Action Items:**
1. ✅ **Keep the file** - It's actively used by landing pages
2. ⚠️ **Sync optimizations** - Apply same fixes as theme.liquid:
   - Font display optimizations (already done ✅)
   - Cart-api.js loading (needs to be added)
   - Any future performance fixes
3. 📝 **Document usage** - Add comment at top of file explaining purpose

**Risk if Deleted:** 🔴 **HIGH** - Would break Shogun landing pages

---

## 2. `snippets/__opt-theme-*.liquid` Files

### Status: ⚠️ **LEGACY PERFORMANCE HACK FROM ~2019-2021**

**Files:**
1. `__opt-theme-observer.liquid` - Bot detection script (296 lines)
2. `__opt-theme-headers.liquid` - Content header manipulation
3. `__opt-theme-js.liquid` - Deferred JS loading

### What They Do:

#### A. `__opt-theme-observer.liquid`
**Purpose:** Bot detection to avoid showing slow optimizations to bots
```javascript
class BotDetection {
  testUserAgent() { /* detect headless browsers */ }
  testChromeWindow() { /* detect automation */ }
  testPlugins() { /* check for real browser */ }
  // ...12 different bot detection tests
}
```

**Analysis:**
- 296 lines of bot detection code
- From era when aggressive optimizations could hurt SEO
- Modern Shopify/Google handles this better now
- **Likely unnecessary in 2026**

---

#### B. `__opt-theme-headers.liquid`
**Purpose:** Defer third-party scripts (Yotpo, analytics, etc.)
```liquid
{%- assign content_for_header = __content_for_header  
  | replace: "defer='defer' src='", "type='noscript-s' data-src='"
  | replace: 'DOMContentLoaded', 'allLoad'
-%}
```

**What It Does:**
1. Hijacks `{{ content_for_header }}`
2. Converts scripts to `type="noscript-s"`
3. Delays loading until custom `allLoad` event
4. Delays Shopify apps, analytics, and widgets

**Analysis:**
- **FRAGILE:** Relies on string replacement of Shopify's output
- **RISKY:** Could break when Shopify updates their code
- **OUTDATED:** Modern approach is to use `<script defer>` natively
- **BETTER ALTERNATIVE:** Use Shopify's native script loading controls

---

#### C. `__opt-theme-js.liquid`
**Purpose:** Custom event system for deferred JS
```javascript
window.addEventListener('wnw_load', function (e) {
  setTimeout(() => {
    // Fire custom 'allLoad' event after 2 seconds
    emitEvent("allLoad", window, {});
  }, 2000);
});
```

**What It Does:**
- Creates fake event system (`wnw_load`, `allLoad`)
- Delays all third-party scripts by 2 seconds
- Attempts to improve initial page load metrics

**Analysis:**
- **OUTDATED TECHNIQUE** from ~2019-2020
- **BREAKS USER EXPERIENCE:** 2 second delay for reviews, loyalty, etc.
- **BETTER ALTERNATIVES:** 
  - Modern `defer` and `async` attributes
  - Intersection Observer for below-fold widgets
  - Native lazy loading

---

### Why These Files Exist:

**Historical Context:**
- Created ~2019-2021 during "Core Web Vitals" panic
- Speed optimization services sold this as a "hack"
- Worked around slow third-party apps
- Improved Lighthouse scores artificially

**The Problem:**
- ❌ Fragile (breaks when Shopify updates)
- ❌ Hard to maintain
- ❌ Delays user-facing features unnecessarily
- ❌ Uses string manipulation of Shopify's HTML
- ❌ Not necessary with modern performance techniques

---

### Recommendation: 🗑️ **GRADUALLY REMOVE**

**Phase 1: Test Without Them**
1. Comment out the `{% render '__opt-theme-observer' %}` lines
2. Comment out the `{% include '__opt-theme-headers' %}` lines
3. Comment out the `{% render '__opt-theme-js' %}` lines
4. Test on staging:
   - Check Lighthouse scores
   - Check third-party app functionality
   - Monitor Core Web Vitals

**Phase 2: If No Issues, Delete Files**
```
✅ Remove: snippets/__opt-theme-observer.liquid
✅ Remove: snippets/__opt-theme-headers.liquid
✅ Remove: snippets/__opt-theme-js.liquid
```

**Phase 3: Modern Replacements**
Instead of these hacks, use:
- ✅ Native `<script defer>`
- ✅ Intersection Observer for widgets
- ✅ Shopify's app loading controls
- ✅ Proper lazy loading (already implemented)
- ✅ Font-display: swap (already implemented ✅)

**Risk if Deleted:** 🟡 **MEDIUM**
- May see small Lighthouse score decrease initially
- Can be offset by modern optimizations (already mostly done)
- Third-party apps may load slightly earlier (actually GOOD UX)

---

## 3. `templates/index.sl-*.json` Files

### Status: ✅ **ACTIVELY USED - SHOGUN LANDING PAGES**

**Files Found:**
1. `index.sl-6D5566D8.json` - Uses theme.alternate layout
2. `index.sl-BE05ED61.json`
3. `index.sl-7CD43787.json`
4. `index.sl-CD717D16.json`
5. `index.sl-328F1568.json`
6. `index.sl-468547E8.json`
7. `index.sl-D24C3FAD.json`

**What They Are:**
- **Shogun Page Builder** landing page templates
- Auto-generated by Shogun (note the header comment)
- Each `.sl-*` ID is a unique landing page variant
- Used for A/B tests, campaigns, seasonal promos

**Example:**
```json
/*
 * IMPORTANT: The contents of this file are auto-generated.
 * This file may be updated by the Shopify admin theme editor
 * or related systems. Please exercise caution as any changes
 * made to this file may be overwritten.
 */
{
  "layout": "theme.alternate",
  "sections": { ... }
}
```

### Recommendation: ✅ **KEEP - DO NOT DELETE**

**Why:**
- Auto-generated by Shogun app
- Deleting them will break published landing pages
- Each represents a live or scheduled landing page
- Contains page-specific settings and content

**Maintenance:**
- Don't manually edit these files
- Manage through Shogun Page Builder admin
- They'll be regenerated/updated by Shogun automatically

**Risk if Deleted:** 🔴 **CRITICAL**
- Would break all Shogun landing pages
- Loss of marketing campaign pages
- Loss of A/B test variations

---

## 🎯 ACTION PLAN

### Immediate (Safe to do now):

1. ✅ **Keep theme.alternate.liquid**
   - Add comment explaining it's for Shogun pages
   - Ensure it stays in sync with main theme optimizations

2. ✅ **Keep all .sl-*.json files**
   - These are managed by Shogun
   - Don't touch them manually

### Phase 1 (Test on staging):

3. ⚠️ **Test removing __opt files**
   ```liquid
   <!-- In layout/theme.liquid, comment out: -->
   {%- comment -%}
     {% render '__opt-theme-observer' %}
     {% include '__opt-theme-headers' %}
   {%- endcomment -%}
   
   <!-- And near closing </body>: -->
   {%- comment -%}
     {% render '__opt-theme-js' %}
   {%- endcomment -%}
   ```

4. ⚠️ **Monitor for 1 week:**
   - Lighthouse scores
   - Core Web Vitals
   - User complaints
   - Third-party app functionality (Yotpo, Klaviyo, etc.)

### Phase 2 (If Phase 1 successful):

5. 🗑️ **Delete __opt files permanently**
   ```
   rm snippets/__opt-theme-observer.liquid
   rm snippets/__opt-theme-headers.liquid
   rm snippets/__opt-theme-js.liquid
   ```

6. 🗑️ **Remove the render/include statements**
   - From `layout/theme.liquid`
   - From `layout/theme.alternate.liquid`

### Phase 3 (Modern replacements):

7. ✅ **Replace with modern techniques** (mostly already done!)
   - ✅ Font-display: swap (DONE)
   - ✅ Image lazy loading (DONE)
   - ✅ Modular JS (cart-api.js, etc.) (DONE)
   - 🔄 Consider moving to Shopify Hydrogen/Oxygen for ultimate performance

---

## 📊 FILE SIZE SAVINGS

If we remove the `__opt-*` files:

| File | Size | Purpose |
|------|------|---------|
| `__opt-theme-observer.liquid` | ~12 KB | Bot detection (unnecessary) |
| `__opt-theme-headers.liquid` | ~2 KB | Header hacking (fragile) |
| `__opt-theme-js.liquid` | ~1 KB | Event delays (bad UX) |
| **TOTAL SAVINGS** | **~15 KB** | **+ reduced complexity** |

**Additional Benefits:**
- ✅ Easier to maintain theme
- ✅ Less fragile (no string manipulation hacks)
- ✅ Better user experience (no artificial delays)
- ✅ More predictable third-party app loading
- ✅ Cleaner codebase

---

## 🚨 RISKS SUMMARY

| Action | Risk Level | Impact if Wrong |
|--------|-----------|-----------------|
| Delete theme.alternate.liquid | 🔴 **HIGH** | Breaks Shogun landing pages |
| Delete .sl-*.json files | 🔴 **CRITICAL** | Breaks all landing pages |
| Remove __opt files | 🟡 **MEDIUM** | Slight Lighthouse decrease, better UX |

---

## 💡 RECOMMENDATIONS

### ✅ DO:
1. Keep `theme.alternate.liquid` - actively used
2. Keep all `.sl-*.json` files - Shogun needs them
3. Test removing `__opt-*` files on staging first
4. Add comments documenting what each file does

### 🗑️ CONSIDER REMOVING:
1. `snippets/__opt-theme-observer.liquid` - outdated bot detection
2. `snippets/__opt-theme-headers.liquid` - fragile header hacking
3. `snippets/__opt-theme-js.liquid` - artificial delays hurt UX

### ⚠️ DON'T:
1. Delete files without testing first
2. Assume old "speed hacks" are still beneficial in 2026
3. Manually edit `.sl-*.json` files (Shogun manages them)

---

## 📝 NEXT STEPS

1. **Document in theme.alternate.liquid:**
   ```liquid
   {%- comment -%}
   ========================================
   ALTERNATE THEME LAYOUT
   
   Purpose: Used by Shogun Page Builder for landing pages
   Files using this: templates/index.sl-*.json
   
   IMPORTANT: Keep this in sync with layout/theme.liquid
   When making optimizations to main theme, apply here too.
   ========================================
   {%- endcomment -%}
   ```

2. **Test __opt file removal:**
   - Create test branch
   - Comment out __opt includes
   - Deploy to staging
   - Monitor for 1 week

3. **If successful, clean up:**
   - Delete __opt files
   - Document the removal
   - Update performance documentation

---

**Status:** 📋 Analysis Complete - Ready for Action  
**Recommendation:** Remove __opt files, keep everything else  
**Estimated Cleanup Time:** 2-3 hours (including testing)
