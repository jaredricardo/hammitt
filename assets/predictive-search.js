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
    
    // Don't search if query is empty
    if (!searchTerm || searchTerm.length === 0) {
      // Show trending products when search is cleared
      document.querySelectorAll('.trending-now-product').forEach((li) => {
        li.classList.remove('hidden')
      })
      // Remove any existing search results
      document.querySelectorAll('.recent-or-trending-products .basic-product-card-template--li:not(.trending-now-product)').forEach((li) => {
        li.remove()
      })
      return
    }
    
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

    // Fetch Shopify Search & Discovery results and build UI
    const shopifyResults = await this.getShopifySearchResults(searchTerm)
    buildShopifySearchResults(shopifyResults, searchTerm)

    // Also fetch native Shopify predictive search for the main results section
    this.getSearchResults(searchTerm);
  }

  async getShopifySearchResults(searchTerm) {
    try {
      const response = await fetch(window.Shopify.routes.root + `search/suggest.json?q=${encodeURIComponent(searchTerm)}&resources[type]=product&resources[limit]=4&resources[options][unavailable_products]=hide&resources[options][fields]=title,product_type,variants.title`)
      
      if (!response.ok) {
        console.error(`Shopify API returned status: ${response.status}`)  
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Shopify API error: ${response.status}`)
      }

      const jsonResponse = await response.json()
      
      return jsonResponse
    } catch (error) {
      console.error('Error fetching Shopify predictive search results:', error)
      return null
    }
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
    // Don't search if query is empty
    if (!searchTerm || searchTerm.length === 0) {
      return
    }
    
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
  const deploymentId = 'ea9fc1d0-cb86-4dab-8aa3-1879b146fb8b'

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

    // add data for searchClick method for analytics
    simpleProductCard.querySelector('x-gen-search-result').setAttribute('data-query', searchTerm)
    simpleProductCard.querySelector('x-gen-search-result').setAttribute('data-query-id', response.queryId)
    simpleProductCard.querySelector('x-gen-search-result').setAttribute('data-deployment-id', deploymentId)
    simpleProductCard.querySelector('x-gen-search-result').setAttribute('data-item', result.prod_code)

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

function buildXGenSearchResults(xGenResponse, searchTerm) {
  // Check if Shopify variant is active - if so, skip X-Gen results
  if(document.body.classList.contains('shopify-search-test-variant')) {
    return
  }

  const targetContainer = document.querySelector('.initial-search-modal-content .recent-or-trending-products ul')
  const deploymentId = 'ea9fc1d0-cb86-4dab-8aa3-1879b146fb8b'

  if(!targetContainer) return

  // Get X-Gen results (first 4)
  const xGenResults = xGenResponse.items || []

  // Build redirect card if exists
  if(xGenResponse.urlRedirect) {
    buildRedirectCard(targetContainer, xGenResponse, searchTerm)
  }

  // Build X-Gen product cards (first 4)
  xGenResults.slice(0, 4).forEach((result, i) => {
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

    // add data for searchClick method for analytics
    simpleProductCard.querySelector('x-gen-search-result').setAttribute('data-query', searchTerm)
    simpleProductCard.querySelector('x-gen-search-result').setAttribute('data-query-id', xGenResponse.queryId)
    simpleProductCard.querySelector('x-gen-search-result').setAttribute('data-deployment-id', deploymentId)
    simpleProductCard.querySelector('x-gen-search-result').setAttribute('data-item', result.prod_code)

    simpleProductCard.classList.remove('inactive')
    simpleProductCard.classList.add('x-gen-search-result')
    targetContainer.appendChild(simpleProductCard)
  })
}

function buildShopifySearchResults(shopifyResponse, searchTerm) {
  const targetContainer = document.querySelector('.initial-search-modal-content .recent-or-trending-products ul')
  const recentOrTrendingHeader = document.querySelector('.initial-search-modal-content .recent-or-trending-products h4')
  const linkToAllQueryResults = document.querySelector('.initial-search-modal-content .rot-header-container a')
  const noResults = document.querySelector('.number-of-x-gen-results')
  const cardTemplate = document.querySelector('[data-basic-card-template]:not(.trending-now-product)')

  // Hide default suggested products
  targetContainer.querySelectorAll('li').forEach((li) =>{
    if(li.classList.contains('trending-now-product')) {
      li.classList.add('hidden')
    } else {
      li.remove()
    }
  })
  
  if(recentOrTrendingHeader) {
    recentOrTrendingHeader.innerText = 'Top Products'
  }

  // Get Shopify results (first 4)
  const shopifyResults = shopifyResponse?.resources?.results?.products || []

  // Check if we have any results
  if(shopifyResults.length === 0) {
    if(noResults) {
      noResults.classList.remove('inactive')
      noResults.innerText = 'No results found'
      if(searchTerm.length === 0 ) {
        noResults.classList.add('inactive')
      }
    }
    if(document.querySelector('.predictive-search-spinner')) {
      document.querySelector('.predictive-search-spinner').remove()
    }
    document.querySelectorAll('.trending-now-product').forEach((li) => {
      li.classList.remove('hidden')
    })
    return
  }

  // Build Shopify product cards (first 4)
  shopifyResults.slice(0, 4).forEach((product, i) => {
    const simpleProductCard = cardTemplate.cloneNode(true)

    simpleProductCard.querySelector('.card-image img').src = product.featured_image?.url || product.image
    simpleProductCard.querySelector('.card-image img').alt = product.title
    simpleProductCard.querySelector('.product-title').innerText = product.title

    // Shopify products don't have color descriptor in this response
    if(simpleProductCard.querySelector('.product-color')) {
      simpleProductCard.querySelector('.product-color').innerText = ''
    }

    simpleProductCard.querySelector('a').href = product.url

    // Remove X-Gen specific attributes for Shopify results
    if(simpleProductCard.querySelector('x-gen-search-result')) {
      simpleProductCard.querySelector('x-gen-search-result').removeAttribute('data-query')
      simpleProductCard.querySelector('x-gen-search-result').removeAttribute('data-query-id')
      simpleProductCard.querySelector('x-gen-search-result').removeAttribute('data-deployment-id')
      simpleProductCard.querySelector('x-gen-search-result').removeAttribute('data-item')
    }

    simpleProductCard.classList.remove('inactive')
    simpleProductCard.classList.add('shopify-search-result')
    targetContainer.appendChild(simpleProductCard)
  })

  // Update "View All" link
  if(shopifyResults.length > 4) {
    linkToAllQueryResults.classList.remove('inactive')
    linkToAllQueryResults.href = `/search?q=${searchTerm}&type=product`
    linkToAllQueryResults.innerText = `View All`
  } else {
    linkToAllQueryResults.classList.add('inactive')
  }

  // Remove spinner
  if(document.querySelector('.predictive-search-spinner')) {
    document.querySelector('.predictive-search-spinner').remove()
  }
}

window.buildShopifySearchResults = buildShopifySearchResults

/* ============================================================================
   UNUSED X-GEN SEARCH FUNCTIONS - PRESERVED FOR POSSIBLE FUTURE USE
   ============================================================================
   These functions were used for X-Gen search integration but are currently
   not in use. Shopify Search & Discovery has been found to provide better
   results. Keep these functions for reference or future A/B testing.
   ============================================================================ */

/**
 * UNUSED: Build X-Gen search results in the predictive search dropdown
 * @param {Object} xGenResponse - Response from X-Gen API
 * @param {String} searchTerm - User's search query
 */
function buildXGenSearchResults_UNUSED(xGenResponse, searchTerm) {
  const targetContainer = document.querySelector('.initial-search-modal-content .recent-or-trending-products ul')
  const deploymentId = 'ea9fc1d0-cb86-4dab-8aa3-1879b146fb8b'

  if(!targetContainer) return

  // Get X-Gen results (first 4)
  const xGenResults = xGenResponse.items || []

  // Build redirect card if exists
  if(xGenResponse.urlRedirect) {
    buildRedirectCard(targetContainer, xGenResponse, searchTerm)
  }

  // Build X-Gen product cards (first 4)
  xGenResults.slice(0, 4).forEach((result, i) => {
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

    // add data for searchClick method for analytics
    simpleProductCard.querySelector('x-gen-search-result').setAttribute('data-query', searchTerm)
    simpleProductCard.querySelector('x-gen-search-result').setAttribute('data-query-id', xGenResponse.queryId)
    simpleProductCard.querySelector('x-gen-search-result').setAttribute('data-deployment-id', deploymentId)
    simpleProductCard.querySelector('x-gen-search-result').setAttribute('data-item', result.prod_code)

    simpleProductCard.classList.remove('inactive')
    simpleProductCard.classList.add('x-gen-search-result')
    targetContainer.appendChild(simpleProductCard)
  })
}

/**
 * UNUSED: Build combined X-Gen and Shopify search results (for A/B testing)
 * @param {Object} xGenResponse - Response from X-Gen API
 * @param {Object} shopifyResponse - Response from Shopify Search API
 * @param {String} searchTerm - User's search query
 */
function buildCombinedSearchResults_UNUSED(xGenResponse, shopifyResponse, searchTerm) {
  const targetContainer = document.querySelector('.initial-search-modal-content .recent-or-trending-products ul')
  const recentOrTrendingHeader = document.querySelector('.initial-search-modal-content .recent-or-trending-products h4')
  const linkToAllQueryResults = document.querySelector('.initial-search-modal-content .rot-header-container a')
  const noResults = document.querySelector('.number-of-x-gen-results')

  if(!targetContainer) return

  // Hide default suggested products
  targetContainer.querySelectorAll('li').forEach((li) =>{
    if(li.classList.contains('trending-now-product')) {
      li.classList.add('hidden')
    } else {
      li.remove()
    }
  })
  
  recentOrTrendingHeader.innerText = 'Top Products'

  // Get results counts
  const xGenResults = xGenResponse.items || []
  const shopifyResults = shopifyResponse?.resources?.results?.products || []

  // Check if we have any results
  if(xGenResults.length === 0 && shopifyResults.length === 0 && !xGenResponse.urlRedirect) {
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

  // Build X-Gen results (4 cards)
  buildXGenSearchResults_UNUSED(xGenResponse, searchTerm)

  // Build Shopify results (4 cards) 
  // Note: Would need to modify buildShopifySearchResults to not handle UI setup
  // when used in combined mode

  // Update "View All" link
  const totalResults = xGenResults.length + shopifyResults.length
  if(totalResults > 8) {
    linkToAllQueryResults.classList.remove('inactive')
    linkToAllQueryResults.href = `/search?q=${searchTerm}&type=product`
    linkToAllQueryResults.innerText = `View All (${totalResults})`
  } else {
    linkToAllQueryResults.classList.add('inactive')
  }

  // Remove spinner
  if(document.querySelector('.predictive-search-spinner')) {
    document.querySelector('.predictive-search-spinner').remove()
  }
}

/**
 * UNUSED: Example of how to fetch X-Gen results in onChange method
 * 
 * async onChange() {
 *   const searchTerm = this.getQuery()
 *   
 *   // Fetch X-Gen results
 *   const xGenResults = await xg.search.getResults({
 *     query: searchTerm, 
 *     options: {
 *       collection: 'default', 
 *       deploymentId:'ea9fc1d0-cb86-4dab-8aa3-1879b146fb8b'
 *     }
 *   })
 *   
 *   // Build X-Gen only
 *   buildXGenSearchResults_UNUSED(xGenResults, searchTerm)
 *   
 *   // Or build combined with Shopify
 *   const shopifyResults = await this.getShopifySearchResults(searchTerm)
 *   buildCombinedSearchResults_UNUSED(xGenResults, shopifyResults, searchTerm)
 * }
 */
