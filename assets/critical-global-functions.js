async function buildCompleteTheSetInCart() {

  const cartItems = document.querySelectorAll('cart-items .cart-item:not(.fake-cart-item)')
  let completeTheSetProducts, referenceProductId = null

  if (!cartItems) return

  for (const cartItem of cartItems) {
    const json = JSON.parse(cartItem.dataset.json)
    const productRecommendationFetchUrl = `${window.Shopify.routes.root}recommendations/products.json?product_id=${json.product_id}&limit=6&intent=complementary`
    const response = await fetch(productRecommendationFetchUrl)
    const data = await response.json()
    if (data && data.products.length > 0) {
      completeTheSetProducts = data.products
      referenceProductId = json.product_id
      break
    }
  }

  let upsellHeaderTarget = document.querySelector('cart-upsells ul .tab-item a[data-heading="You May Also Like"]')
  const upsellProductContainer = document.querySelector('cart-upsells .tab-content .swiper[data-heading-target="You May Also Like"]')

  if (!upsellHeaderTarget || !upsellProductContainer || !completeTheSetProducts || !referenceProductId) return

  let swiperJson = JSON.parse(upsellProductContainer.dataset.json)

  swiperJson.scrollbar.el = '.swiper-scrollbar--complete-the-set'
  upsellHeaderTarget.setAttribute('data-href', 'complete-the-set')

  upsellHeaderTarget.innerText = 'Complete the Set'

  // build and init swiper inside that specific upsellProductContainer

  const swiperContainer = document.createElement('div')
  const swiperWrapper = document.createElement('div')
  const swiperScrollbar = document.createElement('div')

  swiperContainer.classList = 'swiper complete-the-set'
  swiperContainer.setAttribute('data-target', 'complete-the-set')
  swiperWrapper.classList = 'horizontal-scroller__upsell swiper-wrapper'
  swiperScrollbar.classList = 'swiper-scrollbar swiper-scrollbar--complete-the-set'

  completeTheSetProducts.forEach((product) => {

    if(!product.available || product.id == referenceProductId) return

    const productHtml = `
      <upsell-item class="upsell cts relative swiper-slide" data-title="${product.title}">
        <a data-id="${product.variants[0].id}" href="/products/${product.handle}" class="quick-add-btn link--fill-parent seventy">
          <span class="visually-hidden">Link to ${product.title}</span>
        </a>
        <div class="upsell__image">
          <img src="${product.featured_image}" width="100%" alt="${product.title}">
          <svg class="icon-plus" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" stroke="black"/>
            <path d="M7.37255 7.37255V4H8.60784V7.37255H12V8.60784H8.60784V12H7.37255V8.60784H4V7.37255H7.37255Z" fill="black"/>
          </svg>
        </div>
        <a href="${product.url}">
          <div class="upsell__title">${product.title}</div>
        </a>
        <div class="upsell__price">${formatPrice(product.price)}</div>
      </upsell-item>
    `
    swiperWrapper.innerHTML += productHtml
  })

  swiperContainer.appendChild(swiperWrapper)
  swiperContainer.appendChild(swiperScrollbar)

  upsellProductContainer.parentElement.prepend(swiperContainer)
  upsellProductContainer.remove()

  const swiper = new Swiper('.complete-the-set', swiperJson)
  swiper.init()

}

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price / 100);
}

// this needs to be converted into a web component later, as th event listener is being lost when the ajax call reloads the pdp buybox section
function initInspiredAppClickListener() {
  const inspiredAppOpener = document.querySelector('.inspired-app-opener')

  inspiredAppOpener?.addEventListener('click', () => {
    const widget = document.querySelector('inspired-floating-widget')
    const shadowRoot = widget?.shadowRoot
    if (!shadowRoot) return
    shadowRoot.querySelector('.inspired-floating').click()
  })
}

function initImgModelHeight() {
  const desktopImgContainer = document.querySelector('li.grid__item:has(img[alt*="Model height"])')
  const mobileImgContainer = document.querySelector('#product__mobile-images .swiper-slide:has(img[alt*="Model height"]) .media')
  let contentDesktop
  let contentMobile

  if(desktopImgContainer) {
    contentDesktop = desktopImgContainer.querySelector('img').getAttribute('alt')
    desktopImgContainer.style.setProperty("--content", `"${contentDesktop}"`);
  }
  if(mobileImgContainer) {
    contentMobile = mobileImgContainer.querySelector('img').getAttribute('alt')
    mobileImgContainer.style.setProperty("--content", `"${contentMobile}"`);
  }
}

function setRecentlyViewedNav(refreshingStorage = true) {
  
  const recentlyViewedButton = document.querySelector('.recently-viewed-button')
  const recentlyViewedCount = recentlyViewedButton?.querySelector('.recently-viewed-count')
  const recentlyViewedNav = document.querySelector('.recently-viewed-nav')
  const recentlyViewedNavList = recentlyViewedNav?.querySelector('.recently-viewed-products-list')

  if (!recentlyViewedButton || !recentlyViewedCount || !recentlyViewedNav) return

  const storage = JSON.parse(localStorage.getItem('_rv'))
  const currentCount = storage.length || 0

  if(currentCount === 0) {
    recentlyViewedCount.classList.add('hidden')
    recentlyViewedCount.innerText = '0'
    // set state of nav 
    return
  }

  // set up nav

  storage.forEach((product, i) =>{
    if(i >= 5) return
    recentlyViewedNavList.innerHTML += `
      <li>
        <div class="recently-viewed-card">
            <a href="/products/${product.handle}">
              <img src="${product.featured_image}" alt="Recently Viewed Product">
              <div class="info-container">
                <div class="price-title">
                  <h3 class="product-title">${product.product_title_type}</h3>
                  <h3 class="product-price">${window.formatPrice(product.price)}</h3>
                </div>
                <p class="color-descriptor">${product.product_title_color_descriptor}</p>
              </div>
            </a>
        </div>
      </li>`
  })

  // needed to add this check as when the function is called on storage update, it was adding multiple event listeners
  if(!refreshingStorage) {
    recentlyViewedButton.addEventListener('click', (e) => {
      e.preventDefault()
      recentlyViewedNav.classList.remove('hidden')
    })
    recentlyViewedButton.addEventListener('mouseenter', () => {
      recentlyViewedNav.classList.remove('hidden')
    })
    recentlyViewedNav.addEventListener('mouseleave', () => {
      recentlyViewedNav.classList.add('hidden')
    })
  }

  recentlyViewedCount.classList.remove('hidden')
  recentlyViewedCount.innerText = currentCount

}

class xGenSearchResult extends HTMLElement {
  constructor() {
    super()
    this.addEventListener('click', this.trackClick)
  }
  trackClick() {

    const query = this.dataset.query
    const queryId = this.dataset.queryId
    const deploymentId = this.dataset.deploymentId
    const item = this.dataset.item
  
    if(!query || !queryId || !deploymentId || !item) return

    xg.track.pageView({ locale: "en_US"})
    xg.track.searchClick({query, queryId, deploymentId, item})
  } 
}

customElements.define('x-gen-search-result', xGenSearchResult)

window.buildCompleteTheSetInCart = buildCompleteTheSetInCart
window.formatPrice = formatPrice
window.initInspiredAppClickListener = initInspiredAppClickListener
window.initImgModelHeight = initImgModelHeight
window.setRecentlyViewedNav = setRecentlyViewedNav
