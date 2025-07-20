/* eslint-disable */
class PredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.cachedResults = {};
    this.input = this.querySelector('input[type="search"]');
    this.predictiveSearchResults = this.querySelector('[data-predictive-search]');
    this.isOpen = false;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const form = this.querySelector('form.search');
    form.addEventListener('submit', this.onFormSubmit.bind(this));

    this.input.addEventListener('input', debounce((event) => {
      this.onChange(event);
    }, 300).bind(this));
    this.input.addEventListener('focus', this.onFocus.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    // this.addEventListener('keyup', this.onKeyup.bind(this));
    // this.addEventListener('keydown', this.onKeydown.bind(this));
  }

  getQuery() {
    return this.input.value.trim();
  }

  async onChange() {
    const searchTerm = this.getQuery();

    if (!searchTerm.length) {
      this.close(true);
      return;
    }

    const results = await xg.search.getResults({
      query: searchTerm, 
        options: {
          collection: 'default', 
          deploymentId:'acf20249-770a-4e8f-8407-ab4c8527df46'
        }
    })    

     buildXGenSearchResultsForSearchHeader(results.items, searchTerm);

    //  old get search results method turned off for now
    // this.getSearchResults(searchTerm);
  }

  onFormSubmit(event) {
    if (!this.getQuery().length || this.querySelector('[aria-selected="true"] a')) event.preventDefault();
  }

  onFocus() {
    const searchTerm = this.getQuery();

    if (!searchTerm.length) return;

    if (this.getAttribute('results') === 'true') {
      this.open();
    } else {
      this.getSearchResults(searchTerm);
    }
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    })
  }

  onKeyup(event) {
    if (!this.getQuery().length) this.close(true);
    event.preventDefault();

    switch (event.code) {
      case 'ArrowUp':
        this.switchOption('up')
        break;
      case 'ArrowDown':
        this.switchOption('down');
        break;
      case 'Enter':
        this.selectOption();
        break;
    }
  }

  onKeydown(event) {
    // Prevent the cursor from moving in the input when using the up and down arrow keys
    if (
      event.code === 'ArrowUp' ||
      event.code === 'ArrowDown'
    ) {
      event.preventDefault();
    }
  }

  switchOption(direction) {
    if (!this.getAttribute('open')) return;

    const moveUp = direction === 'up';
    const selectedElement = this.querySelector('[aria-selected="true"]');
    const allElements = this.querySelectorAll('li');
    let activeElement = this.querySelector('li');

    if (moveUp && !selectedElement) return;

    this.statusElement.textContent = '';

    if (!moveUp && selectedElement) {
      activeElement = selectedElement.nextElementSibling || allElements[0];
    } else if (moveUp) {
      activeElement = selectedElement.previousElementSibling || allElements[allElements.length - 1];
    }

    if (activeElement === selectedElement) return;

    activeElement.setAttribute('aria-selected', true);
    if (selectedElement) selectedElement.setAttribute('aria-selected', false);

    this.setLiveRegionText(activeElement.textContent);
    this.input.setAttribute('aria-activedescendant', activeElement.id);
  }

  selectOption() {
    const selectedProduct = this.querySelector('[aria-selected="true"] a, [aria-selected="true"] button');

    if (selectedProduct) selectedProduct.click();
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(" ", "-").toLowerCase();
    this.setLiveRegionLoadingState();

    if (this.cachedResults[queryKey]) {
      this.renderSearchResults(this.cachedResults[queryKey]);
      return;
    }

    fetch(`${routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&${encodeURIComponent('resources[type]')}=product&${encodeURIComponent('resources[limit]')}=4&section_id=predictive-search`)
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status);
          this.close();
          throw error;
        }

        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-predictive-search').innerHTML;
        this.cachedResults[queryKey] = resultsMarkup;
        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        this.close();
        throw error;
      });
  }

  setLiveRegionLoadingState() {
    this.statusElement = this.statusElement || this.querySelector('.predictive-search-status');
    this.loadingText = this.loadingText || this.getAttribute('data-loading-text');

    this.setLiveRegionText(this.loadingText);
    this.setAttribute('loading', true);
  }

  setLiveRegionText(statusText) {
    this.statusElement.setAttribute('aria-hidden', 'false');
    this.statusElement.textContent = statusText;

    setTimeout(() => {
      this.statusElement.setAttribute('aria-hidden', 'true');
    }, 1000);
  }

  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = this.cleanSearchResultURLs(resultsMarkup);
    this.setAttribute('results', true);

    this.setLiveRegionResults();
    this.open();
  }

  cleanSearchResultURLs(resultsMarkup) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = resultsMarkup;
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
      const cleanHref = link.getAttribute('href').replace(/(\?[^"]+)/g, '');
      link.setAttribute('href', cleanHref);
    });
    return tempDiv.innerHTML;
  }

  setLiveRegionResults() {
    this.removeAttribute('loading');
    this.setLiveRegionText(this.querySelector('[data-predictive-search-live-region-count-value]').textContent);
  }

  getResultsMaxHeight() {
    this.resultsMaxHeight = window.innerHeight - document.getElementById('shopify-section-header').getBoundingClientRect().bottom;
    return this.resultsMaxHeight;
  }

  open() {
    this.predictiveSearchResults.style.maxHeight = this.resultsMaxHeight || `${this.getResultsMaxHeight()}px`;
    this.setAttribute('open', true);
    this.input.setAttribute('aria-expanded', true);
    this.isOpen = true;
  }

  close(clearSearchTerm = false) {
    if (clearSearchTerm) {
      this.input.value = '';
      this.removeAttribute('results');
    }

    const selected = this.querySelector('[aria-selected="true"]');

    if (selected) selected.setAttribute('aria-selected', false);

    this.input.setAttribute('aria-activedescendant', '');
    this.removeAttribute('open');
    this.input.setAttribute('aria-expanded', false);
    this.resultsMaxHeight = false
    this.predictiveSearchResults.removeAttribute('style');

    this.isOpen = false;
  }
}

customElements.define('predictive-search', PredictiveSearch);

function buildXGenSearchResultsForSearchHeader(resultsArr, searchTerm) {

  const targetContainer = document.querySelector('.initial-search-modal-content .recent-or-trending-products ul')
  const recentOrTrendingHeader = document.querySelector('.initial-search-modal-content .recent-or-trending-products h4')
  const linkToAllQueryResults = document.querySelector('.initial-search-modal-content .rot-header-container a')

  if(!targetContainer) return

  targetContainer.querySelectorAll('li').forEach((li) =>{li.remove()})
  recentOrTrendingHeader.innerText = 'Top Products'

  if(resultsArr.length == 0) {
      const noResults = document.createElement('li')
      noResults.innerText = 'No results found'
      targetContainer.appendChild(noResults)
      return
  }

  resultsArr.forEach((result, i ) => {

    if(i > 3) return
    
    let formattedProductTitle = result.prod_name
    let productSize = result.metafields.hammitt.size || null
    let productColorDescriptor = result.metafields.custom.product_title_color_descriptor || null
    let productTitleType = result.metafields.custom.product_title_type || null
    let useDescriptor = false

    if(productSize !== null && productColorDescriptor !== null && productTitleType !== null) {

      let finalSizeString = ''

      switch(productSize) {
        case 'Small':
          finalSizeString = 'sml'
          break
        case 'Medium':
          finalSizeString = "med"
          break
        case 'Large':
          finalSizeString = "lrg"
          break
        case 'Extra Large':
          finalSizeString = "xl"
          break
        default:
          finalSizeString = productSize
      }

      formattedProductTitle = `${productTitleType} ${finalSizeString}`
      useDescriptor = true   
    }

    const simpleProductCard = document.querySelector('[data-basic-card-template]').cloneNode(true)

    simpleProductCard.classList.remove('inactive')

    simpleProductCard.querySelector('.card-image img').src = result.featured_image.src
    simpleProductCard.querySelector('.card-image img').alt = result.prod_name
    simpleProductCard.querySelector('.product-title').innerText = formattedProductTitle

    if(useDescriptor) {
        simpleProductCard.querySelector('.product-color').innerText = productColorDescriptor
    }

    simpleProductCard.querySelector('a').href = result.product_url

    targetContainer.appendChild(simpleProductCard)
  })

  if(resultsArr.length > 3) {
    linkToAllQueryResults.classList.remove('inactive')
    linkToAllQueryResults.href = `/search?q=${searchTerm}&type=product`
    linkToAllQueryResults.innerText = `View All (${resultsArr.length})`
  } else {
    linkToAllQueryResults.classList.add('inactive')
  }

}
