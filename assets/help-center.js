(function() {
  return;
  
  /* maybe later
  const sidebarLinks = document.querySelectorAll('.help__sidebar-link');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      sidebarLinks.forEach(link => {
         link.classList.remove('active'); 
      });
      event.target.classList.add('active');
      const newUrl = event.target.href;
	  fetch(newUrl)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        document.querySelector('.help__main-inner').innerHTML = doc.querySelector('.help__main-inner').innerHTML;
        
        
      })
    });
  });
   */
})();