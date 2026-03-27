const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch'); // node-fetch@2

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] 
});

const SERVER_URL = process.env.SERVER_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// 🔗 Генерация ссылки на Roblox профиль
function createProfileLink(userId) {
    return `https://www.roblox.com/users/${userId}/profile`;
}

// 📡 Отправка команды на сервер
async function sendCommand(type, username, userId, reason, days, adminId) {
    const data = { type, username, userId, reason, days, adminId };

    try {
        const res = await fetch(`${SERVER_URL}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        console.log(`[COMMAND] ${type} -> ${username} (${userId}) | Status: ${res.status}`);
    } catch (err) {
        console.error("ERROR sending command:", err);
    }
}

// 📜 Отправка embed лога
async function sendEmbedLog(title, description) {
    const embed = {
        title: title.toUpperCase(),
        description,
        color: 0xFFC0CB,
        timestamp: new Date()
    };

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (err) {
        console.error("Error sending log:", err);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    // ❗ защита от двойного срабатывания
    if (interaction.replied || interaction.deferred) return;

    // 🔒 проверка роли
    if (!interaction.member.roles.cache.has('1432275054149894227')) {
        return interaction.reply({ 
            content: "You don't have permission", 
            ephemeral: true 
        });
    }

    const username = interaction.options.getString('username');
    const userId = interaction.options.getString('userid') || "Unknown";
    const reason = interaction.options.getString('reason') || "No reason set";
    const days = interaction.options.getInteger('days') || 0;
    const adminId = interaction.user.id;

    const profileLink = createProfileLink(userId);

    // 🚪 KICK
    if (interaction.commandName === 'kick') {
        await sendCommand('kick', username, userId, reason, 0, adminId);

        await sendEmbedLog("KICK LOG",
`**Player:** ${username} (${userId})
🔗 ${profileLink}

**Reason:** ${reason}
📄 Administrator: <@${adminId}>`
        );

        await interaction.reply(`✅ Kicked ${username}`);
    }

    // 🔨 BAN
    if (interaction.commandName === 'ban') {
        await sendCommand('ban', username, userId, reason, days, adminId);

        await sendEmbedLog("BAN LOG",
`**Player:** ${username} (${userId})
🔗 ${profileLink}

**Duration:** ${days} day(s)
**Reason:** ${reason}
📄 Administrator: <@${adminId}>`
        );

        await interaction.reply(`✅ Banned ${username} for ${days} day(s)`);
    }

    // ☠️ PERMABAN
    if (interaction.commandName === 'permaban') {
        await sendCommand('permaban', username, userId, reason, 0, adminId);

        await sendEmbedLog("PERMABAN LOG",
`**Player:** ${username} (${userId})
🔗 ${profileLink}

**Reason:** ${reason}
📄 Administrator: <@${adminId}>`
        );

        await interaction.reply(`✅ Permanently banned ${username}`);
    }

    // 🔓 UNBAN
    if (interaction.commandName === 'unban') {
        await sendCommand('unban', username, userId, "", 0, adminId);

        await sendEmbedLog("UNBAN LOG",
`**Player:** ${username} (${userId})
🔗 ${profileLink}

📄 Administrator: <@${adminId}>`
        );

        await interaction.reply(`✅ Unbanned ${username}`);
    }

    // 🔍 FIND
    if (interaction.commandName === 'find') {
        const userId = interaction.options.getString('userid');
        await interaction.reply(`https://www.roblox.com/users/${userId}/profile`);
    }

    // 📋 BANLIST
    if (interaction.commandName === 'banlist') {
        try {
            const res = await fetch(`${SERVER_URL}/banlist`);
            const data = await res.json();

            if (data.length === 0) {
                return await interaction.reply("No bans currently.");
            }

            const text = data.map(b => 
                `${b.username} (${b.userId}) — ${b.daysLeft} day(s)`
            ).join("\n");

            await interaction.reply("```" + text + "```");
        } catch (err) {
            console.error(err);
            await interaction.reply("Error fetching banlist.");
        }
    }
});

client.login(process.env.BOT_TOKEN);
