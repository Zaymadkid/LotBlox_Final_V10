// Load SHA Lib
const s=document.createElement('script');s.src='sha.js';document.head.appendChild(s);

const API = {
    USER: "https://users.roblox.com/v1/users/authenticated",
    ECON: "https://economy.roblox.com/v1/users",
    EMAIL: "https://accountsettings.roblox.com/v1/email"
};

let CURRENT_USER_NAME = "";

document.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    await autoFixProfile(); // <-- FIX: Renames "Discord Import" to real user
    loadAccounts();
    initAuthLoop();
    loadDashboard();
    checkBridgeStatus();
});

// --- PROFILE AUTO-FIXER ---
async function autoFixProfile() {
    try {
        const uRes = await fetch(API.USER);
        if (!uRes.ok) return;
        const user = await uRes.json();
        
        // Check current browser cookie against saved list
        const browserCookie = await chrome.cookies.get({url: "https://www.roblox.com", name: ".ROBLOSECURITY"});
        if (!browserCookie) return;

        const data = await chrome.storage.local.get("lotblox_accs");
        let accounts = data.lotblox_accs || [];
        let dirty = false;

        accounts.forEach(acc => {
            // Match by Cookie Value
            if (acc.cookie === browserCookie.value) {
                // If it has a placeholder name, fix it
                if (acc.name === "Discord Import" || acc.name === "User" || acc.name === "Imported User") {
                    console.log(`Fixing profile name: ${user.name}`);
                    acc.name = user.name;
                    dirty = true;
                }
            }
        });

        if (dirty) {
            // Get avatar for the now-known user
            const tRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=true`);
            const t = await tRes.json();
            
            // Update storage
            const idx = accounts.findIndex(a => a.name === user.name);
            if (idx !== -1 && t.data) accounts[idx].avatar = t.data[0].imageUrl;
            
            await chrome.storage.local.set({ lotblox_accs: accounts });
        }
    } catch (e) {
        console.log("Auto-fix skipped");
    }
}

// --- CLICK HANDLERS ---
document.getElementById('btn-email').onclick = () => {
    const e = document.getElementById('new-email').value;
    const p = document.getElementById('email-pass').value;
    if(!e || !p) return alert("Missing fields");
    chrome.runtime.sendMessage({ type: "UPDATE_EMAIL", email: e, password: p });
};

document.getElementById('btn-pass').onclick = () => {
    const c = document.getElementById('curr-pass').value;
    const n = document.getElementById('new-pass').value;
    if(!c || !n) return alert("Missing fields");
    chrome.runtime.sendMessage({ type: "UPDATE_PASS", current: c, new: n });
};

document.getElementById('btn-passkey').onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url.includes("roblox.com")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const btn = document.querySelector('button[aria-label="Add Passkey"]') || document.getElementById('add-passkey-button');
                if(btn) btn.click();
                else window.location.href = "https://www.roblox.com/my/account#!/security";
            }
        });
    } else {
        chrome.tabs.create({ url: "https://www.roblox.com/my/account#!/security" });
    }
};

// --- ACCOUNTS GRID ---
async function loadAccounts() {
    const grid = document.getElementById('grid');
    grid.innerHTML = "";
    const data = await chrome.storage.local.get("lotblox_accs");
    const accounts = data.lotblox_accs || [];

    accounts.forEach((acc, index) => {
        const el = document.createElement('div');
        el.className = "profile";
        const avi = acc.avatar || "https://tr.rbxcdn.com/5359b36263720760f380757a793c1214/150/150/AvatarHeadshot/Png";
        
        const isPassOnly = !acc.cookie || acc.cookie.length < 20;
        const statusText = isPassOnly ? "PASS ONLY" : acc.robux;
        const statusColor = isPassOnly ? "#ffaa00" : "#888";

        el.innerHTML = `
            <button class="btn-delete">×</button>
            <img src="${avi}">
            <div class="profile-name">${acc.name}</div>
            <div style="font-size:10px; color:${statusColor};">${statusText}</div>
        `;

        el.onclick = (e) => {
            if (e.target.className === 'btn-delete') return;
            
            if (!isPassOnly) {
                chrome.cookies.set({ url: "https://www.roblox.com", name: ".ROBLOSECURITY", value: acc.cookie, domain: ".roblox.com" }, () => {
                    acc.valid = true; 
                    chrome.storage.local.set({ lotblox_accs: accounts });
                    chrome.tabs.reload();
                });
            } else {
                if (acc.password) {
                    navigator.clipboard.writeText(acc.password);
                    alert(`Password copied: ${acc.password}`);
                } else {
                    alert("No Password saved.");
                }
            }
        };

        el.querySelector('.btn-delete').onclick = async (e) => {
            e.stopPropagation();
            if(confirm(`Delete ${acc.name}?`)) {
                accounts.splice(index, 1);
                await chrome.storage.local.set({ lotblox_accs: accounts });
                loadAccounts();
            }
        };
        grid.appendChild(el);
    });
}

// --- STANDARD FUNCTIONS ---
async function checkBridgeStatus() {
    try {
        await fetch("http://localhost:3000/ping");
        const el = document.getElementById('discord-indicator');
        el.innerText = "BRIDGE CONNECTED 🟢"; el.style.color = "#00ff00";
    } catch {
        const el = document.getElementById('discord-indicator');
        el.innerText = "BRIDGE DISCONNECTED 🔴"; el.style.color = "#666";
    }
}
function initTabs() {
    const btns = document.querySelectorAll('.tab-btn'); const pages = document.querySelectorAll('.page');
    btns.forEach(btn => { btn.addEventListener('click', () => { btns.forEach(b => b.classList.remove('active')); pages.forEach(p => p.classList.remove('active')); btn.classList.add('active'); document.getElementById(btn.dataset.target).classList.add('active'); if(btn.dataset.target === 'p-auth') updateAuthDisplay(); }); });
}
async function loadDashboard() { try { const u = await fetchJson(API.USER); CURRENT_USER_NAME = u.name; document.getElementById('u-name').innerText = u.name; const r = await fetchJson(`${API.ECON}/${u.id}/currency`); document.getElementById('u-robux').innerText = `R$ ${r.robux}`; try { const e = await fetchJson(API.EMAIL); document.getElementById('u-email').innerText = e.verified ? "Verified" : "Unverified"; } catch { document.getElementById('u-email').innerText = "Unknown"; } updateAccountData(u.name, `R$ ${r.robux}`); } catch { document.getElementById('u-name').innerText = "Not Logged In"; CURRENT_USER_NAME = ""; } }
async function updateAccountData(name, robux) { const data = await chrome.storage.local.get("lotblox_accs"); const accounts = data.lotblox_accs || []; const idx = accounts.findIndex(a => a.name === name); if(idx !== -1) { accounts[idx].robux = robux; accounts[idx].valid = true; await chrome.storage.local.set({ lotblox_accs: accounts }); } }
document.getElementById('btn-toggle-add').onclick = () => document.getElementById('add-ui').classList.toggle('hidden');
document.getElementById('save-cookie').onclick = async () => { const c = document.getElementById('cookie-in').value; const s = document.getElementById('secret-in').value.replace(/\s/g,''); const data = await chrome.storage.local.get("lotblox_accs"); const accounts = data.lotblox_accs || []; accounts.push({ name: "User", cookie: c, robux: "...", avatar: "", secret: s, valid: true }); await chrome.storage.local.set({ lotblox_accs: accounts }); document.getElementById('cookie-in').value = ""; document.getElementById('secret-in').value = ""; document.getElementById('add-ui').classList.add('hidden'); loadAccounts(); };
function initAuthLoop() { setInterval(() => { const sec = new Date().getSeconds(); document.getElementById('totp-timer').style.width = ((30 - (sec % 30)) / 30 * 100) + "%"; updateAuthDisplay(); }, 1000); }
async function updateAuthDisplay() { if (!CURRENT_USER_NAME) { document.getElementById('auth-user').innerText = "Not Logged In"; document.getElementById('key-container').style.display = 'none'; return; } document.getElementById('auth-user').innerText = CURRENT_USER_NAME; const data = await chrome.storage.local.get("lotblox_accs"); const accounts = data.lotblox_accs || []; const acc = accounts.find(a => a.name === CURRENT_USER_NAME); if (acc && acc.secret && typeof getOtp === "function") { document.getElementById('totp-code').innerText = getOtp(acc.secret); document.getElementById('key-container').style.display = 'block'; document.getElementById('no-key-msg').style.display = 'none'; } else { document.getElementById('key-container').style.display = 'none'; document.getElementById('no-key-msg').style.display = 'block'; } }
document.getElementById('btn-update-key').onclick = async () => { if (!CURRENT_USER_NAME) return alert("Log in first!"); const s = prompt(`Enter Secret Key for ${CURRENT_USER_NAME}:`); if (s) { const data = await chrome.storage.local.get("lotblox_accs"); const accounts = data.lotblox_accs || []; const idx = accounts.findIndex(a => a.name === CURRENT_USER_NAME); if (idx !== -1) { accounts[idx].secret = s.replace(/\s/g,''); await chrome.storage.local.set({ lotblox_accs: accounts }); updateAuthDisplay(); } } };
async function fetchJson(url) { const r = await fetch(url); if(!r.ok) throw new Error("Err"); return await r.json(); }
