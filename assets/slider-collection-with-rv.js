// Tab switching for combined slider + recently viewed sections
(function () {
  function initTabs(tabNav) {
    var section = tabNav.closest('.combined-slider-section');
    if (!section) return;

    tabNav.querySelectorAll('.tab-item button').forEach(function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        var target = this.getAttribute('data-href');

        // Update active tab state
        tabNav.querySelectorAll('.tab-item').forEach(function (li) {
          li.classList.remove('active');
        });
        this.closest('.tab-item').classList.add('active');

        // Show/hide panels
        section.querySelectorAll('[data-panel]').forEach(function (panel) {
          if (panel.getAttribute('data-panel') === target) {
            panel.classList.remove('hidden');
          } else {
            panel.classList.add('hidden');
          }
        });

        // Lazy-init RV swiper on first activation
        if (target === 'recently-viewed') {
          var rvEl = section.querySelector('combined-recently-viewed');
          if (rvEl) rvEl.lazyInit();
        }
      });
    });
  }

  document.querySelectorAll('.combined-slider__tabs').forEach(initTabs);
})();

// Recently Viewed custom element for combined slider section
class CombinedRecentlyViewed extends HTMLElement {
  connectedCallback() {
    this._imageRatio = this.dataset.imageRatio || 'adapt';
    this._hidePrice = this.dataset.hidePrice === 'true';
    this._hideSubtitle = this.dataset.hideSubtitle === 'true';
    this._hideQuickAdd = this.dataset.hideQuickAdd === 'true';
    this._populated = false;
    this._swiperInited = false;
    this._populate();
    this.lazyInit(); // init eagerly; observer flags handle hidden-panel resize
  }

  _abbrevSize(size) {
    if (!size) return '';
    switch ((size + '').toLowerCase().trim()) {
      case 'mini': return 'mini';
      case 'small': return 'sml';
      case 'medium': return 'med';
      case 'large': return 'lrg';
      default: return size;
    }
  }

  _formatMoney(cents) {
    if (cents == null) return '';
    return '$' + Math.floor(cents / 100).toLocaleString('en-US');
  }

  _buildCard(product) {
    const productType = product.product_title_type || product.title || '';
    const productColor = product.product_title_color_descriptor || '';
    const sizeAbbrev = this._abbrevSize(product.product_size);
    const formattedTitle = `${productType}${sizeAbbrev ? ` ${sizeAbbrev}` : ''}`;
    const priceFormatted = this._formatMoney(product.price);
    const isAvailable = product.available !== false;
    const variantId = product.variant_id;
    const isSingleVariant = product.has_only_default_variant === true;
    const imgSrc = product.featured_image || '';
    const handle = product.handle || '';
    const escapedTitle = formattedTitle.replace(/"/g, '&quot;');

    const ratioPercent = this._imageRatio === 'portrait' ? 125 : 100;

    // Match card-product data-json shape; single-quotes in JSON must be HTML-escaped
    // since the attribute uses single-quote delimiters
    const variantData = variantId
      ? [{ id: variantId, available: isAvailable, options: [], title: 'Default Title', color: false, productStyle: productType }]
      : [];
    const safeVarJson = JSON.stringify(variantData).replace(/'/g, '&#39;');

    // Only show quick add for single-variant products — matches card-product.liquid:
    // {% unless hide_quick_add or card_product.variants.size > 1 %}
    const quickAddHTML = (!this._hideQuickAdd && variantId && isAvailable && isSingleVariant) ? `
      <div class="quick-add__wrapper">
        <quick-add>
          <form class="quick-add__form">
            <small class="label">Add to Cart</small>
            <button data-id="${variantId}" class="quick-add-btn">Add to Cart</button>
          </form>
        </quick-add>
      </div>` : '';

    // Match price.liquid structure
    const priceHTML = (!this._hidePrice && priceFormatted) ? `
      <div class="price">
        <div class="price__container">
          <div class="price__regular">
            <span class="visually-hidden visually-hidden--inline">Regular price</span>
            <span class="price-item price-item--regular price_change">${priceFormatted}</span>
          </div>
          <div class="price__sale"></div>
        </div>
      </div>` : '';

    const subtitleHTML = (!this._hideSubtitle && productColor)
      ? `<small class="card__seo-text no-seo-tag">${productColor}</small>`
      : '';

    const soldOutHTML = !isAvailable
      ? `<div class="card__badge hidden"><span class="badge badge--bottom-left">Sold out</span></div>`
      : '';

    return `
      <div class="card-wrapper" id="${product.id}">
        <div class="loading-overlay__spinner loading-overlay__spin">
          <svg aria-hidden="true" focusable="false" role="presentation" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
            <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
          </svg>
        </div>
        <div class="card card--standard product-card card--media" data-json='${safeVarJson}' style="--ratio-percent: ${ratioPercent}%;">
          <div class="card__inner ratio" style="--ratio-percent: ${ratioPercent}%;">
            <div class="card__media">
              <div class="media media--transparent media--hover-effect">
                <img data-src="${imgSrc}" src="${imgSrc}" width="533" alt="${escapedTitle}" class="motion-reduce" loading="lazy">
              </div>
            </div>
            <div class="card__content">
              <div class="card__information">
                <h3 class="card__heading">
                  <a href="/products/${handle}" class="full-unstyled-link">${formattedTitle}</a>
                </h3>
              </div>
              ${quickAddHTML}
            </div>
          </div>
          <div class="card__content card__main-content">
            <div class="card__information">
              <h3 class="card__heading carlson-semibold">
                <a href="/products/${handle}" class="full-unstyled-link">${formattedTitle}</a>
                ${priceHTML}
              </h3>
              <div class="card-information">
                ${subtitleHTML}
              </div>
            </div>
            ${soldOutHTML}
          </div>
          <a href="/products/${handle}" class="link--fill-parent"><span class="visually-hidden">${formattedTitle}</span></a>
        </div>
      </div>`;
  }

  _populate() {
    var storageRaw = localStorage.getItem('_rv');
    if (!storageRaw) { this._hideRvTab(); return; }

    var storageJson;
    try { storageJson = JSON.parse(storageRaw); } catch (e) { this._hideRvTab(); return; }
    if (!storageJson || !storageJson.length) { this._hideRvTab(); return; }

    var currentProductId = window.productJSON ? window.productJSON.id : null;
    var wrapper = this.querySelector('.swiper-wrapper');
    var reversed = storageJson.slice().reverse();
    var count = 0;

    reversed.forEach(function (product) {
      if (currentProductId && product.id === currentProductId) return;
      if (product.product_tags && product.product_tags.indexOf('shareholder') !== -1) {
        if (localStorage.getItem('shareholder_login') !== 'true') return;
      }
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';
      slide.innerHTML = this._buildCard(product);
      wrapper.appendChild(slide);
      count++;
    }.bind(this));

    if (count === 0) { this._hideRvTab(); return; }

    this._populated = true;
    if (typeof lazyImages === 'function') lazyImages();
  }

  lazyInit() {
    if (this._swiperInited || !this._populated) return;
    var jsonStr = this.dataset.json;
    if (!jsonStr) return;
    try {
      var config = JSON.parse(jsonStr);
      // observer + observeParents: Swiper auto-recalculates when hidden panel is revealed
      config.observer = true;
      config.observeParents = true;
      new Swiper(this, config);
      this._swiperInited = true;
    } catch (e) {
      console.error('CombinedRecentlyViewed: Swiper init failed', e);
    }
  }

  _hideRvTab() {
    var section = this.closest('.combined-slider-section');
    if (!section) return;
    var rvTabBtn = section.querySelector('.tab-item button[data-href="recently-viewed"]');
    if (rvTabBtn) rvTabBtn.closest('.tab-item').style.display = 'none';
  }
}

customElements.define('combined-recently-viewed', CombinedRecentlyViewed);

// Product Recommendations custom element for combined slider section
class CombinedProductRecommendations extends HTMLElement {
  connectedCallback() {
    this._imageRatio = this.dataset.imageRatio || 'adapt';
    this._hidePrice = this.dataset.hidePrice === 'true';
    this._hideTag = this.dataset.hideTag === 'true';
    this._hideSubtitle = this.dataset.hideSubtitle === 'true';
    this._hideQuickAdd = this.dataset.hideQuickAdd === 'true';
    this._showSecondaryImage = this.dataset.showSecondaryImage === 'true';
    this._populated = false;
    this._swiperInited = false;
    this._swiperInstance = null;
    
    // Fetch recommendations on load
    this._fetchRecommendations();
    
    // Listen for variant swap events
    this._boundHandleVariantSwap = this._handleVariantSwap.bind(this);
    document.addEventListener('pdp:variant-swapped', this._boundHandleVariantSwap);
  }

  _fetchRecommendations() {
    const url = this.dataset.url;
    if (!url) {
      console.warn('CombinedProductRecommendations: No data-url provided');
      return;
    }

    fetch(url)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract product cards from the response
        const productCards = doc.querySelectorAll('.swiper-slide');
        
        if (!productCards || productCards.length === 0) {
          console.warn('CombinedProductRecommendations: No products found');
          return;
        }

        // Insert cards into the swiper wrapper
        const wrapper = this.querySelector('.swiper-wrapper');
        productCards.forEach(card => {
          wrapper.appendChild(card.cloneNode(true));
        });

        this._populated = true;
        
        // Initialize lazy loading for images
        if (typeof lazyImages === 'function') {
          lazyImages();
        }
        
        // Initialize the swiper
        this._initSwiper();
      })
      .catch(error => {
        console.error('CombinedProductRecommendations: Fetch failed', error);
      });
  }

  _initSwiper() {
    if (this._swiperInited || !this._populated) return;
    
    const jsonStr = this.dataset.json;
    if (!jsonStr) return;
    
    try {
      const config = JSON.parse(jsonStr);
      // observer + observeParents: Swiper auto-recalculates when needed
      config.observer = true;
      config.observeParents = true;
      this._swiperInstance = new Swiper(this, config);
      this._swiperInited = true;
    } catch (e) {
      console.error('CombinedProductRecommendations: Swiper init failed', e);
    }
  }
  
  _handleVariantSwap(event) {
    // Extract new product ID from the event detail
    const newProductId = event.detail?.productId;
    if (!newProductId) {
      return;
    }
    
    // Update the data-url with new product ID
    const baseUrl = this.dataset.url.split('?')[0];
    const urlParams = new URLSearchParams(this.dataset.url.split('?')[1]);
    urlParams.set('product_id', newProductId);
    this.dataset.url = `${baseUrl}?${urlParams.toString()}`;
    
    // Destroy existing swiper if it exists
    if (this._swiperInstance && typeof this._swiperInstance.destroy === 'function') {
      this._swiperInstance.destroy(true, true);
      this._swiperInstance = null;
    }
    
    // Clear the wrapper
    const wrapper = this.querySelector('.swiper-wrapper');
    if (wrapper) {
      wrapper.innerHTML = '';
    }
    
    // Reset flags
    this._populated = false;
    this._swiperInited = false;
    
    // Fetch new recommendations
    this._fetchRecommendations();
  }
  
  disconnectedCallback() {
    // Clean up event listener when element is removed
    document.removeEventListener('pdp:variant-swapped', this._boundHandleVariantSwap);
  }
}

customElements.define('combined-product-recommendations', CombinedProductRecommendations);
