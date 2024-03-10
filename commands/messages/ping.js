// commands/message/ping.js
module.exports = {
  name: 'ping',
  description: 'Replies with pong!',
  async execute(interaction) {
    await interaction.reply('pong');
  },
};
