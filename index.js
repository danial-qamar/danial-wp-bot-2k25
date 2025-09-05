const {
  default: makeWASocket,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const {
  storeMessage,
  handleMessageRevocation,
} = require("./commands/antidelete");

// Owner number
const OWNER_NUMBER = "923218228183@s.whatsapp.net";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({
    auth: state,
    // printQRInTerminal: true,
    browser: ["WhatsApp Bot", "Chrome", "1.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === "open") console.log("✅ Bot connected!");
    if (connection === "close") startBot();
  });

  // Load all command files dynamically
  const commands = {};
  fs.readdirSync(path.join(__dirname, "commands"))
    .filter((f) => f.endsWith(".js"))
    .forEach((file) => {
      const cmd = require(`./commands/${file}`);
      if (cmd.name) commands[cmd.name] = cmd;
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
          }
        }
        continue; // skip storing command messages
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
