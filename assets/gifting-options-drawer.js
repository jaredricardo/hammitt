window.addEventListener('DOMContentLoaded', () => {

    /*  
        For some reason, cart loads significantly later than the rest of the dom (previous devs did something funky with it),
        so we need to wait for DOM content to load before accessing elements inside the cart drawer.
    */ 

    class HammittGiftingOptionsDrawerTrigger extends HTMLElement {
        constructor() {
            super()
            this.querySelector('#open-btn').addEventListener('click', this.openGiftingDrawer)
        }
        openGiftingDrawer(){
            document.querySelector('hammitt-gifting-options-drawer')?.classList.add('active')
        }
    }


    class HammittGiftingOptionsDrawer extends HTMLElement {
        constructor() {
            super()
            this.querySelector('#close-btn').addEventListener('click', this.closeGiftingDrawer)
        }
        closeGiftingDrawer(){
            document.querySelector('hammitt-gifting-options-drawer')?.classList.remove('active')
        }
    }

    customElements.define('hammitt-gifting-options-drawer-trigger', HammittGiftingOptionsDrawerTrigger)
    customElements.define('hammitt-gifting-options-drawer', HammittGiftingOptionsDrawer)

})
