class MintyFreshFilters extends HTMLElement {
  constructor() {
    super()

    this.querySelector('#toggle-grid').addEventListener('click', this.toggleGridView)
    this.querySelector('#toggle-filter-drawer').addEventListener('click', this.toggleFilterDrawer)
    this.querySelector('#toggle-sort-drawer').addEventListener('click', this.toggleSortDrawer)
  }

  toggleGridView() {    
    this.classList.toggle('collection-view')
    this.classList.toggle('grid-view')
  }

  toggleFilterDrawer(){
    console.log('toggling filter drawer')
  }

  toggleSortDrawer() {
    console.log('toggling sort drawer')
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`)
  }
}

customElements.define('minty-fresh-filters', MintyFreshFilters)

