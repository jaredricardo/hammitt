/**
 * Drawer Components Module
 * Web Components for menu drawer and header drawer functionality
 * Extracted from global.js for better code organization
 */

// Menu Drawer Component
class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');
    const summaryElements = this.querySelectorAll('summary');
    this.detailsContainer = this.querySelector('.menu-drawer__submenu');

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));

    summaryElements.forEach(summary => 
      summary.addEventListener('click', this.onSummaryClick.bind(this))
    );
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute('open');

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);
    } else {
      if (typeof trapFocus === 'function') {
        trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
      }
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
      });
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    if (typeof trapFocus === 'function') {
      trapFocus(this.mainDetailsToggle, summaryElement);
    }
    document.body.classList.add('overflow-hidden');
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event !== undefined) {
      this.mainDetailsToggle.classList.remove('menu-opening');
      this.mainDetailsToggle.querySelectorAll('details').forEach(details => {
        details.removeAttribute('open');
        details.classList.remove('menu-opening');
      });
      this.mainDetailsToggle.removeAttribute('open');
      if (typeof removeTrapFocus === 'function' && elementToFocus) {
        removeTrapFocus(elementToFocus);
      }
      document.body.classList.remove('overflow-hidden');
    }
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) {
        this.closeMenuDrawer();
      }
    });
  }
}

// Header Drawer Component
class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector('.section-header');
    this.borderOffset = this.borderOffset || this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;
    
    document.documentElement.style.setProperty('--header-bottom-position', `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`);

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });

    summaryElement.setAttribute('aria-expanded', true);
    if (typeof trapFocus === 'function') {
      trapFocus(this.mainDetailsToggle, summaryElement);
    }
    document.body.classList.add('overflow-hidden');
  }
}

// Register drawer components
customElements.define('menu-drawer', MenuDrawer);
customElements.define('header-drawer', HeaderDrawer);
