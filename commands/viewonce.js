const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

// Load owner number from JSON
const ownerFilePath = path.join(__dirname, "../data/owner.json");
const ownerData = JSON.parse(fs.readFileSync(ownerFilePath, "utf-8"));
const OWNER_NUMBER = ownerData.number;

module.exports = {
  name: "dekhta",
  aliases: ["wow", "mine", "kya", "thanks", "nice", "chuzza", "paro", "jhoot"],
  description:
    "Save and resend a view-once image or video to owner with sender info",
  run: async (sock, chatId, args, message) => {
    try {
      const quoted =
        message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const quotedImage = quoted?.imageMessage;
      const quotedVideo = quoted?.videoMessage;

      let buffer;
      let captionText = `👤 Sender: ${chatId}`;

      if (quotedImage && quotedImage.viewOnce) {
        const stream = await downloadContentFromMessage(quotedImage, "image");
        buffer = Buffer.from([]);
        for await (const chunk of stream)
          buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(OWNER_NUMBER, {
          image: buffer,
          fileName: "media.jpg",
          caption: `${captionText}\n${quotedImage.caption || ""}`,
        });
      } else if (quotedVideo && quotedVideo.viewOnce) {
        const stream = await downloadContentFromMessage(quotedVideo, "video");
        buffer = Buffer.from([]);
        for await (const chunk of stream)
          buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(OWNER_NUMBER, {
          video: buffer,
          fileName: "media.mp4",
          caption: `${captionText}\n${quotedVideo.caption || ""}`,
        });
      } else {
        // Send error only to owner if user didn't reply to view-once media
        await sock.sendMessage(OWNER_NUMBER, {
          text: `❌ User ${chatId} tried to use .dekhta but didn't reply to a view-once image or video.`,
        });
      }
    } catch (error) {
      // Send error details only to owner
      await sock.sendMessage(OWNER_NUMBER, {
        text: `❌ Error in .dekhta command from ${chatId}: ${error.message}`,
      });
      console.error("Error in dekhta command:", error);
    }
  },
};
