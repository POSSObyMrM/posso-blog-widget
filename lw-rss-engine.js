(async function () {
    const config = document.currentScript.dataset;
    const RSS_URL = "https://posso.es/rss.xml";

    console.log("> RSS Engine: Starting...");
    
    const isSameOrigin = window.location.hostname === "posso.es";

    /**
     * FETCH IMAGE FROM METADATA (og:image)
     */
    const fetchMetaImage = async (url) => {
        try {
            const targetUrl = isSameOrigin ? url : "https://corsproxy.io/?" + encodeURIComponent(url);
            const response = await fetch(targetUrl);
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");
            const ogImage = doc.querySelector('meta[property="og:image"]');
            return ogImage ? ogImage.getAttribute('content') : null;
        } catch (e) {
            console.warn(`> RSS Engine: Could not fetch meta image for ${url}`);
            return null;
        }
    };

    /**
     * TEMPLATE REPOSITORY
     */
    const templates = {
        'card-mini': (data) => `
            <div class="col span_4_of_12 lw-card-mb span_4_of_12-tl span_6_of_12-tp span_6_of_12-sl span_12_of_12-sp no-padding flex-item">
                <a href="${data.link}" class="lw-card card-mini">
                    <div class="lw-badge learnworlds-overline-text">Actividad</div>
                    <div class="lw-header">
                        <span class="lw-day learnworlds-main-text learnworlds-main-text-huge">${data.day}</span>
                        <span class="lw-month-year learnworlds-main-text learnworlds-main-text-large">${data.month} ${data.year}</span>
                    </div>
                    <div class="lw-body">
                        <h3 class="learnworlds-heading3 learnworlds-heading3-small">${data.title}</h3>
                    </div>
                </a>
            </div>
        `,
        'card-list': (data) => `
            <div class="col span_12_of_12 no-padding flex-item lw-card-mb">
                <a href="${data.link}" class="lw-card card-list">
                    <div class="row-section row-title-box">
                        <span class="lw-badge learnworlds-overline-text">Así fue</span>
                        <h3 class="learnworlds-heading3 learnworlds-element learnworlds-heading3-large lw-title">${data.title}</h3>
                    </div>
                    <div class="row-section row-info-box">
                        <p class="learnworlds-main-text learnworlds-main-text-normal lw-description">${data.description}</p>
                        <div class="lw-date">
                            <span class="lw-day learnworlds-main-text learnworlds-main-text-huge">${data.day}</span> 
                            <span class="lw-month-year learnworlds-main-text learnworlds-main-text-normal bold">${data.month} ${data.year}</span>
                        </div>
                    </div>
                    <div class="row-section row-image-box" style="background-image: url('${data.image || 'https://via.placeholder.com/400x300'}')">
                        <div class="js-learnworlds-overlay"></div>
                    </div>
                </a>
            </div>
        `,
        'card-color': (data) => `
            <div class="col lw-b-1px-fadeout80 span_4_of_12 span_4_of_12-tl span_4_of_12-tp span_6_of_12-sl span_12_of_12-sp mb-2rem no-padding flex-item learnworlds-align-left lw-body-bg lw-blog-card js-blog-card">
                <a href="${data.link}" class="lw-blog-card-txt text-dec-none card-color">
                    <div class="lw-tags">
                        ${data.categories.map(cat => `
                            <div class="lw-tag lw-brand-bg learnworlds-main-text learnworlds-element learnworlds-main-text-tiny tt-none">${cat}</div>
                        `).join('')}
                    </div>
                    <div class="learnworlds-image pos-rel learnworlds-bg-default stretched-bg learnworlds-framed-image learnworlds-element no-margin-bottom rectangle learnworlds-frame-size-full" style="background-image: url('${data.image || 'https://via.placeholder.com/400x300'}');"></div>
                    <div class="lw-padding-small learnworlds-element">
                        <div class="learnworlds-overline-text learnworlds-element">
                            por <span>${data.author || 'Equipo POSSO'}</span> | ${data.day} ${data.month}, ${data.year}
                        </div>
                        <h3 class="learnworlds-heading3 learnworlds-heading3-small learnworlds-element">
                            ${data.title}
                        </h3>
                        <div class="lw-blog-card-descr learnworlds-main-text learnworlds-element learnworlds-main-text-very-small">
                            ${data.description}
                        </div>
                    </div>
                </a>
            </div>
        `,
        'card-dark': (data) => `
            <div class="col lw-b-1px-fadeout80 span_4_of_12 span_4_of_12-tl span_4_of_12-tp span_6_of_12-sl span_12_of_12-sp mb-2rem no-padding flex-item learnworlds-align-left lw-body-bg lw-blog-card js-blog-card">
                <a href="${data.link}" class="lw-blog-card-txt text-dec-none card-dark">
                    <div class="lw-tags">
                        ${data.categories.map(cat => `
                            <div class="lw-tag lw-brand-bg learnworlds-main-text learnworlds-element learnworlds-main-text-tiny tt-none">${cat}</div>
                        `).join('')}
                    </div>
                    <div class="learnworlds-image pos-rel learnworlds-bg-default stretched-bg learnworlds-framed-image learnworlds-element no-margin-bottom rectangle learnworlds-frame-size-full" style="background-image: url('${data.image || 'https://via.placeholder.com/400x300'}');"></div>
                    <div class="lw-padding-small learnworlds-element">
                        <div class="learnworlds-overline-text learnworlds-element">
                            por <span>${data.author || 'Equipo POSSO'}</span> | ${data.day} ${data.month}, ${data.year}
                        </div>
                        <h3 class="learnworlds-heading3 learnworlds-heading3-small learnworlds-element">
                            ${data.title}
                        </h3>
                        <div class="lw-blog-card-descr learnworlds-main-text learnworlds-element learnworlds-main-text-very-small">
                            ${data.description}
                        </div>
                    </div>
                </a>
            </div>
        `,
        'debug': (data) => `<pre style="font-size:10px; color:white; background:black; padding:10px; overflow:auto;">${JSON.stringify(data, null, 2)}</pre>`
    };

    /**
     * MAIN FEED PROCESSING
     */
    try {
        let xmlText = "";
        if (isSameOrigin) {
            console.log("> RSS Engine: Same-origin detected. Fetching directly.");
            const response = await fetch("/rss.xml");
            xmlText = await response.text();
        } else {
            console.log("> RSS Engine: Cross-origin detected. Using proxy.");
            const PROXY_URL = "https://corsproxy.io/?" + encodeURIComponent(RSS_URL);
            const response = await fetch(PROXY_URL);
            xmlText = await response.text();
        }

        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "text/xml");
        const items = Array.from(xml.querySelectorAll("item"));

        if (items.length === 0) throw new Error("No items found.");

        // PREPARE CATEGORY FILTERS
        const rawCategoryParam = config.category || "";
        const categoryList = rawCategoryParam.split(',').map(s => s.trim()).filter(Boolean);
        const includeTags = categoryList.filter(s => !s.startsWith('-')).map(s => s.toLowerCase());
        const excludeTags = categoryList.filter(s => s.startsWith('-')).map(s => s.substring(1).toLowerCase());

        // FILTER ITEMS
        const filtered = items.filter(item => {
            const itemLink = item.querySelector("link").textContent;
            const itemCategories = Array.from(item.querySelectorAll("category")).map(c => c.textContent.toLowerCase());
            const pubDate = new Date(item.querySelector("pubDate").textContent);
            const itemSlug = itemLink.split('/').filter(Boolean).pop();

            // 1. Check Exclusion Slug (data-remove)
            if (config.remove && itemSlug === config.remove.trim()) return false;

            // 2. Date Filter (Optional)
            if (config.filter === 'future' && pubDate < new Date()) return false;
            if (config.filter === 'past' && pubDate >= new Date()) return false;

            // 3. Category Filter Logic
            const hasExcludedTag = excludeTags.some(tag => itemCategories.includes(tag));
            if (hasExcludedTag) return false;

            if (includeTags.length > 0) {
                const hasIncludedTag = includeTags.some(tag => itemCategories.includes(tag));
                if (!hasIncludedTag) return false;
            }

            return true;
        });

        // NORMALIZE DATA
        const processedItems = filtered.slice(0, parseInt(config.limit) || 3).map(item => {
            const dateObj = new Date(item.querySelector("pubDate").textContent);
            const descHtml = item.querySelector("description").textContent;
            return {
                title: item.querySelector("title").textContent,
                link: item.querySelector("link").textContent,
                description: descHtml.replace(/<[^>]*>?/gm, '').substring(0, 180),
                day: dateObj.getDate(),
                month: dateObj.toLocaleDateString('es-ES', { month: 'long' }),
                year: dateObj.getFullYear(),
                categories: Array.from(item.querySelectorAll("category")).map(c => c.textContent),
                image: (descHtml.match(/src="([^"]+)"/) || [])[1] || null
            };
        });

        // FETCH IMAGES ONLY IF TEMPLATE NEEDS THEM
        const needsImages = config.template !== 'card-mini';
        if (needsImages) {
            await Promise.all(processedItems.map(async (data) => {
                if (!data.image) {
                    data.image = await fetchMetaImage(data.link);
                }
            }));
        }

        const container = document.querySelector(config.container);
        if (!container) return;
        
        // Use classList.add to preserve existing classes instead of overwriting them
        container.classList.add(
            "lw-event-wrapper", 
            "lw-cols", 
            "multiple-rows", 
            "multiple-rows-tl", 
            "multiple-rows-tp", 
            "multiple-rows-sl", 
            "multiple-rows-sp", 
            "align-items-stretch", 
            "j-c-f-s"
        );
        
        container.innerHTML = "";

        processedItems.forEach(itemData => {
            const templateFn = templates[config.template] || templates['card-mini'];
            container.innerHTML += templateFn(itemData);
        });

    } catch (error) {
        console.error("> RSS Engine Error:", error);
    }
})();