async function buildCompleteTheSetInCart() {

  const cartItems = document.querySelectorAll('cart-items .cart-item')
  let completeTheSetProducts, referenceProductId = null

  if (!cartItems) return

  for (const cartItem of cartItems) {
    const json = JSON.parse(cartItem.dataset.json);
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
  }).format(price / 100);
}

window.buildCompleteTheSetInCart = buildCompleteTheSetInCart
window.formatPrice = formatPrice