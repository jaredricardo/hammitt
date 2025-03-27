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
    this.closest('minty-fresh-filters').classList.add('filter-drawer-open')
    this.closest('minty-fresh-filters').classList.remove('sort-drawer-open')
  }

  openSortDrawer() {
    this.closest('minty-fresh-filters').classList.add('sort-drawer-open')
    this.closest('minty-fresh-filters').classList.remove('filter-drawer-open')
  }

  closeFilterDrawer() {
    this.closest('minty-fresh-filters').classList.remove('filter-drawer-open')
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`)
  }
}

class MintyFreshFilterDrawer extends HTMLElement {
  constructor() {
    super()

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