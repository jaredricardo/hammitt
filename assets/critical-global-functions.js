// functions that need to load immediately and on almost every page

async function checkCartForCompleteTheSet() {
  const cartItems = document.querySelectorAll('cart-items .cart-item')
  if (!cartItems) return

  for (const cartItem of cartItems) {
    const json = JSON.parse(cartItem.dataset.json);
    const productRecommendationFetchUrl = `${window.Shopify.routes.root}recommendations/products.json?product_id=${json.product_id}&limit=6&intent=complementary`
    const response = await fetch(productRecommendationFetchUrl)
    const data = await response.json()
    if (data && data.products.length > 0) {
      buildCompleteTheSetInCart(data.products, json.product_id)
      break
    }
  }
}


function buildCompleteTheSetInCart(completeTheSetProducts, referenceProductId) {

  const upsellHeaderTarget = document.querySelector('cart-upsells ul .tab-item a[data-heading="You May Also Like"]')
  const upsellProductContainer = document.querySelector('cart-upsells .tab-content .swiper[data-heading-target="You May Also Like"]')

  if (!upsellHeaderTarget || !upsellProductContainer) return

  const swiperJson = upsellProductContainer.dataset.json

  upsellHeaderTarget.innerText = 'Complete the Set'

  // build and init swiper inside that specific upsellProductContainer

  const swiperContainer = document.createElement('div')

  completeTheSetProducts.forEach((product) => {
    if(!product.available || product.id == referenceProductId) return
    const productHtml = `
      <div class="horizontal-scroller__upsell swiper-wrapper">
        <upsell-item class="upsell relative swiper-slide" data-title="${product.title}">
          <a data-id="${product.variants[0].id}" href="/products/${product.handle}" class="link--fill-parent">
            <span class="visually-hidden">Link to ${product.title}</span>
          </a>
          <div class="upsell__image"><img src="${product.featured_image}" width="100%" alt="${product.title}"></div>
          <div class="upsell__title">${product.title}</div>
          <div class="upsell__price">${product.price}</div>
        </upsell-item>
      <div class="swiper-scrollbar"></div>
    `
    swiperContainer.innerHTML += productHtml
  })
  
  // TO DO:
  //  - format prices
  //  - init swiper after product are added
  //  - call check cart function on cart update

  swiperContainer.classList = 'swiper complete-the-set'
  upsellProductContainer.parentElement.prepend(swiperContainer)
  upsellProductContainer.remove()
}

window.checkCartForCompleteTheSet = checkCartForCompleteTheSet