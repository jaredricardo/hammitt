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

    class HammittGiftingBrokenOutLineItem extends HTMLElement {
        constructor() {
            super()
            this.querySelector('#no-box').addEventListener('change', this.handleLineItemBoxChange)
            this.querySelector('#line-item-hand-written-note').addEventListener('change', this.handleLineItemGiftNoteChange)
        }

        handleLineItemBoxChange() {
            const optOutOfBox = this.checked
            const giftNoteCheckbox = this.closest('.broken-out-line-item').querySelector('#line-item-hand-written-note')
            if(optOutOfBox) {
                giftNoteCheckbox.checked = false
            }
        }

        handleLineItemGiftNoteChange() {
            const giftNoteChecked = this.checked
            const boxOptOut = this.closest('.broken-out-line-item').querySelector('#no-box')
            if(giftNoteChecked) {
                boxOptOut.checked = false
            }
        }

    }
    customElements.define('hammitt-gifting-options-drawer-trigger', HammittGiftingOptionsDrawerTrigger)
    customElements.define('hammitt-gifting-options-drawer', HammittGiftingOptionsDrawer)
    customElements.define('hammitt-gifting-broken-out-line-item', HammittGiftingBrokenOutLineItem)

})
