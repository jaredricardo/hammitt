# 🧪 Pre-Production Testing Checklist
## Hammitt Theme Optimizations - Quality Assurance

**Branch:** `feature/theme-optimizations-2026`  
**Test Date:** _______________  
**Tester:** _______________

---

## 🎯 CRITICAL FUNCTIONALITY TESTS

### Cart Functionality
- [ ] **Add to Cart** - Single product adds correctly
- [ ] **Add to Cart** - Quick add from collection works
- [ ] **Remove from Cart** - Item removal works
- [ ] **Update Quantity** - Plus/minus buttons work
- [ ] **Update Quantity** - Manual input works
- [ ] **Cart Total** - Calculates correctly
- [ ] **Empty Cart** - Shows empty state message
- [ ] **Cart Drawer** - Opens/closes smoothly
- [ ] **Cart Drawer** - Overlay clicks close drawer

### Gift With Purchase (GWP)
- [ ] **Progress Bar** - Displays correctly in cart drawer
- [ ] **Progress Bar** - Updates when items added
- [ ] **Progress Bar** - Resets when below threshold
- [ ] **Auto-Add** - GWP item auto-adds at threshold
- [ ] **Auto-Remove** - GWP item removes below threshold
- [ ] **Gift Wrap** - Excluded from GWP threshold calculation
- [ ] **Multi-Tier** - Second tier GWP works (if applicable)
- [ ] **Message** - Correct messaging above/below threshold

### Gift Wrap & Gifting Options
- [ ] **Gift Wrap Checkbox** - Adds gift wrap product
- [ ] **Gift Wrap Checkbox** - Removes gift wrap when unchecked
- [ ] **Gift Note** - Saves cart note
- [ ] **Gift Note** - Character limit enforced (if applicable)
- [ ] **Box Opt-Out** - Works correctly
- [ ] **Mutual Exclusivity** - Gift wrap + box opt-out can't both be checked

### Order Protection
- [ ] **Auto-Add** - Order Protection adds to cart (if enabled)
- [ ] **Removal** - Can be removed from cart
- [ ] **Re-Add Prevention** - Doesn't auto-add after manual removal

---

## 🎨 VISUAL REGRESSION TESTS

### Homepage
- [ ] **Hero Section** - Loads without layout shift
- [ ] **Above-Fold** - All content visible
- [ ] **Images** - Load correctly
- [ ] **Fonts** - Display correctly (no FOIT)
- [ ] **Slideshow** - Auto-rotates if enabled
- [ ] **GWP Banner** - Shows if active

### Product Detail Page (PDP)
- [ ] **Product Images** - Load correctly
- [ ] **Image Slider** - Navigation works
- [ ] **Variant Selection** - Changes product correctly
- [ ] **Price** - Displays correctly
- [ ] **Add to Cart** - Button works
- [ ] **Quick Add** - Modal works (if applicable)
- [ ] **Upsells** - Display correctly

### Collection Page
- [ ] **Product Grid** - Loads correctly
- [ ] **Infinite Scroll** - Works (if enabled)
- [ ] **Filters** - Work correctly
- [ ] **Sort** - Works correctly
- [ ] **Card Swatches** - Color variants switch (if applicable)
- [ ] **Quick Add** - Works from cards

### Cart Page
- [ ] **Cart Items** - Display correctly
- [ ] **Line Item Details** - Show correctly
- [ ] **Quantity Controls** - Work
- [ ] **Remove Buttons** - Work
- [ ] **Cart Note** - Displays/saves
- [ ] **Checkout Button** - Works
- [ ] **Dynamic Checkout** - Buttons display

### Cart Drawer
- [ ] **Drawer Layout** - Correct styling
- [ ] **Progress Bar** - Displays correctly
- [ ] **Upsells** - Display if enabled
- [ ] **Saved for Later** - Works (if enabled)
- [ ] **Gift Options** - Display correctly
- [ ] **Checkout Button** - Works
- [ ] **Continue Shopping** - Closes drawer

---

## 🚀 PERFORMANCE TESTS

### Lighthouse Audit - Desktop
- [ ] **Performance Score:** _____ (Target: 85+)
- [ ] **Accessibility Score:** _____ (Target: 95+)
- [ ] **Best Practices Score:** _____ (Target: 95+)
- [ ] **SEO Score:** _____ (Target: 95+)

### Lighthouse Audit - Mobile
- [ ] **Performance Score:** _____ (Target: 75+)
- [ ] **Accessibility Score:** _____ (Target: 95+)
- [ ] **Best Practices Score:** _____ (Target: 95+)
- [ ] **SEO Score:** _____ (Target: 95+)

### Core Web Vitals
- [ ] **LCP (Largest Contentful Paint):** _____ (Target: <2.5s)
- [ ] **FID (First Input Delay):** _____ (Target: <100ms)
- [ ] **CLS (Cumulative Layout Shift):** _____ (Target: <0.1)
- [ ] **FCP (First Contentful Paint):** _____ (Target: <1.8s)
- [ ] **TBT (Total Blocking Time):** _____ (Target: <300ms)

### Network Tests
- [ ] **Fast 3G** - Site usable on slow connection
- [ ] **Slow 3G** - Critical content loads
- [ ] **Offline** - Shows appropriate message

---

## 🖥️ BROWSER COMPATIBILITY

### Desktop Browsers
- [ ] **Chrome (latest)** - Full functionality
- [ ] **Firefox (latest)** - Full functionality
- [ ] **Safari (latest)** - Full functionality
- [ ] **Edge (latest)** - Full functionality

### Mobile Browsers
- [ ] **Safari iOS** - Full functionality
- [ ] **Chrome Android** - Full functionality
- [ ] **Samsung Internet** - Full functionality (if applicable)

### Specific Features to Test Per Browser:
- [ ] Cart drawer animations
- [ ] Modal dialogs
- [ ] Slideshow autoplay
- [ ] Image loading
- [ ] Font rendering
- [ ] CSS Grid/Flexbox layouts

---

## 📱 DEVICE TESTS

### iPhone
- [ ] **iPhone 13/14** - Layout correct
- [ ] **iPhone SE** - Small screen works
- [ ] **Touch Interactions** - Tap targets adequate
- [ ] **Drawer Gestures** - Swipe works

### Android
- [ ] **Samsung Galaxy** - Layout correct
- [ ] **Google Pixel** - Layout correct
- [ ] **Touch Interactions** - Tap targets adequate

### Tablet
- [ ] **iPad** - Layout correct
- [ ] **iPad Mini** - Small tablet works
- [ ] **Android Tablet** - Layout correct

---

## 🔍 CODE QUALITY CHECKS

### Console Output
- [ ] **No JavaScript Errors** - Console clean
- [ ] **No Console.logs** - Production code clean
- [ ] **No Warnings** - No browser warnings

### Network Tab
- [ ] **No 404 Errors** - All assets load
- [ ] **No 500 Errors** - Server healthy
- [ ] **CSS Loads** - All stylesheets present
- [ ] **JS Loads** - All scripts present
- [ ] **Fonts Load** - WOFF2 fonts load
- [ ] **Images Load** - No broken images

### HTML Validation
- [ ] **Valid HTML** - No critical errors
- [ ] **Semantic HTML** - Proper structure
- [ ] **Accessibility** - ARIA attributes correct

---

## 🎨 CSS VERIFICATION

### Variables
- [ ] **variables.css** - Loads before other CSS
- [ ] **CSS Variables** - Applied correctly
- [ ] **Font Families** - Using var(--font-primary)
- [ ] **Spacing** - Using var(--spacing-*)
- [ ] **Colors** - Using var(--color-*)

### Cart CSS
- [ ] **cart.css** - Loads correctly
- [ ] **Cart Styles** - Applied correctly
- [ ] **Drawer Styles** - Applied correctly
- [ ] **No Duplicates** - Old cart CSS removed from theme

### Critical CSS
- [ ] **Inlined** - In <head> not external file
- [ ] **Above-Fold Only** - Only critical styles
- [ ] **No !important** - Minimal usage

---

## 🔧 JAVASCRIPT VERIFICATION

### Modules Loading
- [ ] **cart-api.js** - Loads and works
- [ ] **gwp-manager.js** - Loads and works
- [ ] **utilities.js** - Functions available
- [ ] **ui-components.js** - Components register
- [ ] **drawer-components.js** - Drawers work
- [ ] **product-components.js** - Components work

### Web Components
- [ ] **slider-component** - Works
- [ ] **modal-dialog** - Works
- [ ] **quantity-input** - Works
- [ ] **menu-drawer** - Works
- [ ] **quick-add** - Works
- [ ] **slideshow-component** - Works

### Event System
- [ ] **cart:updated** - Fires correctly
- [ ] **Event Listeners** - Not duplicated
- [ ] **Memory Leaks** - None detected

---

## 🛡️ SECURITY & PRIVACY

### Third-Party Scripts
- [ ] **Google Tag Manager** - Loads async
- [ ] **Klaviyo** - Loads correctly
- [ ] **Yotpo** - Loads correctly
- [ ] **No Mixed Content** - All HTTPS
- [ ] **CSP Compliant** - If CSP enabled

### Data Handling
- [ ] **Cart Data** - Handled securely
- [ ] **Personal Info** - Not exposed in console
- [ ] **API Keys** - Not exposed

---

## 📊 ANALYTICS VERIFICATION

### Google Analytics
- [ ] **Pageviews** - Tracked
- [ ] **Events** - Firing correctly
- [ ] **E-commerce** - Cart tracked

### Klaviyo
- [ ] **Events** - Firing
- [ ] **Cart Abandonment** - Tracked

### Other Tools
- [ ] **Yotpo** - Working
- [ ] **Swym Wishlist** - Working (if enabled)

---

## ⚡ ADVANCED TESTS

### Stress Tests
- [ ] **50 Items in Cart** - Still performant
- [ ] **Rapid Quantity Changes** - No errors
- [ ] **Fast Add/Remove** - No race conditions
- [ ] **Multiple Tabs** - Cart syncs correctly

### Edge Cases
- [ ] **Sold Out Product** - Handled correctly
- [ ] **Invalid Variant** - Error shown
- [ ] **Empty Inventory** - Message shown
- [ ] **Discount Codes** - Applied correctly
- [ ] **Free Shipping** - Calculated correctly

---

## 🐛 KNOWN ISSUES LOG

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
|       |          |        |       |
|       |          |        |       |
|       |          |        |       |

---

## ✅ FINAL SIGN-OFF

### Developer Checklist
- [ ] All tests passed
- [ ] No critical issues
- [ ] Performance targets met
- [ ] Code quality verified
- [ ] Documentation complete

### QA Checklist
- [ ] Functionality verified
- [ ] Visual regression passed
- [ ] Performance acceptable
- [ ] Browser compatibility confirmed
- [ ] Device testing complete

### Stakeholder Approval
- [ ] **Developer:** _______________  Date: _______
- [ ] **QA Lead:** _______________  Date: _______
- [ ] **Product Owner:** _______________  Date: _______

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Backup current live theme
- [ ] Create restore point
- [ ] Notify stakeholders
- [ ] Schedule maintenance window (if needed)

### Deployment
- [ ] Deploy to staging first
- [ ] Final staging tests
- [ ] Deploy to production
- [ ] Verify production deploy
- [ ] Monitor error logs

### Post-Deployment
- [ ] 15-min check - No errors
- [ ] 1-hour check - Performance stable
- [ ] 24-hour check - No issues reported
- [ ] 1-week review - Metrics improved

---

**Notes:**
- Mark each checkbox as tests are completed
- Document any issues in the Known Issues Log
- Retest after fixes are applied
- Get sign-off before production deployment

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete
