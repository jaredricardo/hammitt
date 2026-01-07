if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      this.currentVariant = window.initialVariant;
      if(this.currentVariant.available) {
        this.submitButton = this.querySelector('[type="submit"]');
        if(this.submitButton) {
          this.submitButton.disabled = false
        }
      }
      this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cartDrawer = document.querySelector('cart-drawer');
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      let submitButton = this.querySelector('[type="submit"]');

      if (submitButton.classList.contains('loading')) return;

      this.handleErrorMessage();

      submitButton.setAttribute('aria-disabled', true);
      submitButton.classList.add('loading');
      const spinner = submitButton.querySelector('.loading-overlay__spinner');
      if(spinner) {
        spinner.classList.remove('hidden');
      }

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      const formData = new FormData(this.form);
      formData.append('sections', this.cartDrawer.getSectionsToRender().map((section) => section.id));
      formData.append('sections_url', window.location.pathname);
      config.body = formData;

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            this.handleErrorMessage(response.description);
            return;
          }
          // var cartContents = fetch(window.Shopify.routes.root + 'cart.js')
          // .then(response => response.json())
          // .then(data => 
          //   {
          //     document.dispatchEvent(
          //       new CustomEvent('cart:updated', {
          //         detail: {
          //           cart: data,
          //         },
          //       })
          //     );
          //   }
          // );
          // this.cartDrawer.renderContents(response);
          cartUpdate(response);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          submitButton.classList.remove('loading');
          submitButton.removeAttribute('aria-disabled');
         
          if(spinner) {
            spinner.classList.add('hidden');  
          }
        });
    }

    handleErrorMessage(errorMessage = false) {
      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}

class ProductThumbnail extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', this.onClick.bind(this));
  }
  onClick() {
    const myEl = event.target.closest('product-thumbnail').getAttribute('data-main-media');
    if(!myEl) return;
    const mySection = document.querySelector(`#${myEl}`);
    const headerOffset = 100;
    const mySectionPosition = mySection.getBoundingClientRect().top;
    const offsetPosition = mySectionPosition + window.pageYOffset - headerOffset;
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
}

customElements.define('product-thumbnail', ProductThumbnail);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    console.log('VariantSelects');
    this.addEventListener('change', this.onVariantChange);
    this.productId = window.productJSON.id
    this.currentVariant = window.initialVariant;
    this.backInStock();
	this.updateColors();
  }

  onVariantChange() {
    
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, '', false);
    this.updatePickupAvailability();
    this.removeErrorMessage();
   
    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateShareUrl();
      this.updateAvailability();
      this.backInStock();
    }
  }
  
  updateAvailability() {
    const optionName = event.target.name;
    if(event.target.name === 'Size') {
      this.updateColors();
    } else if(event.target.name === 'Color') {
      this.updateSizes();
    }
  }
  
  backInStock() {
    const iStockWrapper = document.querySelector('.bis-container');
    const submitButton = document.querySelector('.product-form__submit');
    if(!iStockWrapper) return;
    if(this.currentVariant.available) {
      submitButton.disabled = false;
      iStockWrapper.style.display = 'none';
    } else {
      submitButton.disabled = true;
      iStockWrapper.style.display = 'block';
    }
  }

  updateColors() {
    const currentSize = this.currentVariant.options[0];
    const allColors = this.querySelectorAll('input[name="Color"]');
    if(currentSize === 'false') return;
    allColors.forEach(colorInput => {
      colorInput.parentNode.classList.add('soldout');
      colorInput.parentNode.style.display = 'none';
//       colorInput.disabled = true;
    });
    window.productJSON.variants.forEach(variant => {
      var input = this.querySelector(`input[name="Color"][value="${variant.options[1]}"]`);
      if(variant.options[0] === currentSize) {
        if(input) {
          if(variant.available) {
            input.parentNode.classList.remove('soldout');
          }
          input.parentNode.style.display = 'inline-block';
        }
      }
    });
  }
  
  updateSizes() {
    const currentColor = this.currentVariant.options[1];
    const allSizes = this.querySelectorAll('input[name="Size"]');
    allSizes.forEach(sizeInput => {
//       sizeInput.disabled = true;
      sizeInput.parentNode.classList.add('soldout');
    });
    window.productJSON.variants.forEach(variant => {
      if(variant.options[1] === currentColor && variant.available) {
        var input = this.querySelector(`input[name="Size"][value="${variant.options[0]}"]`);
        if(input) {
//           input.disabled = false;
          input.parentNode.classList.remove('soldout');
        }
      }
    });
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const mediaGallery = document.getElementById(`MediaGallery-${this.dataset.section}`);
    mediaGallery.setActiveMedia(`${this.dataset.section}-${this.currentVariant.featured_media.id}`, true);

    const modalContent = document.querySelector(`#ProductModal-${this.dataset.section} .product-media-modal__content`);
    const newMediaModal = modalContent.querySelector( `[data-media-id="${this.currentVariant.featured_media.id}"]`);
    modalContent.prepend(newMediaModal);
  }

  updateURL() {
      var VariantPrice = Shopify.formatMoney(this.currentVariant.price, window.money_format);
      const priceElement = document.querySelector('.variant_price .price-item');
      if (priceElement) {
          priceElement.textContent = VariantPrice;
      } 

    
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.currentVariant.productUrl}?variant=${this.currentVariant.id}`);
  }

  updateShareUrl() {
    const shareButton = document.getElementById(`Share-${this.dataset.section}`);
    if (!shareButton) return;
    shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector('pickup-availability');
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;

    const productForm = section.querySelector('product-form');
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    fetch(`${this.currentVariant.productUrl}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
      
        var elementsToUpdate = [
          '.product__price-wrapper',
          '.limited-supply__wrapper',
          '.variant-radios__wrapper[data-option="Color"] .current-value',
          '.variant-radios__wrapper[data-option="Size"] .current-value'
        ];
      
        var extraElements = [
          '.product__media-wrapper',
          '.product__description',
          '.product__title',
          '.product__accordion',
          '.product-media-modal',
          '.bis-container',
        ];
      
		const allElements = this.productId !== this.currentVariant.productId ? elementsToUpdate.concat(extraElements) : elementsToUpdate;
        const html = new DOMParser().parseFromString(responseText, 'text/html')
        
        allElements.forEach(el => {
          const destination = document.querySelector(el);
          const source = html.querySelector(el);
          if (source && destination) destination.innerHTML = source.innerHTML;
        });

        const productAccordions = document.querySelectorAll('.product__accordion');
        productAccordions.forEach(accordion => {
          let accordionHandle = accordion.getAttribute('data-accordion');
          let accordionDestination = document.querySelector(`.product__accordion[data-accordion="${accordionHandle}"]`);
          let accordionSource = html.querySelector(`.product__accordion[data-accordion="${accordionHandle}"]`);
          if (accordionSource && accordionDestination) accordionDestination.innerHTML = accordionSource.innerHTML;
        });
      
        playPauseVideo();
        lazyImages();
        this.initSwiper();
      
        this.productId = this.currentVariant.productId;
        this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);
      
      });
  }

  initSwiper() {
    const swiper = document.getElementById('product__mobile-images');
    const json = JSON.parse(swiper.getAttribute('data-json'));
    const productSwiper = new Swiper(swiper, json);
  }
  

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add('visibility-hidden');
  }

  getVariantData() {
    this.variantData = this.variantData || window.productJSON.variants;
    return this.variantData;
  }
}


class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const checked = Array.from(this.querySelectorAll('.variant-radio input[type="radio"]:checked'), e => e.value);
    this.options = checked;
  }
}

const getSwatches = () => {
 console.log('getSwatches');
};



const buildSizes = (sizes) => {
  if(sizes.length === 0) return;
  const sizesEl = document.querySelector('.sizes-search');
  sizes.forEach(size => {
    const newSize = document.createElement('a');
    newSize.setAttribute('href','#');
    newSize.innerHTML = size;
    sizesEl.appendChild(newSize);
  });
  document.querySelector('.sizes-search--wrapper').style.display = 'block';
};

const arrayMove = (arr, old_index, new_index) => {
  if (new_index >= arr.length) {
    var k = new_index - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr; // for testing
};

const buildOptions = (b) => {
  
  const sizeOrder = ['Sml','Med','Lrg'];
  
  const formId = document.querySelector('.product-form form').getAttribute('id');
  const sizeRadiosEl = document.querySelector('.variant-radios__wrapper[data-option="Size"] .variant-radios');
  window.sizesFound.forEach(size => {
    if(!size) return true;
    const sizeHandle = size.replace(' ','-').replace('/','-');
    const sizeExists = document.querySelector(`.variant-radios__wrapper[data-option="Size"] input[value="${size}"]`);
    if(sizeExists) {
      sizeExists.parentNode.setAttribute('data-index',sizeOrder.indexOf(size));
      return true;
    }
    const newSizeElement = document.createElement('div');
    newSizeElement.classList.add('variant-radio');
    newSizeElement.setAttribute('data-index',sizeOrder.indexOf(size));
    newSizeElement.innerHTML = `<input type="radio" id="new-size-${sizeHandle}" name="Size" value="${size}" form="${formId}"><label for="new-size-${sizeHandle}">${size}</label>`;
    if(sizeRadiosEl) {
      sizeRadiosEl.appendChild(newSizeElement);
    }
  });
  
  if(sizeRadiosEl) {
    const sizeRadios = Array.from(sizeRadiosEl.querySelectorAll('.variant-radio'));

    sizeRadios.sort(function(a,b) {
      return a.getAttribute('data-index') - b.getAttribute('data-index');
    });
    sizeRadios.forEach(el => {
      sizeRadiosEl.appendChild(el);
    });
  }
  
  const coreColorsEl = document.querySelector('#core-colors .variant-radios');
  const limitedColorsEl = document.querySelector('#limited-colors .variant-radios');

  if(!coreColorsEl || !limitedColorsEl) return;
  
  window.colorsFound.forEach(color => {
    const isCoreColor = window.coreColors.indexOf(color) > -1;
    const isLimitedColor = window.limitedColors.indexOf(color) > -1;
    const selected = window.productJSON.variants[0].name.indexOf(color) > -1 ? 'checked' : '';
    const colorHandle = color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').replace(/^-/, '');

    const radioExists = document.querySelector(`.variant-radios__wrapper[data-option="Color"] input[value="${color}"]`);
    if(radioExists) return true;
    const newColorElement = document.createElement('div');
    newColorElement.classList.add('variant-radio');
    newColorElement.setAttribute('data-tooltip',color);
    const swatchUrl = window.fileUrl.split('x.png')[0] + colorHandle + '.png';
    newColorElement.innerHTML = `<input type="radio" id="new-color-${colorHandle}" ${selected} name="Color" value="${color}" form="${ formId }"><label for="new-color-${colorHandle}" style="background-image: url(${swatchUrl});" >${color}</label>`;
    if(isCoreColor) {
      coreColorsEl.appendChild(newColorElement);
    } else  {
      limitedColorsEl.appendChild(newColorElement)
    }
  });
  
  if(coreColorsEl.innerHTML.trim().length === 0) {
    coreColorsEl.parentNode.style.display = 'none';
  }
  
  if(limitedColorsEl.innerHTML.trim().length === 0) {
    limitedColorsEl.parentNode.style.display = 'none';
  }
  console.log('buildOptions done');
  window.productJSON = window.fauxJSON;
  customElements.define('variant-selects', VariantSelects);
  customElements.define('variant-radios', VariantRadios);
  
};

const completeTheSetPDP = (c) => {
  console.log('completeTheSetPDP');
  const productUpsells = document.querySelector('.product__upsells .product__upsells-scroller');
  if(!productUpsells) return
  fetch(`/collections/you-may-also-like?view=upsells`)
  .then(response => response.text())
  .then(html => {
    console.log('fetched');
    var parser = new DOMParser();
	var doc = parser.parseFromString(html, 'text/html');
    const upsells = doc.querySelectorAll('.upsell');
    upsells.forEach(upsell => {
      console.log(upsell);
      const myTitle = upsell.getAttribute('data-title');
      if(window.ogJSON.tags.indexOf('NO_LAUNDRY') != -1 && myTitle.indexOf("Leather Laundry") != -1) {
        return true;
      }
      productUpsells.appendChild(upsell);
    });
    
  })
  .catch(error => console.log(error));
};

const foursixtyHasPosts = (f) => {
  return document.querySelector('#foursixty .fs-has-posts');
};

const foursixtyObserver = new MutationObserver(function(mutations_list) {
  mutations_list.forEach(function(mutation) {
    mutation.addedNodes.forEach(function(added_node) {
      if(added_node.className === 'fs-has-posts') {
        foursixtyObserver.disconnect();
        document.getElementById('foursixty').style.display = 'block';
      }
    });
  });
});
const feedDiv = document.querySelector('.foursixty-feed');
if (feedDiv) {
  
foursixtyObserver.observe(document.querySelector('.foursixty-feed'), { subtree: true, childList: true });
}

(function() {
  const splitValue = ' | ';
  if(window.productJSON.title.indexOf(splitValue) === -1) {
    customElements.define('variant-selects', VariantSelects);
    customElements.define('variant-radios', VariantRadios);
    completeTheSetPDP();
    return;
  };
  
  const titleSplit = window.productJSON.title.split(splitValue);
  const productStyle = titleSplit[0];
  const productColor = titleSplit[1];
  const productSize = titleSplit.length >= 3  ? titleSplit[2] : false;
  
  window.colorsFound = [];
  window.sizesFound = [];
  
  if(productSize) {
    window.sizesFound.push(productSize);
  }
  
  window.fauxJSON = {  
    id: window.productJSON.id,
    title: window.productJSON.title,
    options: ['Size','Color'],
    variants: [
      {
        id: window.initialVariant.id,
        productId: window.productJSON.id,
        quantity: window.initialVariant.quantity,
        productUrl: window.initialVariant.productUrl,
        available: window.initialVariant.available,
        name: window.initialVariant.name,
        options: [`${productSize}`,`${productColor}`]
      }
    ]
  };
  
  window.initialVariant = window.fauxJSON.variants[0];
  let searchParams = productStyle.split(' ').join('+');
  if(productSize) {
    // searchParams += `+${productSize}`;
  }
  completeTheSetPDP();

  
  
  return;
  fetch(`/search?q=title:${searchParams}&type=product&view=api`)
  .then(response => response.json())
  .then(data => {
    data.forEach((item,i) => {
      if(item.title.indexOf(splitValue) === -1) return true;
      const itemTitleSplit = item.title.split(splitValue);
      const itemStyle = itemTitleSplit[0];
      const itemColor = itemTitleSplit[1];
      const itemSize = itemTitleSplit[2];
      const obj = {
        title: itemTitleSplit,
        productStyle: productStyle,
        itemStyle: itemStyle,
        color: itemColor,
        size: itemSize
      };
      
      if(itemStyle !== productStyle) return true;
      // console.log(obj);

      
      // if(window.productJSON.title === item.title) return true;
      
      if(sizesFound.indexOf(itemSize) === -1) {
        window.sizesFound.push(itemSize);
      }
      
      if(colorsFound.indexOf(itemColor) === -1) {
        window.colorsFound.push(itemColor);
      }     

      
  
      const newVariant = {
        id: item.variants[0].id,
        quantity: item.variants[0].quantity,
        productId: item.id,
        productUrl: `/products/${item.handle}`,
        available: item.variants[0].available,
        name: item.variants[0].name,
        options: [`${itemSize}`,`${itemColor}`]
      };
      if(!productSize) {
        newVariant.options.shift();
      }
      window.fauxJSON.variants.push(newVariant);
    });
    buildOptions(true);
  })
  .catch(error => console.log(error));
  

  var stickyClasses = document.getElementsByClassName('product__info-container--sticky');
  for (let i = 0; i < stickyClasses.length; i++) {
    var rrElem = stickyClasses[i].querySelector('#rr_dam_widget');
    if(rrElem){
        stickyClasses[i].style.position = 'initial';
    }
  }
})();