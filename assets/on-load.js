window.addEventListener('DOMContentLoaded', () => {
    window.buildCompleteTheSetInCart()
    window.setRecentlyViewedNav(false)


    // temprorary clearing of the _rv cookie to avoid 400 NGINX error for users in the past
    // who had viewed the right combination of products that caused the issue
    window.document.cookie = '_rv=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

    // Clear X-Gen cookies on load if not already
    const xgenCookies = ['xgen_session', 'xgen_token', 'xgen_user']
    const lastFlushDate = localStorage.getItem('dateOfLastXGenCookieFlush')

    if (!lastFlushDate) {
        const commonPaths = [
            '/',
            '/products/',
            '/collections/',
            '/cart/',
            '/search/',
            '/pages/',
            '/account/',
            '/checkout/'
        ]

        const commonDomains = [
            '',  
            '.hammitt.com',
            'hammitt.com',
            'www.hammitt.com'
        ]

        xgenCookies.forEach(cookieName => {
            commonPaths.forEach(path => {
                commonDomains.forEach(domain => {
                    const domainPart = domain ? `; domain=${domain}` : ''
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domainPart};`
                })
            })
        })

        localStorage.setItem('dateOfLastXGenCookieFlush', new Date().toISOString());
    }

})

window.addEventListener('load', () => {
    window.initInspiredAppClickListener()
})