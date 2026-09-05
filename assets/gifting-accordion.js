class HammittGiftingAccordion extends HTMLElement {
  constructor() {
    super()
    this.animation = null
    this.duration = 420
    this.easing = 'cubic-bezier(0.25, 0.1, 0.25, 1)'
  }

  connectedCallback() {
    this.details = this.querySelector('details')
    this.summary = this.querySelector('summary')
    this.content = this.querySelector('.gifting-accordion-content')

    if(!this.details || !this.summary || !this.content) return

    this.onSummaryClick = this.onSummaryClick.bind(this)
    this.summary.addEventListener('click', this.onSummaryClick)
  }

  disconnectedCallback() {
    if(this.summary) {
      this.summary.removeEventListener('click', this.onSummaryClick)
    }
  }

  onSummaryClick(event) {
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
