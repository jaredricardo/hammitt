/**
 * GWP (Gift With Purchase) Auto-Management Module
 * Handles automatic adding/removing of free gifts based on cart thresholds
 * Extracted from global.js for better maintainability
 */

const GWPManager = (() => {
  'use strict';

  let isManagingGWP = false;

  /**
   * Main GWP management logic
   * @param {Object} cart - Cart object from cart:updated event
   */
  const manageGWP = async (cart) => {
    // Prevent infinite loops
    if (isManagingGWP) return;

    const progressBarContainer = document.querySelector('.progress-bar-container');
    if (!progressBarContainer) return;

    const gwpTiersData = progressBarContainer.getAttribute('data-gwp-tiers');
    if (!gwpTiersData) return;

    let gwpTiers = [];
    try {
      gwpTiers = JSON.parse(gwpTiersData);
    } catch (e) {
      console.error('Failed to parse GWP tiers:', e);
      return;
    }

    if (gwpTiers.length === 0) return;

    const cartItems = cart.items;
    const gwpVariantIds = gwpTiers.map(tier => tier.variantId);

    // Get gift wrap variant ID if active
    const giftingOptionsActive = document.querySelector('hammitt-gifting-options-drawer');
    const giftWrapProductVid = giftingOptionsActive
      ? parseInt(giftingOptionsActive.getAttribute('data-gift-note-vid'))
      : null;

    // Calculate cart total EXCLUDING GWP items and gift wrap
    const excludedTotal = cartItems
      .filter(item => {
        const isGWP = gwpVariantIds.includes(item.variant_id);
        const isGiftWrap = giftWrapProductVid && item.variant_id === giftWrapProductVid;
        return isGWP || isGiftWrap;
      })
      .reduce((total, item) => total + item.final_line_price, 0);

    const cartTotal = (cart.total_price - excludedTotal) / 100;

    // Determine which GWPs to add/remove
    const gwpsToManage = gwpTiers.map(tier => {
      const thresholdMet = cartTotal >= tier.threshold;
      const isInCart = cartItems.some(item => item.variant_id === tier.variantId);
      const isFreeGWP = tier.productPrice === 0;

      return {
        variantId: tier.variantId,
        threshold: tier.threshold,
        thresholdMet,
        isInCart,
        isFreeGWP,
        shouldAdd: thresholdMet && !isInCart,
        shouldRemove: !thresholdMet && isInCart && isFreeGWP
      };
    });

    const itemsToAdd = gwpsToManage.filter(gwp => gwp.shouldAdd);
    const itemsToRemove = gwpsToManage.filter(gwp => gwp.shouldRemove);

    if (itemsToAdd.length === 0 && itemsToRemove.length === 0) return;

    // Set flag to prevent loops
    isManagingGWP = true;

    try {
      // Remove items first if needed
      if (itemsToRemove.length > 0) {
        const updates = {};
        itemsToRemove.forEach(gwp => {
          updates[gwp.variantId] = 0;
        });

        await fetch(window.Shopify.routes.root + 'cart/update.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'xmlhttprequest'
          },
          body: JSON.stringify({ updates })
        });
      }

      // Add items if needed
      if (itemsToAdd.length > 0) {
        const items = itemsToAdd.map(gwp => ({
          id: gwp.variantId,
          quantity: 1,
          properties: { '_free_gift': 'true' }
        }));

        await fetch(window.Shopify.routes.root + 'cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'xmlhttprequest'
          },
          body: JSON.stringify({ items })
        });
      }

      // Fetch updated cart sections
      const sectionsResponse = await fetch(
        window.Shopify.routes.root + 'cart?sections=cart-drawer,cart-icon-bubble,main-cart-items,header',
        {
          headers: { 'X-Requested-With': 'xmlhttprequest' }
        }
      );

      const sectionsData = await sectionsResponse.json();
      const data = { sections: sectionsData };
      
      if (typeof cartUpdate === 'function') {
        cartUpdate(data);
      }

    } catch (error) {
      console.error('GWP management error:', error);
    } finally {
      // Reset flag after delay
      setTimeout(() => {
        isManagingGWP = false;
      }, 1000);
    }
  };

  /**
   * Initialize GWP manager
   */
  const init = () => {
    document.addEventListener('cart:updated', (event) => {
      if (event.detail?.cart) {
        manageGWP(event.detail.cart);
      }
    });
  };

  return { init };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', GWPManager.init);
} else {
  GWPManager.init();
}
