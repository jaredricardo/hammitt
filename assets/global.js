i /* eslint-disable */

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

const lockBackground = (menuOpen) => {
  if (menuOpen) {
      const offsetY = window.pageYOffset;
      document.body.style.top = `${-offsetY}px`;
      document.body.classList.add('js-lock-position');
  } else {
      const offsetY = Math.abs(parseInt(document.body.style.top || 0, 10));
      document.body.classList.remove('js-lock-position');
      document.body.style.removeProperty('top');
      window.scrollTo(0, offsetY || 0);
  }
};

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute('role', 'button');
  summary.setAttribute('aria-expanded', 'false');

  if(summary.nextElementSibling.getAttribute('id')) {
    summary.setAttribute('aria-controls', summary.nextElementSibling.id);
  }

  summary.addEventListener('click', (event) => {
    // event.preventDefault();
    event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
  });
  

  /* When you leave the dropdown, close it */
  // if(summary.classList.contains('header__menu-item')) {
  //   let myElement = document.getElementById(summary.getAttribute('aria-controls'));
  //   myElement.addEventListener('mouseleave',event => {
  //     summary.setAttribute('aria-expanded',false);
  //     summary.parentNode.removeAttribute('open');
  //   });
  // }
  /* When it hovers, it clicks */
  if(summary.classList.contains('header__menu-item')) {
    summary.parentNode.addEventListener('mouseenter', event => {
      summary.setAttribute('aria-expanded',true);
      summary.parentNode.setAttribute('open',true);
    });
    summary.parentNode.addEventListener('mouseleave', event => {
      summary.setAttribute('aria-expanded',false);
      summary.parentNode.removeAttribute('open');
    });
  } 

  
  if (summary.closest('header-drawer')) return;
  summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function() {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch(e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB', 'ENTER', 'SPACE', 'ESCAPE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN']
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if(navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener('focus', () => {
    if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

    if (mouseClick) return;

    currentFocusedElement = document.activeElement;
    currentFocusedElement.classList.add('focused');

  }, true);
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true })

    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    // Get current updated variant_id 
    let currUpdatedItemID = this.getAttribute("data-variant-id");
    window.currUpdatedItemID = currUpdatedItemID;

    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) {
      const cartPageItems = this.closest(".cart-items.cart-page-items");
      if(cartPageItems){
        cartPageItems.setAttribute("data-qty-updated", "true");
      }

      if(Number(this.input.value) === 0){
        if(this.closest(".cart-item").querySelector("cart-remove-button")){
          this.closest(".cart-item").querySelector("cart-remove-button").click();
        }
      }else{
        this.input.dispatchEvent(this.changeEvent);
      }
    };
  }
}

customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}

/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}

Shopify.money_format="${{amount}}",Shopify.formatMoney=function(a,o){"string"==typeof a&&(a=a.replace(".",""));var e="",t=/\{\{\s*(\w+)\s*\}\}/,o=o||this.money_format;function r(a,o){return void 0===a?o:a}function n(a,o,e,t){if(o=r(o,2),e=r(e,","),t=r(t,"."),isNaN(a)||null==a)return 0;a=(a=(a/100).toFixed(o)).split(".");return a[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g,"$1"+e)+(a[1]?t+a[1]:"")}switch(o.match(t)[1]){case"amount":e=n(a,2);break;case"amount_no_decimals":e=n(a,0);break;case"amount_with_comma_separator":e=n(a,2,".",",");break;case"amount_no_decimals_with_comma_separator":e=n(a,0,".",",")}return o.replace(t,e)};

Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  }
};

Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};

Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');

    if (navigator.platform === 'iPhone') document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
    this.querySelectorAll('button[class*="close"]').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
  }

  onKeyUp(event) {
    if(event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if(!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    this.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute('open');
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
      summaryElement.nextElementSibling.removeEventListener('transitionend', addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if(isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);
    } else {
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        summaryElement.setAttribute('aria-expanded', true);
        !reducedMotion || reducedMotion.matches ? addTrapFocus() : summaryElement.nextElementSibling.addEventListener('transitionend', addTrapFocus);
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
    document.body.classList.add(`menu-drawer__${this.tagName}--open`);
    document.body.style.paddingRight = `${this.scrollbarWidth}px`;
    
    const root = document.getElementsByTagName( 'html' )[0];
    root.classList.add(`menu-drawer__${this.tagName}--open`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    // console.log('closeMenuDrawer', event);
    if (event === undefined) {
      return;
    }

    this.mainDetailsToggle.classList.remove('menu-opening');
    this.mainDetailsToggle.querySelectorAll('details').forEach(details =>  {
      details.removeAttribute('open');
      details.classList.remove('menu-opening');
    });
    document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
    document.body.classList.remove(`menu-drawer__${this.tagName}--open`);
    document.body.style.paddingRight = '';
    
    const root = document.getElementsByTagName( 'html' )[0];
    root.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
    root.classList.remove(`menu-drawer__${this.tagName}--open`);
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    detailsElement.classList.remove('menu-opening');    
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
    removeTrapFocus(detailsElement.querySelector('summary'));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    }

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.getElementById('shopify-section-header') || document.getElementById('shopify-section-ab-header');
    this.borderOffset = this.borderOffset || this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;
    document.documentElement.style.setProperty('--header-bottom-position', `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`);
    this.header.classList.add('menu-open');

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });

    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    super.closeMenuDrawer(event, elementToFocus);
    this.header.classList.remove('menu-open');
  }
}

customElements.define('header-drawer', HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      'click',
      this.hide.bind(this)
    );
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
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
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define('modal-dialog', ModalDialog);

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
customElements.define('modal-opener', ModalOpener);

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
        const intersecting = entry.isIntersecting
        if(entry.isIntersecting) {
          this.loadContent(false);
          playPauseVideo();
//           this.querySelector('video').play();
        }
      })
    });

    observer.observe(poster)
  }
    

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
      if (focus) deferredElement.focus();
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

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
    const resizeObserver = new ResizeObserver(entries => this.initPages());
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

    if (this.currentPage != previousPage) {
      this.dispatchEvent(new CustomEvent('slideChanged', { detail: {
        currentPage: this.currentPage,
        currentElement: this.sliderItemsToShow[this.currentPage - 1]
      }}));
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
    this.slideScrollPosition = event.currentTarget.name === 'next' ? this.slider.scrollLeft + (step * this.sliderItemOffset) : this.slider.scrollLeft - (step * this.sliderItemOffset);
    this.slider.scrollTo({
      left: this.slideScrollPosition
    });
  }
}

customElements.define('slider-component', SliderComponent);

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector('.slider-buttons');
    this.enableSliderLooping = true;

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.slider.querySelector('.slideshow__slide');
    if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

    this.sliderControlLinksArray = Array.from(this.sliderControlWrapper.querySelectorAll('.slider-counter__link'));
    this.sliderControlLinksArray.forEach(link => link.addEventListener('click', this.linkToSlide.bind(this)));
    this.slider.addEventListener('scroll', this.setSlideVisibility.bind(this));
    this.setSlideVisibility();

    if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();
  }

  setAutoPlay() {
    this.sliderAutoplayButton = this.querySelector('.slideshow__autoplay');
    this.autoplaySpeed = this.slider.dataset.speed * 1000;

    this.sliderAutoplayButton.addEventListener('click', this.autoPlayToggle.bind(this));
    this.addEventListener('mouseover', this.focusInHandling.bind(this));
    this.addEventListener('mouseleave', this.focusOutHandling.bind(this));
    this.addEventListener('focusin', this.focusInHandling.bind(this));
    this.addEventListener('focusout', this.focusOutHandling.bind(this));

    this.play();
    this.autoplayButtonIsSetToPlay = true;
  }

  onButtonClick(event) {
    super.onButtonClick(event);
    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

    if (!isFirstSlide && !isLastSlide) return;

    if (isFirstSlide && event.currentTarget.name === 'previous') {
      this.slideScrollPosition = this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
    } else if (isLastSlide && event.currentTarget.name === 'next') {
      this.slideScrollPosition = 0;
    }
    this.slider.scrollTo({
      left: this.slideScrollPosition
    });
  }

  update() {
    super.update();
    this.sliderControlButtons = this.querySelectorAll('.slider-counter__link');
    this.prevButton.removeAttribute('disabled');

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach(link => {
      link.classList.remove('slider-counter__link--active');
      link.removeAttribute('aria-current');
    });
    this.sliderControlButtons[this.currentPage - 1].classList.add('slider-counter__link--active');
    this.sliderControlButtons[this.currentPage - 1].setAttribute('aria-current', true);
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    const focusedOnAutoplayButton = event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
    if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
    this.play();
  }

  focusInHandling(event) {
    const focusedOnAutoplayButton = event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
    if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
      this.play();
    } else if (this.autoplayButtonIsSetToPlay) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute('aria-live', 'off');
    clearInterval(this.autoplay);
    this.autoplay = setInterval(this.autoRotateSlides.bind(this), this.autoplaySpeed);
  }

  pause() {
    this.slider.setAttribute('aria-live', 'polite');
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.classList.add('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.playSlideshow);
    } else {
      this.sliderAutoplayButton.classList.remove('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.pauseSlideshow);
    }
  }

  autoRotateSlides() {
    const slideScrollPosition = this.currentPage === this.sliderItems.length ? 0 : this.slider.scrollLeft + this.slider.querySelector('.slideshow__slide').clientWidth;
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }

  setSlideVisibility() {
    this.sliderItemsToShow.forEach((item, index) => {
      const button = item.querySelector('a');
      if (index === this.currentPage - 1) {
        if (button) button.removeAttribute('tabindex');
        item.setAttribute('aria-hidden', 'false');
        item.removeAttribute('tabindex');
      } else {
        if (button) button.setAttribute('tabindex', '-1');
        item.setAttribute('aria-hidden', 'true');
        item.setAttribute('tabindex', '-1');
      }
    });
  }

  linkToSlide(event) {
    event.preventDefault();
    const slideScrollPosition = this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * (this.sliderControlLinksArray.indexOf(event.currentTarget) + 1 - this.currentPage);
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }
}

customElements.define('slideshow-component', SlideshowComponent);

class QuickAdd extends HTMLElement {
  constructor() {
    super();
    this.json = JSON.parse(this.closest('.card').getAttribute('data-json'));
    this.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', this.addItem.bind(this));
    });
    this.button = this.querySelector('.quick-add-btn');
    if(this.button) {
      this.button.addEventListener('click', this.addItem.bind(this));  
    }
    

  }  
  async addItem(event) {
    event.preventDefault();

    const target = event.target;
    const itemId = target.getAttribute('data-id');

    const quickAddElement = target.closest("quick-add");
    const isPreOrderInput = quickAddElement ? quickAddElement.querySelector(".preorder__field") : null;
    const isBadgeInput = quickAddElement ? quickAddElement.querySelector(".badgeProperties__field") : null;
    if (target.classList.contains("iday-promotion__product") && EE_GWP.available) {
      const addOnId = EE_GWP.item;
      try {
        const isInCart = await isProductInCart(addOnId);
        addToCartPromo(itemId, isInCart ? false : addOnId);
        console.log(`GWP is ${isInCart ? 'already' : 'not'} in the cart.`);
      } catch (error) {
        console.error('Error checking if product is in the cart:', error);
      }
    } else {
      const quickAddObj = {
        items: [{
            id: itemId,
            quantity: 1,
            ...(isPreOrderInput && {
                properties: {
                    [isPreOrderInput.name]: isPreOrderInput.value
                }
            }),
            ...(isBadgeInput && {
              properties: {
                  [isBadgeInput.name]: isBadgeInput.value
              }
            })
        }]
      };
      addToCart(quickAddObj);
    }
  }
}
customElements.define('quick-add', QuickAdd);

class UpsellItem extends HTMLElement {
  constructor() {
    super();
    this.querySelector('.quick-add-btn').addEventListener('click', this.addItem.bind(this));

  }  
  addItem(event) {
    event.preventDefault();
    const quickAddObj = {
      items: [
        {
          id: event.target.getAttribute('data-id'),
          quantity: 1
        }
      ]
    }
    addToCart(quickAddObj);
  }
}
customElements.define('upsell-item', UpsellItem);


class CardSwatches extends HTMLElement {
  constructor() {
    super();
    this.json = JSON.parse(this.closest('.card').getAttribute('data-json')) || false;
//     console.log(this.json);
    this.data = false;
  }
  findColors() {
//     if(!this.json) return;
    fetch(`/search?q=${this.json[0].productStyle}&type=product&view=api`)
    .then(response => response.json())
    .then(data => {
      if(data.length <= 1) return;
      this.data = data;
      this.buildSwatches();
    })
    .catch(error => console.log(error))
    .finally(end => {
    });
  }
  buildSwatches() {
    this.data.forEach(item => {
      if(item.title.indexOf('Extended') > -1) return;
      const colorIndex = item.options.indexOf('Color');
      const colorValue = item.variants[0].options[colorIndex];
      const swatch = document.createElement('button');
      swatch.classList.add('card-swatch__button');
      swatch.setAttribute('data-color',colorValue);
      if(colorValue == this.json[0].color) {
        swatch.classList.add('active');
      }
      swatch.setAttribute('data-product',`/products/${item.handle}?view=card`);
      this.appendChild(swatch);
      swatch.addEventListener('click', this.updateContent.bind(this));
//       this.addEventListener('keyup', this.onKeyUp.bind(this));
    });
    this.classList.add('swatches-loaded');
  }
  updateContent(event) {
    const elementsToUpdate = [
      '.card__media',
      '.quick-add__wrapper',
      '.card__main-content',
      '.card__badge'
    ];
    const myCard = event.target.closest('.product-card');
    fetch(event.target.getAttribute('data-product'))
    .then(response => response.text())
    .then(data => {
      var parser = new DOMParser();
      var doc = parser.parseFromString(data,'text/html');
      elementsToUpdate.forEach(el => {
        const currentEl = myCard.querySelector(el);
        const newEl = doc.querySelector(el);
        if(currentEl && newEl) {
          currentEl.innerHTML = newEl.innerHTML;
        } else {
          console.log(currentEl,newEl,el);
        }
        lazyImages();
      });
      myCard.querySelectorAll('.card-swatch__button').forEach(button => {
        button.classList.remove('active');
      });
      event.target.classList.add('active');
      const newJson = doc.querySelector('.product-card').getAttribute('data-json');
      myCard.setAttribute('data-json',newJson);
      myCard.querySelector('quick-add').json = JSON.parse(newJson);
      
    })
    .catch(error => console.log(error));
  }
}

customElements.define('card-swatches', CardSwatches);


const playPauseVideo = () => {
  let videos = document.querySelectorAll("video");
  videos.forEach((video) => {
    // We can only control playback without insteraction if video is mute
    video.muted = true;
    // Play is a promise so we need to check we have it
    let playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then((_) => {
        let observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.intersectionRatio <= 0 && !video.paused) {
                video.pause();
                console.log('pause me');
              } else if (video.paused) {
                video.play();
              }
            });
          }
        );
        observer.observe(video);
      });
    }
  });
}

// And you would kick this off where appropriate with:
playPauseVideo();


const lazyImages = () => {
  const targets = document.querySelectorAll(".media img");
  const lazyLoad = target => {
    if(target.classList.contains('fade')) return true;
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          img.setAttribute('src', src);
          img.classList.add('fade');
          observer.disconnect();
        }
      });
    }, {
      threshold: 0.33
    });
    io.observe(target)
  };
  targets.forEach(lazyLoad);
};
lazyImages();


const totalColors = () => {
  if(!window.enableTotalColors) return;
  const targets = document.querySelectorAll(".total-colors");
  const getTotalColors = target => {
    if(target.classList.contains('colors-found')) return true;
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cardStyle = entry.target.getAttribute('data-style');
          const cardColor = entry.target.getAttribute('data-color');
          let totalFound = 0;
          fetch(`/search?q=${cardStyle}&type=product&view=api`)
          .then(response => response.json())
          .then(data => {
            if(data.length <= 1) return;
            data.forEach(item => {
              const style = item.title.split(' - ')[0];
              if(style !== cardStyle) return;
              totalFound++;
            });
            
            if(totalFound > 1) {
              const allMatches = document.querySelectorAll(`.total-colors[data-style="${cardStyle}"]`);
              allMatches.forEach(match => {
                match.innerHTML = `+ ${totalFound} Colors`;
                match.classList.add('colors-found');
              });  
            }
          })
          .catch(error => console.log(error));
          observer.disconnect();
        }
      });
    }, {
      threshold: 0.5
    });
    io.observe(target);
  };
  targets.forEach(getTotalColors);
};


totalColors();


const productCardHovers = () => {
  if(!window.enableCardSwatches) return;
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    const cardSwatches = card.querySelector('card-swatches');
    card.addEventListener('mouseenter', event => {
      if(cardSwatches.classList.contains('swatches-loaded')) return;
      cardSwatches.findColors();
    });
  });
};

productCardHovers();

const productSwatchReload = () => {
  const swatchCards = document.querySelectorAll('.swatch_image-a');
  swatchCards.forEach(card => {
    card.addEventListener('click', (event) => {
      event.preventDefault();
      const productURL = event.currentTarget.getAttribute('href');
      const productSKU = event.currentTarget.getAttribute('data-sku');
      const productTitle = event.currentTarget.getAttribute('data-product-title');
      const productImage = event.currentTarget.getAttribute('data-product-img');
      
      window.__RRPRWidget.product_id = productSKU;
      window.__RRPRWidget.sku = productSKU;
      
      if(event.currentTarget.closest('.customSwatch') != null) {
        event.currentTarget.closest('.customSwatch').classList.add('btn--loading');  
      }

      const elementsToUpdate = [
        '.pdp-hero-wrap',
        '.pdp-review-section',
        '.pdp-rc-section'
      ];

      fetch(productURL)
      .then(response => response.text())
      .then(data => {
        var parser = new DOMParser();
        var doc = parser.parseFromString(data,'text/html');
        elementsToUpdate.forEach(el => {
          const currentEl = document.querySelector(el);
          const newEl = doc.querySelector(el);
          if(currentEl && newEl) {
            currentEl.innerHTML = newEl.innerHTML;
          } else {
            console.log(currentEl,newEl,el);
          }
          if(document.querySelector('.pdp-hero-wrap .yotpo-widget-instance')) {
            yotpoWidgetsContainer.initWidgets()
          }
        });

        lazyImages();
        complimentary();
        productRecommendations();
        productSwatchReload();
        changeSwiperSlider();

        const swiper = document.getElementById('product__mobile-images');
        const json = JSON.parse(swiper.getAttribute('data-json'));
        const productSwiper = new Swiper(swiper, json);

        var __RRPRWidget_Settings = {
          name: productTitle,
          sku: productSKU,
          img: productImage,
          url: `https://hammitt.com${productURL}`,
          onclick: function(){
            $('html').animate({
            scrollTop: $('#RR_PR_Frame_Wrapper').offset().top - 50
            }, 700);
            document.getElementById('RR_PR_Frame_Wrapper').click();
          }
        };


        let scriptsAllTag = document.querySelectorAll('script');
        scriptsAllTag.forEach(script => {
            if (script.src.includes("https://www.resellerratings.com/productreviews/widget/javascript/Hammitt.js")) {
                script.remove(); // Remove the script from the DOM
                console.log("Review script removed.");
            }
        });


        let script = document.createElement("script");
        script.src = `https://www.resellerratings.com/productreviews/widget/javascript/Hammitt.js?sku=${productSKU}`; // Replace with the actual script URL
        script.onload = function () {
            console.log("Review script loaded successfully.");
        };
        document.body.appendChild(script);

        delete window.initializedRRProductReviews;
        __RRPRWidget.init(__RRPRWidget_Settings);

        
        history.pushState(null, "", `${productURL}`);
      }).finally(() => {
          if(document.querySelector('.swym-button.hammitt-custom')) {
            document.dispatchEvent(new CustomEvent("swym:collections-loaded"))
          }
          
          const myInterval = setInterval(myTimer, 1000);
          function myTimer() {
            if(document.querySelector('.rr_img_overall_container img') != null) {
              document.querySelector('.rr_img_overall_container img').setAttribute('src', productImage);
              document.querySelector('.acs_heading_lg').innerHTML = productTitle;
              myStopFunction();
            }
          }
          function myStopFunction() {
            clearInterval(myInterval);
          }
      });
    });
  });
};

productSwatchReload();

const addToCart = (itemsObj) => {
  console.log('ADDING AN ITEM TO CART!!!!')
  if(!itemsObj.hasOwnProperty('sections')) {
    itemsObj.sections = "cart-drawer,cart-icon-bubble,main-cart-items";
  }
  if(!itemsObj.hasOwnProperty('sections_url')) {
    itemsObj.sections_url = "/cart?sections=cart-drawer,cart-icon-bubble,main-cart-items";
  }
  fetch('/cart/add.js', {
    body: JSON.stringify(itemsObj),
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With':'xmlhttprequest' /* XMLHttpRequest is ok too, it's case insensitive */
    },
    method: 'POST'
  }).then(function(response) {
    return response.json();
  }).then(function(json) {
    /* we have JSON */
    if(json.status == 422 && json.message == "Cart Error") {
      itemsObj.items.shift();
      addToCart(itemsObj);
    } else {
      cartUpdate(json);
    }
  }).catch(function(err) {
    /* uh oh, we have error. */
    console.log(err)
  });
};

const klaviyoForms = () => {
  const subscribeForms = document.querySelectorAll(".klaviyo-subscribe");
  subscribeForms.forEach((form) => {
    const button = form.querySelector(".newsletter-form__button");
    button.addEventListener("click", function (e) {
      e.preventDefault();
	  klaviyoSubscribe(form);
    });
  });
  const bisForms = document.querySelectorAll(".klaviyo-bis");
  bisForms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      theme.klaviyoSubscribe(form,function() {
        klaviyoBISsubmit(form);
      });
    });
  });
};

klaviyoForms();

const klaviyoSubscribe = (form, callback) => {
  
  const email = form.querySelector('input[name="email"]').value;
  const phone = form.querySelector('input[name="phone"]');
  const acceptsMarketing =  true;
  const listId = form.querySelector('input[name="g"]').value;
  const successMessage = form.getAttribute("data-success-message");
  const messages = form.querySelector(".messages");
  const subscribeUrl = "//manage.kmail-lists.com/ajax/subscriptions/subscribe";
  let phoneNumber = '';
  

  if (email === "") {
    messages.textContent = "Please enter a valid email address";
    messages.classList.remove("hidden");
    return false;
  } 
  
  if(phone && phone.value != '') {
    const countryCode = form.querySelector('.iti__selected-flag').getAttribute('title').split(': ')[1];
    phoneNumber = `${countryCode}${phone.value}`;
  }
  
  const bodyContent = {
    g: listId,
    email: email,
    sms_consent: true,
    $fields: '$phone_number,sms_consent',
    $phone_number: phoneNumber,
    $consent: ['sms']
  };

  fetch(subscribeUrl, {
    body: new URLSearchParams(bodyContent),
    method: "POST",
  })
  .then((response) => response.json())
  .then((response) => {

    if (response.success) {
      messages.textContent = successMessage;
    } else {
      messages.textContent = response.errors;
    }
    console.log('subscribe',response);
    messages.classList.remove("hidden");
    if (callback && typeof callback === 'function') {
      callback();
    }
  })
  .catch((err) => {
    console.error(err);
  });
};

const klaviyoBISsubmit = (form) => {
  const url = "//a.klaviyo.com/onsite/components/back-in-stock/subscribe";
  const email = form.querySelector(".klaviyo-bis-email").value;
  const messages = form.querySelector(".messages");
  const hiddenInfo = form.querySelector('.klaviyo-variant-id');
  var variantId = false;
  var productId = false;
  if(hiddenInfo) {
    variantId = parseFloat(hiddenInfo.value);
    productId = hiddenInfo.getAttribute('product-id');
  } else {
    variantId = window.currentVariant.id || false;
    productId = window.currentVariant.productId || false;
  }
  
  const formBody = new URLSearchParams({
    a: window.klaviyoAccountId,
    email: email,
    variant: variantId,
    product: productId,
    platform: "shopify"
  });
  messages.classList.add("hidden");
  if (email === "") {
    messages.textContent = "Please enter a valid email";
    messages.classList.remove("hidden");
    return false;
  }

  fetch(url, {
    body: formBody,
    method: "POST",
  })
  .then((response) => response.json())
  .then((response) => {
    if (response.success) {
      messages.textContent = "You're in! We'll let you know when it's back.";
    } else {
    }
    messages.classList.remove("hidden");
  })
  .catch((err) => {
    console.error(err);
  });
};

const gwpInCart = (id = false) => {
  return document.querySelector(`[data-variant-id="${id}"`);  
};

const checkGWPs = (json = false) => {
  if(document.querySelector('.cart-drawer-btn') != null) {
    document.querySelector('.cart-drawer-btn').disabled = false;  
  }        
  if(document.querySelector('.cart__checkout-button') != null) {
    document.querySelector('.cart__checkout-button').disabled = false;  
  }
  
  let updatesObj = { 
    updates: {},
    sections: "cart-drawer,cart-icon-bubble,main-cart-items"
  };
  const drawerItems = document.querySelector('.drawer__items');
  if(!json) {
    json = JSON.parse(drawerItems.getAttribute('data-json'));
  }
  const subtotal = parseFloat(drawerItems.getAttribute('data-subtotal'));
 
  const sortedGwps = gwps.sort((a, b) => b.minimum - a.minimum);
  let addedGwp = false;
  sortedGwps.forEach(gwp => { 
    if (!gwp.enabled || !gwp.available) return;
    
    if (subtotal >= gwp.minimum && !addedGwp) {
      if (!gwpInCart(gwp.item)) {
        if(document.querySelector('.cart-drawer-btn') != null) {
          document.querySelector('.cart-drawer-btn').disabled = true;  
        }        
        if(document.querySelector('.cart__checkout-button') != null) {
          document.querySelector('.cart__checkout-button').disabled = true;  
        }
        addToCart(
          {
            items: [ 
              {
                id: gwp.item,
                quantity: 1,
                properties: {
                  '_free_gift': true
                }
              }
            ],
            sections: "cart-drawer,cart-icon-bubble,main-cart-items"
          }
        );
      }
      addedGwp = true;
    } else if (gwpInCart(gwp.item)) {
      
      updatesObj.updates[gwp.item] = 0;
      if(document.querySelector('.cart-drawer-btn') != null) {
        document.querySelector('.cart-drawer-btn').disabled = true;  
      }
      
      if(document.querySelector('.cart__checkout-button') != null) {
        document.querySelector('.cart__checkout-button').disabled = true;  
      }

      updateCart({
        url: '/cart/update.js',
        data: JSON.stringify(updatesObj)
      });
    }
  });  
};

function updateCart(params) {  
  fetch(params.url, {
    method: 'POST',
    body: params.data,
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(function(cart) {
    cartUpdate(cart);
    const onCartPage = window.location.href.indexOf('/cart') > -1;
    if(onCartPage) {
        window.location.reload()
    }
  });
}

checkGWPs(false);
// document.addEventListener('change', function(evt) {
//   if(document.querySelector('.cart-drawer-btn') != null) {
//     document.querySelector('.cart-drawer-btn').disabled = true;  
//   }
  
//   if(document.querySelector('.cart__checkout-button') != null) {
//     document.querySelector('.cart__checkout-button').disabled = true;  
//   }
  
// });

const cartUpdate = (json = false) => {
  console.log('///// cart update')
  const cartUpdates = [
    {
      section: "cart-drawer",
      elements: [".cart-announcement-bar",".drawer__items",".drawer__subtotal",".cart_shipping_notes",".jr-temp-single-gwp"]
    },
    {
      section: "cart-icon-bubble",
      elements: [".cart-count-bubble"]
    }
  ];

  const mainCart = document.querySelector('.cart-main');

  if(mainCart) {
    cartUpdates.push({
      section: "main-cart-items",
      elements: ['.cart-items']
    });
    cartUpdates.push({
      section: "main-cart-footer",
      elements: ['#main-cart-footer']
    });
  }
  

  const monogramElement = document.querySelector('#PopupModal-monogram');
  if(monogramElement && monogramElement.hasAttribute('open')) {
    monogramElement.removeAttribute('open');
  }

  if(!json || json === undefined) {
    json = JSON.parse(document.querySelector('.drawer__items').getAttribute('data-json'));
  };

  cartUpdates.forEach(update => {
    update.elements.forEach(element => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(json.sections[update.section], "text/html");
      const elOld = document.querySelector(element);
      const elNew = doc.querySelector(element);



      if(element == '.jr-temp-single-gwp') {
        let oldPercent = '0';
        if(elOld.querySelector('.jr-temp-single-gwp .progress-bar') != null) {
          oldPercent = elOld.querySelector('.jr-temp-single-gwp .progress-bar').getAttribute('data-percentage')
        }
       
        const oldStyle = document.createElement('style')

        oldStyle.textContent = `
          .jr-temp-single-gwp .progress-bar:before {
            width: ${oldPercent}% !important;
          }
        `
        oldStyle.id = 'temp-single-psuedo'

        elNew.querySelector('#temp-single-psuedo').remove()

        elNew.appendChild(oldStyle) 
        
      }

      if(elOld && elNew) {
        elOld.outerHTML = elNew.outerHTML;
      }

      if(element == '.jr-temp-single-gwp') {
        setTimeout(() => {
          let newPercent = '0'
          if(elNew.querySelector('.jr-temp-single-gwp .progress-bar') != null) {
            newPercent = elNew.querySelector('.jr-temp-single-gwp .progress-bar').getAttribute('data-percentage')
          }
          const newStyle = document.createElement('style')
          newStyle.textContent = `
            .jr-temp-single-gwp .progress-bar:before { 
              width: ${newPercent}% !important;
            }
          `
          newStyle.id = 'temp-single-psuedo'
          document.querySelector('#temp-single-psuedo').remove()
          document.querySelector('.jr-temp-single-gwp').appendChild(newStyle)
        }, 200)
        
      }

    })

    cartUpsellSwiper();
    var cartContents = fetch(window.Shopify.routes.root + 'cart.js')
    .then(response => response.json())
    .then(data => 
      {
        if(parseFloat((document.querySelector(`free-shipping-goal`).dataset.minimumAmount) * 100) < data.items_subtotal_price) {
          document.querySelector(`free-shipping-goal`).classList.add('free-shipping-goal--done');
        }
        document.dispatchEvent(
          new CustomEvent('cart:updated', {
            detail: {
              cart: data,
            },
          })
        );
      }
    );

  });

  // Get the currUpdatedItemID from window and add scrollIntoView()
  let selector = `.drawer__items [data-variant-id="${window.currUpdatedItemID}"]`;
  let lastUpdatedItemID = document.querySelector(selector);
  if(lastUpdatedItemID){
    setTimeout(function(){
      lastUpdatedItemID.scrollIntoView(false);
    }, 100);
  }

  if(document.querySelector(`[data-empty-div]`) != null) {
    document.querySelector(`[data-empty-div]`).classList.add('hidden');
  }
  if(document.querySelector(`free-shipping-goal`)) {
    document.querySelector(`free-shipping-goal`).classList.remove('hidden');
  }
  
  document.querySelectorAll('.loading-overlay').forEach(loader => {
    loader.classList.add('hidden');
  });
  
  const productAddButton = document.querySelector('.product-form__submit');
  if(productAddButton) {
    productAddButton.classList.remove('loading');
    productAddButton.removeAttribute('aria-disabled');
    productAddButton.querySelector('.loading-overlay__spinner').classList.add('hidden');
  }
  
  const cartOpen = document.getElementById('Details-cart-drawer-container').hasAttribute('open');
  const onCartPage = window.location.href.indexOf('/cart') > -1;
  if(!cartOpen && !onCartPage) {
    document.querySelector('#Details-cart-drawer-container .header__icon--menu').click();
  }

  checkGWPs(json);

  if(!onCartPage) {
    const itemRemovedCartDrawer = new Event("itemRemovedFromCartDrawer");
    document.dispatchEvent(itemRemovedCartDrawer);
  }

  if (onCartPage && document.querySelector(".cart-items.cart-page-items").getAttribute("data-qty-updated") === "true") {
    window.location.href = '/cart';
  }
}

const headerScroll = (h) => {
 
  let headerWrapper = document.querySelector('.header-wrapper');
  let mainContent = document.getElementById('MainContent');
  var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
  if (scrollTop >= mainContent.offsetTop) {
    headerWrapper.classList.add("header--scrolled");
  } 
  else {
    headerWrapper.classList.remove("header--scrolled");
  }

};


window.onscroll = function() {
  // headerScroll();
};


const footerCollapse = () => {
  const footerButtons = document.querySelectorAll('.footer-block__link_list .button--inline');
  footerButtons.forEach(footerButton => {
    footerButton.addEventListener('click',event => {
      event.preventDefault();
      const isOpen = footerButton.getAttribute('aria-expanded') == 'true';
      const controlledEl = document.getElementById(footerButton.getAttribute('aria-controls'));
      if(isOpen) {
        controlledEl.style.display = 'none';
      } else {
        controlledEl.style.display = 'block';
      }
      footerButton.setAttribute('aria-expanded',!isOpen);
    });
  });
};

footerCollapse();


document.addEventListener('shopify:section:load', event => {
  lazyImages();
  playPauseVideo();
  productCardHovers();
  klaviyoForms();
  headerScroll();
  footerCollapse();
  checkGWPs(false);
});



if(window.transparentHeader) {
  window.onload = (event) => {
    let mainContent = document.getElementById('MainContent');
    mainContent.style.marginTop = `-${headerWrapper.offsetHeight}px`;
    

  };

}

if(window.announcementSticky) {
    let announcementContent = document.getElementById('shopify-section-announcement-bar');
    if(announcementContent) {
      document.querySelector('#shopify-section-header').style.setProperty('--announcement-sticky', `${announcementContent.offsetHeight}px`);
    }
}

window.addEventListener("resize", () => {
  if(window.announcementSticky) {
    let announcementContent = document.getElementById('shopify-section-announcement-bar');
    if(announcementContent) {
      document.querySelector('#shopify-section-header').style.setProperty('--announcement-sticky', `${announcementContent.offsetHeight}px`);
    }
  }
});

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      fetch(this.dataset.url)
        .then((response) => response.text())
        .then((text) => {
          const html = document.createElement('div');
          html.innerHTML = text;
          const recommendations = html.querySelector('product-recommendations');

          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }

          if (this.classList.contains('complimentary-products')) {
            console.log('complientary')
            // this.remove();
          }

          if (html.querySelector('.grid__item')) {
            this.classList.add('product-recommendations--loaded');
          }
          lazyImages();
        })
        .catch((e) => {
          console.error(e);
        });
    };

    new IntersectionObserver(handleIntersection.bind(this), { rootMargin: '0px 0px 400px 0px' }).observe(this);
  }
}

customElements.define('product-recommendations', ProductRecommendations);

// @desc Check GWP is in Cart
// @params variantId
// @return true/false
const isProductInCart = async (variantId) => {
  try {
    const response = await fetch('/cart.json', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    const cartItems = data.items;

    return cartItems.some(item => item.id === variantId);
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
    return false;
  }
}

// @desc Add a standalone product or a product with GWP
// @params productId, variantId?
const addToCartPromo = async (productId, addOnId = null) => {
  let itemsObj = {
    items: [
      {
        id: productId,
        quantity: 1,
        properties: {
          "_IDPromotion": "IDPromotion"
        }
      }
    ]
  };

  if (addOnId) {
    itemsObj.items.push({
      id: addOnId,
      quantity: 1,
      properties: {
        "_IDPromotion": "AddOnPromotion"
      }
    });
  }

  addToCart(itemsObj);
}

jsLoad = true;


// function getOS() {
//   let userAgent = navigator.userAgent.toLowerCase();

//   if (userAgent.includes("win")) {
//     document.body.classList.add('os-windows');
//   } else if (userAgent.includes("mac")) {
//     document.body.classList.add('os-macOs');
//   } else if (userAgent.includes("linux")) {
//     document.body.classList.add('os-linux');
//   } else if (userAgent.includes("android")) {
//     document.body.classList.add('os-android');
//   } else if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
//     document.body.classList.add('os-iphone');
//   }
  
//   if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
//     document.body.classList.add('browser-safari');
//   }

// }

// getOS();

const findElement = setInterval(expressCheckout, 1000);

function expressCheckout() {
  if(document.querySelector('shopify-paypal-button')) {
    document.querySelector('shopify-paypal-button').remove();
    if(document.querySelector('shopify-google-pay-button')) {
      document.querySelector('shopify-google-pay-button').remove();
    }
    if(document.querySelector('shopify-apple-pay-button')) {
      document.querySelector('shopify-apple-pay-button').remove();
    }
    stopFindElement();
  }
}

function stopFindElement() {
  clearInterval(findElement);
}