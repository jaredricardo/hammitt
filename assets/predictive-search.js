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
    }, 350).bind(this));
    this.input.addEventListener('focus', this.onFocus.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    // this.addEventListener('keyup', this.onKeyup.bind(this));
    // this.addEventListener('keydown', this.onKeydown.bind(this));
  }

  getQuery() {
    return this.input.value.trim();
  }

  async onChange() {
    const searchTerm = this.getQuery()
    const numXGenSearchResults = document.querySelector('.number-of-x-gen-results')
    
    const loader = `
    <div class="loading-overlay__spinner predictive-search-spinner">
        <svg aria-hidden="true" focusable="false" role="presentation" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
          <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
        </svg>
    </div>`
    const tempLi = document.createElement('li')

    document.querySelectorAll('.recent-or-trending-products .basic-product-card-template--li').forEach((li) => {
      if(li.classList.contains('trending-now-product')) {
        li.classList.add('hidden')
      } else {
        li.remove();
      }
    })

    if(!document.querySelector('.predictive-search-spinner')) {
      tempLi.innerHTML = loader
      document.querySelector('.initial-search-modal-content .recent-or-trending-products ul').appendChild(tempLi)
    }

    const results = await xg.search.getResults({
      query: searchTerm, 
        options: {
          collection: 'default', 
          deploymentId:'ea9fc1d0-cb86-4dab-8aa3-1879b146fb8b'
        }
    })    

    console.log('//////// ' + searchTerm + ' ////////')
    console.log(results)
    buildXGenSearchResultsForSearchHeader(results, searchTerm)

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

function buildXGenSearchResultsForSearchHeader(response, searchTerm) {

  const resultsArr = response.items
  const targetContainer = document.querySelector('.initial-search-modal-content .recent-or-trending-products ul')
  const recentOrTrendingHeader = document.querySelector('.initial-search-modal-content .recent-or-trending-products h4')
  const linkToAllQueryResults = document.querySelector('.initial-search-modal-content .rot-header-container a')
  const noResults = document.querySelector('.number-of-x-gen-results')

  // 0 indexed number of product cards to show, if there is a url redirect, we are going to insert a fake cart at the front so need one less. 
  let numProductCardsNeeded = response.urlRedirect ? 2 : 3

  if(!targetContainer) return

  // hide default suggested products

  targetContainer.querySelectorAll('li').forEach((li) =>{
    if(li.classList.contains('trending-now-product')) {
      // hide trending now products for later usage if there are no results
      li.classList.add('hidden')
    } else {
      // remove added product from previous build results
      li.remove()
    }
  })
  
  recentOrTrendingHeader.innerText = 'Top Products'

  if(resultsArr.length == 0 || searchTerm.length == 0) {
    if(!response.urlRedirect) {
      noResults.classList.remove('inactive')
      noResults.innerText = 'No results found'
      if(searchTerm.length === 0 ) {
        noResults.classList.add('inactive')
      }
      if(document.querySelector('.predictive-search-spinner')) {
        document.querySelector('.predictive-search-spinner').remove()
      }
      document.querySelectorAll('.trending-now-product').forEach((li) => {
        li.classList.remove('hidden')
      })
      return
    }
  }

  if(response.urlRedirect) {
    buildRedirectCard(targetContainer, response, searchTerm)
  }

  resultsArr.forEach((result, i) => {

    if(i > numProductCardsNeeded) return
    
    let formattedProductTitle = result.prod_name
    let productSize = result.metafields?.hammitt?.size || null
    let productColorDescriptor = result.metafields?.custom?.product_title_color_descriptor || null
    let productTitleType = result.metafields?.custom?.product_title_type || null
    let useDescriptor = false

    if(productColorDescriptor !== null && productTitleType !== null) {

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
        case 'One Size':
          finalSizeString = ""
          break
        default:
          finalSizeString = ""
      }

      formattedProductTitle = `${productTitleType} ${finalSizeString}`
      useDescriptor = true   
    }

    const simpleProductCard = document.querySelector('[data-basic-card-template]:not(.trending-now-product)').cloneNode(true)

    simpleProductCard.querySelector('.card-image img').src = result.featured_image.src
    simpleProductCard.querySelector('.card-image img').alt = result.prod_name
    simpleProductCard.querySelector('.product-title').innerText = formattedProductTitle

    if(useDescriptor) {
      simpleProductCard.querySelector('.product-color').innerText = productColorDescriptor
    }

    simpleProductCard.querySelector('a').href = result.product_url
    simpleProductCard.classList.remove('inactive')

    targetContainer.appendChild(simpleProductCard)
    
  })

  if(resultsArr.length > 3) {
    linkToAllQueryResults.classList.remove('inactive')
    linkToAllQueryResults.href = `/search?q=${searchTerm}&type=product`
    linkToAllQueryResults.innerText = `View All (${resultsArr.length})`
  } else {
    linkToAllQueryResults.classList.add('inactive')
  }
  if(document.querySelector('.predictive-search-spinner')) {
    document.querySelector('.predictive-search-spinner').remove()
  }
}

function buildRedirectCard(targetContainer, response, searchTerm){
  const simplePageResultCard = document.querySelector('[data-basic-card-template]:not(.trending-now-product)').cloneNode(true)
  simplePageResultCard.classList.remove('inactive')
  simplePageResultCard.querySelector('.card-image img').src = 'https://cdn.shopify.com/s/files/1/0661/5963/files/Group_1010.png?v=1753809853'
  simplePageResultCard.querySelector('.product-title').innerText = `${response.keyword}`
  simplePageResultCard.querySelector('a').href = response.urlRedirect
  document.querySelector('.initial-search-modal-content .recent-or-trending-products h4').innerText = `Other results for "${searchTerm}"`
  targetContainer.appendChild(simplePageResultCard)
}

window.buildRedirectCard = buildRedirectCard