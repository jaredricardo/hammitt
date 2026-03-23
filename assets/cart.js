/* eslint-disable */
class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', this.handleClick.bind(this));
  }

  handleClick(event) {
    event.preventDefault();

    const cartItems = this.closest('cart-items');
    const onCartPage = window.location.href.includes('/cart');

    if (onCartPage) {
      this.handleCartPageClick(event, cartItems);
    } else {
      this.handleCartDrawerClick(event, cartItems);
    }

    setTimeout(function() {
      if(document.querySelector('.cart-drawer-btn') != null) {
        document.querySelector('.cart-drawer-btn').disabled = false;  
      }
      
      if(document.querySelector('.cart__checkout-button') != null) {
        document.querySelector('.cart__checkout-button').disabled = false;  
      }
    }, 1000)
  }

  handleCartPageClick(event, cartItems) {
    const item = event.target.closest(".cart-item");
    const key = String(item.getAttribute("data-key"));
    this.showLoadingOverlay(item);

    const idPromotionPropertyElement = item.querySelector(".id-promotion_property");
    const idAddOnPropertyElement = item.querySelector(".id-addon_property");

    const idPromotionProperty = idPromotionPropertyElement?.innerHTML.trim();
    const idAddOnProperty = idAddOnPropertyElement?.innerHTML.trim();

    if (idAddOnProperty === "AddOnPromotion") {
      this.updateCartItems({ [key]: 0 }, true);
    } else {
      this.updateCartItems({ [key]: 0 }, true);
    }
  }

  handleCartDrawerClick(event, cartItems) {
    const item = event.target.closest(".drawer__content-item");
    const idPromotionPropertyElement = item.querySelector(".id-promotion_property");
    const idAddOnPropertyElement = item.querySelector(".id-addon_property");

    const idPromotionProperty = idPromotionPropertyElement?.innerHTML.trim();
    const idAddOnProperty = idAddOnPropertyElement?.innerHTML.trim();

    if(idAddOnProperty === "AddOnPromotion") {
      cartItems.updateQuantity(this.getAttribute("data-key"), 0, undefined, undefined, true);
    } else {
      cartItems.updateQuantity(this.getAttribute("data-key"), 0, undefined, undefined, true);
    }
  }

  showLoadingOverlay(item) {
    const qtySelector = item.querySelector(".cart-item__quantity-wrapper");
    const cOverlay = item.querySelector(".custom-loading_overlay");
    qtySelector.classList.add("hidden");
    cOverlay.classList.remove("hidden");
  }


  updateCartItems(updates, reload = false) {
    const body = JSON.stringify({ updates });
    fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
      .then(response => {
        return response.json();
      })
      .then(data => {
        if (reload)
          window.location.reload()
      })
      .catch((error) => {
        console.error('ERROR(updateCartItems): ', error);
        window.location.reload();
      });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement = this.querySelector('.shopping-cart-line-item-status');
    this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]'))
      .reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener('change', this.debouncedOnChange.bind(this));
  }

  onChange(event) {
    this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'));
  }

  updateQuantity(line, quantity, name, event, isKey = false) {
    this.enableLoading(line);

    const body = JSON.stringify({
      [isKey ? "id" : "line"]: line,
      quantity,
      sections: "cart-drawer,cart-icon-bubble,main-cart-items,header"
    });     

    fetch(`${routes.cart_change_url}`, {...fetchConfig(), ...{ body }})
    .then((response) => {
      return response.text();
    })
    .then((state) => {
      const parsedState = JSON.parse(state);
      this.classList.toggle('is-empty', parsedState.item_count === 0);
      const cartFooter = document.querySelector('#main-cart-footer');
      if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
      cartUpdate(parsedState);
      
      this.updateLiveRegions(line, parsedState.item_count);
      const lineItem =  this.querySelector(`.CartItem-${line}`);
      if (lineItem && lineItem.querySelector(`[name="${name}"]`)) lineItem.querySelector(`[name="${name}"]`).focus();
      
      this.disableLoading(line);
      
      setTimeout(function() {
        if(document.querySelector('.cart-drawer-btn') != null) {
          document.querySelector('.cart-drawer-btn').disabled = false;  
        }
        
        if(document.querySelector('.cart__checkout-button') != null) {
          document.querySelector('.cart__checkout-button').disabled = false;  
        }
      }, 1000)

      fetch(window.Shopify.routes.root + 'cart.js')
      .then(response => response.json())
      .then(data => 
        {
          document.dispatchEvent(
            new CustomEvent('cart:updated', {
              detail: {
                cart: data,
              },
            })
          );
        }
      );
    }).catch((e) => {
      this.querySelectorAll('.loading-overlay').forEach((overlay) => overlay.classList.add('hidden'));
      this.querySelector('.cart-errors').textContent = window.cartStrings.error;
      this.disableLoading(line);
    });
  }

  updateLiveRegions(line, itemCount) {
    
    if (this.currentItemCount === itemCount) {
      this.querySelector(`.Line-item-error-${line}`)
        .querySelector('.cart-item__error-text')
        .innerHTML = window.cartStrings.quantityError.replace(
          '[quantity]',
           this.querySelector(`.quantity__input`).value
        );
    }

    this.currentItemCount = itemCount;
    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus = this.querySelector('.cart-live-region-text');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }


  enableLoading(line) {
    this.classList.add('cart__items--disabled');

    if (/^\d+:[a-f0-9]+$/.test(line)) {
      // Cart Remove Button
      const cartDrawerRemoveElements = this.querySelectorAll(`[data-key="${line}"] cart-remove-button`);
      [...cartDrawerRemoveElements].forEach((btn) => btn.classList.add("hidden"));

      const cartDrawerItemElements = this.querySelectorAll(`[data-key="${line}"] .loading-overlay`);
      [...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));
    }else{
      // Cart Remove Button
      const cartDrawerRemoveElements = this.querySelectorAll(`#CartDrawerItem-${line} cart-remove-button`);
      [...cartDrawerRemoveElements].forEach((btn) => btn.classList.add("hidden"));

      const cartDrawerItemElements = this.querySelectorAll(`#CartDrawerItem-${line} .loading-overlay`);
      const cartPageItemElements = this.querySelectorAll(`#CartItem-${line} .custom-loading_overlay`);
      [...cartDrawerItemElements, ...cartPageItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

      // Cart Page QTY 
      const cartPageQty = this.querySelectorAll(`#CartItem-${line} .cart-item__quantity-wrapper`);
      [...cartPageQty].forEach((overlay) => overlay.classList.add('hidden'));
    }
  }

  disableLoading(line) {
    this.classList.remove('cart__items--disabled');
    
    if (/^\d+:[a-f0-9]+$/.test(line)) {
      // Cart Remove Button
      const cartDrawerRemoveElements = this.querySelectorAll(`[data-key="${line}"] cart-remove-button`);
      [...cartDrawerRemoveElements].forEach((btn) => btn.classList.remove("hidden"));

      const cartDrawerItemElements = this.querySelectorAll(`[data-key="${line}"] .loading-overlay`);
      [...cartDrawerItemElements].forEach((overlay) => overlay.classList.add('hidden'));
    }else{
      // Cart Remove Button
      const cartDrawerRemoveElements = this.querySelectorAll(`#CartDrawerItem-${line} cart-remove-button`);
      [...cartDrawerRemoveElements].forEach((btn) => btn.classList.remove("hidden"));

      const cartDrawerItemElements = this.querySelectorAll(`#CartDrawerItem-${line} .loading-overlay`);
      const cartPageItemElements = this.querySelectorAll(`#CartItem-${line} .custom-loading_overlay`);
      [...cartDrawerItemElements, ...cartPageItemElements].forEach((overlay) => overlay.classList.add('hidden'));
    }
  }
}

customElements.define('cart-items', CartItems);

class CartDrawer extends MenuDrawer {
  constructor() {
    super();
  }
  renderContents(parsedState) {
      this.cartItemKey = parsedState.key;
      this.getSectionsToRender().forEach((section => {
        if(section.id == 'cart-drawer') {
          document.querySelector('#cart-icon-bubble').innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], '#cart-icon-bubble');
        }
        document.querySelector(section.id + ' ' + section.selector).innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
        
      }));
      this.querySelector('[data-drawer-close]').addEventListener('click',this.onCloseButtonClick.bind(this));
      this.open();
  }
  
  open() {
    this.querySelector('summary').click();
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeMenuDrawer(event);
    event.preventDefault();
  }
  
  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '.drawer__content'
      }
    ];
  }
  
  setActiveElement(element) {
    this.activeElement = element;
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }
 
}

customElements.define('cart-drawer', CartDrawer);
class QuickAddButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      event.target.disabled = true
      event.preventDefault();
      const id = event.target.getAttribute('data-id');
      const quickAddObj = {
        items: [
          {
            id: id,
            quantity: 1
          }
        ]
      }
      theme.addToCart(quickAddObj);
    });
  }
}

customElements.define('quick-add-button', QuickAddButton);

class CartUpsells extends HTMLElement {
  constructor() {
    super();
    this.scroller = this.querySelector('.horizontal-scroller__upsell');
    this.max = 5;
    this.found = 0;
    this.productTitle= this.getAttribute('data-upsell-title') || false;

    
    this.tabItems = this.querySelectorAll('.tab-item');
    this.tabItems.forEach(tab => {
      var hasref = tab.querySelector('a');

      // document.querySelectorAll(`[data-target]`).forEach(tab => {
      //   const targetEle = tab.getAttribute('data-target');
      //   document.querySelector(`[data-target="${targetEle}"]`).classList.add('hidden')
      //   tab.style.display = 'none';
      // });
      
      hasref.addEventListener('click', (event) => {
        event.preventDefault();
        this.activetabCollection = event.currentTarget.getAttribute('data-href');

        this.tabItems.forEach(tab => {
          tab.classList.remove('active');
        });
        this.querySelectorAll(`[data-target]`).forEach(tab => {
          tab.classList.add('hidden')
        });
        event.currentTarget.closest('li').classList.add('active');
        this.querySelector(`[data-target="${this.activetabCollection}"]`).classList.remove('hidden')
        this.found = 0;
        // this.getUpsells(this.activetabCollection);
        cartUpsellSwiper();
      });

    });
    this.productPageScroller = document.querySelector('.product__upsells-scroller');

  }
  getUpsells(handle) {
    if(!this.productTitle) return;
    const url = `/collections/${handle}?view=upsells`;
    fetch(url)
    .then(response => response.text())
    .then(data => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, "text/html");
      const upsells = doc.querySelectorAll('.upsell');
      this.scroller.innerHTML = '';
      upsells.forEach(upsell => {        
        if(upsell.getAttribute('data-title') === this.productTitle) return true;
        // if(this.found >= this.max) return false;
        this.scroller.appendChild(upsell);
        if(this.productPageScroller && window.productJSON) {
          if(upsell.getAttribute('data-title') === window.productJSON.title) return true;
          const clone = upsell.cloneNode(true);
          clone.removeAttribute('id');
//           this.productPageScroller.appendChild(clone);
        }
        this.found = this.found + 1;
        cartUpsellSwiper();
        
      });
      
      if(this.scroller.innerHTML.trim().length === 0) {
        this.scroller.innerHTML = '<p style="font-size: 13px;">No products found</p>';
      }
    })
    .catch(error => console.log(error));
  }
}

customElements.define('cart-upsells', CartUpsells);
class GiftNoteToggle extends HTMLElement {
  constructor() {
    super();
    this.json = JSON.parse(document.querySelector('.drawer__items').getAttribute('data-json'));
    
    this.toggle = this.querySelector('input');
    this.toggle.addEventListener('change', this.toggleGiftNote.bind(this));
    this.giftNoteInput = document.getElementById('gift-note');
    this.giftWrapInCart = this.getAttribute('data-has-gift-note') === 'true';
    this.giftNoteId = 32065742504054;
    
    this.init();

    if(!this.giftNoteInput) {
      return;
    }
    this.giftNoteInput.addEventListener('keyup', this.debounce(() => {
      let noteData = {
         attributes: {
           'Gift Note': this.giftNoteInput.value
         }
      };
      
      fetch(window.Shopify.routes.root + 'cart/update.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(noteData)
      })
      .then(response => {
        return response.json();
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    },250));
  }
  
  debounce(callback, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(function () { callback.apply(this, args); }, wait);
    };
  }
  
  init() {
    this.toggle.checked = this.giftWrapInCart;
  }
  giftNoteListener() {
    let timer;
    let interval = 250;
    clearTimeout
  }
  
  giftWrapInCart() {
    return this.giftWrapInCart;
  }
  removeGiftWrap() {
    let removeData = {
      id: this.giftNoteId.toString(),
      quantity: 0,
      note: ''
    }
    removeData.sections = "cart-drawer,cart-icon-bubble,main-cart-items,header";
    
	fetch(window.Shopify.routes.root + 'cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(removeData)
      })
      .then(response => {
        return response.json();
      })
      .then(data => {
        cartUpdate(data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }
  toggleGiftNote() {
    const qty = event.target.checked ? 1 : 0;
    const itemObj = {
      items: [
        {
          id: this.giftNoteId,
          quantity: qty
        }
      ]
    }
    qty === 1 ? addToCart(itemObj) : this.removeGiftWrap();
  }
}

customElements.define('gift-note', GiftNoteToggle);

class SaveForLater extends HTMLElement {
  constructor() {
    super()
    this.addEventListener('click', (event) => this.handleClick(event))
  } 

  handleClick(event) {
    event.preventDefault()
    
    // Get data from attributes (no JSON parsing needed)
    const productId = this.getAttribute('data-product-id')
    const variantId = this.getAttribute('data-variant-id')
    const variantUrl = this.getAttribute('data-variant-url')
    const variantImage = this.getAttribute('data-variant-image')
    const variantTitle = this.getAttribute('data-line-title')
    const variantPrice = this.getAttribute('data-line-string-price')
    const variantColor = this.getAttribute('data-item-variant-color')
    
    const saveForLaterItemData = {
      product_level_id: productId,
      variant_add_to_cart_id: variantId,
      variant_url: variantUrl,
      variant_image_string: variantImage,
      variant_formatted_title: variantTitle,
      variant_string_price: variantPrice,
      variant_color: variantColor && variantColor !== '' ? variantColor : null
    }
    
    const savedItems = JSON.parse(localStorage.getItem('saveForLater') || '{}')
    
    savedItems[variantId] = saveForLaterItemData
    
    localStorage.setItem('saveForLater', JSON.stringify(savedItems))

    const cartItems = this.closest('cart-items')
    if (cartItems) {
      cartItems.updateQuantity(this.getAttribute("data-key"), 0, undefined, undefined, true)
    }

    setTimeout(function() {
      if(document.querySelector('.cart-drawer-btn') != null) {
        document.querySelector('.cart-drawer-btn').disabled = false  
      }
      
      if(document.querySelector('.cart__checkout-button') != null) {
        document.querySelector('.cart__checkout-button').disabled = false  
      }
    }, 1000)
  }
}

customElements.define('save-for-later', SaveForLater)

class RemoveFromSaveForLater extends HTMLElement {
  constructor() {
    super()
    this.addEventListener('click', (event) => this.handleClick(event))
  }

  handleClick(event) {
    event.preventDefault()
    const variantId = this.getAttribute('data-variant-id-to-remove')
    
    if (!variantId) {
      return
    }
    
    // Get existing saved items
    const savedItems = JSON.parse(localStorage.getItem('saveForLater') || '{}')
    
    // Check if item exists
    if (!savedItems[variantId]) {
      console.warn(`Variant ${variantId} not found in saved items`)
      return
    }
    
    delete savedItems[variantId]
    
    localStorage.setItem('saveForLater', JSON.stringify(savedItems))
    
    // Dispatch event to update the saved for later container
    document.dispatchEvent(new CustomEvent('saveForLater:updated', {
      detail: { 
        action: 'removed',
        variantId: variantId,
        savedItems: savedItems
      }
    }))
  }
}

customElements.define('remove-from-save-for-later', RemoveFromSaveForLater)

class SavedForLaterContainer extends HTMLElement {
  constructor() {
    super()
    this.isOpen = false
  }

  connectedCallback() {
    this.render()
    this.attachEventListeners()
    
    // Listen for localStorage updates
    document.addEventListener('saveForLater:updated', () => {
      this.renderItems()
    })
  }

  attachEventListeners() {
    const toggle = this.querySelector('.saved-for-later__toggle')
    if (toggle) {
      toggle.addEventListener('click', () => this.toggleContainer())
    }
  }

  toggleContainer() {
    this.isOpen = !this.isOpen
    const content = this.querySelector('.saved-for-later__content')
    const icon = this.querySelector('.saved-for-later__icon')
    
    if (content) {
      content.style.display = this.isOpen ? 'block' : 'none'
    }
    if (icon) {
      icon.textContent = this.isOpen ? '−' : '+'
    }
  }

  render() {
    const savedItems = JSON.parse(localStorage.getItem('saveForLater') || '{}')
    const itemCount = Object.keys(savedItems).length
    
    if (itemCount === 0) {
      this.style.display = 'none'
      return
    }

    this.style.display = 'block'
    
    // Check if cart is empty to default to open state
    const drawerItems = document.querySelector('.drawer__items')
    const cartItemCount = drawerItems ? parseInt(drawerItems.dataset.totalItems || '0') : 0
    const shouldBeOpen = cartItemCount === 0
    
    this.isOpen = shouldBeOpen
    
    this.innerHTML = `
      <div class="saved-for-later__toggle">
        <span class="saved-for-later__title">Saved for Later (${itemCount})</span>
        <span class="saved-for-later__icon">${shouldBeOpen ? '−' : '+'}</span>
      </div>
      <div class="saved-for-later__content" style="display: ${shouldBeOpen ? 'block' : 'none'};">
        <ul class="saved-for-later__list"></ul>
      </div>
    `
    
    this.renderItems()
  }

  renderItems() {
    const savedItems = JSON.parse(localStorage.getItem('saveForLater') || '{}')
    const itemCount = Object.keys(savedItems).length
    const list = this.querySelector('.saved-for-later__list')
    const title = this.querySelector('.saved-for-later__title')
    
    if (!list) return
    
    if (itemCount === 0) {
      this.style.display = 'none'
      return
    }

    this.style.display = 'block'
    
    if (title) {
      title.textContent = `Saved for Later (${itemCount})`
    }
    
    list.innerHTML = ''
    
    Object.entries(savedItems).forEach(([variantId, itemData]) => {
      const itemElement = document.createElement('save-for-later-item')
      itemElement.setAttribute('data-variant-id', variantId)
      itemElement.setAttribute('data-item-data', JSON.stringify(itemData))
      list.appendChild(itemElement)
    })
  }
}

customElements.define('saved-for-later-container', SavedForLaterContainer)

class SaveForLaterItem extends HTMLElement {
  connectedCallback() {
    const itemData = JSON.parse(this.getAttribute('data-item-data'))
    const variantId = this.getAttribute('data-variant-id')
    
    this.innerHTML = `
      <li class="drawer__content-item cart-item saved-for-later-item">
        <div class="drawer__content-item-image">
          <img src="${itemData.variant_image_string}" alt="${itemData.variant_formatted_title}">
        </div>
        <div class="drawer__content-item-info">
          <div>
            <div class="drawer__content-item-and-price">
              <a href="${itemData.variant_url}" class="cart-item__name break">
                <span class="cart-item__title">${itemData.variant_formatted_title}</span>
              </a>
              <div class="drawer__content-item-price">
                <div class="cart-item__price-wrapper">
                  <span class="price price--end">${itemData.variant_string_price}</span>
                </div>
              </div>
            </div>
            <div class="drawer_product-info">
              ${itemData.variant_color ? `<span class="product-option">${itemData.variant_color}</span>` : ''}
            </div>
          </div>
          <div class="flex align-center drawer__content-item-actions saved-for-later-actions">
            <button class="saved-for-later-move-to-cart" data-variant-id="${itemData.variant_add_to_cart_id}">
              Move to Cart
            </button>

            <button 
                class="saved-for-later-move-to-wishlist" 
                data-variant-id="${variantId}"
                data-product-id="${itemData.product_level_id}"
                data-variant-add-id="${itemData.variant_add_to_cart_id}"
                data-product-url="https://www.hammitt.com${itemData.variant_url}"
            >
              Move to Wishlist
            </button>
            <div class="remove-button-container">
              <remove-from-save-for-later data-variant-id-to-remove="${variantId}">
                <a href="#" class="button button--tertiary" aria-label="Remove ${itemData.variant_formatted_title}">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true" focusable="false" role="presentation" class="icon icon-remove">
                    <path d="M14 3h-3.53a3.07 3.07 0 00-.6-1.65C9.44.82 8.8.5 8 .5s-1.44.32-1.87.85A3.06 3.06 0 005.53 3H2a.5.5 0 000 1h1.25v10c0 .28.22.5.5.5h8.5c.28 0 .5-.22.5-.5V4H14a.5.5 0 000-1zM6.91 1.98c.23-.29.58-.48 1.09-.48s.85.19 1.09.48c.2.24.3.6.36 1.02h-2.9c.05-.42.17-.78.36-1.02zm4.84 11.52h-7.5V4h7.5v9.5z" fill="currentColor"></path>
                    <path d="M6.55 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5zM9.45 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5z" fill="currentColor"></path>
                  </svg>
                </a>
              </remove-from-save-for-later>
              <div class="loading-overlay hidden">
                <svg aria-hidden="true" focusable="false" role="presentation" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                  <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </li>
    `
    
    // Attach event listener for "Move to Cart" button
    const moveToCartBtn = this.querySelector('.saved-for-later-move-to-cart')
    if (moveToCartBtn) {
      moveToCartBtn.addEventListener('click', () => this.moveToCart(itemData, variantId))
    }

    // Attach event listener for "Move to Wishlist" button
    const moveToWishlistBtn = this.querySelector('.saved-for-later-move-to-wishlist')
    if (moveToWishlistBtn) {
      moveToWishlistBtn.addEventListener('click', () => this.moveToWishlist(itemData, variantId))
    }
  }

  showLoading() {
    const actions = this.querySelector('.saved-for-later-actions')
    const removeContainer = this.querySelector('.remove-button-container')
    const moveToCartBtn = this.querySelector('.saved-for-later-move-to-cart')
    const moveToWishlistBtn = this.querySelector('.saved-for-later-move-to-wishlist')
    const removeBtn = this.querySelector('remove-from-save-for-later')
    const loadingOverlay = this.querySelector('.loading-overlay')
    
    if (actions) actions.style.opacity = '0.5'
    if (moveToCartBtn) moveToCartBtn.classList.add('hidden')
    if (moveToWishlistBtn) moveToWishlistBtn.classList.add('hidden')
    if (removeBtn) removeBtn.classList.add('hidden')
    if (loadingOverlay) loadingOverlay.classList.remove('hidden')
  }

  hideLoading() {
    const actions = this.querySelector('.saved-for-later-actions')
    const moveToCartBtn = this.querySelector('.saved-for-later-move-to-cart')
    const moveToWishlistBtn = this.querySelector('.saved-for-later-move-to-wishlist')
    const removeBtn = this.querySelector('remove-from-save-for-later')
    const loadingOverlay = this.querySelector('.loading-overlay')
    
    if (actions) actions.style.opacity = '1'
    if (moveToCartBtn) moveToCartBtn.classList.remove('hidden')
    if (moveToWishlistBtn) moveToWishlistBtn.classList.remove('hidden')
    if (removeBtn) removeBtn.classList.remove('hidden')
    if (loadingOverlay) loadingOverlay.classList.add('hidden')
  }

  moveToCart(itemData, variantId) {
    // Show loading state
    this.showLoading()

    const addToCartObj = {
      items: [{
        id: itemData.variant_add_to_cart_id,
        quantity: 1
      }]
    }
    
    // Add to cart using global function if available
    if (typeof theme !== 'undefined' && theme.addToCart) {
      theme.addToCart(addToCartObj)
      
      // Remove from saved items after a brief delay
      setTimeout(() => {
        this.removeFromSaved(variantId)
      }, 500)
    } else if (typeof addToCart === 'function') {
      addToCart(addToCartObj)
      
      // Remove from saved items after a brief delay
      setTimeout(() => {
        this.removeFromSaved(variantId)
      }, 500)
    } else {
      // Fallback to fetch
      fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addToCartObj)
      })
      .then(response => response.json())
      .then(() => {
        this.removeFromSaved(variantId)
      })
      .catch(error => {
        console.error('Error adding to cart:', error)
        this.hideLoading()
      })
    }
  }

  removeFromSaved(variantId) {
    // Remove from saved items
    const savedItems = JSON.parse(localStorage.getItem('saveForLater') || '{}')
    delete savedItems[variantId]
    localStorage.setItem('saveForLater', JSON.stringify(savedItems))
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('saveForLater:updated', {
      detail: { action: 'movedToCart', variantId }
    }))
  }

  moveToWishlist(itemData, variantId) {
    // Check if Swym is available
    if (typeof window._swat === 'undefined') {
      console.error('Swym is not loaded')
      return
    }

    // Show loading state
    this.showLoading()

    // Create the product object for Swym
    const productData = {
      epi: parseInt(itemData.variant_add_to_cart_id),
      empi: parseInt(itemData.product_level_id),
      du: `https://www.hammitt.com${itemData.variant_url}`,
      dt: itemData.variant_formatted_title,
      iu: itemData.variant_image_string,
      pr: parseFloat(itemData.variant_string_price.replace(/[^0-9.]/g, ''))
    }

    // Add to wishlist using Swym API
    window._swat.addToWishList(
      productData,
      (response) => {
        // Success callback - remove from saved items immediately        
        // Remove from saved items
        const savedItems = JSON.parse(localStorage.getItem('saveForLater') || '{}')
        delete savedItems[variantId]
        localStorage.setItem('saveForLater', JSON.stringify(savedItems))
        
        // Dispatch event to update container
        document.dispatchEvent(new CustomEvent('saveForLater:updated', {
          detail: { action: 'movedToWishlist', variantId }
        }))
      },
      (error) => {
        // Error callback
        console.error('Error adding to wishlist:', error)
        this.hideLoading()
      }
    )
  }
}

customElements.define('save-for-later-item', SaveForLaterItem)

