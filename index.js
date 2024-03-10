const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");
const { Client, GatewayIntentBits, MessageEmbed } = Discord;
const { spawn } = require("child_process");
const { ActivityType } = require("discord.js");
const { Partials } = require("discord.js");
const mongoose = require("mongoose");

const config = require("./setup/config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
mongoose
  .connect(
    config.mongodbUri,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB:", err));

client.commands = new Discord.Collection();
client.buttons = new Discord.Collection();

const loadCommands = (dir) => {
  console.log(`Reading directory: ${dir}`);
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    console.log(`Checking file: ${filePath}`);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      loadCommands(filePath);
    } else if (file.endsWith(".js")) {
      console.log(`Attempting to require: ${filePath}`);
      const command = require(`./${filePath}`);
      client.commands.set(command.name, command);
    }
  }
};

loadCommands("./commands");

client.functions = new Discord.Collection();

const loadFunctions = (dir) => {
  console.log(`Reading directory: ${dir}`);
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    console.log(`Checking file: ${filePath}`);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      loadFunctions(filePath);
    } else if (file.endsWith(".js")) {
      console.log(`Attempting to require: ${filePath}`);
      const func = require(`./${filePath}`);
      client.functions.set(func.name, func);
      func(client);
    }
  }
};

loadFunctions("./functions");

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({
    activities: [{ name: `Hierarchy Mc`, type: ActivityType.Competing }],
    status: "online",
  });

  const commands = client.commands.map(
    ({ name, description, options = [] }) => ({
      name,
      description,
      options,
    }),
  );
  client.application.commands.set(commands);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    // Existing command handling logic
    const command = client.commands.get(interaction.commandName);
    if (command) {
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isButton()) {
    // Handling button interactions
    console.log(`Button clicked: ${interaction.customId}`); // Logging the button click for debugging
    const buttonHandler = client.buttons.get(interaction.customId);
    if (buttonHandler) {
      try {
        await buttonHandler.execute(interaction);
      } catch (error) {
        console.error("Error handling button interaction:", error);
        await interaction.reply({
          content: "There was an error while handling this button interaction!",
          ephemeral: true,
        });
      }
    }
  }
});

const buttonFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));

for (const file of buttonFiles) {
  const filePath = path.join(__dirname, "events", file);
  const button = require(filePath);
  console.log(`Loading button handler: ${button.name}`);
  client.buttons.set(button.name, button);
}

client.login(config.discordToken);

module.exports = client;
