window.addEventListener('DOMContentLoaded', () => {
    window.buildCompleteTheSetInCart()
    window.setRecentlyViewedNav(false)

    // temprorary clearing of the _rv cookie to avoid 400 NGINX error for users in the past
    // who had viewed the right combination of products that caused the issue
    window.document.cookie = '_rv=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

})

window.addEventListener('load', () => {
    window.initInspiredAppClickListener()
})