class KlaviyoBackInStock {
    constructor() {
        this.init();
    }

    init() {
        document.body.addEventListener('click', (event) => this.handleClick(event));
    }

    handleClick(event) {
        if (event.target.classList.contains('klaviyo_button_product')) {
            if (event.target.dataset.variantId) {
                document.querySelector(".variant_id").value = event.target.dataset.variantId;
            }
            document.querySelector("#klaviyo_popup .product_title").innerHTML = event.target.dataset.title;
            // document.querySelector("#klaviyo_popup .variant--title").innerHTML = event.target.dataset.variantTitle;
            document.querySelector('#klaviyo_popup .content').classList.remove('hidden');
            document.querySelector(".klaviyo-success_msg").classList.add('hidden');
            document.querySelector("#klaviyo_popup").classList.remove("hidden");
            document.body.classList.add('overflow-hidden-all');
        } else if (event.target.classList.contains('back-in-stock-btn')) {
            this.handleBackInStock(event);
        }
    }

    handleBackInStock(event) {
        const form = event.target.closest('form');
        const variantId = form.querySelector(".variant_id").value;
        let email = form.querySelector(".email").value.trim();
        let errorMsgWrapper = form.querySelector(".error");
        let phoneNumber,countryCode;
        if(form.querySelector('.phone_number')){
          phoneNumber = form.querySelector('.phone_number').value;
        }
        if(form.querySelector('#js_number-prefix')){
          countryCode = form.querySelector('#js_number-prefix').value;
          if (!phoneNumber.startsWith(countryCode)) {
            phoneNumber = countryCode + phoneNumber;
          }
        }
        const numberRegex = /^[0-9]{10}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        errorMsgWrapper.classList.remove("hidden");

        if (email.length <= 0) {
            errorMsgWrapper.innerHTML = "Please enter your email address";
            return;
        } else if (!emailRegex.test(email)) {
            errorMsgWrapper.innerHTML = "Invalid email address";
        } else {
            errorMsgWrapper.classList.add("hidden");
            this.klaviyoRequest(email, variantId, phoneNumber, errorMsgWrapper);
        }
    }

    klaviyoRequest(email, variantId, phoneNumber, errorMsgWrapper) {
        const channels = ["EMAIL"];
        const userDetails = { "email": email };
        let isSMS;
        if(document.getElementById("sms_subscribe")){
          isSMS = document.getElementById("sms_subscribe").checked;
        }

        if (isSMS) {
            channels.push("SMS");
            userDetails["phone_number"] = phoneNumber;
        }

        const options = {
            method: 'POST',
            headers: {
                accept: 'application/vnd.api+json',
                revision: '2024-10-15',
                'content-type': 'application/vnd.api+json'
            },
            body: JSON.stringify({
                data: {
                    type: "back-in-stock-subscription",
                    attributes: {
                        profile: {
                            data: {
                                type: "profile",
                                attributes: userDetails
                            }
                        },
                        channels: channels
                    },
                    relationships: {
                        variant: {
                            data: {
                                type: "catalog-variant",
                                id: `$shopify:::$default:::${variantId}`
                            }
                        }
                    }
                }
            })
        };

        fetch('https://a.klaviyo.com/client/back-in-stock-subscriptions?company_id=LkNEd5', options)
            .then(res => {
                if (res.status == 202) {
                    this.successMsgTemplate();
                    let isSubscribed = document.getElementById("subscribe").checked;
                    if (isSubscribed) {
                        this.subscribeEmail(email);
                        if (isSMS) {
                            this.subscribeSMS(phoneNumber);
                        }
                    }
                } else {
                    return res.json();
                }
            })
            .then(res => {
                if (res && res.errors) {
                    errorMsgWrapper.innerHTML = res.errors[0].detail;
                    errorMsgWrapper.classList.remove("hidden");
                }
            })
            .catch(err => console.error('Fetch error:', err));
    }

    subscribeEmail(email) {
        const options = {
            method: 'POST',
            headers: { revision: '2024-10-15', 'content-type': 'application/vnd.api+json' },
            body: JSON.stringify({
                data: {
                    type: "subscription",
                    attributes: {
                        profile: {
                            data: {
                                type: "profile",
                                attributes: { email }
                            }
                        }
                    },
                    relationships: {
                        list: {
                            data: {
                                type: "list",
                                id: "KTq8i9"
                            }
                        }
                    }
                }
            })
        };

        fetch('https://a.klaviyo.com/client/subscriptions?company_id=LkNEd5', options)
            .then(res => {return res;})
            .catch(err => console.error(err));
    }

    subscribeSMS(phoneNumber) {
        const options = {
            method: 'POST',
            headers: { revision: '2024-10-15', 'content-type': 'application/vnd.api+json' },
            body: JSON.stringify({
                data: {
                    type: "subscription",
                    attributes: {
                        profile: {
                            data: {
                                type: "profile",
                                attributes: {
                                    properties: { "newKey": "New Value" },
                                    phone_number: phoneNumber
                                },
                                meta: {
                                    patch_properties: {
                                        append: { "newKey": "New Value" },
                                        unappend: { "newKey": "New Value" }
                                    }
                                }
                            }
                        }
                    },
                    relationships: {
                        list: {
                            data: {
                                type: "list",
                                id: "RHnXfZ"
                            }
                        }
                    }
                }
            })
        };

        fetch('https://a.klaviyo.com/client/subscriptions?company_id=LkNEd5', options)
            .then(res => { return res;})
            .catch(err => console.error(err));
    }

    successMsgTemplate() {
        document.querySelector('#klaviyo_popup .content').classList.add('hidden');
        document.querySelector(".klaviyo-success_msg").classList.remove('hidden');
    }
}

// Instantiate the class
const klaviyoBackInStock = new KlaviyoBackInStock();