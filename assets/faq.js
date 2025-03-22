(function() {
  const faqQuestions = document.querySelectorAll('.faq__question');
  faqQuestions.forEach(question => {
    question.addEventListener('click', event => {
      event.preventDefault;
      const faqAnswer = event.target.nextElementSibling;
      if (!faqAnswer.classList.contains('active')) {

        faqAnswer.classList.add('active');
        faqAnswer.style.height = 'auto';

        var height = faqAnswer.clientHeight + 'px';

        faqAnswer.style.height = '0px';

        setTimeout(function () {
          faqAnswer.style.height = height;
        }, 0);
        
        event.target.setAttribute('aria-expanded',true);

      } else {

        faqAnswer.style.height = '0px';

        faqAnswer.addEventListener('transitionend', function () {
          faqAnswer.classList.remove('active');
          event.target.setAttribute('aria-expanded',false);
        }, {
          once: true
        });

      }
      
    });
  });
})();