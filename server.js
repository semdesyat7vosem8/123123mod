const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch'); // node-fetch@2
const config = require('./config.json');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', () => console.log(`Logged in as ${client.user.tag}`));

// ===== Отправка команд на сервер Roblox =====
async function sendCommand(type, username, reason, days, adminId, userId = null) {
    const data = { type, username, reason, days, adminId, userId };
    try {
        await fetch(`${process.env.SERVER_URL}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (err) {
        console.error("Error sending command to server:", err);
    }
}

// ===== Отправка логов в Discord вебхук =====
async function sendEmbedLog(title, description) {
    const embed = {
        title: title.toUpperCase(),
        description,
        color: 0xFFC0CB,
        timestamp: new Date()
    };
    try {
        await fetch(process.env.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (err) {
        console.error("Error sending log to Discord:", err);
    }
}

// ===== Слушаем slash команды =====
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;

    // Проверка роли
    if (!interaction.member.roles.cache.has('1432275054149894227')) {
        return interaction.reply({ content: "You don't have permission", ephemeral: true });
    }

    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason') || "No reason set";
    const days = interaction.options.getInteger('days') || 0;
    const adminId = interaction.user.id;

    // ===== KICK =====
    if (commandName === 'kick') {
        await sendCommand('kick', username, reason, 0, adminId);
        await sendEmbedLog("KICK LOG", `**Player:** ${username}\n**Reason:** ${reason}\n📄Administrator: <@${adminId}>`);
        await interaction.reply(`✅ Kicked ${username}`);
    }

    // ===== BAN =====
    if (commandName === 'ban') {
        await sendCommand('ban', username, reason, days, adminId);
        await sendEmbedLog("BAN LOG", `**Player:** ${username} (${days} day(s))\n**Reason:** ${reason}\n📄Administrator: <@${adminId}>`);
        await interaction.reply(`✅ Banned ${username} for ${days} day(s)`);
    }

    // ===== PERMABAN =====
    if (commandName === 'permaban') {
        await sendCommand('permaban', username, reason, 0, adminId);
        await sendEmbedLog("PERMABAN LOG", `**Player:** ${username}\n**Reason:** ${reason}\n📄Administrator: <@${adminId}>`);
        await interaction.reply(`✅ Permanently banned ${username}`);
    }

    // ===== UNBAN =====
    if (commandName === 'unban') {
        await sendCommand('unban', username, "", 0, adminId);
        await sendEmbedLog("UNBAN LOG", `**Player:** ${username}\n📄Administrator: <@${adminId}>`);
        await interaction.reply(`✅ Unbanned ${username}`);
    }

    // ===== FIND =====
    if (commandName === 'find') {
        const userId = interaction.options.getString('userid');
        await interaction.reply(`https://www.roblox.com/users/${userId}/profile`);
    }

    // ===== BANLIST =====
    if (commandName === 'banlist') {
        const res = await fetch(`${process.env.SERVER_URL}/banlist`);
        const data = await res.json();
        if (data.length === 0) return await interaction.reply("No bans currently.");
        const text = data.map(b => `${b.username} (${b.userId}) — ${b.daysLeft}`).join("\n");
        await interaction.reply("```" + text + "```");
    }
});

client.login(process.env.BOT_TOKEN);
