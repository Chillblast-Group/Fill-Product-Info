(function() {
    // Only run once unless forceRefresh is true
    if (!window.fillProductInfoHasRun) window.fillProductInfoHasRun = false;

    function fillProductInfo({ forceRefresh = false } = {}) {
        if (window.fillProductInfoHasRun && !forceRefresh) return;
        window.fillProductInfoHasRun = true;

        const format_gbp = new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        });

        const sku_els = Array.from(document.querySelectorAll('[data-fill-product-info-sku][data-fill-product-info-status="pending"]'));
        const dl = window.dataLayer || [];
        const dlItem = dl
          .slice()
          .find(e => Array.isArray(e?.ecommerce?.items) && e.ecommerce.items.length);
        const currentSku = dlItem?.ecommerce?.items?.[0]?.item_id || null;

        const fetchPromises = sku_els.map(el => {
            const sku = el.dataset.fillProductInfoSku;
            const apiUrl = "https://api.chillblast.com/Product/GetProducts?productCodes=" + sku;

            const price_el = el.querySelector('[data-fill-product-info="price"]');
            const link_el = el.querySelector('[data-fill-product-info="link"]');
            const image_el = el.querySelector('[data-fill-product-info="image"]');
            const title_el = el.querySelector('[data-fill-product-info="title"]');
            const value_if_current_el = el.querySelector('[data-fill-product-info-value-if-current]');
            const remove_if_unavailable = el.querySelector('[data-fill-product-info-unavailable="hide"]');

            return fetch(apiUrl)
                .then(r => r.json())
                .then(data => {

                    let image_width = '600';
                    if (image_el?.dataset?.fillProductInfoImageWidth) {
                        image_width = image_el.dataset.fillProductInfoImageWidth;
                    }

                    if (!data) {
                        el.remove();
                        return false;
                    }

                    if (data.value) data = data.value;

                    if (data.length === 0) {
                        el.remove();
                        return null;
                    }

                    var isCurrent = currentSku === sku

                    const tags = data[0].tags || [];
                    const status = tags.includes("LeadTime_Z") ? "unavailable" : "ready";

                    if (price_el) price_el.textContent = status === "ready" ? format_gbp.format(data[0].grossPrice) : 'Sold out';
                    if (link_el) link_el.href = data[0].url;
                    if (image_el) image_el.src = "https://static.chillblast.com" + data[0].imageUrl + '?width=' + image_width;
                    if (title_el) title_el.textContent = data[0].name;
                    if (isCurrent) el.dataset.fillProductInfoCurrent = "current";
                    if (isCurrent && value_if_current_el) {
                        value_if_current_el.textContent = value_if_current_el.dataset.fillProductInfoValueIfCurrent
                    }
                    el.dataset.fillProductInfoStatus = status;
                    if(remove_if_unavailable && status === 'unavailable') {
                        el.remove()
                    }

                    return true;
                })
                .catch(err => {
                    console.error("Error fetching product:", err);
                    el.dataset.fillProductInfoStatus = "unavailable";
                    if(remove_if_unavailable) {
                        el.remove()
                    }
                    return err;
                });
        });

        Promise.all(fetchPromises).then(() => {
            console.log('All products processed');
        });
    }

    // Run once DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => fillProductInfo());
    } else {
        fillProductInfo();
    }

    // Expose to window so you can force refresh manually
    window.fillProductInfo = fillProductInfo;
})();
