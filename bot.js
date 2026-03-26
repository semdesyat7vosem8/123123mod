const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');

// Берём всё из Environment Variables Render
const BOT_TOKEN = process.env.BOT_TOKEN;
const SERVER_URL = process.env.SERVER_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Создаем клиента
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// Лог готовности бота
client.once('clientReady', () => console.log("Bot is ready!"));

// Общая функция отправки команды на сервер Roblox
async function sendCommand(type, username, reason, days, adminId) {
    const data = { type, username, reason, days, adminId, userId: null };
    try {
        await fetch(`${SERVER_URL}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (err) {
        console.error("Error sending command to server:", err);
    }
}

// Функция отправки логов в Discord через Webhook
async function sendLog(action, username, userId, adminId, reason, days = null) {
    const embed = {
        title: `${action.toUpperCase()} LOG`,
        color: 0xFFC0CB,
        fields: [
            { name: "Player", value: `${username} (${userId || "unknown"})`, inline: true },
            { name: "Reason", value: reason || "No reason set", inline: true },
            { name: "📄Administrator", value: `<@${adminId}>`, inline: false }
        ],
        timestamp: new Date()
    };
    if (days !== null) embed.fields.push({ name: "Days", value: `${days}`, inline: true });

    try {
        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (err) {
        console.error("Error sending log to Discord:", err);
    }
}

// ===== Обработка команд Discord =====
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    // Проверка роли
    if (!interaction.member.roles.cache.has('1432275054149894227')) {
        await interaction.reply({ content: "You don't have permission", ephemeral: true });
        return;
    }

    const adminId = interaction.user.id;

    // === KICK ===
    if (commandName === 'kick') {
        const username = interaction.options.getString('username');
        const reason = interaction.options.getString('reason') || "No reason set";
        await sendCommand('kick', username, reason, 0, adminId);
        await sendLog('kick', username, null, adminId, reason);
        await interaction.reply(`✅ Kicked ${username}`);
    }

    // === BAN ===
    if (commandName === 'ban') {
        const username = interaction.options.getString('username');
        const days = interaction.options.getInteger('days');
        const reason = interaction.options.getString('reason') || "No reason set";
        await sendCommand('ban', username, reason, days, adminId);
        await sendLog('ban', username, null, adminId, reason, days);
        await interaction.reply(`✅ Banned ${username} for ${days} day(s)`);
    }

    // === PERMABAN ===
    if (commandName === 'permaban') {
        const username = interaction.options.getString('username');
        const reason = interaction.options.getString('reason') || "No reason set";
        await sendCommand('permaban', username, reason, 0, adminId);
        await sendLog('permaban', username, null, adminId, reason);
        await interaction.reply(`✅ Permanently banned ${username}`);
    }

    // === UNBAN ===
    if (commandName === 'unban') {
        const username = interaction.options.getString('username');
        await sendCommand('unban', username, "", 0, adminId);
        await sendLog('unban', username, null, adminId, "No reason set");
        await interaction.reply(`✅ Unbanned ${username}`);
    }

    // === BANLIST ===
    if (commandName === 'banlist') {
        try {
            const res = await fetch(`${SERVER_URL}/banlist`);
            const data = await res.json();
            if (data.length === 0) return await interaction.reply("No bans currently.");
            const text = data.map(b => `${b.username} (${b.userId}) — ${b.daysLeft}`).join("\n");
            await interaction.reply("```" + text + "```");
        } catch (err) {
            console.error("Error fetching banlist:", err);
            await interaction.reply("❌ Error fetching banlist");
        }
    }

    // === FIND ===
    if (commandName === 'find') {
        const userId = interaction.options.getString('userid');
        await interaction.reply(`https://www.roblox.com/users/${userId}/profile`);
    }
});

client.login(BOT_TOKEN);
