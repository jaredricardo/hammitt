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
            this.querySelector('#save-btn').addEventListener('click', this.saveGiftingOptions)
        }
        closeGiftingDrawer(){
            document.querySelector('hammitt-gifting-options-drawer')?.classList.remove('active')
        }
        saveGiftingOptions() {
            console.log('Saving gifting options...')
            const brokenOutLineItems = document.querySelectorAll('hammitt-gifting-options-drawer .broken-out-line-item')
            let updateObject = {}
            let arr = []
            brokenOutLineItems.forEach((item) => {
                if(item.querySelector('.no-box').checked) {
                    const lineKey = item.dataset.lineKey 
                    arr.push({
                        id: lineKey,
                        quantity: 1,
                        properties: {
                            'gift_box_opt_out': true
                        }
                    })
                }
            })
            updateObject['items'] = arr
            console.log(updateObject)
            fetch(window.Shopify.routes.root + 'cart/update.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateObject)
            })
            .then(response => {
                if(response.ok) {
                    console.log('SUCCESS')
                }
                return response.json()
            })
            .catch((error) => {
                console.error('Error:', error);
            })
        }
    }

    class HammittGiftingBrokenOutLineItem extends HTMLElement {
        constructor() {
            super()
            this.querySelector('.no-box').addEventListener('change', this.handleLineItemBoxChange)
            this.querySelector('.line-item-hand-written-note').addEventListener('change', this.handleLineItemGiftNoteChange)
        }

        handleLineItemBoxChange() {
            const optOutOfBox = this.checked
            const giftNoteCheckbox = this.closest('.broken-out-line-item').querySelector('.line-item-hand-written-note')
            if(optOutOfBox) {
                giftNoteCheckbox.checked = false
            }
        }

        handleLineItemGiftNoteChange() {
            const giftNoteChecked = this.checked
            const boxOptOut = this.closest('.broken-out-line-item').querySelector('.no-box')
            if(giftNoteChecked) {
                boxOptOut.checked = false
            }
        }
    }

    class HammittLineLevelGiftNote extends HTMLElement {
        constructor() {
            super()

            this.textArea = this.querySelector('.line-item-gift-note-text-area')
            this.charLimitDisplay = this.querySelector('.gift-note-char-limit')
            this.textAreaPlaceHolder = this.textArea.placeholder
            console.log(this.textAreaPlaceHolder)
            this.textArea.addEventListener('input', this.handleGiftNoteTextAreaChange)
        }
        handleGiftNoteTextAreaChange = (e) => {
            if(e.target.value.length >= 500) {
                this.charLimitDisplay.innerText = `500/500`
                return
            } else {
                this.charLimitDisplay.innerText = `${e.target.value.length}/500`
            }
            console.log(e.target.value)
        }
    }

    customElements.define('hammitt-gifting-options-drawer-trigger', HammittGiftingOptionsDrawerTrigger)
    customElements.define('hammitt-gifting-options-drawer', HammittGiftingOptionsDrawer)
    customElements.define('hammitt-gifting-broken-out-line-item', HammittGiftingBrokenOutLineItem)
    customElements.define('hammitt-line-level-gift-note', HammittLineLevelGiftNote)
})
