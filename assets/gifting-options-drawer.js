window.addEventListener('DOMContentLoaded', () => {

    const underlayClose = document.querySelector('.cart-drawer-underlay-close')
    const testMode = false

    underlayClose?.addEventListener('click', () => {
        document.querySelector('hammitt-gifting-options-drawer')?.classList.remove('active')
    })

    /*  
        For some reason, cart loads significantly later than the rest of the dom (previous devs did something funky with it),
        so we need to wait for DOM content to load before accessing elements inside the cart drawer.
    */ 

    class HammittGiftingOptionsDrawerTrigger extends HTMLElement {
        constructor() {
            super()
            this.addEventListener('click', this.openGiftingDrawer)
        }
        openGiftingDrawer(){
            document.querySelector('hammitt-gifting-options-drawer')?.classList.add('active')
        }
    }

    class HammittGiftingOptionsDrawerTriggerNoButton extends HTMLElement {
        constructor() {
            super()
            this.addEventListener('click', this.openGiftingDrawer)
        }
        openGiftingDrawer(){
            document.querySelector('hammitt-gifting-options-drawer')?.classList.add('active')
        }
    }

    class HammittGiftingOptionsDrawerElTrigger extends HTMLElement {
        constructor() {
            super()
            this.addEventListener('click', this.openGiftingDrawer)
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

            // Save buttons starts in a disabled state, as some products are final sale and cannot be gifted and
            // will throw an error if a user tries to save gifting options for them, so we only enable the 
            // button when a user makes a change to a gifting eligible product    

            this.querySelectorAll('hammitt-gifting-broken-out-line-item input').forEach((input) => {
                input.addEventListener('change', this.enableSaveButton)
            })

            // Similarly, all the textareas are not real inputs, so we must listen for a change event
            // on them and enable the save button when a user types in one. Note we are not comparing old gift note
            // state to new here, we are simply turning it and assuming they've made a change if they type anything.

            this.querySelectorAll('hammitt-line-level-gift-note .line-item-gift-note-text-area').forEach((textarea) => {
                textarea.addEventListener('input', this.enableSaveButton)
            })
        }

        enableSaveButton() {
            const saveBtn = document.querySelector('hammitt-gifting-options-drawer #save-btn')
            saveBtn.disabled = false
        }
        closeGiftingDrawer(){
            document.querySelector('hammitt-gifting-options-drawer')?.classList.remove('active')
        }
        saveGiftingOptions() {
            const brokenOutLineItems = document.querySelectorAll('hammitt-gifting-options-drawer .broken-out-line-item')
            const saveBtn = document.querySelector('hammitt-gifting-options-drawer #save-btn')
            const giftNoteVid = document.querySelector('hammitt-gifting-options-drawer').dataset.giftNoteVid
            let updates = {}
            let postUpdateFormData = {
                items: []
            }

            saveBtn.disabled = true
            saveBtn.innerText = 'Saving...'
            document.querySelector('hammitt-gifting-options-drawer .loading-spinner-container .spinner')?.classList.add('active')

            /*  

                Steps to save gifting options at line item level:
            
                1. Loop through gifting options and check how many of a single variant are modified 
                2. Decrement variant by the number of modified variants
                3. Use add.js to add the same variant to cart with the modified properties
                4. Refresh cart drawer to reflect changes

            */
         
            let numberOfRibbonsToAdd = 0

            brokenOutLineItems.forEach((item) => {

                /* 

                    I couldn't find an easy way to include the json for the existing properties. 
                    The properties object comes in as an array with first value being the key
                    and th second value being the value. This made it difficult to parse through
                    and re-create the object to include in the new line item. Instead, I am
                    capturing the keys and values separately in data attributes and creating the JSON
                    for it below.

                */

                if(item.dataset.excludedFromGifting === 'true' ) return

                const preExistingProperties = item.dataset.preExistingPropertiesKeys
                const preExistingPropertiesValues = item.dataset.preExistingPropertiesValues
                let consolidatedExistingProperties = null

                // must check false as string since data attributes return strings
                if(preExistingProperties != 'false' && preExistingPropertiesValues != 'false') {
                    const keysArray = preExistingProperties.split(',').filter(key => key !== '')
                    const valuesArray = preExistingPropertiesValues.split(',').filter(value => value !== '')
                    consolidatedExistingProperties = {}
                    keysArray.forEach((key, index) => {
                        consolidatedExistingProperties[key] = valuesArray[index]
                    })
                }

                const noBoxChecked     = item.querySelector('.no-box')?.checked ?? false
                const ribbonChecked    = item.querySelector('.add-ribbon')?.checked ?? false
                const giftMsgChecked   = item.querySelector('.add-gift-message')?.checked ?? false
                const giftingModified  = item.dataset.giftingModified === 'true'

                // Ribbon is blocked when no-box is selected
                const needsRibbon         = ribbonChecked && !noBoxChecked
                // Line item must be re-added whenever any property changes, resets, OR ribbon is
                // toggled — so the _line_item_ribbon property stays in sync with the cart and the
                // global.js gift-wrap reconciliation logic doesn't remove the ribbon product.
                const needsLineItemUpdate = noBoxChecked || giftMsgChecked || giftingModified || needsRibbon

                if (!needsLineItemUpdate && !needsRibbon) return

                // Zero out all gift wrap — correct ribbon count re-added after loop
                updates[giftNoteVid] = 0

                if (needsLineItemUpdate) {
                    const lineKey = item.dataset.lineKey
                    const variantFromLineKey = parseInt(item.dataset.vid)
                    const fullQuantity = parseInt(item.dataset.fullQuantity)

                    if (!updates[lineKey]) {
                        updates[lineKey] = fullQuantity - 1
                    } else {
                        updates[lineKey] = updates[lineKey] - 1
                    }

                    const itemProperties = {}

                    if (noBoxChecked) {
                        itemProperties[testMode ? 'test_mode_line_item_box_opt_out' : '_line_item_box_opt_out'] = true
                    }

                    if (giftMsgChecked) {
                        const giftNote = item.querySelector('.line-item-gift-note-text-area')?.value ?? ''
                        itemProperties[testMode ? 'test_mode_line_item_gift_note' : '_line_item_gift_note'] = giftNote
                    }

                    if (needsRibbon) {
                        itemProperties[testMode ? 'test_mode_line_item_ribbon' : '_line_item_ribbon'] = true
                    }

                    postUpdateFormData.items.push({
                        id: variantFromLineKey,
                        quantity: 1,
                        properties: itemProperties
                    })

                    // merge in any pre-existing properties
                    if (consolidatedExistingProperties) {
                        const currentItemIndex = postUpdateFormData.items.length - 1
                        postUpdateFormData.items[currentItemIndex].properties = {
                            ...postUpdateFormData.items[currentItemIndex].properties,
                            ...consolidatedExistingProperties
                        }
                    }
                }

                if (needsRibbon) {
                    numberOfRibbonsToAdd++
                }
            })

            // add sections to update so cart updates properly
            // 'header' is required so cartUpdate() can refresh .drawer__items and related cart elements
            if (numberOfRibbonsToAdd > 0) {
                postUpdateFormData.items.push({
                    id: parseInt(giftNoteVid),
                    quantity: numberOfRibbonsToAdd
                })
            }

            postUpdateFormData.sections = "cart-drawer,cart-icon-bubble,main-cart-items,header"

            const stopSpinner = () => {
                document.querySelector('hammitt-gifting-options-drawer .loading-spinner-container .spinner')?.classList.remove('active')
            }

            // use change.js to decrement existing line items via the updates object
      
            fetch(window.Shopify.routes.root + 'cart/update.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({updates})
            })
            .then(response => {
                if(response.ok) {
                    fetch(window.Shopify.routes.root + 'cart/add.js', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(postUpdateFormData)
                    })
                    .then(addResponse => {
                        if(addResponse.ok) {
                            saveBtn.innerText = 'Saved'
                        }
                        return addResponse.json()
                    })
                    .then((json) => {
                        cartUpdate(json)
                        // this is specifically for the free gift wrap, though it should be ok to stay here even when free gift wrap is active. It just forces the progress bar to update.
                        const parser = new DOMParser()
                        const doc = parser.parseFromString(json.sections['cart-drawer'], "text/html")
                        const elOld = document.querySelector('free-shipping-goal')
                        const elNew = doc.querySelector('free-shipping-goal')
                        if(elOld && elNew) {
                            elOld.outerHTML = elNew.outerHTML
                        }
                    })
                    .catch((error) => {
                        console.error('Error adding to cart:', error)
                        saveBtn.innerText = 'Save'
                        saveBtn.disabled = false
                    })
                    .finally(() => {
                        stopSpinner()
                    })
                } else {
                    stopSpinner()
                    saveBtn.innerText = 'Save'
                    saveBtn.disabled = false
                }
            })
            .catch((error) => {
                console.error('Error:', error)
                stopSpinner()
                saveBtn.innerText = 'Save'
                saveBtn.disabled = false
            })
        }
    }

    class HammittGiftingBrokenOutLineItem extends HTMLElement {
        constructor() {
            super()
            this.querySelector('.no-box')?.addEventListener('change', this.handleNoBoxClick)
        }

        handleNoBoxClick() {
            const noBoxChecked = this.checked
            const ribbonCheckbox = this.closest('.broken-out-line-item').querySelector('.add-ribbon')
            if (noBoxChecked && ribbonCheckbox) {
                ribbonCheckbox.checked = false
            }
        }
    }

    class HammittLineLevelGiftNote extends HTMLElement {
        constructor() {
            super()

            this.textArea = this.querySelector('.line-item-gift-note-text-area')
            this.charLimitDisplay = this.querySelector('.gift-note-char-limit')
            this.textAreaPlaceHolder = this.textArea.placeholder
            this.textArea.addEventListener('input', this.handleGiftNoteTextAreaChange)
        }
        handleGiftNoteTextAreaChange = (e) => {
            if(e.target.value.length >= 500) {
                this.charLimitDisplay.innerText = `500/500`
                return
            } else {
                this.charLimitDisplay.innerText = `${e.target.value.length}/500`
            }
        }
    }


    customElements.define('hammitt-gifting-options-drawer-trigger', HammittGiftingOptionsDrawerTrigger)
    customElements.define('hammitt-gifting-options-drawer', HammittGiftingOptionsDrawer)
    customElements.define('hammitt-gifting-broken-out-line-item', HammittGiftingBrokenOutLineItem)
    customElements.define('hammitt-line-level-gift-note', HammittLineLevelGiftNote)
    customElements.define('hammitt-gifting-options-drawer-el-trigger', HammittGiftingOptionsDrawerElTrigger)
    customElements.define('hammitt-gifting-options-drawer-trigger-no-button', HammittGiftingOptionsDrawerTriggerNoButton)
})