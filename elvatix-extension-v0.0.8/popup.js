let iframe;
let PRIMARY_URL = 'https://app.elvatix.com/extension_page';
let FALLBACK_URL = 'https://elvatix.com/extension_page';
let width = 800;
let height = 580;

let iframe_onload = function () {
    let loading = document.getElementsByClassName('lds-ring')[0];
    if (loading) loading.remove();
}

/**
 * Check if a URL is reachable (HEAD request with timeout).
 * Returns true if the server responds with a 2xx or 3xx status.
 */
async function isUrlReachable(url, timeoutMs = 3000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Determine which iframe URL to use.
 * Tries the primary (new) domain first, falls back to the old domain.
 */
async function getActiveIframeUrl() {
    const primaryReachable = await isUrlReachable(PRIMARY_URL);
    if (primaryReachable) {
        console.log('[Elvatix] Using primary domain: app.elvatix.com');
        return PRIMARY_URL;
    }
    console.log('[Elvatix] Primary domain unreachable, falling back to: elvatix.com');
    return FALLBACK_URL;
}

window.onload = async function () {
    function getCookie(name) {
        return new Promise((resolve, reject) => {
            chrome.cookies.get({ url: "https://www.linkedin.com", name: name }, function (cookie) {
                if (cookie) {
                    resolve(cookie.value);
                } else {
                    resolve(null);
                }
            });
        });
    }

    const liAtCookie = await getCookie("li_at");
    const liACookie = await getCookie("li_a");

    // Determine which domain to use (new or fallback)
    const iframe_url = await getActiveIframeUrl();

    setTimeout(function () {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, async function (tabs) {
            var currentTab = tabs[0];
            var currentUrl = currentTab.url;
            let group = document.getElementsByClassName('group_iframe')[0];
            const agent = navigator.userAgent;
            let i = document.createElement('iframe');
            i.frameBorder = 0;
            i.width = width;
            i.height = height;
            i.src = iframe_url + `?url=${encodeURIComponent(currentUrl)}&userAgent=${agent}&liat=${liAtCookie}&lia=${liACookie}`;
            console.log('[Elvatix] Loading iframe:', i.src);
            i.onload = iframe_onload;
            iframe = group.appendChild(i);
        });
    }, 100);
}

