// welcome.js
module.exports = (client) => {
  client.on('guildMemberAdd', (member) => {
    const welcomeChannelID = '1156688444106481704'; // Replace with the channel ID where you want to send the welcome message
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelID);

    if (welcomeChannel) {
      const welcomeMessage = `Welcome to the server, ${member.toString()}! go buy something!!!.`;
      welcomeChannel.send(welcomeMessage);
    }
  });
};
