window.addEventListener('DOMContentLoaded', () => {

  // due to some crazy z-index issues with the header, we need to move the drawers to the header on load

  const filterDrawer = document.querySelector('minty-fresh-filter-drawer')
  const sortDrawer = document.querySelector('minty-fresh-sort-drawer')
  const targetInsert = document.querySelector('header.header')

  targetInsert.insertAdjacentElement('afterend', filterDrawer)
  targetInsert.insertAdjacentElement('afterend', sortDrawer)
  
})

window.onload = function () {
  console.log('loaded new filter !!!! init range')
  slideMin()
  slideMax()
}

const minVal = document.querySelector(".min-val");
const maxVal = document.querySelector(".max-val");
const priceInputMin = document.querySelector(".min-input");
const priceInputMax = document.querySelector(".max-input");
const minTooltip = document.querySelector(".min-tooltip");
const maxTooltip = document.querySelector(".max-tooltip");
const minGap = 1500;
const range = document.querySelector(".slider-track");
const sliderMinValue = parseInt(minVal.min);
const sliderMaxValue = parseInt(maxVal.max);

function slideMin() {
  let gap = parseInt(maxVal.value) - parseInt(minVal.value);
  console.log(gap)
}

function slideMax() {
  let gap = parseInt(maxVal.value) - parseInt(minVal.value);
  console.log(gap)
}

function setArea() {
  range.style.left = `${
    ((minVal.value - sliderMinValue) / (sliderMaxValue - sliderMinValue)) * 100
  }%`;

  range.style.left = (minVal.value / sliderMaxValue) * 100 + "%";
  minTooltip.style.left = (minVal.value / sliderMaxValue) * 100 + "%";
  range.style.right = `${
    100 -
    ((maxVal.value - sliderMinValue) / (sliderMaxValue - sliderMinValue)) * 100
  }%`;
  maxTooltip.style.right = 100 - (maxVal.value / sliderMaxValue) * 100 + "%";
}

function setMinInput() {
  let minPrice = parseInt(priceInputMin.value);
}

function setMaxInput() {
  let maxPrice = parseInt(priceInputMax.value);
}

class MintyFreshFilters extends HTMLElement {
  constructor() {
    super()
    this.querySelector('#toggle-grid').addEventListener('click', this.toggleGridView)
    this.querySelector('#toggle-filter-drawer').addEventListener('click', this.openFilterDrawer)
    this.querySelector('#toggle-sort-drawer').addEventListener('click', this.openSortDrawer)
    this.querySelector('#close-filter-drawer').addEventListener('click', this.closeFilterDrawer)
  }

  toggleGridView() {    
    this.classList.toggle('collection-view')
    this.classList.toggle('grid-view')
  }

  openFilterDrawer(){
    document.querySelector('minty-fresh-filter-drawer').classList.add('filter-drawer-open')
    document.querySelector('minty-fresh-filter-drawer').classList.remove('sort-drawer-open')
  }

  openSortDrawer() {
    document.querySelector('minty-fresh-sort-drawer').classList.add('sort-drawer-open')
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
  }
}

class MintyFreshSortDrawer extends HTMLElement {
  constructor() {
    super()

  }

}

class MintyFreshFilterInput extends HTMLElement {
  constructor() {
    super()

  }

}

customElements.define('minty-fresh-filters', MintyFreshFilters)
customElements.define('minty-fresh-filter-drawer', MintyFreshFilterDrawer)
customElements.define('minty-fresh-sort-drawer', MintyFreshSortDrawer)
customElements.define('minty-fresh-filter-input', MintyFreshFilterInput)