var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 && navigator.userAgent && navigator.userAgent.indexOf('CriOS') == -1 && navigator.userAgent.indexOf('FxiOS') == -1;
function scrollVertically(height) {
  if (isSafari) {
    window.scrollTo(0, height);
  } else {
    window.scrollTo({
      top: height,
      left: 0,
      behavior: 'smooth'
    });
  }
}

// restore anchor position
function updateQueryParam(key, value) {
  let url = new URL(window.location.href);
  console.log(key)
  url.searchParams.set(key, value);

  // Update the URL without reloading the page
  window.history.pushState(null, "", url.toString());
}

document.addEventListener("click", function (event) {
  if (event.target.closest(".grid__item")) {
    // window.alert("Hello world!");
    let productItemBg = event.target.closest(".grid__item").querySelector(".card-wrapper");
    updateQueryParam("page", productItemBg.dataset.currentPage);
    let target = productItemBg.id;
    localStorage.setItem("target", target);
    let savedCollectionUrl = productItemBg.dataset.currentPage;
    let targetProduct = productItemBg.id;
    localStorage.setItem("savedCollectionUrl", savedCollectionUrl);
    localStorage.setItem("targetProduct", targetProduct);
  }
});

if (localStorage.getItem("target") !== null) {
  let targetElement = document.getElementById(localStorage.getItem("target"));
  let scrollTarget = parseInt((targetElement === null || targetElement === void 0 ? void 0 : targetElement.getBoundingClientRect().top) - 200 + window.scrollY);
  if (!isNaN(scrollTarget)) {
    setTimeout(function () {
      console.log(scrollTarget, 'f')
      scrollVertically(scrollTarget);
    }, 10);
  } 
  localStorage.removeItem("target");
} 

const loadNextPage = (url) => {
  fetch(url)
    .then(response => response.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const productGrid = document.querySelector('.product-grid');
      doc.querySelectorAll('.product-grid .grid__item').forEach(gridItem => {
        productGrid.appendChild(gridItem);
      });
      const pagination = document.querySelector('.pagination-wrapper');
      const newPagination = doc.querySelector('.pagination-wrapper');
      if (pagination && newPagination) {
        pagination.innerHTML = newPagination.innerHTML;
      }
      lazyImages();
      infiniteScroll();
    })
    .catch(error => console.log(error));
}

const infiniteScroll = () => {
  let nextButton = document.querySelector('.pagination__item[aria-label="Next page"]');
  const loader = document.getElementById('loader');

  if (!nextButton) {
    // Hide the loader if there is no next page
    if (loader) {
      loader.style.display = 'none';
    }
    return;
  }

  const intersectionObserver = new IntersectionObserver(entries => {
    if (entries[0].intersectionRatio <= 0) return;
    loadNextPage(nextButton.getAttribute('href'));
  });

  intersectionObserver.observe(nextButton);
};

(function() {
  infiniteScroll();  
})();
