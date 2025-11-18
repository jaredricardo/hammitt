window.addEventListener('DOMContentLoaded', () => {
    window.buildCompleteTheSetInCart()
    window.setRecentlyViewedNav(false)


    // temprorary clearing of the _rv cookie to avoid 400 NGINX error for users in the past
    // who had viewed the right combination of products that caused the issue
    window.document.cookie = '_rv=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

    // Clear X-Gen cookies on load if not already and not on search page
    const xgenCookies = ['xgen_session', 'xgen_token', 'xgen_user']
    const lastFlushDate = localStorage.getItem('dateOfLastXGenCookieFlush')
    const isSearchPage = window.location.href.includes('/search?')
    const nov17MidnightPST = new Date(Date.UTC(2025, 10, 17, 8, 0, 0)).getTime()
    const shouldFlush = !lastFlushDate || new Date(lastFlushDate).getTime() < nov17MidnightPST

    if (!isSearchPage && shouldFlush) {
        console.log('Clearing XGen cookies')
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