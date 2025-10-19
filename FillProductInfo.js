function fillProductInfo() {
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

    // Prepare fetch promises
    const fetchPromises = sku_els.map(el => {
        const sku = el.dataset.fillProductInfoSku;
        const apiUrl = "https://api.chillblast.com/Product/GetProducts?productCodes=" + sku;

        return fetch(apiUrl)
            .then(r => r.json())
            .then(data => {
                const price_el = el.querySelector('[data-fill-product-info="price"]');
                const link_el = el.querySelector('[data-fill-product-info="link"]');
                const image_el = el.querySelector('[data-fill-product-info="image"]');
                const title_el = el.querySelector('[data-fill-product-info="title"]');
                
                
                let image_width = '600'
                if(image_el && image_el.dataset && image_el.dataset.fillProductInfoImageWidth) {
                    image_width = image_el.dataset.fillProductInfoImageWidth
                }

                if (!data) {
                  el.remove();
                  return false
                }

                if (data.value) {
                  data = data.value
                }

               if (data.length === 0) {
                    // Remove element if no data returned
                    el.remove();
                    return null;
                }
              
                const tags = data[0].tags || [];
                const status = tags.includes("LeadTime_Z") ? "unavailable" : "ready";
              
                if (price_el) {
                    price_el.textContent = status === "ready" ? format_gbp.format(data[0].grossPrice) : 'Sold out';
                }
                if (link_el) link_el.href = data[0].url;
                if (image_el) image_el.src = "https://static.chillblast.com" + data[0].imageUrl + '?width=' + image_width;
                if (title_el) title_el.textContent = data[0].name;
                if (currentSku === sku) el.dataset.fillProductInfoCurrent = "current";
                el.dataset.fillProductInfoStatus = status;
                return true;
            })
            .catch(err => {
                console.error("Error fetching product:", err);
                el.dataset.fillProductInfoStatus = "unavailable";
                return err;
            });
    });
}

setPrices();
