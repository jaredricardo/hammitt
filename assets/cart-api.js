/**
 * Cart Operations Module
 * Handles all cart-related API calls and state management
 * Extracted from global.js for better maintainability and performance
 */

const CartAPI = (() => {
  'use strict';

  const CART_SECTIONS = 'cart-drawer,cart-icon-bubble,main-cart-items,header';
  const CART_SECTIONS_URL = '/cart?sections=' + CART_SECTIONS;

  /**
   * Add items to cart
   * @param {Object} itemsObj - Cart add payload
   * @returns {Promise}
   */
  const addToCart = (itemsObj) => {
    if (!itemsObj.sections) {
      itemsObj.sections = CART_SECTIONS;
    }
    if (!itemsObj.sections_url) {
      itemsObj.sections_url = CART_SECTIONS_URL;
    }

    return fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'xmlhttprequest'
      },
      credentials: 'same-origin',
      body: JSON.stringify(itemsObj)
    })
    .then(response => response.json())
    .then(json => {
      if (json.status === 422 && json.message === "Cart Error") {
        itemsObj.items.shift();
        return addToCart(itemsObj);
      }
      cartUpdate(json);
      return json;
    })
    .catch(error => {
      console.error('Cart add error:', error);
      throw error;
    });
  };

  /**
   * Update cart
   * @param {Object} params - Update parameters
   */
  const updateCart = (params) => {
    return fetch(params.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: params.data
    })
    .then(response => response.json())
    .then(cart => {
      cartUpdate(cart);
      const onCartPage = window.location.href.includes('/cart');
      if (onCartPage) {
        window.location.reload();
      }
      return cart;
    });
  };

  /**
   * Get current cart state
   * @returns {Promise<Object>}
   */
  const getCart = () => {
    return fetch(window.Shopify.routes.root + 'cart.js')
      .then(response => response.json())
      .then(cart => {
        console.log(cart);
        return cart;
      });
  };

  /**
   * Check if Order Protection items exist and remove them
   * (They should only be in cart at checkout)
   */
  const removeOrderProtection = () => {
    const drawerItems = document.querySelector('.drawer__items');
    if (!drawerItems?.dataset.json) return;

    const cart = JSON.parse(drawerItems.dataset.json);
    const protectionItems = cart.filter(item => item.vendor === "Order Protection");
    
    if (protectionItems.length === 0) return;

    const updates = {};
    protectionItems.forEach(item => {
      updates[item.variant_id] = 0;
    });

    const body = JSON.stringify({
      updates,
      sections: CART_SECTIONS
    });

    fetch(window.Shopify.routes.root + 'cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    })
    .then(response => response.json())
    .then(data => {
      // Silent update - don't open drawer or reload
      const sectionsToUpdate = [
        { section: "cart-drawer", elements: [".cart-announcement-bar", ".drawer__items", ".drawer__final", ".cart_shipping_notes", ".drawer__header h4"] },
        { section: "cart-icon-bubble", elements: [".cart-count-bubble"] }
      ];

      sectionsToUpdate.forEach(({ section, elements }) => {
        elements.forEach(selector => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.sections[section], "text/html");
          const oldEl = document.querySelector(selector);
          const newEl = doc.querySelector(selector);
          if (oldEl && newEl) {
            oldEl.outerHTML = newEl.outerHTML;
          }
        });
      });
    })
    .catch(error => console.error('Order Protection removal error:', error));
  };

  // Public API
  return {
    add: addToCart,
    update: updateCart,
    get: getCart,
    removeOrderProtection
  };
})();

// Expose globally for backwards compatibility
window.addToCart = CartAPI.add;
window.updateCart = CartAPI.update;
window.getCart = CartAPI.get;

// Auto-remove Order Protection on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', CartAPI.removeOrderProtection);
} else {
  CartAPI.removeOrderProtection();
}
