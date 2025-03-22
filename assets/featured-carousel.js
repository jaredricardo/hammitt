class FeaturedCarousel extends HTMLElement {
  constructor() {
    super();
    this.isScrolling = '';
    this.spacing = parseFloat(this.getAttribute('data-spacing'));
    this.items = this.querySelectorAll('.featured-carousel__item');
    if(this.items.length == 0) return;

    this.itemWidth = this.querySelectorAll('.featured-carousel__item')[0].offsetWidth;
    this.carousel = this.querySelector('.featured-carousel');
    this.carousel.addEventListener('scroll', this.onScroll.bind(this));    
    
    this.nextButton = this.querySelector('.featured-carousel__next');
    this.prevButton = this.querySelector('.featured-carousel__prev');
    this.nextButton.addEventListener('click', this.scrollCarousel.bind(this));
    this.prevButton.addEventListener('click', this.scrollCarousel.bind(this));
    this.dragging = false;
    
    this.rangeSlider = this.querySelector('.range-slider');
    this.rangeSlider.addEventListener('input', this.scrollDrag.bind(this));
    this.rangeSlider.addEventListener('mouseup', this.scrollDragStop.bind(this));
        
    this.onScroll();
    this.onScrollFinished();
    
    this.selectorToggles = document.querySelectorAll('.featured-collection-selector');
    this.selectorToggles.forEach(toggle => {
      toggle.addEventListener('click',this.toggleCollection.bind(this));
    });
 
  }
  
  
  toggleCollection() {
    if(event.target.getAttribute('data-carousel') !== this.id) return;
    const section = event.target.closest('.shopify-section');
    section.querySelectorAll('.featured-carousel__multi').forEach(carousel => {
      carousel.style.display = 'none';
    });
    document.getElementById(this.id).parentNode.style.display = 'block';
    this.onScroll();
    this.itemWidth = this.querySelectorAll('.featured-carousel__item')[0].offsetWidth;
    document.querySelectorAll('.featured-collection-selector').forEach(selector => {
      if(selector.id === event.target.id) {
        selector.classList.add('active');
      } else {
        selector.classList.remove('active');
      }
    });
  }
  
  scrollDrag() {
    const total = this.carousel.scrollWidth - this.carousel.offsetWidth;
    const percentage = total * (event.target.value / 100);
    this.carousel.scrollLeft = percentage;
    this.dragging = true;
  }
  
  scrollDragStop() {
    this.dragging = false;
    console.log('stopped dragging');
  }

  getScrollPercent() {
    return Math.round(100 * this.carousel.scrollLeft / (this.carousel.scrollWidth - this.carousel.clientWidth));
  }
  
  
  scrollCarousel() {
    if(event.target.classList.contains('featured-carousel__next')) {
      this.carousel.scrollLeft += this.itemWidth
    } else {
      this.carousel.scrollLeft -= this.itemWidth
    } 
  }
  
  onScroll() {
    if(!this.dragging) {
      this.rangeSlider.value = this.getScrollPercent();
    }
    clearTimeout(this.isScrolling);
    const _this = this;
    this.isScrolling = setTimeout(function() {
      _this.onScrollFinished(_this);
    },100);
  }
  
  onScrollFinished() {
    this.prevButton.disabled = this.carousel.scrollLeft <= 0;
    this.nextButton.disabled = this.carousel.offsetWidth + this.carousel.scrollLeft >= this.carousel.scrollWidth;
    this.rangeSlider.disabled = this.carousel.scrollWidth <= this.carousel.offsetWidth;
  }
  
  slideHovers() {
    const slideHoverContent = this.querySelectorAll('.featured-carousel-slide__hover-content');
    
  	slideHoverContent.forEach(content => {
      if(content.classList.contains('checked')) return;
      const myHeight = content.offsetHeight;
      content.setAttribute('data-height',myHeight+'px');
      content.style.height = 0 + 'px';
      content.classList.add('checked');

      content.closest('.featured-carousel-card').addEventListener('mouseenter',event => {
        content.style.height = myHeight + 'px';
      });

      content.closest('.featured-carousel-card').addEventListener('mouseleave',event => {
        content.style.height = 0 + 'px';
      });
    });
  }
}

customElements.define('featured-carousel', FeaturedCarousel);