// /* eslint-disable */

// to check local storage size
// var _lsTotal = 0,
//     _xLen, _x;
// for (_x in localStorage) {
//     if (!localStorage.hasOwnProperty(_x)) {
//         continue;
//     }
//     _xLen = ((localStorage[_x].length + _x.length) * 2);
//     _lsTotal += _xLen;
//     console.log(_x.substr(0, 50) + " = " + (_xLen / 1024).toFixed(2) + " KB")
// };
// console.log("Total ========================= " + (_lsTotal / 1024).toFixed(2) + " KB");
class RecentlyViewed extends HTMLElement {
  
  constructor() {
    super();
    this.storageKey = '_rv';
    this.max = 50;
    this.init();
    this.recordRecentlyViewed();
  }
  
  setStorage(value) {
    localStorage.setItem(this.storageKey, value);
  }
  
  getStorage() {
    const value = localStorage.getItem(this.storageKey);
    this.storage = value ? JSON.parse(value) : false;
    return value;
  }

  getStorageSize(name, value) {
    // localStorage size is much larger, but you can still check if needed
    const encodedValue = encodeURIComponent(value);
    return name.length + encodedValue.length + 1;
  }

  recordRecentlyViewed() {
    const productObj = {
      id: window.productJSON.id,
      title: window.productJSON.title,
      handle: window.productJSON.handle,
      featured_image: window.productJSON.featured_image,
      product_tags: window.productJSON.tags,
      product_title_type: window.productJSON.product_title_type,
      product_title_color_descriptor: window.productJSON.product_title_color_descriptor,
      product_size: window.productJSON.product_size,
      price: window.productJSON.price
    };
    if(!this.storage) {
      this.storage = [];
      this.storage.push(productObj);
      this.setStorage(JSON.stringify(this.storage));
    } else {
      let productInArray = false;
      this.storage.forEach(product => {
        if(product.id === window.productJSON.id) {
          productInArray = true;
        }
      });
      if(productInArray) return true;
      
      if(this.storage.length >= this.max) {
        this.storage.shift();
      }
      window.setRecentlyViewedNav()
      this.storage.push(productObj);
      // localStorage size is much larger, but you can still check if needed
      // const storageSize = this.getStorageSize('_rv', JSON.stringify(this.storage));
      // if (storageSize > 5000000) { // ~5MB
      //   console.log("localStorage size exceeds the 5MB limit!");
      //   this.storage.shift();
      // }

      this.setStorage(JSON.stringify(this.storage));
    }
  }
  
  init() {
    const storageJson = JSON.parse(this.getStorage());

    if (!storageJson || storageJson.length === 0) {
      const rvpElement = document.querySelector('.recently-product-grid');
      if (rvpElement) {
        rvpElement.style.display = 'none';
      }
      return;
    }
    const reversedArr = [...storageJson].reverse();

    reversedArr.forEach(product => {
      // Don't show Current Product 
      if(product.id === window.productJSON.id) return true;
      // Don't show Monogram Addon Product 
      if(product.id === 9113502449848) return true;
      // Don't show EE GWP 
      if(product.id === EE_GWP.item) return true; 

      if (product.product_tags && product.product_tags.includes("shareholder")) {
        let shareholderLogin = localStorage.getItem('shareholder_login');
        if (!shareholderLogin) {
            console.log("No Shareholder Storage");
            return;
        }
        // If shareholder_login is not "true", skip this product
        if (shareholderLogin !== "true") {
          return;
        }
      }

      const el = document.createElement('div');
      el.classList.add('recently-viewed__item','grid__item' , 'swiper-slide');
      el.innerHTML = `<div class="media">
        <img data-src="${product.featured_image}" width="100%" alt="${product.title}" /></div>
        <h5>${product.title}</h5>
        <a href="/products/${product.handle}" class="link--fill-parent"><span class="visually-hidden">${product.title}</span></a>`;
      this.querySelector('.swiper-wrapper').appendChild(el);
      lazyImages();
    });
  }
}

customElements.define('recently-viewed', RecentlyViewed);