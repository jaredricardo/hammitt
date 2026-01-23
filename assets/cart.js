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
