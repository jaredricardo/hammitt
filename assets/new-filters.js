window.addEventListener('DOMContentLoaded', () => {

  // due to some crazy z-index issues with the header, we need to move the drawers to the header on load

  const filterDrawer = document.querySelector('minty-fresh-filter-drawer')
  const sortDrawer = document.querySelector('minty-fresh-sort-drawer')
  const targetInsert = document.querySelector('header.header')
  const activeFilterCount = document.querySelectorAll('.minty-fresh-active-filter-count')
  const applyFilters = document.querySelector('.apply-area #apply')
  const resetFilters = document.querySelector('.apply-area #reset')

  targetInsert.insertAdjacentElement('afterend', filterDrawer)

  applyFilters.addEventListener('click', () => {

    const filterForm = document.querySelector('minty-fresh-filter-drawer form')
    const formData = new FormData(filterForm);
    const searchParams = new URLSearchParams(formData).toString();

    window.location.href =  `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`
    
  })

})

window.onload = function () {
  slideMin()
  slideMax()
}

const minVal = document.querySelector("minty-fresh-price-range .min-val")
const maxVal = document.querySelector("minty-fresh-price-range .max-val")

const priceInputMin = document.querySelector("minty-fresh-price-range .min-input")
const priceInputMax = document.querySelector("minty-fresh-price-range .max-input")
const priceDisplayMin = document.querySelector("minty-fresh-price-range #current-low")
const priceDisplayMax = document.querySelector("minty-fresh-price-range #current-high")

const minTooltip = document.querySelector("minty-fresh-price-range .min-tooltip")
const maxTooltip = document.querySelector("minty-fresh-price-range .max-tooltip")
const minGap = 0
const range = document.querySelector("minty-fresh-price-range .slider-track")
const sliderMinValue = parseInt(minVal.min)
const sliderMaxValue = parseInt(maxVal.max)

function slideMin() {
  let gap = parseInt(maxVal.value) - parseInt(minVal.value)
  if(gap <= minGap) {
    minVal.value = parseInt(maxVal.value) - minGap
  }
  minTooltip.innerHTML = `$${minVal.value}`
  priceInputMin.value = minVal.value
  priceDisplayMin.innerHTML = `$${minVal.value}`
  setArea()
}

function slideMax() {
  let gap = parseInt(maxVal.value) - parseInt(minVal.value)
  if(gap <= minGap) {
    maxVal.value = parseInt(minVal.value) + minGap
  }
  maxTooltip.innerHTML = "$" + maxVal.value
  priceInputMax.value = maxVal.value
  priceDisplayMax.innerHTML = "$" + maxVal.value
  setArea()
}

function setArea() {
  range.style.left = `${((minVal.value - sliderMinValue) / (sliderMaxValue - sliderMinValue)) * 100}%`
  range.style.left = (minVal.value / sliderMaxValue) * 100 + "%"
  minTooltip.style.left = (minVal.value / sliderMaxValue) * 100 + "%"
  maxTooltip.style.right = 100 - (maxVal.value / sliderMaxValue) * 100 + "%"
  range.style.right = `${100 -((maxVal.value - sliderMinValue) / (sliderMaxValue - sliderMinValue)) * 100}%`
}

function setMinInput() {
  let minPrice = parseInt(priceInputMin.value)
  if(minPrice < sliderMinValue) {
    priceInputMin.value = sliderMinValue
  }
  minVal.value = priceInputMin.value
  slideMin()
}

function setMaxInput() {
  let maxPrice = parseInt(priceInputMax.value)
  if(maxPrice > sliderMaxValue) {
    priceInputMax.value = sliderMaxValue
  }
  maxVal.value = priceInputMax.value
  slideMax()
}

class MintyFreshFilters extends HTMLElement {
  constructor() {
    super()
    this.querySelector('#toggle-grid').addEventListener('click', this.toggleGridView)
    this.querySelector('#toggle-filter-drawer').addEventListener('click', this.openFilterDrawer)
    this.querySelector('#toggle-sort-drawer').addEventListener('click', this.toggleSortDrawer)
    this.querySelector('#close-filter-drawer').addEventListener('click', this.closeFilterDrawer)
  }

  toggleGridView() {    
    this.classList.toggle('collection-view')
    this.classList.toggle('grid-view')
  }

  openFilterDrawer(){
    document.body.classList.add('overflow-hidden-all')
    document.querySelector('minty-fresh-filter-drawer').classList.add('filter-drawer-open')
    document.querySelector('minty-fresh-filter-drawer').classList.remove('sort-drawer-open')
  }

  toggleSortDrawer() {
    document.querySelector('minty-fresh-sort-drawer').classList.toggle('sort-drawer-open')
    document.querySelector('minty-fresh-filter-drawer').classList.remove('filter-drawer-open')
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`)
  }
}

class MintyFreshFilterDrawer extends HTMLElement {
  constructor() {
    super()
    this.querySelector('#close-filter-drawer').addEventListener('click', this.closeFilterDrawer)
  }

  closeFilterDrawer() {
    this.closest('minty-fresh-filter-drawer').classList.remove('filter-drawer-open')
    document.body.classList.remove('overflow-hidden-all')
  }
}

class MintyFreshFilterInput extends HTMLElement {
  constructor() {
    super()
    this.addEventListener('click', this.toggleFilter)
    this.addEventListener('change', this.toggleFilter)
  }
  toggleFilter() {
    this.querySelector('input').checked = !this.querySelector('input').checked
  }
}

class MintyFreshSortDrawer extends HTMLElement {
  constructor() {
    super()
      this.querySelectorAll('ul li').forEach((li) => {
        li.addEventListener('click', this.connectSortToHidenFormInput)
      })
      this.addEventListener('mouseleave', () => {
        this.classList.remove('sort-drawer-open')
      })
  }
  connectSortToHidenFormInput() {

    const onXGenSearch = document.querySelector('.main-search-grid #x-gen-search-results-container')

    document.querySelectorAll('minty-fresh-sort-drawer li').forEach((li) => {
      li.classList.remove('active')
    })

    const sortSelect = document.querySelector('minty-fresh-filter-drawer .hidden-sort-select select')

    document.querySelectorAll('minty-fresh-filter-drawer .hidden-sort-select option').forEach((option, i) => {
      if(option.value == this.dataset.value) {
        sortSelect.options[i].setAttribute('selected', 'selected')
      } else {
        sortSelect.options[i].removeAttribute('selected')
      }
    })

    this.classList.add('active')
    
    if(onXGenSearch) {

      const targetContainer = document.querySelector('#x-gen-search-results-container .product-grid')
      const queryString = window.location.search
      const params = new URLSearchParams(queryString)
      const searchTerm = params.get('q')

      xGenSort(targetContainer, searchTerm, this.dataset.value)
    } else {
      document.querySelector('minty-fresh-filter-drawer form').submit()
    }

    onXGenSearch ? xGenSort() : document.querySelector('minty-fresh-filter-drawer form').submit()

  }
}

function xGenSort(targetContainer, searchTerm, sortValue) {

  let sortValueFormatted = sortValue
  // remove old container LIs and activate spinner
  document.querySelectorAll('#ProductGridContainerXGen li').forEach((li) => { li.remove()})
  document.querySelector('.collection-load-spinner').classList.add('active')

  switch(sortValue) {
    case 'price-ascending':
      sortValueFormatted = 'asc'
      break
    case 'price-descending':
      sortValueFormatted = 'desc'
      break
  }

  window.buildXGenSearchResultsForCollectionGrid(targetContainer, searchTerm, sortValueFormatted)
}

customElements.define('minty-fresh-filters', MintyFreshFilters)
customElements.define('minty-fresh-filter-drawer', MintyFreshFilterDrawer)
customElements.define('minty-fresh-sort-drawer', MintyFreshSortDrawer)
customElements.define('minty-fresh-filter-input', MintyFreshFilterInput)