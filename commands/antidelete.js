const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

// Load owner number from JSON
const ownerFilePath = path.join(__dirname, "../data/owner.json");
const ownerData = JSON.parse(fs.readFileSync(ownerFilePath, "utf-8"));
const OWNER_NUMBER = ownerData.number;

const store = {}; // Stores messages temporarily

// Unwrap ephemeral/view-once messages
function unwrapMessage(msg) {
  if (!msg) return msg;
  if (msg.ephemeralMessage?.message)
    return unwrapMessage(msg.ephemeralMessage.message);
  if (msg.viewOnceMessage?.message)
    return unwrapMessage(msg.viewOnceMessage.message);
  if (msg.documentWithCaptionMessage?.message)
    return unwrapMessage(msg.documentWithCaptionMessage.message);
  return msg;
}

// Determine message type and content
function summarizeMessageContent(message) {
  const m = unwrapMessage(message);

  if (m.conversation) return { type: "text", text: m.conversation };
  if (m.extendedTextMessage?.text)
    return { type: "text", text: m.extendedTextMessage.text };
  if (m.imageMessage)
    return { type: "image", text: m.imageMessage.caption || "[Image]" };
  if (m.videoMessage)
    return { type: "video", text: m.videoMessage.caption || "[Video]" };
  if (m.stickerMessage) return { type: "sticker", text: "[Sticker]" };
  if (m.audioMessage) return { type: "audio", text: "[Audio]" };
  if (m.documentMessage)
    return {
      type: "document",
      text: m.documentMessage.fileName || "[Document]",
    };
  if (m.contactMessage) return { type: "contact", text: "[Contact]" };
  if (m.locationMessage) return { type: "location", text: "[Location]" };

  return { type: "unknown", text: "[Non-text message]" };
}

// Store messages in memory
function storeMessage(msg) {
  const chatId = msg.key.remoteJid;
  const fromMe = !!msg.key.fromMe;
  const senderJid = fromMe ? msg.key.remoteJid : msg.key.participant || chatId;

  const { type, text } = summarizeMessageContent(msg.message);

  store[msg.key.id] = {
    chatId,
    fromMe,
    senderJid,
    type,
    text,
    originalMsg: msg.message,
  };
}

// Handle deleted messages and forward to owner
async function handleMessageRevocation(proto, sock) {
  if (!proto || !(proto.type === 0 || proto.type === "REVOKE")) return;

  const rId = proto.key?.id;
  const deletedMsg = store[rId];

  if (!deletedMsg) {
    console.log(
      `🚫 [DELETED MESSAGE] content not found in memory (id=${rId}).`
    );
    return;
  }

  console.log(
    `🚫 [DELETED MESSAGE] (${deletedMsg.chatId}) ${
      deletedMsg.senderJid || "Unknown"
    }: ${deletedMsg.text}`
  );

  try {
    const m = deletedMsg.originalMsg;

    switch (deletedMsg.type) {
      case "text":
        await sock.sendMessage(OWNER_NUMBER, {
          text: `🚫 Deleted message from ${deletedMsg.chatId} (${
            deletedMsg.senderJid || "Unknown"
          }):\n${deletedMsg.text}`,
        });
        break;

      case "image":
      case "video":
      case "audio":
      case "document":
      case "sticker":
        const media = await downloadMediaMessage(
          { message: m },
          "buffer",
          {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        );

        const mediaPayload = {};
        if (deletedMsg.type === "image") mediaPayload.image = media;
        if (deletedMsg.type === "video") mediaPayload.video = media;
        if (deletedMsg.type === "audio") mediaPayload.audio = media;
        if (deletedMsg.type === "document") mediaPayload.document = media;
        if (deletedMsg.type === "sticker") mediaPayload.sticker = media;

        await sock.sendMessage(OWNER_NUMBER, {
          ...mediaPayload,
          caption: `🚫 Deleted ${deletedMsg.type} from ${deletedMsg.chatId} (${
            deletedMsg.senderJid || "Unknown"
          }): ${deletedMsg.text}`,
        });
        break;

      case "contact":
        await sock.sendMessage(OWNER_NUMBER, {
          contacts: {
            displayName: deletedMsg.text,
            contacts: [m.contactMessage],
          },
        });
        break;

      case "location":
        await sock.sendMessage(OWNER_NUMBER, {
          location: m.locationMessage,
          caption: `🚫 Deleted location from ${deletedMsg.chatId} (${
            deletedMsg.senderJid || "Unknown"
          })`,
        });
        break;

      default:
        await sock.sendMessage(OWNER_NUMBER, {
          text: `🚫 Deleted unknown message from ${deletedMsg.chatId} (${
            deletedMsg.senderJid || "Unknown"
          }):\n${deletedMsg.text}`,
        });
        break;
    }
  } catch (err) {
    console.error("Failed to send deleted message to owner:", err);
  }
}

module.exports = { storeMessage, handleMessageRevocation };
