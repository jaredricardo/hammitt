/* eslint-disable */
class RecentlyViewed extends HTMLElement {
  
  constructor() {
    super();
    this.cookie = false;
    this.cookieName = '_rv';
    this.cookieExpiration = 365;
    this.max = 10;
    this.maxCookieSize = 4096; // 4KB cookie limit
    this.init();
    this.recordRecentlyViewed();
  }
  
  setCookie(value) {
    let date = new Date();
    date.setTime(date.getTime() + (this.cookieExpiration * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = this.cookieName + "=" + value + "; " + expires + "; path=/";
  }
  
  getCookie() {
    var re = new RegExp('_rv' + "=([^;]+)");
    var value = re.exec(document.cookie);
    var cookie = (value != null) ? unescape(value[1]) : false;
    this.cookie = JSON.parse(cookie);
    return cookie;
  }
  getCookieSize(name, value) {
    const encodedValue = encodeURIComponent(value);
    return name.length + encodedValue.length + 1; // Plus 1 for the '=' sign
  }

  recordRecentlyViewed() {

    const productObj = {
      id: window.productJSON.id,
      title: window.productJSON.title,
      handle: window.productJSON.handle,
      featured_image: window.productJSON.featured_image,
      product_tags: window.productJSON.tags
    };
    if(!this.cookie) {
      this.cookie = [];
      this.cookie.push(productObj);
      this.setCookie(JSON.stringify(this.cookie));
    } else {
      let productInArray = false;
      this.cookie.forEach(product => {
        if(product.id === window.productJSON.id) {
          productInArray = true;
        }
      });
      if(productInArray) return true;
      
      if(this.cookie.length >= this.max) {
        this.cookie.shift();
      }
      this.cookie.push(productObj);
      const cookieSize = this.getCookieSize('_rv', JSON.stringify(this.cookie));

      if (cookieSize > this.maxCookieSize) {
        console.log("Cookie size exceeds the 4KB limit!");
        this.cookie.shift();
        // return false; // Cookie exceeds size limit
      }

      this.setCookie(JSON.stringify(this.cookie));
    }
  }
  
  init() {
    const cookieJson = JSON.parse(this.getCookie());

    if (!cookieJson || cookieJson.length === 0) {
      const rvpElement = document.querySelector('.recently-product-grid');
      if (rvpElement) {
        rvpElement.style.display = 'none';
      }
      return;
    }
    const reversedArr = [...cookieJson].reverse();

    reversedArr.forEach(product => {
      // Don't show Current Product 
      if(product.id === window.productJSON.id) return true;
      // Don't show Monogram Addon Product 
      if(product.id === 9113502449848) return true;
      // Don't show EE GWP 
      if(product.id === EE_GWP.item) return true; 

      if (product.product_tags && product.product_tags.includes("shareholder")) {
        let shareholderLoginCookie = document.cookie.split('; ')
          .find(row => row.startsWith('shareholder_login='));

        if (!shareholderLoginCookie) {
            console.log("No Shareholder Cookie");
            return;
        }

        let shareholderLogin = shareholderLoginCookie.split('=')[1];
    
        // If shareholder_login is not "true", skip this product
        if (shareholderLogin !== "true") {
          return;
        }
      }

      const el = document.createElement('div');
      el.classList.add('recently-viewed__item','grid__item' , 'swiper-slide');
      el.innerHTML = `<div class="media">
        <img data-src="${product.featured_image}" width="100%" alt="${product.title}" /></div>
        <h4>${product.title}</h4>
        <a href="/products/${product.handle}" class="link--fill-parent"><span class="visually-hidden">${product.title}</span></a>`;
      this.querySelector('.swiper-wrapper').appendChild(el);
      lazyImages();
    });
  }
}

customElements.define('recently-viewed', RecentlyViewed);
