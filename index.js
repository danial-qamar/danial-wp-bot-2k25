const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const {
  storeMessage,
  handleMessageRevocation,
} = require("./commands/antidelete");

const ownerFilePath = path.join(__dirname, "data/owner.json");
const ownerData = fs.existsSync(ownerFilePath) ? JSON.parse(fs.readFileSync(ownerFilePath, "utf-8")) : { number: "923218228183@s.whatsapp.net" };
const OWNER_NUMBER = ownerData.number;

// Suppress libsignal session errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = args[0]?.toString() || "";
  if (msg.includes("Bad MAC") || msg.includes("Session error") || msg.includes("Failed to decrypt") || msg.includes("Closing open session")) return;
  originalConsoleError(...args);
};

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    logger: pino({ level: "silent" }),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\n📱 Scan this QR code:");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") console.log("✅ Bot connected!");
    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log("Disconnected:", reason, "| Reconnecting:", shouldReconnect);
      if (shouldReconnect) setTimeout(startBot, 5000);
    }
  });

  // Load all command files dynamically
  const commands = {};
  fs.readdirSync(path.join(__dirname, "commands"))
    .filter((f) => f.endsWith(".js"))
    .forEach((file) => {
      const cmd = require(`./commands/${file}`);
      if (cmd.name) {
        commands[cmd.name] = cmd;
        if (cmd.aliases) {
          cmd.aliases.forEach(alias => commands[alias] = cmd);
        }
      }
    });

  // Handle incoming messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg?.message || !msg.key?.remoteJid) continue;

      const chatId = msg.key.remoteJid;
      const msgText =
        msg.message.conversation || msg.message.extendedTextMessage?.text;

      // Handle commands (start with .)
      if (msgText && msgText.startsWith(".")) {
        const args = msgText.slice(1).trim();
        const commandName = args.split(" ")[0];
        const commandArgs = args.split(" ").slice(1).join(" ");

        if (commands[commandName]) {
          try {
            await commands[commandName].run(sock, chatId, commandArgs, msg);
            console.log(
              `💻 [COMMAND] (${chatId}): .${commandName} ${commandArgs}`
            );
          } catch (err) {
            console.error(`Error executing .${commandName}:`, err);
            // Try to send error message
            try {
              await sock.sendMessage(chatId, { text: "❌ Command failed. Please try again." });
            } catch (e) {}
          }
        }
        continue;
      }

      // Handle deleted messages
      const proto = msg.message?.protocolMessage;
      if (proto) {
        await handleMessageRevocation(proto, sock, OWNER_NUMBER);
      } else {
        // Store normal messages for anti-delete
        storeMessage(msg);
      }
    }
  });

  // Handle message updates (deleted messages)
  sock.ev.on("messages.update", async (updates) => {
    for (const u of updates) {
      await handleMessageRevocation(
        u.update?.message?.protocolMessage,
        sock,
        OWNER_NUMBER
      );
    }
  });
}

startBot();
