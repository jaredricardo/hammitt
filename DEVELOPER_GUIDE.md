# 🏗️ New Theme Architecture - Quick Reference
## Hammitt Shopify Theme - Developer Guide

---

## 📦 NEW MODULAR STRUCTURE

### JavaScript Modules

#### `assets/cart-api.js`
**Import:** Auto-loaded globally OR `<script src="{{ 'cart-api.js' | asset_url }}" defer></script>`

**Usage:**
```javascript
// Add items to cart
await CartAPI.add({
  items: [
    { id: variantId, quantity: 1 }
  ]
});

// Update cart item
await CartAPI.update({
  id: lineItemKey,
  quantity: 2,
  sections: ['cart-drawer', 'cart-icon-bubble']
});

// Get current cart
const cart = await CartAPI.get();

// Remove Order Protection
await removeOrderProtection();

// Listen for cart updates
document.addEventListener('cart:updated', (e) => {
  console.log('Cart updated!', e.detail);
});
```

---

#### `assets/gwp-manager.js`
**Import:** Auto-loaded when GWP active

**Features:**
- Auto-adds GWP at threshold
- Auto-removes when below threshold
- Excludes gift wrap from calculations
- Updates progress bar
- Prevents infinite loops

**No manual interaction needed** - works automatically

---

#### `assets/utilities.js`
**Import:** Available globally

**Functions:**
```javascript
// Debounce function calls
const debouncedFn = debounce(() => {
  console.log('Called after 300ms of inactivity');
}, 300);

// Get Shopify fetch config
const config = fetchConfig('json'); // or 'javascript'
fetch('/cart.js', config);

// Get focusable elements
const focusable = getFocusableElements(container);

// Lock background scroll
lockBackground(true); // lock
lockBackground(false); // unlock

// Pause all media
pauseAllMedia();
```

---

#### `assets/ui-components.js`
**Components:** Auto-register as custom elements

**Usage in HTML:**
```liquid
<!-- Slider -->
<slider-component>
  <div id="Slider-{{ section.id }}">
    <div id="Slide-1">Content</div>
    <div id="Slide-2">Content</div>
  </div>
  <button name="previous">Previous</button>
  <button name="next">Next</button>
</slider-component>

<!-- Modal -->
<modal-opener data-modal="#Modal-1">
  <button>Open Modal</button>
</modal-opener>

<modal-dialog id="Modal-1">
  <div role="dialog">
    <button id="ModalClose-1">Close</button>
    <div>Modal content</div>
  </div>
</modal-dialog>

<!-- Quantity Input -->
<quantity-input data-variant-id="{{ variant.id }}">
  <button name="minus">-</button>
  <input type="number" value="1">
  <button name="plus">+</button>
</quantity-input>

<!-- Deferred Media (lazy load video) -->
<deferred-media>
  <button id="Deferred-Poster-{{ section.id }}">
    Play Video
  </button>
  <template>
    <video src="{{ video.url }}" controls></video>
  </template>
</deferred-media>
```

---

#### `assets/drawer-components.js`
**Components:** Auto-register as custom elements

**Usage in HTML:**
```liquid
<!-- Menu Drawer -->
<menu-drawer>
  <details>
    <summary>Menu</summary>
    <div class="menu-drawer__submenu">
      <!-- Menu content -->
    </div>
  </details>
</menu-drawer>

<!-- Header Drawer -->
<header-drawer>
  <details>
    <summary>Menu</summary>
    <div class="menu-drawer__submenu">
      <!-- Menu content -->
    </div>
  </details>
</header-drawer>
```

---

#### `assets/product-components.js`
**Components:** Auto-register as custom elements

**Usage in HTML:**
```liquid
<!-- Quick Add -->
<quick-add>
  <button>Quick Add</button>
  <modal-dialog>
    <form method="post" action="/cart/add">
      <!-- Product form -->
    </form>
  </modal-dialog>
</quick-add>

<!-- Upsell Item -->
<upsell-item>
  <form>
    <input type="hidden" name="id" value="{{ variant.id }}">
    <button name="add">Add to Cart</button>
  </form>
</upsell-item>

<!-- Card Swatches -->
<card-swatches>
  <input type="radio" data-variant-image="{{ image.src }}" data-variant-url="{{ variant.url }}">
</card-swatches>

<!-- Slideshow -->
<slideshow-component data-autoplay="true" data-speed="5">
  <slider-component>
    <!-- Slides -->
  </slider-component>
</slideshow-component>
```

---

### CSS Architecture

#### `assets/variables.css`
**Load Order:** FIRST (before all other CSS)

**Usage:**
```liquid
<!-- In theme.liquid <head> -->
{{ 'variables.css' | asset_url | stylesheet_tag }}
```

**Available Variables:**
```css
/* Fonts */
font-family: var(--font-primary);
font-family: var(--font-secondary);
font-family: var(--font-heading);
font-size: var(--font-size-sm);
font-weight: var(--font-weight-semibold);

/* Spacing */
margin: var(--spacing-md);
padding: var(--spacing-lg) var(--spacing-md);
gap: var(--spacing-sm);

/* Colors */
color: var(--color-primary);
background: var(--color-background);

/* Shadows */
box-shadow: var(--shadow-md);

/* Transitions */
transition: var(--transition-default);

/* Z-index */
z-index: var(--z-modal);
```

---

#### `assets/cart.css`
**Replaces:**
- component-cart.css ❌
- component-cart-items.css ❌
- component-cart-drawer.css ❌
- component-cart-notification.css ❌

**Load:**
```liquid
{{ 'cart.css' | asset_url | stylesheet_tag }}
```

**Sections:**
- Cart page layout
- Cart drawer
- Cart notifications
- GWP progress bar
- Gift wrap/notes
- Save for later
- Upsells

---

#### `assets/critical.css`
**Load:** Inlined in `<head>`

```liquid
<style>
  {{ 'critical.css' | asset_url | asset_content }}
</style>
```

**Contains:**
- Above-fold styles only
- Uses CSS variables
- No font-family duplications
- Minimal !important usage

---

## 🔧 DEVELOPMENT GUIDELINES

### Adding New Styles

**DO:**
```css
/* Use CSS variables */
.my-component {
  font-family: var(--font-primary);
  padding: var(--spacing-md);
  color: var(--color-primary);
}
```

**DON'T:**
```css
/* Don't hardcode values */
.my-component {
  font-family: "Nunito Sans", sans-serif;
  padding: 20px;
  color: #000000;
}
```

---

### Creating New Components

**Template:**
```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    // Initialize
  }

  connectedCallback() {
    // Component added to DOM
    this.addEventListener('click', this.handleClick.bind(this));
  }

  disconnectedCallback() {
    // Component removed from DOM
    // Clean up listeners
  }

  handleClick(event) {
    // Handle interaction
  }
}

customElements.define('my-component', MyComponent);
```

---

### Working with Cart

**Adding to cart:**
```javascript
// Simple add
await CartAPI.add({
  items: [{ id: variantId, quantity: 1 }]
});

// Add with properties
await CartAPI.add({
  items: [{
    id: variantId,
    quantity: 1,
    properties: {
      'Gift Message': 'Happy Birthday!'
    }
  }]
});
```

**Updating cart:**
```javascript
// Update quantity
await CartAPI.update({
  id: lineItemKey,
  quantity: 3
});

// Update with sections refresh
await CartAPI.update({
  id: lineItemKey,
  quantity: 3,
  sections: ['cart-drawer', 'cart-icon-bubble']
});
```

**Getting cart:**
```javascript
const cart = await CartAPI.get();
console.log(cart.item_count);
console.log(cart.total_price);
console.log(cart.items);
```

---

## 📚 COMMON TASKS

### Task: Add a new product to cart on button click
```javascript
document.querySelector('.add-to-cart-btn').addEventListener('click', async (e) => {
  e.preventDefault();
  
  const variantId = e.target.dataset.variantId;
  
  try {
    await CartAPI.add({
      items: [{ id: variantId, quantity: 1 }]
    });
    
    // Cart will auto-update via 'cart:updated' event
    alert('Added to cart!');
  } catch (error) {
    alert('Error adding to cart');
  }
});
```

---

### Task: Listen for cart updates
```javascript
document.addEventListener('cart:updated', (e) => {
  const cart = e.detail;
  
  // Update cart count
  document.querySelector('.cart-count').textContent = cart.item_count;
  
  // Update cart total
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cart.total_price / 100);
  
  document.querySelector('.cart-total').textContent = formatted;
});
```

---

### Task: Create a custom slider
```liquid
<slider-component>
  <div id="Slider-{{ section.id }}" class="slider">
    {% for block in section.blocks %}
      <div id="Slide-{{ forloop.index }}" class="slide">
        {{ block.settings.content }}
      </div>
    {% endfor %}
  </div>
  
  <button name="previous" aria-label="Previous slide">
    {% render 'icon-arrow-left' %}
  </button>
  
  <button name="next" aria-label="Next slide">
    {% render 'icon-arrow-right' %}
  </button>
  
  <div class="slider-counter">
    <span class="slider-counter--current"></span>
    /
    <span class="slider-counter--total"></span>
  </div>
</slider-component>
```

---

### Task: Add a new CSS variable
```css
/* In variables.css */
:root {
  --my-custom-color: #FF6B6B;
  --my-custom-spacing: 24px;
}

/* Use in other CSS */
.my-element {
  color: var(--my-custom-color);
  padding: var(--my-custom-spacing);
}
```

---

## 🚨 TROUBLESHOOTING

### Cart not updating
1. Check browser console for errors
2. Verify `cart-api.js` is loaded
3. Check network tab for failed requests
4. Verify variant ID is correct

### Component not working
1. Check if custom element is defined: `customElements.get('component-name')`
2. Verify HTML structure matches expected format
3. Check browser console for errors
4. Ensure component JS file is loaded

### Styles not applying
1. Verify `variables.css` loads first
2. Check for CSS specificity issues
3. Clear browser cache
4. Check if styles are in critical.css or regular CSS

### GWP not auto-adding
1. Check `gwp-manager.js` is loaded
2. Verify threshold in theme settings
3. Check console for GWP-related logs
4. Verify gift wrap is excluded from calculation

---

## 📖 RESOURCES

### Files to Reference
- `OPTIMIZATION_SUMMARY.md` - Full optimization details
- `OPTIMIZATION_PROGRESS.md` - Detailed progress log
- `TESTING_CHECKLIST.md` - QA checklist
- This file - Quick reference

### Key Concepts
- **Custom Elements** - Web Components API
- **CSS Variables** - Custom properties
- **Event-Driven** - Using document events for communication
- **Modular** - Separated concerns
- **Progressive Enhancement** - Works without JS

---

**Last Updated:** January 2025  
**Maintained By:** Development Team
