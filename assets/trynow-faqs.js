window.onload = function() {
  var acc = document.getElementsByClassName("lp-accordion");
  var i;
  if (acc.length > 0) {
    for (i = 0; i < 4; i++) {
      acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
          panel.style.display = "none";
        } else {
          panel.style.display = "block";
        }
      });
    }

    document.getElementById("accordion-last").addEventListener("click", function(){
      if(document.getElementById("accordion-last").classList.contains("accordion-last")){
        document.getElementById("accordion-last").classList.remove("accordion-last");
      }else{
        document.getElementById("accordion-last").classList.add("accordion-last");
      }
    });
  }
};