class CarouselComponent extends HTMLElement {
  constructor() {
    super();

    this.slideBox = this.querySelector('.carouselBox');
    this.slides = this.querySelectorAll('.carouselSlider');
    this.slideLot = this.querySelector('.activeNumber');

    this.prevBtn = this.querySelector("#prevSlide");
    this.nextBtn = this.querySelector("#nextSlide");
    this.pausePlay = this.querySelector(".pauseContainer");
    this.slideDots = this.querySelectorAll('.slideDots');

    this.counter = this.dataset.counterType;
    this.interval = this.dataset.interval;
    this.infinite = this.dataset.infiniteScroll;
    this.autoplay = this.dataset.autoplay;

    if(!this.slideDots) return;
    this.slideDots.forEach( dot => dot.addEventListener('click', this.showDot.bind(this)));
    this.timeout;
    this.curSlide = 0;

    if(this.autoplay == 'true') {
      this.autoPlayFx();
      this.infinite = 'true';
    }else {
      clearInterval(this.autoplaying);
      this.infinite = 'false';
    }

    this.init()
    const resizeObserver = new ResizeObserver(entries => this.init());
    resizeObserver.observe(this.slideBox);

    this.prevBtn.addEventListener("click", this.prevFx.bind(this));
    this.nextBtn.addEventListener("click", this.nextFx.bind(this));
    if(!this.pausePlay) return;
    this.pausePlay.addEventListener("click", this.pauseFx.bind(this));    
  }

  init() {
    if (this.counter == 'number') {
      this.slideLot.innerHTML = 1;
    }
    this.goToSlide(0);
  }

  autoPlayFx(){
    clearInterval(this.autoplaying);
    this.autoplaying = setInterval(this.nextFx.bind(this), this.interval);
  }

  pauseFx() {
    this.pauseBtn = this.pausePlay.querySelector('.pauseBtn');
    this.playBtn = this.pausePlay.querySelector('.playBtn');
    if (this.autoplay === 'true'){
      clearInterval(this.autoplaying);
      this.autoplay = 'false';

      this.playBtn.style.display = "block";
      this.pauseBtn.style.display = "none";
    }else{
      if(this.curSlide == this.slides.length -1) {
        this.curSlide  = -1;
      }
      this.autoPlayFx();
      this.autoplay = 'true';
      this.playBtn.style.display = "none";
      this.pauseBtn.style.display = "block";
    }
  }

  prevFx () {
    this.curSlide--;
    if(this.curSlide  < 0){
      if(this.infinite == 'true') {
        this.curSlide  = this.slides.length - 1;
      } else {
        this.curSlide  = 0;
      }
    }
    this.goToSlide(this.curSlide );
    this.activeSlide(this.curSlide );
  }

  nextFx () {
    this.curSlide ++
    if(this.curSlide  == this.slides.length) {
      if(this.infinite == 'true') {
        this.curSlide  = 0;
      }
      if(this.autoplay == 'true') {
        this.curSlide  = 0;
      }
    }
    this.goToSlide(this.curSlide );
    this.activeSlide(this.curSlide );
  }

  showDot(e) {
    if(!e.currentTarget) return;
    const currentDot = e.currentTarget.dataset.dotId;

    this.activeSlide(currentDot);
  }

  goToSlide (slide) {
    let leftScroll = slide * this.slides[0].clientWidth;
    this.slideBox.scrollTo({left: leftScroll});
  }

  activeSlide(currentDot) {
    this.slideDots.forEach(dot => dot.classList.remove('activeDot'));

    if(this.infinite == 'false') {
      if(currentDot == this.slides.length - 1) {
        this.nextBtn.setAttribute('disabled', true);
      } else {
        this.nextBtn.removeAttribute('disabled');
      }
      if(currentDot == 0) {
        this.prevBtn.setAttribute('disabled', true);
      } else {
        this.prevBtn.removeAttribute('disabled');
      }
    }

    this.slideLot.innerHTML = currentDot + 1;
    if(! this.slideDots[currentDot]) return;
    this.slideDots[currentDot].classList.add('activeDot');
    this.showDot(currentDot);

    this.curSlide = currentDot;
    this.goToSlide(currentDot );
  }
}

customElements.define('carousel-component', CarouselComponent);