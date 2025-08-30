let settings=null;
let observer=null;

const patterns={
    promo: [
        'sponsored', 'promoted', 'ad', 'advertisement', 'partner content',
        'paid partnership', 'affiliate', 'discount code', 'promo code',
        'limited time offer', 'sale', 'deal', 'offer expires', 'shop now',
        'buy now', 'get yours', 'order today', 'free shipping'
    ],
    bait: [
        'you won\'t believe', 'shocking', 'this one trick', 'doctors hate',
        'number 5 will shock you', 'gone wrong', 'gone sexual', 'not clickbait',
        'wait for it', 'watch till the end', 'mind-blowing', 'life-changing',
        'you\'ve been doing it wrong', 'secret revealed', 'exposed'
    ],
    adult: [
        'nsfw', '18+', 'onlyfans', 'adult content', 'explicit',
        'mature content', 'xxx', 'porn', 'nude', 'sexy', 'hot pics'
    ],
    scam: [
        'get rich quick', 'make money online', 'earn from home',
        'passive income', 'financial freedom', 'millionaire', 'giveaway',
        'free money', 'cash app', 'venmo me', 'send money', 'wire transfer',
        'nigerian prince', 'inheritance', 'lottery winner', 'you\'ve won'
    ],
    crypto: [
        'crypto', 'bitcoin', 'ethereum', 'nft', 'defi', 'blockchain',
        'hodl', 'to the moon', 'pump', 'altcoin', 'tokenomics', 'airdrop',
        'ico', 'web3', 'metaverse', 'dao', 'staking', 'yield farming'
    ],
    spam: [
        'follow for follow', 'f4f', 'like for like', 'l4l', 'sub4sub',
        'follow back', 'dm for', 'link in bio', 'check my profile',
        'retweet to win', 'tag someone', 'share if you agree'
    ]
};

const platformSelectors={
    x: {
        post: '[data-testid="tweet"], article[data-testid="tweet"]',
        feed: '[data-testid="primaryColumn"]',
        text: '[data-testid="tweetText"], .css-1qaijid, .css-901oao'
    },
    linkedin: {
        post: '.feed-shared-update-v2, .occludable-update',
        feed: '.scaffold-layout__main',
        text: '.feed-shared-text, .update-components-text'
    }
};

function detectPlatform() {
    const hostname=window.location.hostname;
    if (hostname.includes('x.com')||hostname.includes('twitter.com')) return 'x';
    if (hostname.includes('linkedin.com')) return 'linkedin';
    return null;
}

function shouldFilter(text) {
    if (!settings||!settings.enabled) return false;

    const lowerText=text.toLowerCase();

    for (const [filterType, keywords] of Object.entries(patterns)) {
        if (settings.filters[filterType]) {
            for (const keyword of keywords) {
                if (lowerText.includes(keyword)) return true;
            }
        }
    }

    for (const keyword of settings.customKeywords) {
        if (lowerText.includes(keyword)) return true;
    }

    return false;
}

function hidePost(element) {
    if (element.dataset.filtered) return;

    element.dataset.filtered='true';
    element.style.display='none';

    settings.hiddenCount++;
    chrome.storage.local.set({ settings });
    chrome.runtime.sendMessage({ action: 'updateCount', count: settings.hiddenCount });
}

function filterContent() {
    const platform=detectPlatform();
    if (!platform||!settings?.platforms[platform]) return;

    const selectors=platformSelectors[platform];
    const posts=document.querySelectorAll(selectors.post);

    posts.forEach(post => {
        if (post.dataset.filtered) return;

        const textElements=post.querySelectorAll(selectors.text);
        let fullText='';

        textElements.forEach(el => {
            fullText+=' '+(el.textContent||el.innerText||'');
        });

        if (shouldFilter(fullText)) {
            hidePost(post);
        }
    });
}

async function loadSettings() {
    const data=await chrome.storage.local.get('settings');
    settings=data.settings||{
        enabled: true,
        platforms: { x: true, linkedin: true },
        filters: { promo: true, bait: true, adult: true, scam: true, crypto: true, spam: true },
        customKeywords: [],
        hiddenCount: 0
    };
}

function setupObserver() {
    if (observer) observer.disconnect();

    const platform=detectPlatform();
    if (!platform) return;

    const targetNode=document.querySelector(platformSelectors[platform].feed);
    if (!targetNode) {
        setTimeout(setupObserver, 1000);
        return;
    }

    observer=new MutationObserver(() => {
        filterContent();
    });

    observer.observe(targetNode, {
        childList: true,
        subtree: true
    });
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.action==='updateSettings') {
        settings=request.settings;
        filterContent();
    }
});

async function init() {
    await loadSettings();
    setupObserver();
    filterContent();

    setInterval(filterContent, 2000);
}

if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}