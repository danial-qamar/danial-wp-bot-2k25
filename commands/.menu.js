const fs = require("fs");
const path = require("path");

module.exports = {
  name: "menu", // Command name triggered by .menu
  description: "Show a minimal list of available commands",
  run: async (sock, chatId, args, message) => {
    console.log(`📜 .menu command triggered by ${chatId}`);

    const botName = "Danial Whatsapp Bot";
    const botVersion = "1.0.0";
    const botOwner = "Danial Qamar";

    const menuMessage = `
╔═══════════════════╗
   *🤖 ${botName}*  
   Version: *${botVersion}*
   by ${botOwner}
╚═══════════════════╝

*Available Commands:*  

╔═══════════════════╗
🌐 *Basic Commands*:
║ ➤ .ping
║ ➤ .tts <text>
║ ➤ .blur <image>
╚═══════════════════╝
`;

    try {
      const imagePath = path.join(__dirname, "../assets/danialqamar.jpg");

      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);

        await sock.sendMessage(
          chatId,
          {
            image: imageBuffer,
            caption: menuMessage,
          },
          { quoted: message }
        );
      } else {
        await sock.sendMessage(
          chatId,
          { text: menuMessage },
          { quoted: message }
        );
      }
    } catch (error) {
      console.error("Error sending menu:", error);
      await sock.sendMessage(chatId, { text: menuMessage });
    }
  },
};
