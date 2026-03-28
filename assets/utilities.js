/**
 * Shopify Utilities Module
 * Consolidated utility functions to avoid duplication
 * IMPORTANT: This replaces the Shopify utilities in global.js
 */

window.Shopify = window.Shopify || {};

/**
 * Debounce function
 * @param {Function} fn - Function to debounce
 * @param {Number} wait - Wait time in ms
 * @returns {Function}
 */
const debounce = (fn, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
};

/**
 * Fetch configuration helper
 * @param {String} type - Response type (json, text, etc.)
 * @returns {Object}
 */
const fetchConfig = (type = 'json') => ({
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': `application/${type}`
  }
});

/**
 * Get all focusable elements in a container
 * @param {HTMLElement} container
 * @returns {Array<HTMLElement>}
 */
const getFocusableElements = (container) => {
  const selector = [
    'summary',
    'a[href]',
    'button:enabled',
    '[tabindex]:not([tabindex^="-"])',
    '[draggable]',
    'area',
    'input:not([type=hidden]):enabled',
    'select:enabled',
    'textarea:enabled',
    'object',
    'iframe'
  ].join(', ');
  
  return Array.from(container.querySelectorAll(selector));
};

/**
 * Lock/unlock background scrolling
 * @param {Boolean} lock - True to lock, false to unlock
 */
const lockBackground = (lock) => {
  if (lock) {
    const offsetY = window.pageYOffset;
    document.body.style.top = `${-offsetY}px`;
    document.body.classList.add('js-lock-position');
  } else {
    const offsetY = Math.abs(parseInt(document.body.style.top || 0, 10));
    document.body.classList.remove('js-lock-position');
    document.body.style.removeProperty('top');
    window.scrollTo(0, offsetY || 0);
  }
};

/**
 * Pause all media elements
 */
const pauseAllMedia = () => {
  // YouTube videos
  document.querySelectorAll('.js-youtube').forEach(video => {
    video.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
  });

  // Vimeo videos
  document.querySelectorAll('.js-vimeo').forEach(video => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });

  // HTML5 videos
  document.querySelectorAll('video').forEach(video => video.pause());

  // Product models
  document.querySelectorAll('product-model').forEach(model => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
};

// Export to window for backwards compatibility
Object.assign(window, {
  debounce,
  fetchConfig,
  getFocusableElements,
  lockBackground,
  pauseAllMedia
});
