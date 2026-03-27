````js
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] 
});

const SERVER_URL = process.env.SERVER_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// 🔍 Получаем Roblox данные
async function getRobloxUser(username) {
    try {
        const res = await fetch('https://users.roblox.com/v1/usernames/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usernames: [username],
                excludeBannedUsers: false
            })
        });

        const data = await res.json();
        if (!data.data || data.data.length === 0) return null;

        return data.data[0]; // { id, name }
    } catch (err) {
        console.error("Roblox API error:", err);
        return null;
    }
}

// 🖼️ Аватар
async function getAvatar(userId) {
    try {
        const res = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png`);
        const data = await res.json();
        return data.data[0].imageUrl;
    } catch {
        return null;
    }
}

// 📡 СТАРЫЙ формат (ВАЖНО)
async function sendCommand(type, username, reason, days, adminId) {
    try {
        const res = await fetch(`${SERVER_URL}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, username, reason, days, adminId })
        });

        const text = await res.text();
        console.log(`[SERVER]`, res.status, text);
    } catch (err) {
        console.error("Command error:", err);
    }
}

// 📜 ЛОГ
async function sendLog(title, username, userId, description, avatar) {
    const embed = {
        title,
        description,
        thumbnail: avatar ? { url: avatar } : undefined,
        color: 0xFFC0CB,
        timestamp: new Date()
    };

    // 👇 ВАЖНО: обычный текст (для поиска)
    const content = `🔎 ${username} (${userId})`;

    await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: content,
            embeds: [embed]
        })
    });
}

    await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
    });
}

// 🔗 профиль
function profile(id) {
    return `https://www.roblox.com/users/${id}/profile`;
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction.replied || interaction.deferred) return;

    if (!interaction.member.roles.cache.has('1432275054149894227')) {
        return interaction.reply({ content: "No permission", ephemeral: true });
    }

    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason') || "No reason set";
    const days = interaction.options.getInteger('days') || 0;
    const adminId = interaction.user.id;

    await interaction.reply("⏳ Processing...");

    // 🔍 получаем данные Roblox (ТОЛЬКО ДЛЯ ЛОГОВ)
    const user = await getRobloxUser(username);

    let userId = "Unknown";
    let avatar = null;
    let displayName = username;

    if (user) {
        userId = user.id;
        displayName = user.name;
        avatar = await getAvatar(userId);
    }

    const base = `**Player:** ${displayName} (${userId})
🔗 ${userId !== "Unknown" ? profile(userId) : "Not found"}

📄 **Administrator:** <@${adminId}>`;

    // 🚪 KICK
    if (interaction.commandName === 'kick') {
        await sendCommand('kick', username, reason, 0, adminId);

       await sendLog("KICK LOG", displayName, userId, `${base}`, avatar);

**Reason:** ${reason}`, avatar);

        return interaction.editReply(`✅ Successfully Kicked ${displayName}.`);
    }

    // 🔨 BAN
    if (interaction.commandName === 'ban') {
        await sendCommand('ban', username, reason, days, adminId);

        await sendLog("BAN LOG", displayName, userId,
`${base}

**Duration:** ${days} day(s)
**Reason:** ${reason}`, avatar);

        return interaction.editReply(`✅ Successfully Banned ${displayName}.`);
    }

    // ☠️ PERMABAN
    if (interaction.commandName === 'permaban') {
        await sendCommand('permaban', username, reason, 0, adminId);

        await sendLog("PERMABAN LOG", displayName, userId,
`${base}

**Reason:** ${reason}`, avatar);

        return interaction.editReply(`✅ Successfully Perma-banned ${displayName}.`);
    }

    // 🔓 UNBAN
    if (interaction.commandName === 'unban') {
        await sendCommand('unban', username, "", 0, adminId);

        await sendLog("UNBAN LOG", displayName, userId,
`${base}`, avatar);

        return interaction.editReply(`✅ Successfully Unbanned ${displayName}.`);
    }

    // 📋 BANLIST
    if (interaction.commandName === 'banlist') {
        const res = await fetch(`${SERVER_URL}/banlist`);
        const data = await res.json();

        if (!data.length) {
            return interaction.editReply("No bans.");
        }

        const text = data.map(b => 
            `${b.username} (${b.userId}) — ${b.daysLeft} day(s)`
        ).join("\n");

        return interaction.editReply("```" + text + "```");
    }
});

client.login(process.env.BOT_TOKEN);
````
