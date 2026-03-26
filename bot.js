const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
const config = require('./config.json');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('clientReady', () => console.log("Bot is ready!"));

// Общая функция отправки команды на сервер
async function sendCommand(type, username, reason, days, adminId) {
    const data = { type, username, reason, days, adminId, userId: null };
    await fetch(config.serverURL + '/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

// ===== Команды =====
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    // Проверка роли
    if (!interaction.member.roles.cache.has('1432275054149894227')) {
        await interaction.reply({ content: "You don't have permission", ephemeral: true });
        return;
    }

    // === KICK ===
    if (commandName === 'kick') {
        const username = interaction.options.getString('username');
        const reason = interaction.options.getString('reason') || "No reason set";
        await sendCommand('kick', username, reason, 0, interaction.user.id);
        await interaction.reply(`✅ Kicked ${username}`);
    }

    // === BAN ===
    if (commandName === 'ban') {
        const username = interaction.options.getString('username');
        const days = interaction.options.getInteger('days');
        const reason = interaction.options.getString('reason') || "No reason set";
        await sendCommand('ban', username, reason, days, interaction.user.id);
        await interaction.reply(`✅ Banned ${username} for ${days} day(s)`);
    }

    // === PERMABAN ===
    if (commandName === 'permaban') {
        const username = interaction.options.getString('username');
        const reason = interaction.options.getString('reason') || "No reason set";
        await sendCommand('permaban', username, reason, 0, interaction.user.id);
        await interaction.reply(`✅ Permanently banned ${username}`);
    }

    // === UNBAN ===
    if (commandName === 'unban') {
        const username = interaction.options.getString('username');
        await sendCommand('unban', username, "", 0, interaction.user.id);
        await interaction.reply(`✅ Unbanned ${username}`);
    }

    // === BANLIST ===
    if (commandName === 'banlist') {
        const res = await fetch(config.serverURL + '/banlist');
        const data = await res.json();
        if (data.length === 0) return await interaction.reply("No bans currently.");
        const text = data.map(b => `${b.username} (${b.userId}) — ${b.daysLeft}`).join("\n");
        await interaction.reply("```" + text + "```");
    }

    // === FIND ===
    if (commandName === 'find') {
        const userId = interaction.options.getString('userid');
        await interaction.reply(`https://www.roblox.com/users/${userId}/profile`);
    }
});

client.login(config.botToken);