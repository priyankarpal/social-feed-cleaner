const storage=chrome.storage.local;

const defaultSettings={
    enabled: true,
    platforms: {
        x: true,
        linkedin: true,
    },
    filters: {
        promo: true,
        bait: true,
        adult: true,
        scam: true,
        crypto: true,
        spam: true
    },
    customKeywords: [],
    hiddenCount: 0
};

async function loadSettings() {
    const data=await storage.get('settings');
    return data.settings||defaultSettings;
}

async function saveSettings(settings) {
    await storage.set({ settings });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSettings', settings });
    });
}

async function init() {
    const settings=await loadSettings();

    document.getElementById('enabled').checked=settings.enabled;
    document.getElementById('filterX').checked=settings.platforms.x;
    document.getElementById('filterLinkedIn').checked=settings.platforms.linkedin;
    document.getElementById('filterPromo').checked=settings.filters.promo;
    document.getElementById('filterBait').checked=settings.filters.bait;
    document.getElementById('filterAdult').checked=settings.filters.adult;
    document.getElementById('filterScam').checked=settings.filters.scam;
    document.getElementById('filterCrypto').checked=settings.filters.crypto;
    document.getElementById('filterSpam').checked=settings.filters.spam;
    document.getElementById('hiddenCount').textContent=settings.hiddenCount;

    renderKeywords(settings.customKeywords);

    document.getElementById('enabled').addEventListener('change', async (e) => {
        settings.enabled=e.target.checked;
        await saveSettings(settings);
    });

    document.getElementById('filterX').addEventListener('change', async (e) => {
        settings.platforms.x=e.target.checked;
        await saveSettings(settings);
    });

    document.getElementById('filterLinkedIn').addEventListener('change', async (e) => {
        settings.platforms.linkedin=e.target.checked;
        await saveSettings(settings);
    });

    document.getElementById('filterPromo').addEventListener('change', async (e) => {
        settings.filters.promo=e.target.checked;
        await saveSettings(settings);
    });

    document.getElementById('filterBait').addEventListener('change', async (e) => {
        settings.filters.bait=e.target.checked;
        await saveSettings(settings);
    });

    document.getElementById('filterAdult').addEventListener('change', async (e) => {
        settings.filters.adult=e.target.checked;
        await saveSettings(settings);
    });

    document.getElementById('filterScam').addEventListener('change', async (e) => {
        settings.filters.scam=e.target.checked;
        await saveSettings(settings);
    });

    document.getElementById('filterCrypto').addEventListener('change', async (e) => {
        settings.filters.crypto=e.target.checked;
        await saveSettings(settings);
    });

    document.getElementById('filterSpam').addEventListener('change', async (e) => {
        settings.filters.spam=e.target.checked;
        await saveSettings(settings);
    });

    document.getElementById('addKeyword').addEventListener('click', async () => {
        const input=document.getElementById('keywordInput');
        const keyword=input.value.trim().toLowerCase();
        if (keyword&&!settings.customKeywords.includes(keyword)) {
            settings.customKeywords.push(keyword);
            await saveSettings(settings);
            renderKeywords(settings.customKeywords);
            input.value='';
        }
    });

    document.getElementById('keywordInput').addEventListener('keypress', (e) => {
        if (e.key==='Enter') {
            document.getElementById('addKeyword').click();
        }
    });

    document.getElementById('resetStats').addEventListener('click', async () => {
        settings.hiddenCount=0;
        await saveSettings(settings);
        document.getElementById('hiddenCount').textContent='0';
    });
}

function renderKeywords(keywords) {
    const list=document.getElementById('keywordList');
    list.innerHTML=keywords.map(kw => `
        <div class="keyword-row">
            <span class="keyword-text">${kw}</span>
            <button data-keyword="${kw}" class="remove-keyword keyword-remove-btn" title="Remove">X</button>
        </div>
    `).join('');

    document.querySelectorAll('.remove-keyword').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const keyword=e.currentTarget.dataset.keyword;
            const settings=await loadSettings();
            settings.customKeywords=settings.customKeywords.filter(kw => kw!==keyword);
            await saveSettings(settings);
            renderKeywords(settings.customKeywords);
        });
    });
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.action==='updateCount') {
        document.getElementById('hiddenCount').textContent=request.count;
    }
});

init();