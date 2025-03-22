class BuildABundle extends HTMLElement {
  constructor() {
    super();
    this.bundleItems = this.querySelectorAll('bundle-item');
    this.bundleTotal = 0;
    this.bundleOriginalTotal = 0;
    this.addEventListener('change',this.checkCompletion.bind(this));
    this.button = this.querySelector('#add-set-to-bag');
    this.button.addEventListener('click',this.addBundle.bind(this));
    
    this.bundleOriginalPriceEl = this.querySelector('.bundle__original-price');
    this.bundleSalePriceEl = this.querySelector('.bundle__sale-price');
  }  
  checkCompletion() {
    let allSelected = true;
    this.bundleItems.forEach(bundleItem => {
      if(!bundleItem.currentVariant) {
        allSelected = false;
      }
    });
    if(!allSelected) return;
    this.button.disabled = false;
    this.querySelector('.bundle-price').style.display = 'block';
    
  }
  updateTotal() {
    this.bundleTotal = 0;
    this.bundleOriginalTotal = 0;
    this.bundleItems.forEach(item => {
      this.bundleOriginalTotal = this.bundleOriginalTotal + item.currentVariant.price;
      
      const salePrice = item.currentVariant.price - ((item.currentVariant.price / 100) * 20);
      this.bundleTotal = this.bundleTotal + salePrice;
      
    });
    
    this.bundleOriginalPriceEl.innerHTML = Shopify.formatMoney(this.bundleOriginalTotal);
    this.bundleSalePriceEl.innerHTML = Shopify.formatMoney(this.bundleTotal);
  }
  addBundle() {
    const now =  'bundle_'+Math.floor(Date.now() / 1000);
    const bundleIDs = Array.prototype.map.call(this.bundleItems, (item) => {
      let obj = { 
        id:item.currentVariant.id,
        quantity:1,
        properties: {
          "_bundle": true,
          "_bundle_total": this.bundleTotal,
          "bundle_id": now
        }
      };
      return obj;
    });
    const bundleObj = {
      items: bundleIDs
    }
    addToCart(bundleObj);
    console.log(bundleObj);
  }
}
customElements.define('build-a-bundle', BuildABundle);

class BundleItem extends HTMLElement {
  constructor() {
    super();
    this.json = false;
    this.currentVariant = false;
    this.selectorButtons = this.querySelectorAll('.bundle-item__product-selector');
    this.selectorButtons.forEach((button) => {
      button.addEventListener('click', this.updateBundleItem.bind(this));
    });
    this.colorOptions = this.querySelector('.bundle-item__colors');
    this.sizeOptions = this.querySelector('.bundle-item__sizes');
    this.originalPriceEl = this.querySelector('.bundle-item__price-original')
    this.salePriceEl = this.querySelector('.bundle-item__price-sale');
    this.index = parseFloat(this.getAttribute('data-index'));
  }  
  updateBundleItem() {
    this.selectorButtons.forEach((button) => {
      button.classList.remove('active');
    });
    event.target.classList.add('active');
    
    this.json = JSON.parse(event.target.getAttribute('data-json'));
    this.handle = event.target.getAttribute('data-product-handle');
    this.color = this.json[0].options[0];
    this.colorHandle = this.color.split(' ').join('-');
    this.colors = [];
    this.sizes = [];
    
    fetch(`/products/${this.handle}.js`)
    .then((response) => response.json())
    .then((product) => {
      this.colorOptions.innerHTML = '';
      this.sizeOptions.innerHTML = '';
      this.json = product;
      this.currentVariant = product.variants[0];
      this.updatePrice();
      product.options.forEach(option => {
        if(option.name == 'Color') {
          const colorSwatch = document.createElement('div');
          colorSwatch.classList.add('bundle-item__input-wrapper');
          const colorHandle = option.values[0].split(' ').join('-');
          colorSwatch.innerHTML = `
			<input checked="checked" type="radio" name="${option.name}-${this.index}" value="${option.values[0]}" id="bundle-item-${product.id}__${colorHandle}" data-image="${product.featured_image}" />   
            <label for="bundle-item-${product.id}__${colorHandle}">
              <span class="visually-hidden">${option.values[0]}</span>
            </label>
		  `;
          this.colorOptions.appendChild(colorSwatch);
          this.getColors(product.title.split(' - ')[0]);
          this.showContent();
        }
        if(option.name == 'Size') {
          option.values.forEach(value => {
            const sizeSwatch = document.createElement('div');
            sizeSwatch.classList.add('bundle-item__input-wrapper');
            const sizeHandle = value.split(' ').join('-');
            sizeSwatch.innerHTML = `
            <input type="radio" name="${option.name}-${product.id}" value="${value}" id="bundle-item-${product.id}__${sizeHandle}"  />
            <label for="bundle-item-${product.id}__${sizeHandle}">
              <span>${value}</span>
            </label>
            `;
            this.sizeOptions.appendChild(sizeSwatch);
          });                   
        }
      });
      
    });
  }
  getColors(title) {
    fetch(`/search?q=title:${title}&view=api&type=product`)
    .then((response) => response.json())
    .then((results) => {
      results.forEach(result => {
        const productTitle = result.title.split(' - ')[0];
        if(productTitle != title) return true;
        if(this.json.title == result.title) return true;
//         if(!result.available) return true;
        this.json.variants.push(...result.variants);        
        const colorIndex = result.options.indexOf('Color');
        const color = result.variants[0].options[colorIndex];
        const colorSwatch = document.createElement('div');
        colorSwatch.classList.add('bundle-item__input-wrapper');
        const colorHandle = color.split(' ').join('-');
        colorSwatch.innerHTML = `
		<input type="radio" name="Color-${ this.index }" value="${color}" id="bundle-item-${result.handle}__${colorHandle}" data-image="${result.featured_image}" />
        <label for="bundle-item-${result.handle}__${colorHandle}">
          <span class="visually-hidden">${color}</span>
        </label>
        `;
        this.colorOptions.appendChild(colorSwatch);
      });
      
      this.inputs = this.querySelectorAll('input[type="radio"]');
      this.inputs.forEach((button) => {
        button.addEventListener('change', this.onChange.bind(this));
      });
      
      this.updateAvailability();
      
    });
  }
  updatePrice() {
    const price = this.currentVariant.price;
    const savings = (price / 100) * 20;
    const salePrice = price - savings;
    this.salePriceEl.innerHTML = Shopify.formatMoney(salePrice).replace('.00','');
    this.originalPriceEl.innerHTML = Shopify.formatMoney(price).replace('.00','');
//     this.savingsEl.innerHTML = Shopify.formatMoney(savings).replace('.00','');
    this.closest('build-a-bundle').updateTotal();
  }
  onChange() {
    let foundOne = false;
    const checked = this.querySelectorAll('input:checked');
    const selected = Array.prototype.map.call(checked, ({ value }) => value).join(' / ');
    this.json.variants.forEach(variant => {
      if(variant.title === selected) {
        this.currentVariant = variant;
        foundOne = true;
      }
    });
    this.updateAvailability();
    if(event.target.name === 'Color') {
      this.updateImage();
      
    }
    if(!foundOne) return;
    
    this.updatePrice();
  }
  showContent() {
    this.querySelector('.bundle-item__content').style.display = 'block';
  }
  updateImage() {
    const newImage = event.target.getAttribute('data-image');
    const activeProduct = this.querySelector('.bundle-item__product-selector.active');
    
    if(!activeProduct) return;
    activeProduct.querySelector('img').removeAttribute('srcset');
    activeProduct.querySelector('img').setAttribute('src',newImage);
  }
  updateAvailability() {
    const selectedColor = this.querySelector('.bundle-item__color input:checked').value;
    let sizeIndex = false;
    this.json.options.forEach((option,index) => {
      if(option.name === 'Size') {
        sizeIndex = index;
      }
    });
    this.json.variants.forEach(variant => {
      if(variant.options.indexOf(selectedColor) === -1) return true;
	  const size = variant.options[sizeIndex];
      const sizeInput = this.querySelector(`input[value="${size}"]`);
      variant.available ? sizeInput.disabled = false : sizeInput.disabled = true;
        
    });
  }
}
customElements.define('bundle-item', BundleItem);