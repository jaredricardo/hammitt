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
    // Non-product grid items (e.g. loading placeholders) have no card
    if (!productItemBg) return;
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

/*
 * Appends subsequent pages of #product-grid as the "Next page" link scrolls into view.
 * Also exposes window.collectionInfiniteScroll.loadAll() so other components (e.g. the
 * collection tag filters section) can fetch every remaining page in parallel.
 *
 * Dispatches `collection-pages:loading` / `collection-pages:loaded` on document.
 */
const collectionInfiniteScroll = (() => {
  const PARALLEL_REQUESTS = 4;
  const MAX_RETRIES = 2;
  const FAILURE_COOLDOWN_MS = 5000;

  let observer = null;
  let activeLoad = null;
  let lastLoadFailed = false;

  const getGrid = () => document.querySelector('#product-grid');
  const getNextLink = () => document.querySelector('.pagination__item[aria-label="Next page"]');
  const dispatch = (name) => document.dispatchEvent(new CustomEvent(`collection-pages:${name}`));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchPage = async (url) => {
    const grid = getGrid();
    const requestUrl = new URL(url, window.location.origin);
    // Section Rendering API: only render the grid section instead of the whole page
    if (grid && grid.dataset.id) requestUrl.searchParams.set('section_id', grid.dataset.id);

    for (let attempt = 0; ; attempt++) {
      const response = await fetch(requestUrl);
      if (response.ok) {
        return new DOMParser().parseFromString(await response.text(), 'text/html');
      }

      // Back off and retry when rate limited (429) or on transient server errors
      const isRetryable = response.status === 429 || response.status >= 500;
      if (!isRetryable || attempt >= MAX_RETRIES) {
        throw new Error(`Failed to load ${requestUrl} (${response.status})`);
      }
      const retryAfterSeconds = parseInt(response.headers.get('Retry-After'), 10);
      await wait(retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 1000 * (attempt + 1));
    }
  };

  const appendPage = (grid, doc) => {
    doc.querySelectorAll('#product-grid .grid__item').forEach((gridItem) => grid.appendChild(gridItem));

    const pagination = document.querySelector('.pagination-wrapper');
    const newPagination = doc.querySelector('.pagination-wrapper');
    if (pagination && newPagination) {
      pagination.innerHTML = newPagination.innerHTML;
    }

    if (typeof lazyImages === 'function') lazyImages();
  };

  // Shopify's paginate.parts always includes the last page, so the highest number is the page count
  const getTotalPages = () => {
    const numbers = Array.from(document.querySelectorAll('.pagination-wrapper .pagination__item'))
      .map((item) => parseInt(item.textContent.trim(), 10))
      .filter((number) => !Number.isNaN(number));
    return numbers.length ? Math.max(...numbers) : 0;
  };

  const getRemainingPageUrls = (nextHref) => {
    const nextUrl = new URL(nextHref, window.location.origin);
    const nextPage = parseInt(nextUrl.searchParams.get('page'), 10);
    const totalPages = getTotalPages();
    if (!nextPage || totalPages < nextPage) return [nextUrl.toString()];

    const urls = [];
    for (let page = nextPage; page <= totalPages; page++) {
      const pageUrl = new URL(nextUrl);
      pageUrl.searchParams.set('page', page);
      urls.push(pageUrl.toString());
    }
    return urls;
  };

  // Only one load runs at a time so scroll-triggered and loadAll() requests never append duplicates
  const run = (task) => {
    if (activeLoad) return activeLoad;

    activeLoad = task()
      .then(() => {
        lastLoadFailed = false;
      })
      .catch((error) => {
        lastLoadFailed = true;
        console.error(error);
      })
      .finally(() => {
        activeLoad = null;
        dispatch('loaded');
        // After a failure, pause before re-arming so a visible "Next page" link can't trigger a request loop
        if (lastLoadFailed) {
          setTimeout(observeNextLink, FAILURE_COOLDOWN_MS);
        } else {
          observeNextLink();
        }
      });
    dispatch('loading');
    return activeLoad;
  };

  const loadNext = () =>
    run(async () => {
      const grid = getGrid();
      const nextLink = getNextLink();
      if (!grid || !nextLink) return;

      const doc = await fetchPage(nextLink.getAttribute('href'));
      // Bail if facets/sorting re-rendered the grid while this page was loading
      if (getGrid() !== grid) return;
      appendPage(grid, doc);
    });

  const loadAll = () => {
    if (activeLoad) return activeLoad.then(loadAll);
    if (!getNextLink()) return Promise.resolve();

    return run(async () => {
      const grid = getGrid();
      if (!grid) return;

      let cancelled = false;
      let nextLink = getNextLink();

      try {
        while (nextLink && !cancelled) {
          const nextHref = nextLink.getAttribute('href');
          const urls = getRemainingPageUrls(nextHref);

          // Fetch pages in parallel but append them in order as soon as each one (and all before it) is ready
          const pages = urls.map(() => {
            const deferred = {};
            deferred.promise = new Promise((resolve, reject) => Object.assign(deferred, { resolve, reject }));
            deferred.promise.catch(() => {});
            return deferred;
          });

          let cursor = 0;
          const worker = async () => {
            while (cursor < urls.length && !cancelled) {
              const index = cursor++;
              try {
                pages[index].resolve(await fetchPage(urls[index]));
              } catch (error) {
                pages[index].reject(error);
              }
            }
          };
          for (let i = 0; i < Math.min(PARALLEL_REQUESTS, urls.length); i++) worker();

          for (const page of pages) {
            const doc = await page.promise;
            if (getGrid() !== grid) {
              cancelled = true;
              return;
            }
            appendPage(grid, doc);
          }

          nextLink = getNextLink();
          // Safety net: stop if pagination didn't advance
          if (nextLink && nextLink.getAttribute('href') === nextHref) break;
        }
      } finally {
        cancelled = true;
      }
    });
  };

  const observeNextLink = () => {
    if (observer) observer.disconnect();

    const nextLink = getNextLink();
    const loader = document.getElementById('loader');

    if (!nextLink) {
      // Hide the loader if there is no next page
      if (loader) {
        loader.style.display = 'none';
      }
      return;
    }

    observer = new IntersectionObserver((entries) => {
      if (entries[0].intersectionRatio <= 0) return;
      loadNext();
    });
    observer.observe(nextLink);
  };

  observeNextLink();

  return {
    loadAll,
    isLoading: () => Boolean(activeLoad),
  };
})();

window.collectionInfiniteScroll = collectionInfiniteScroll;
