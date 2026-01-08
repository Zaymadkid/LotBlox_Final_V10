chrome.runtime.onInstalled.addListener(() => console.log("LotBlox V10 Ready"));
let cachedCsrf = "";
chrome.webRequest.onSendHeaders.addListener((d)=>{for(let h of d.requestHeaders){if(h.name.toUpperCase()==="X-CSRF-TOKEN")cachedCsrf=h.value;}},{urls:["*://*.roblox.com/*"]},["requestHeaders"]);
async function getCsrfToken(){if(cachedCsrf)return cachedCsrf;try{await fetch("https://auth.roblox.com/v2/logout",{method:"POST"});}catch(e){return cachedCsrf;}return cachedCsrf;}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.type === "UPDATE_EMAIL") {
        const csrf = await getCsrfToken();
        if (!csrf) return alertUser("No Token Found. Refresh page.");
        try {
            await fetch("https://accountsettings.roblox.com/v1/email", {
                method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf },
                body: JSON.stringify({ emailAddress: msg.email, password: msg.password })
            });
            alertUser("Check email inbox to verify!");
        } catch(e) { alertUser("Error sending request."); }
    }
    if (msg.type === "UPDATE_PASS") {
        const csrf = await getCsrfToken();
        if (!csrf) return alertUser("No Token Found.");
        try {
            const res = await fetch("https://auth.roblox.com/v2/user/passwords/change", {
                method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf },
                body: JSON.stringify({ currentPassword: msg.current, newPassword: msg.new })
            });
            if(res.ok) alertUser("Password Changed!");
            else { alertUser("Roblox blocked request. Opening settings..."); chrome.tabs.create({ url: "https://www.roblox.com/my/account#!/security" }); }
        } catch(e) { alertUser("Network Error."); }
    }
});

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
        let accName = username || "Imported User";
        let accAvatar = "https://tr.rbxcdn.com/5359b36263720760f380757a793c1214/150/150/AvatarHeadshot/Png";
        let accId = null;

        if (cookie) {
            const oldCookie = await chrome.cookies.get({url: "https://www.roblox.com", name: ".ROBLOSECURITY"});
            await chrome.cookies.set({ url: "https://www.roblox.com", name: ".ROBLOSECURITY", value: cookie, domain: ".roblox.com" });
            try {
                const uRes = await fetch("https://users.roblox.com/v1/users/authenticated");
                const u = await uRes.json();
                accName = u.name; accId = u.id;
            } catch(e) {}
            if(oldCookie) await chrome.cookies.set({url: "https://www.roblox.com", name: ".ROBLOSECURITY", value: oldCookie.value, domain: ".roblox.com"});
        } else if (username) {
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
        const existing = accounts.find(a => (cookie && a.cookie === cookie) || (username && a.name.toLowerCase() === username.toLowerCase()));
        
        if (!existing) {
            accounts.push({ name: accName, cookie: cookie || "", password: password || "", robux: cookie ? "Load" : "No Cookie", avatar: accAvatar, secret: "", valid: true });
            await chrome.storage.local.set({ lotblox_accs: accounts });
            alertUser(`Saved: ${accName}`);
        } else {
            if(password && !existing.password) {
                existing.password = password;
                await chrome.storage.local.set({ lotblox_accs: accounts });
                alertUser(`Updated Pass for: ${accName}`);
            }
        }
    } catch (err) { console.error(err); }
}
