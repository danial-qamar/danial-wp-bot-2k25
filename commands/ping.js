module.exports = {
  name: "ping", // Command name triggered by .ping
  description: "Check if the bot is online and measure latency",
  run: async (sock, chatId, args, message) => {
    console.log(`🏓 .ping command triggered by ${chatId}`);

    const start = Date.now();

    // Directly calculate latency and send response
    const latency = Date.now() - start;

    await sock.sendMessage(
      chatId,
      { text: `🏓 Pong! Latency: ${latency}ms` },
      { quoted: message }
    );
  },
};
