class HammittGiftingAccordion extends HTMLElement {
  constructor() {
    super()
    this.animation = null
    this.duration = 420
    this.easing = 'cubic-bezier(0.25, 0.1, 0.25, 1)'
  }

  // Children are resolved on click: when this script runs before the drawer markup is parsed,
  // connectedCallback fires on the opening tag before any children exist.
  connectedCallback() {
    this.onClick = this.onClick.bind(this)
    this.addEventListener('click', this.onClick)
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick)
  }

  onClick(event) {
    const summary = event.target.closest('summary')
    if(!summary || summary.closest('hammitt-gifting-accordion') !== this) return

    this.details = summary.closest('details')
    this.summary = summary
    this.content = this.details && this.details.querySelector('.gifting-accordion-content')
    if(!this.details || !this.content) return

    event.preventDefault()

    const isOpen = this.details.hasAttribute('open')
    this.toggle(!isOpen)
  }

  toggle(opening) {
    if(this.animation) this.animation.cancel()

    const startHeight = opening ? 0 : this.content.offsetHeight
    const startOpacity = opening ? 0 : 1
    const endOpacity = opening ? 1 : 0

    if(opening) this.details.open = true
    const endHeight = opening ? this.content.offsetHeight : 0

    this.animation = this.content.animate(
      {
        height: [`${startHeight}px`, `${endHeight}px`],
        opacity: [startOpacity, endOpacity]
      },
      {
        duration: this.duration,
        easing: this.easing
      }
    )

    this.animation.onfinish = () => {
      this.animation = null
      this.content.style.removeProperty('height')
      this.content.style.removeProperty('opacity')
      if(!opening) this.details.open = false
    }

    this.animation.oncancel = () => {
      this.animation = null
    }
  }
}

if(!customElements.get('hammitt-gifting-accordion')) {
  customElements.define('hammitt-gifting-accordion', HammittGiftingAccordion)
}

// Cart-level gifting panel: open/close height is animated purely in CSS (grid-template-rows)
class CartLevelGiftingToggle extends HTMLElement {
  // Listens on the host and resolves children lazily (see note on HammittGiftingAccordion)
  connectedCallback() {
    this.onClick = this.onClick.bind(this)
    this.addEventListener('click', this.onClick)
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick)
  }

  onClick(event) {
    this.button = event.target.closest('.cart-level-gifting-toggle-button')
    if(!this.button || !this.contains(this.button)) return
    this.panel = this.querySelector('.cart-level-gifting-panel')
    if(!this.panel) return

    this.setOpen(this.button.getAttribute('aria-expanded') !== 'true')
  }

  setOpen(open) {
    this.button.setAttribute('aria-expanded', String(open))
    this.classList.toggle('is-open', open)
    this.panel.inert = !open
  }
}

if(!customElements.get('cart-level-gifting-toggle')) {
  customElements.define('cart-level-gifting-toggle', CartLevelGiftingToggle)
}
