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

    this.summaryToggle.setAttribute('role', 'button');
  }

  isOpen() {
    return this.detailsContainer.hasAttribute('open');
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open')
      ? this.close()
      : this.open(event);
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) this.close(false);
  }

  open(event) {
    this.onBodyClickEvent =
      this.onBodyClickEvent || this.onBodyClick.bind(this);
    event.target.closest('details').setAttribute('open', true);
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
    const details = realModal.querySelector('details')
    details.open = true
    document.querySelector('.x-gen-search.search-desktop input').focus()
  })
})
