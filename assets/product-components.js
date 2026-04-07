/**
 * Product Components Module
 * Web Components for product-related interactive elements
 * QuickAdd, UpsellItem, CardSwatches, etc.
 * Extracted from global.js for better code organization
 */

// Quick Add Component
class QuickAdd extends HTMLElement {
  constructor() {
    super();
    this.modal = this.querySelector('modal-dialog');
    this.form = this.querySelector('form');
  }

  connectedCallback() {
    this.addEventListener('click', this.onButtonClick.bind(this));
  }

  onButtonClick(evt) {
    evt.preventDefault();
    const button = evt.target.closest('button');
    if (!button) return;

    button.setAttribute('aria-disabled', true);
    button.classList.add('loading');
    button.querySelector('.loading-overlay__spinner')?.classList.remove('hidden');

    if (this.modal) {
      this.modal.show(button);
    }

    if (this.form) {
      this.form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  }
}

// Upsell Item Component
class UpsellItem extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector('form');
    this.addButton = this.querySelector('[name="add"]');
    
    if (this.form && this.addButton) {
      this.addButton.addEventListener('click', this.onAddButtonClick.bind(this));
    }
  }

  onAddButtonClick(evt) {
    evt.preventDefault();
    
    const formData = new FormData(this.form);
    const body = JSON.stringify({
      items: [{
        id: formData.get('id'),
        quantity: parseInt(formData.get('quantity') || 1)
      }]
    });

    this.addButton.setAttribute('disabled', true);
    this.addButton.classList.add('loading');

    fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: body
    })
    .then(response => response.json())
    .then(data => {
      // Trigger cart update
      document.dispatchEvent(new CustomEvent('cart:updated'));
      
      // Show confirmation
      this.addButton.textContent = '✓ Added';
      setTimeout(() => {
        this.addButton.removeAttribute('disabled');
        this.addButton.classList.remove('loading');
        this.addButton.textContent = 'Add to Cart';
      }, 2000);
    })
    .catch(error => {
      console.error('Error adding upsell item:', error);
      this.addButton.removeAttribute('disabled');
      this.addButton.classList.remove('loading');
    });
  }
}

// Card Swatches Component (for collection cards with color variants)
class CardSwatches extends HTMLElement {
  constructor() {
    super();
    this.swatches = this.querySelectorAll('input[type="radio"]');
    this.productCard = this.closest('.card');
    this.productImage = this.productCard?.querySelector('.card__media img');
    
    if (this.swatches.length && this.productImage) {
      this.swatches.forEach(swatch => {
        swatch.addEventListener('change', this.onSwatchChange.bind(this));
      });
    }
  }

  onSwatchChange(evt) {
    const selectedSwatch = evt.target;
    const variantImage = selectedSwatch.dataset.variantImage;
    const variantUrl = selectedSwatch.dataset.variantUrl;
    
    if (variantImage && this.productImage) {
      // Update the product image
      this.productImage.src = variantImage;
      this.productImage.srcset = variantImage;
    }
    
    if (variantUrl) {
      // Update the product link
      const productLink = this.productCard?.querySelector('.card__link');
      if (productLink) {
        productLink.href = variantUrl;
      }
    }
  }
}

// Slideshow Component (extends SliderComponent)
class SlideshowComponent extends HTMLElement {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector('.slider-buttons');
    this.enableSliderLooping = true;

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.querySelector('.slideshow__slide');
    if (this.sliderFirstItemNode.classList.contains('slideshow__slide--video')) {
      this.sliderFirstItemNode.classList.add('is-selected');
    }

    // Auto-rotate logic
    this.autoplaySpeed = this.dataset.speed * 1000 || 5000;
    this.initAutoplay();
  }

  initAutoplay() {
    if (!this.dataset.autoplay || this.dataset.autoplay !== 'true') return;

    this.autoplayButtonIsSetToPlay = true;
    this.play();
    this.addEventListener('mouseover', this.focusInHandling.bind(this));
    this.addEventListener('mouseleave', this.focusOutHandling.bind(this));
  }

  play() {
    this.slider = this.slider || this.querySelector('slider-component');
    if (!this.slider) return;

    this.autoplayInterval = setInterval(() => {
      const nextButton = this.querySelector('button[name="next"]');
      if (nextButton) nextButton.click();
    }, this.autoplaySpeed);
  }

  pause() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
  }

  focusInHandling() {
    this.pause();
  }

  focusOutHandling() {
    if (this.autoplayButtonIsSetToPlay) {
      this.play();
    }
  }
}

// Register product components
customElements.define('quick-add', QuickAdd);
customElements.define('upsell-item', UpsellItem);
customElements.define('card-swatches', CardSwatches);
customElements.define('slideshow-component', SlideshowComponent);
