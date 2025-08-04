window.addEventListener('DOMContentLoaded', () => {

    // 'complete the set' in cart upsell replacament 
    const cartItems = document.querySelectorAll('cart-items .cart-item')

    cartItems.forEach((item) => {
        const data = JSON.parse(item.dataset.json)
        console.log('///////////////////')
        console.log(data) 
    })
})