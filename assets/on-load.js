window.addEventListener('DOMContentLoaded', () => {
    window.buildCompleteTheSetInCart()
    window.setRecentlyViewedNav(false)

    // ALL X GEN CODE TURNED OFF AS WE MOVED BACK TO NATIVE SEARCH AND DISCOVERY

    // temprorary clearing of the _rv cookie to avoid 400 NGINX error for users in the past
    // who had viewed the right combination of products that caused the issue
    // window.document.cookie = '_rv=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

    // Clear X-Gen cookies on load if not already and not on search page
    // const xgenCookies = ['xgen_session', 'xgen_token', 'xgen_user']
    // const lastFlushDate = localStorage.getItem('dateOfLastXGenCookieFlush')
    // const isSearchPage = window.location.href.includes('/search?')
    // const nov17MidnightPST = new Date(Date.UTC(2025, 10, 17, 8, 0, 0)).getTime()
    // const shouldFlush = !lastFlushDate || new Date(lastFlushDate).getTime() < nov17MidnightPST

    // if (!isSearchPage && shouldFlush) {
    //     console.log('Clearing XGen cookies')
    //     const commonPaths = [
    //         '/',
    //         '/products/',
    //         '/collections/',
    //         '/cart/',
    //         '/search/',
    //         '/pages/',
    //         '/account/',
    //         '/checkout/'
    //     ]

    //     const commonDomains = [
    //         '',  
    //         '.hammitt.com',
    //         'hammitt.com',
    //         'www.hammitt.com'
    //     ]

    //     xgenCookies.forEach(cookieName => {
    //         commonPaths.forEach(path => {
    //             commonDomains.forEach(domain => {
    //                 const domainPart = domain ? `; domain=${domain}` : ''
    //                 document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domainPart};`
    //             })
    //         })
    //     })
    //     localStorage.setItem('dateOfLastXGenCookieFlush', new Date().toISOString());
    // } 

    // Style access-widget-ui shadow root buttons to be positioned bottom-left
    // Retries up to 10 times (every 1000ms) in case the widget renders late
    let accessWidgetStyleAttempts = 0
    const styleAccessWidgetButtons = () => {
      accessWidgetStyleAttempts++
      console.log(`styleAccessWidgetButtons attempt ${accessWidgetStyleAttempts}`)
      let found = false
      document.querySelectorAll('access-widget-ui').forEach((widget) => {
        const button = widget.shadowRoot?.querySelector('[part="container"] button')
        if (button) {
          button.style.left = '16px'
          button.style.bottom = '16px'
          button.style.display = "none" 
          found = true
        }
      })
      if (!found && accessWidgetStyleAttempts < 20) {
        setTimeout(styleAccessWidgetButtons, 1000)
      }
    }
    styleAccessWidgetButtons()

    // Hide all access-widget-ui shadow root containers when the cart drawer is open
    const cartDrawerDetails = document.getElementById('Details-cart-drawer-container')
    if (cartDrawerDetails) {
      const setAccessWidgetVisibility = () => {
        const isOpen = cartDrawerDetails.hasAttribute('open');
        document.querySelectorAll('access-widget-ui').forEach((widget) => {
          const container = widget.shadowRoot?.querySelector('[part="container"]')
          if (container) container.style.display = isOpen ? 'none' : ''
        })
      }

      new MutationObserver(setAccessWidgetVisibility).observe(cartDrawerDetails, {
        attributes: true,
        attributeFilter: ['open']
      })
    }
})
