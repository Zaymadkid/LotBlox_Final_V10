# 🎮 LotBlox Manager - Vault Edition (V21: Mobile Suite)

**LotBlox Manager** is a premium browser extension for advanced Roblox account management. V21 introduces the **Mobile Suite** - a powerful mobile userscript with draggable UI controls, enhanced Discord bridge integration, and seamless account automation tools.
---

## ✨ Key Features

### 🔵 Discord Vault Integration

Manage your entire account vault through a secure Discord bridge.

- **Cookie Import:** Directly import cookies from Discord bridge
- **Username:Password Storage:** Save login credentials with optional password-only profiles
- **Auto-Sync:** Real-time sync from the local bridge at `http://localhost:3000`

### 🔧 Smart Profile Auto-Fixer (New in V15)

- **Auto-Rename Imports:** Detects active Roblox user and auto-renames generic imports (e.g., "Discord Import") to real usernames
- **Live Avatars:** Pulls live avatar headshots for a cleaner accounts grid
- **Profile Status:** Displays Robux balance or "Pass Only" status for quick account identification

### 🔑 Built-in TOTP / 2FA

- **Per-Account Secrets:** Store 2FA secrets inside the vault for each account
- **Live Code Display:** Real-time code generation with 30-second timer bar
- **Auto-Fill & Auto-Submit:** Automatically fills and submits verification codes on Roblox 2FA prompts
- **Secret Management:** Add, update, or remove secrets per-account

### 📧 Email Auto-Fill (New in V20)

- **Auto-Type Email:** Opens Roblox settings and automatically types new email address
- **Password Auto-Fill:** Fills password field for verification
- **Captcha Support:** Alerts user to complete captcha after auto-fill

### 📉 Age Manager Glitch (New in V20)

- **Force Age Change:** Sets account birthday to Jan 1, 2016 (9 years old)
- **Email Unlinker:** Forcefully unlinks email by changing age to <13
- **Safety Checks:** Detects ID-verified accounts and blocks age change
- **PIN Bruteforce:** Attempts common PINs if parent PIN is detected
- **Warning System:** Confirms action with user before executing

### 🛡️ Security Features

- **Real Passkey Support:** One-click button to add passkeys (opens Roblox security page)
- **Password Changer:** Update account password directly from extension
- **Cookie Switcher:** Instantly switch between accounts with one click

### 🌉 Discord Bridge Server

- **Bot Commands:**
  - `!cookie <cookie>` - Queue cookie for import
  - `!login user:pass` - Queue username:password for import
- **Auto-Sync:** Extension polls bridge every 3 seconds for new accounts
- **Status Indicator:** Shows bridge connection status (🟢 Connected / 🔴 Disconnected)

---

## 📦 Installation

### Chrome Extension

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the repository folder
5. The extension icon should appear in your toolbar

### Mobile UserScript

1. Install a userscript manager (Tampermonkey, Violentmonkey, etc.)
2. Click on `lotblox_mobile.user.js` in this repo
3. Click "Raw" to view the raw file
4. Your userscript manager should prompt you to install
5. The script will auto-update from this GitHub repo

### Discord Bridge Server

#### Local Hosting (Development)

1. Install Node.js
2. Navigate to `LotBlox_Bridge` folder
3. Run `npm install`
4. Edit `server.js` and add your Discord bot token
5. Run `npm start`
6. Server will run on `http://localhost:3000`

#### Free Cloud Hosting (Production)

**Recommended: Render.com**

1. Push the `LotBlox_Bridge` folder to a GitHub repository
2. Go to [Render.com](https://render.com) and sign up
3. Create a new "Web Service"
4. Connect your GitHub repository
5. Set root directory to `LotBlox_Bridge`
6. Add environment variable: `BOT_TOKEN` = your Discord bot token
7. Deploy and copy the production URL
8. Update `background.js` in the extension: replace `http://localhost:3000` with your Render URL

**Alternative Free Hosts:**
- **Glitch.com** - Easy paste-and-go, but sleeps after 5 min inactivity
- **Replit.com** - Good for coding in browser, but "Always On" is now paid

---

## 🤖 Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it "LotBlox Bridge"
3. Go to "Bot" tab and click "Add Bot"
4. Enable "Message Content Intent" under Privileged Gateway Intents
5. Click "Reset Token" and copy your bot token
6. Go to "OAuth2" > "URL Generator"
7. Select scopes: `bot`
8. Select permissions: `Send Messages`, `Read Messages/View Channels`
9. Copy the generated URL and open it to invite the bot to your server
10. Paste the bot token into `server.js` or add it as an environment variable on Render

---

## 🎯 Usage

### Dashboard Tab
- View current user info (username, Robux, email status)
- Add passkey with one click
- Check Discord bridge connection status

### Accounts Tab
- View all saved accounts in a grid
- Click account to switch cookies instantly
- Click "×" to delete an account
- Add new accounts with cookie or 2FA secret

### 2FA Tab
- View live TOTP code for current user
- 30-second countdown timer
- Add/update 2FA secret key

### Settings Tab
- **Email Auto-Fill:** Enter new email and password, extension opens settings and types for you
- **Age Manager:** Change age to 9 (2016) to force email unlink
- **Password Changer:** Update account password

### Mobile UserScript
- Floating button (bottom right) opens control panel
- **Cookie Login:** Paste cookie and login instantly
- **Email Unlinker:** Force age change to <13 to remove email
- **Email Changer:** Add or update email address

### Discord Commands
- `!cookie _|WARNING:-DO-NOT-SHARE...` - Import account by cookie
- `!login username:password` - Import account by credentials

---

## ⚠️ Warnings

- **Age Manager:** Changing age to <13 enables Safe Chat and may restrict account features
- **ID Verified Accounts:** Cannot change age if account is ID verified
- **2FA Required:** Email unlinker may fail if 2FA is enabled and you don't have access to old email
- **Parent PIN:** Age manager will attempt to bruteforce common PINs (0000, 1234, 1111, 12345)
- **Cookies:** Never share your .ROBLOSECURITY cookie with anyone
- **Bot Token:** Keep your Discord bot token private

---

## 🔄 Auto-Update (UserScript)

The mobile userscript includes auto-update URLs:
- `@updateURL https://raw.githubusercontent.com/Zaymadkid/LotBlox/main/lotblox_mobile.user.js`
- `@downloadURL https://raw.githubusercontent.com/Zaymadkid/LotBlox/main/lotblox_mobile.user.js`

Your userscript manager will automatically check for updates.

---

## 📝 License

See [LICENSE](LICENSE) file for details.

---

## 🆘 Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Version 20.0** - Mobile Suite Edition  
**Author:** Zaymadkid  
**Repository:** [github.com/Zaymadkid/LotBlox](https://github.com/Zaymadkid/LotBlox)
