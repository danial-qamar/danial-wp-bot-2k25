const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const sharp = require("sharp");

module.exports = {
  name: "blur",
  description: "Blur an image",
  run: async (sock, chatId, args, message) => {
    try {
      console.log("🔹 .blur command triggered by", chatId);

      let imageBuffer;
      const quotedMessage =
        message.message.extendedTextMessage?.contextInfo?.quotedMessage;
      const currentImageMessage = message.message?.imageMessage;

      if (quotedMessage?.imageMessage) {
        console.log("📸 Quoted image detected");
        imageBuffer = await downloadMediaMessage(
          { message: quotedMessage },
          "buffer",
          {},
          {}
        );
      } else if (currentImageMessage) {
        console.log("📸 Image in current message detected");
        imageBuffer = await downloadMediaMessage(message, "buffer", {}, {});
      } else {
        console.log("❌ No image found to blur");
        await sock.sendMessage(chatId, {
          text: "❌ Send or reply to an image to blur.",
        });
        return;
      }

      console.log("🖌 Blurring image...");
      const blurredImage = await sharp(imageBuffer)
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .blur(10)
        .toBuffer();

      // Send blurred image directly
      await sock.sendMessage(chatId, {
        image: blurredImage,
        caption: "🖼 Image blurred successfully!",
      });
      console.log("✅ Image blurred and sent successfully!");
    } catch (err) {
      console.error("⚠️ Blur Error:", err);
      await sock.sendMessage(chatId, { text: "⚠️ Error processing image." });
    }
  },
};
