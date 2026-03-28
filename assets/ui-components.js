/**
 * UI Components Module
 * Web Components for sliders, modals, and interactive elements
 * Extracted from global.js for better code organization
 */

// Slider Component
class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector('.slider-counter--current');
    this.pageTotalElement = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver(() => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener('scroll', this.update.bind(this));
    this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
    this.nextButton.addEventListener('click', this.onButtonClick.bind(this));
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(element => element.clientWidth > 0);
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset = this.sliderItemsToShow[1].offsetLeft - this.sliderItemsToShow[0].offsetLeft;
    this.slidesPerPage = Math.floor(this.slider.clientWidth / this.sliderItemOffset);
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    const previousPage = this.currentPage;
    this.currentPage = Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage !== previousPage) {
      this.dispatchEvent(new CustomEvent('slideChanged', {
        detail: {
          currentPage: this.currentPage,
          currentElement: this.sliderItemsToShow[this.currentPage - 1]
        }
      }));
    }

    if (this.enableSliderLooping) return;

    if (this.isSlideVisible(this.sliderItemsToShow[0])) {
      this.prevButton.setAttribute('disabled', 'disabled');
    } else {
      this.prevButton.removeAttribute('disabled');
    }

    if (this.isSlideVisible(this.sliderItemsToShow[this.sliderItemsToShow.length - 1])) {
      this.nextButton.setAttribute('disabled', 'disabled');
    } else {
      this.nextButton.removeAttribute('disabled');
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide = this.slider.clientWidth + this.slider.scrollLeft - offset;
    return (element.offsetLeft + element.clientWidth) <= lastVisibleSlide && element.offsetLeft >= this.slider.scrollLeft;
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition = event.currentTarget.name === 'next'
      ? this.slider.scrollLeft + (step * this.sliderItemOffset)
      : this.slider.scrollLeft - (step * this.sliderItemOffset);
    this.slider.scrollTo({ left: this.slideScrollPosition });
  }
}

// Modal Dialog Component
class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]')?.addEventListener('click', this.hide.bind(this));
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });

    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) {
          this.hide();
        }
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target.nodeName === 'MODAL-DIALOG') this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
    if (popup) popup.loadContent();
    if (typeof trapFocus === 'function') {
      trapFocus(this, this.querySelector('[role="dialog"]'));
    }
    if (typeof pauseAllMedia === 'function') {
      pauseAllMedia();
    }
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    this.removeAttribute('open');
    if (typeof removeTrapFocus === 'function') {
      removeTrapFocus(this.openedBy);
    }
    if (typeof pauseAllMedia === 'function') {
      pauseAllMedia();
    }
  }
}

// Modal Opener Component
class ModalOpener extends HTMLElement {
  constructor() {
    super();
    const button = this.querySelector('button');
    if (!button) return;
    
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}

// Deferred Media Component (lazy load videos/models)
class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    
    poster.addEventListener('click', this.loadContent.bind(this));
    this.autoplay(poster);
  }
  
  autoplay(poster) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadContent(false);
          if (typeof playPauseVideo === 'function') {
            playPauseVideo();
          }
        }
      });
    });
    observer.observe(poster);
  }

  loadContent(focus = true) {
    if (typeof pauseAllMedia === 'function') {
      pauseAllMedia();
    }
    
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
      if (focus) deferredElement.focus();
    }
  }
}

// Quantity Input Component
class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });

    this.querySelectorAll('button').forEach(button =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    // Store current updated variant_id
    const currUpdatedItemID = this.getAttribute("data-variant-id");
    if (currUpdatedItemID) {
      window.currUpdatedItemID = currUpdatedItemID;
    }

    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    
    if (previousValue !== this.input.value) {
      const cartPageItems = this.closest(".cart-items.cart-page-items");
      if (cartPageItems) {
        cartPageItems.setAttribute("data-qty-updated", "true");
      }

      if (Number(this.input.value) === 0) {
        const removeButton = this.closest(".cart-item")?.querySelector("cart-remove-button");
        if (removeButton) {
          removeButton.click();
        }
      } else {
        this.input.dispatchEvent(this.changeEvent);
      }
    }
  }
}

// Register all components
customElements.define('slider-component', SliderComponent);
customElements.define('modal-dialog', ModalDialog);
customElements.define('modal-opener', ModalOpener);
customElements.define('deferred-media', DeferredMedia);
customElements.define('quantity-input', QuantityInput);
