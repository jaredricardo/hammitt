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
      <upsell-item-fake class="upsell relative swiper-slide" data-title="${product.title}">
        <a data-id="${product.variants[0].id}" href="/products/${product.handle}" class="link--fill-parent">
          <span class="visually-hidden">Link to ${product.title}</span>
        </a>
        <div class="upsell__image"><img src="${product.featured_image}" width="100%" alt="${product.title}"></div>
        <div class="upsell__title">${product.title}</div>
        <div class="upsell__price">${formatPrice(product.price)}</div>
      </upsell-item-fake>
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