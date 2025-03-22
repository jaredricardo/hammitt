/* eslint-disable */

document.addEventListener("DOMContentLoaded", () => {
    if (!EE_GWP.available) return;
    const addOnId = EE_GWP.item;
    document.querySelectorAll(".product-form__submit.iday-promotion__product").forEach(promotionProduct => {
        promotionProduct.addEventListener("click", async (event) => {
            event.preventDefault();
            const btn = promotionProduct;
            const loader = btn.querySelector('.loading-overlay__spinner');
            const submitText = btn.querySelector('span');
            const productForm = btn.closest('form');
            const productVariantId = productForm.querySelector('input[name="id"]').value;
            toggleLoadingState(btn, loader, submitText, true);
            try {
                const isInCart = await isProductInCart(addOnId);
                addToCartPromo(productVariantId, isInCart ? false : addOnId);
                console.log(`GWP is ${isInCart ? 'already' : 'not'} in the cart.`);
            } finally {
                setTimeout(() => {
                    toggleLoadingState(btn, loader, submitText, false);
                }, 1000);
            }
        });
    });

    function toggleLoadingState(button, loader, submitText, isLoading) {
        button.classList.toggle("loading", isLoading);
        loader.classList.toggle('hidden', !isLoading);
        submitText.classList.toggle('hidden', isLoading);
        document.body.classList.toggle('overflow-hidden', isLoading);
    }
});