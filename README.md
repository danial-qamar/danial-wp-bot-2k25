# 🤖 WhatsApp Bot

A feature-rich, high-performance WhatsApp bot built using Node.js and `@whiskeysockets/baileys`.

---

## 📋 Features & Commands

| Command | Usage | Description |
| :--- | :--- | :--- |
| `.menu` | `.menu` | Display bot menu banner and command list |
| `.ping` | `.ping` | Test bot responsiveness |
| `.tts` | `.tts <text>` | Convert text into spoken voice note (Text-To-Speech) |
| `.blur` | `.blur` (Reply to image) | Blur an image sent in chat |
| `.vv` / `.viewonce` | Reply to View Once | Retrieve and resend View Once images/videos directly to owner |
| **Anti-Delete** | Automatic | Intercepts revoked/deleted messages and forwards them to owner |

---

## ⚙️ Configuration (How to Change Owner Number)

### 1. Setting Owner Number
All owner notifications (Anti-Delete logs, View-Once media, bot alerts) are sent to the phone number configured in `data/owner.json`.

1. Open `data/owner.json`:
   ```json
   {
     "number": "YOUR_COUNTRY_CODE_NUMBER@s.whatsapp.net"
   }
   ```
2. Replace the number with your WhatsApp phone number.
   * **Format:** Country code + Phone number (no `+`, no spaces, no dashes) followed by `@s.whatsapp.net`.
   * **Example for US (+1 234 567 8900):** `"12345678900@s.whatsapp.net"`
   * **Example for Pakistan (+92 321 822 8183):** `"923218228183@s.whatsapp.net"`

### 2. Customizing Menu Details (Optional)
To change the bot name, version, or author shown in `.menu`:
- Edit `commands/.menu.js` lines 10–12.

---

## 🚀 How to Run the Bot

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
- [Git](https://git-scm.com/)

### Step 1: Install Dependencies
Open terminal/command prompt in the project root folder and run:
```bash
npm install
```

### Step 2: Start the Bot
Run the following command:
```bash
npm start
```
*(Alternatively: `node index.js`)*

### Step 3: Link WhatsApp Account
1. A **QR Code** will be generated in your terminal screen.
2. Open **WhatsApp** on your mobile device.
3. Go to **Settings / Menu ⋮** -> **Linked Devices** -> **Link a Device**.
4. Scan the terminal QR code.
5. Once connected, you will see `✅ Bot connected!`.

---

## 📦 Client Setup / Folder Sharing Guide

If you are transferring or selling this bot project to a client:

### ✅ Folders & Files to Share:
* `commands/` — Core bot features and commands
* `assets/` — Bot images and assets
* `data/` — Configuration folder (Make sure `owner.json` is updated)
* `index.js` — Main bot entry script
* `package.json` & `package-lock.json` — Dependency manifests
* `nodemon.json` & `.gitignore` — Configuration files

### ⛔ Folders & Files NOT to Share (Exclude):
* 🛑 **`auth/`** — **DO NOT SHARE!** Contains your private session keys. The client will generate their own `auth/` folder when they scan their own QR code.
* 🛑 **`node_modules/`** — Large folder. The client will automatically generate this by running `npm install`.
* 🛑 **`.git/`** — Version control history.
* 🛑 **`.env`** (if present) — Secret credentials or keys.
