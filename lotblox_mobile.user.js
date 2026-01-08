// ==UserScript==
// @name         LotBlox V20 - Mobile Suite
// @namespace    http://tampermonkey.net/
// @updateURL    https://raw.githubusercontent.com/Zaymadkid/LotBlox/main/lotblox_mobile.user.js
// @downloadURL  https://raw.githubusercontent.com/Zaymadkid/LotBlox/main/lotblox_mobile.user.js
// @author       Zay
// @match        https://www.roblox.com/*
// @icon         https://www.roblox.com/favicon.ico
// @grant        GM_cookie
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. DRAGGABLE BUTTON ---
    const btn = document.createElement('div');
    btn.innerHTML = "🛠️";
    btn.style.cssText = `
        position: fixed; bottom: 120px; right: 20px;
        width: 50px; height: 50px;
        background: #0078d4; border-radius: 50%;
        color: white; font-size: 24px; line-height: 50px; text-align: center;
        z-index: 999999; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        cursor: pointer; user-select: none; touch-action: none;
    `;
    document.body.appendChild(btn);

    // --- 2. THE PANEL (Hidden) ---
    const panel = document.createElement('div');
    panel.style.cssText = `
        display: none; position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%); width: 85%; max-width: 320px;
        background: #111; color: white; border: 2px solid #333; border-radius: 15px;
        padding: 20px; z-index: 1000000; font-family: sans-serif; box-shadow: 0 0 20px black;
        max-height: 80vh; overflow-y: auto; /* Scrollable if screen is small */
    `;
    
    panel.innerHTML = `
        <h3 style="margin:0 0 15px 0; color:#0078d4; font-size:18px; text-align:center;">
            LotBlox Mobile
            <span id="lb-close" style="float:right; cursor:pointer; color:#666;">✖</span>
        </h3>

        <div style="background:#1a1a1a; padding:10px; border-radius:8px; border:1px solid #333; margin-bottom:15px;">
            <label style="color:#00ff00; font-weight:bold; font-size:12px;">🍪 COOKIE LOGIN</label>
            <input id="lb-cookie" placeholder="Paste Cookie Here..." style="width:93%; padding:8px; margin-top:5px; background:#000; border:1px solid #444; color:white; border-radius:4px; font-family:monospace;">
            <button id="btn-login" style="width:100%; margin-top:5px; padding:10px; background:#009900; color:white; border:none; border-radius:6px; font-weight:bold;">LOGIN</button>
        </div>

        <div style="background:#1a1a1a; padding:10px; border-radius:8px; border:1px solid #333; margin-bottom:15px;">
            <label style="color:#ff4444; font-weight:bold; font-size:12px;">⚠️ UNLINK EMAIL (AGE GLITCH)</label>
            <p style="font-size:10px; color:#aaa; margin:5px 0;">Sets age to <13 (2016) to force removal.</p>
            <input id="lb-pass-unlink" type="password" placeholder="Account Password" style="width:93%; padding:8px; margin-top:5px; background:#000; border:1px solid #444; color:white; border-radius:4px;">
            <button id="btn-unlink" style="width:100%; margin-top:5px; padding:10px; background:#ff4444; color:white; border:none; border-radius:6px; font-weight:bold;">FORCE UNLINK</button>
        </div>

        <div style="background:#1a1a1a; padding:10px; border-radius:8px; border:1px solid #333;">
            <label style="color:#ffaa00; font-weight:bold; font-size:12px;">📧 ADD / CHANGE EMAIL</label>
            <input id="lb-email" placeholder="New Email Address" style="width:93%; padding:8px; margin-top:5px; background:#000; border:1px solid #444; color:white; border-radius:4px;">
            <input id="lb-pass-email" type="password" placeholder="Account Password" style="width:93%; padding:8px; margin-top:5px; background:#000; border:1px solid #444; color:white; border-radius:4px;">
            <button id="btn-email" style="width:100%; margin-top:5px; padding:10px; background:#ffaa00; color:black; border:none; border-radius:6px; font-weight:bold;">UPDATE EMAIL</button>
        </div>

        <div id="lb-status" style="margin-top:15px; text-align:center; font-size:12px; color:#888;">Ready</div>
    `;
    document.body.appendChild(panel);

    // --- 3. DRAG LOGIC ---
    let isDrag = false, startX, startY, initLeft, initTop;
    const start = (e) => {
        isDrag = false;
        const t = e.touches ? e.touches[0] : e;
        startX = t.clientX; startY = t.clientY;
        const rect = btn.getBoundingClientRect();
        initLeft = rect.left; initTop = rect.top;
        document.addEventListener(e.touches ? 'touchmove' : 'mousemove', move, {passive: false});
        document.addEventListener(e.touches ? 'touchend' : 'mouseup', stop);
    };
    const move = (e) => {
        const t = e.touches ? e.touches[0] : e;
        if (Math.abs(t.clientX - startX) > 5 || Math.abs(t.clientY - startY) > 5) {
            isDrag = true;
            if(e.cancelable) e.preventDefault();
            btn.style.left = (initLeft + t.clientX - startX) + 'px';
            btn.style.top = (initTop + t.clientY - startY) + 'px';
            btn.style.right = 'auto'; btn.style.bottom = 'auto';
        }
    };
    const stop = () => {
        document.removeEventListener('touchmove', move); document.removeEventListener('mousemove', move);
        document.removeEventListener('touchend', stop); document.removeEventListener('mouseup', stop);
    };
    btn.addEventListener('touchstart', start, {passive: false}); btn.addEventListener('mousedown', start);
    btn.onclick = () => { if(!isDrag) panel.style.display = (panel.style.display==='none'?'block':'none'); };
    document.getElementById('lb-close').onclick = () => panel.style.display = 'none';

    // --- 4. CSRF HELPER ---
    async function getCsrf() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) return meta.content;
        try { await fetch("https://auth.roblox.com/v2/logout", {method:"POST"}); } catch(e){}
        return null;
    }

    // --- 5. LOGIC: COOKIE LOGIN ---
    document.getElementById('btn-login').onclick = () => {
        const c = document.getElementById('lb-cookie').value.trim();
        const s = document.getElementById('lb-status');
        if (!c) return s.innerText = "❌ Paste a cookie first!";
        if (typeof GM_cookie === 'undefined') return alert("❌ Error: GM_cookie not supported on this browser/app.");

        s.innerText = "🍪 Setting Cookie...";
        GM_cookie.set({ url: "https://www.roblox.com", name: ".ROBLOSECURITY", value: c, domain: ".roblox.com", path: "/" }, function(error) {
            if (error) s.innerText = "❌ Failed: " + error;
            else { s.innerText = "✅ SUCCESS! Refreshing..."; setTimeout(() => location.reload(), 1000); }
        });
    };

    // --- 6. LOGIC: AGE GLITCH (UNLINKER) ---
    document.getElementById('btn-unlink').onclick = async () => {
        const p = document.getElementById('lb-pass-unlink').value;
        const s = document.getElementById('lb-status');
        if(!p) return s.innerText = "❌ Enter Password!";
        
        if(!confirm("⚠️ WARNING: This sets age to 9 (2016).\nIt WILL remove the email.\nAre you sure?")) return;

        s.innerText = "⏳ Unlinking...";
        const csrf = await getCsrf();

        try {
            const res = await fetch("https://users.roblox.com/v1/birthdate", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf },
                body: JSON.stringify({ birthMonth: 1, birthDay: 1, birthYear: 2016, password: p })
            });

            if (res.ok) {
                s.innerText = "✅ UNLINKED! Refreshing...";
                s.style.color = "#00ff00";
                setTimeout(() => location.reload(), 2000);
            } else {
                const err = await res.json();
                s.innerText = `❌ Error: ${err.errors?.[0]?.message}`;
                s.style.color = "red";
            }
        } catch(e) { s.innerText = "❌ Network Error"; }
    };

    // --- 7. LOGIC: EMAIL ADDER ---
    document.getElementById('btn-email').onclick = async () => {
        const email = document.getElementById('lb-email').value;
        const p = document.getElementById('lb-pass-email').value;
        const s = document.getElementById('lb-status');
        if(!email || !p) return s.innerText = "❌ Fill all fields!";
        
        s.innerText = "📧 Sending...";
        const csrf = await getCsrf();

        try {
            const res = await fetch("https://accountsettings.roblox.com/v1/email", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf },
                body: JSON.stringify({ emailAddress: email, password: p })
            });

            if (res.ok) {
                s.innerText = "✅ Email Verification Sent!";
                s.style.color = "#00ff00";
            } else {
                const err = await res.json();
                if (res.status === 403) {
                    alert("Captcha Blocked! Use manual mode.");
                    window.open("https://www.roblox.com/my/account#!/info");
                } else {
                    s.innerText = `❌ Error: ${err.errors?.[0]?.message}`;
                }
            }
        } catch(e) { s.innerText = "❌ Network Error"; }
    };

})();
