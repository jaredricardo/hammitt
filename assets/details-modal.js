class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');

    this.detailsContainer.addEventListener(
      'keyup',
      (event) => event.code.toUpperCase() === 'ESCAPE' && this.close()
    );
    this.summaryToggle.addEventListener(
      'click',
      this.onSummaryClick.bind(this)
    );
    this.querySelector('button[type="button"]').addEventListener(
      'click',
      this.close.bind(this)
    );
    // Browsers force-expand <details> elements when the native "Find in page"
    // (Cmd/Ctrl+F) search matches text hidden inside them - e.g. the trending
    // products / predictive-search markup in here. That bypasses onSummaryClick
    // entirely and pops the modal open with no real user interaction, so guard
    // against it: any "open" that wasn't flagged by our own open() call gets
    // reverted immediately.
    this.detailsContainer.addEventListener('toggle', this.onToggle.bind(this));

    this.summaryToggle.setAttribute('role', 'button');
  }

  isOpen() {
    return this.detailsContainer.hasAttribute('open');
  }

  onToggle() {
    if (this.detailsContainer.hasAttribute('open') && !this.openedByUser) {
      this.detailsContainer.removeAttribute('open');
      return;
    }
    this.openedByUser = false;
  }

  onSummaryClick(event) {
    event.preventDefault();
    this.detailsContainer.hasAttribute('open')
      ? this.close()
      : this.open();
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) this.close(false);
  }

  open() {
    this.openedByUser = true;
    this.onBodyClickEvent =
      this.onBodyClickEvent || this.onBodyClick.bind(this);
    this.detailsContainer.setAttribute('open', true);
    document.body.addEventListener('click', this.onBodyClickEvent);
    document.body.classList.add('overflow-hidden');    
    document.body.style.paddingRight = `${this.scrollbarWidth}px`;

    trapFocus(
      this.detailsContainer.querySelector('[tabindex="-1"]'),
      this.detailsContainer.querySelector('input:not([type="hidden"])')
    );
  }

  close(focusToggle = true) {
    removeTrapFocus(focusToggle ? this.summaryToggle : null);
    this.detailsContainer.removeAttribute('open');
    document.body.removeEventListener('click', this.onBodyClickEvent);
    document.body.classList.remove('overflow-hidden');
    document.body.style.paddingRight = '';
  }
}

customElements.define('details-modal', DetailsModal)

window.addEventListener('DOMContentLoaded', () => {
  // doing it this somewhat lazy way because: 
  // 1. I want to keep the modal modal in tact in case we revert (and want to keep the dom structure the same)
  // 2. because we shouldnt have two modals that do the same thing
  const fakeDetailsModal = document.querySelector('fake-details-modal')
  const realModal = document.querySelector('details-modal.open-x-gen-modal-instead')
  fakeDetailsModal.addEventListener('click', () => {
    realModal.open()
    document.querySelector('.x-gen-search.search-desktop input').focus()
  })
})
