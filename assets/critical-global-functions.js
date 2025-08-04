// functions that need to load immediately and on almost every page

function checkCartForCompleteTheSet(){

  const cartItems = document.querySelectorAll('cart-items .cart-item')

  if(!cartItems) return

  cartItems.forEach((item) => {
        console.log('//////////////')
        const json = JSON.parse(item.dataset.json)
        console.log(json)
        const productRecommendationFetchUrl = `${window.Shopify.routes.root}recommendations/products.json?product_id=${json.product_id}&limit=6&intent=complementary` 
        fetch(productRecommendationFetchUrl)
          .then(response => response.json())
          .then(data => {
            console.log('+++++++++++')
            console.log(data)
            // Here you can handle the product recommendations as needed
          })
          .catch(error => {
            console.error('Error fetching product recommendations:', error)
          })
  })
}

window.checkCartForCompleteTheSet = checkCartForCompleteTheSet;