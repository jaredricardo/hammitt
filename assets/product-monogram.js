/* eslint-disable */

if (!customElements.get('monogram-form')) {
    customElements.define('monogram-form', class MonogramForm extends HTMLElement {
        constructor() {
            super();
            this.elements = {
                submit: this.querySelector('#monogram-submit'),
                submitText: this.querySelector('.monogram-submit__text'),
                submitLoader: this.querySelector('.monogram-submit__spinner'),
                closeButton: this.querySelector('#ModalClose-monogram')
            }
            this.giftWrapId = 48220694577336;
            this.productVariantId = document.querySelector('product-form input[name="id"]').value;
            this.elements.submit.addEventListener('click', this.onSubmit.bind(this));
            this.colorSelected = false;
            this.initialsSelected = false;
            this.placementSelected = false;
            this.inputEvents();
            
        }

        getAllInitials() {
            let initials = '';
            this.querySelectorAll('.monogram-initial__input').forEach((initial) => {
                initials += initial.value;
            });
            return initials;
        }
        inputEvents() {
            /* Colors */
            this.querySelectorAll('.monogram-color__radio').forEach((radio) => {
                radio.addEventListener('change', () => {
                    this.colorSelected = radio.value;
                    this.checkSubmit();
                });
            });

            /* Initials */
            this.querySelectorAll('.monogram-initial__input').forEach((initial) => {
                initial.addEventListener('keyup', () => {
                    this.initialsSelected = this.getAllInitials();
                    this.checkSubmit();
                    if(initial.nextElementSibling && initial.value.length > 0) {
                        debounce(initial.nextElementSibling.focus(), 1000);
                    }
                });
            })

            /* Placements */
            this.querySelectorAll('.monogram-placement__radio').forEach((radio) => {
                radio.addEventListener('change', () => {
                    this.placementSelected = radio.value;
                    this.checkSubmit();
                });
            });
        }
        checkSubmit() {
            if(this.colorSelected && this.initialsSelected && this.placementSelected) {
                this.elements.submit.removeAttribute('disabled');
            } else {
                this.elements.submit.setAttribute('disabled','true');
            }
        }
        onSubmit() {
            this.elements.submit.setAttribute('disabled','true');
            this.elements.submitLoader.classList.remove('hidden');
            this.elements.submitText.classList.add('hidden');
            let now = Math.floor(Date.now() / 1000);
            let itemsObj = {
                items: [
                    {
                        id: this.productVariantId,
                        quantity: 1,
                        properties: {
                            "Monogram Color": this.colorSelected,
                            "Monogram Initials": this.initialsSelected,
                            "Monogram Placement": this.placementSelected,
                            "Note":"Please allow 2-3 weeks for monogram orders to ship. Monogram items are final sale.",
                            "_id": now
                        }
                    },
                    {
                        id: this.giftWrapId,
                        quantity: 1,
                        properties: {
                            "_id": now,
                            "For product": window.productJSON.title
                        }
                    }
                ]
            }
            addToCart(itemsObj, function() {
                this.closeButton.click();
            });

            setTimeout(()=>{
                document.body.classList.remove('overflow-hidden');
                this.elements.submitLoader.classList.add('hidden');
                this.elements.submitText.classList.remove('hidden');
            }, 1000);
        }       
    });
}
