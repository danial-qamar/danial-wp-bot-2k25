const gTTS = require("gtts");

module.exports = {
  name: "tts",
  description: "Convert text to speech",
  run: async (sock, chatId, args, message, language = "en") => {
    try {
      const text = Array.isArray(args) ? args.join(" ") : args;
      if (!text.trim()) {
        console.log("❌ No text provided for TTS");
        await sock.sendMessage(chatId, {
          text: "❌ Please provide text for TTS.",
        });
        return;
      }

      console.log(`🎤 .tts command triggered by ${chatId}: ${text}`);

      // Generate TTS audio in memory using a temporary file
      const gtts = new gTTS(text, language);
      const tempPath = `./tts-temp-${Date.now()}.mp3`;

      gtts.save(tempPath, async (err) => {
        if (err) {
          console.error("⚠️ TTS Error:", err);
          await sock.sendMessage(chatId, {
            text: "⚠️ Error generating TTS audio.",
          });
          return;
        }

        const audioBuffer = require("fs").readFileSync(tempPath);

        // Send audio directly
        await sock.sendMessage(
          chatId,
          {
            audio: audioBuffer,
            mimetype: "audio/mp4",
            ptt: true,
          },
          { quoted: message }
        );

        console.log("✅ TTS audio sent successfully!");

        // Delete temporary file immediately
        require("fs").unlinkSync(tempPath);
      });
    } catch (err) {
      console.error("⚠️ TTS Command Error:", err);
      await sock.sendMessage(chatId, { text: "⚠️ Error processing TTS." });
    }
  },
};
