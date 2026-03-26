const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config.json');

const commands = [
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a player')
        .addStringOption(o => o.setName('username').setRequired(true))
        .addStringOption(o => o.setName('reason')),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a player for X days')
        .addStringOption(o => o.setName('username').setRequired(true))
        .addIntegerOption(o => o.setName('days').setRequired(true))
        .addStringOption(o => o.setName('reason')),

    new SlashCommandBuilder()
        .setName('permaban')
        .setDescription('Permanently ban a player')
        .addStringOption(o => o.setName('username').setRequired(true))
        .addStringOption(o => o.setName('reason')),

    new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a player')
        .addStringOption(o => o.setName('username').setRequired(true)),

    new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Show list of banned players'),

    new SlashCommandBuilder()
        .setName('find')
        .setDescription('Find Roblox profile by userId')
        .addStringOption(o => o.setName('userid').setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(config.botToken);

(async () => {
    await rest.put(
        Routes.applicationCommands("1486778621879259368"),
        { body: commands }
    );
    console.log("✅ Commands deployed");
})();