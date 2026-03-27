const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] 
});

const SERVER_URL = process.env.SERVER_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// 🔍 Получение userId по нику
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

        return data.data[0]; // { id, name, displayName }
    } catch (err) {
        console.error("Roblox API error:", err);
        return null;
    }
}

// 🖼️ Получение аватара
async function getRobloxAvatar(userId) {
    try {
        const res = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
        const data = await res.json();

        return data.data[0].imageUrl;
    } catch (err) {
        console.error("Avatar error:", err);
        return null;
    }
}

// 📡 Отправка команды на сервер
async function sendCommand(type, username, userId, reason, days, adminId) {
    try {
        const res = await fetch(`${SERVER_URL}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, username, userId, reason, days, adminId })
        });

        const text = await res.text();
        console.log(`[${type}] ${username} (${userId}) ->`, res.status, text);
    } catch (err) {
        console.error("Command error:", err);
    }
}

// 📜 Лог с аватаром
async function sendEmbedLog(title, user, userId, avatar, description) {
    const embed = {
        title: title.toUpperCase(),
        description,
        thumbnail: { url: avatar },
        color: 0xFFC0CB,
        timestamp: new Date()
    };

    await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
    });
}

// 🔗 профиль
function profile(userId) {
    return `https://www.roblox.com/users/${userId}/profile`;
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

    const user = await getRobloxUser(username);
    if (!user) {
        return interaction.editReply(`❌ User "${username}" not found`);
    }

    const userId = user.id;
    const avatar = await getRobloxAvatar(userId);

    const descBase = `**Player:** ${user.name} (${userId})
🔗 ${profile(userId)}

📄 Administrator: <@${adminId}>`;

    // 🚪 KICK
    if (interaction.commandName === 'kick') {
        await sendCommand('kick', user.name, userId, reason, 0, adminId);

        await sendEmbedLog("KICK LOG", user.name, userId, avatar,
`${descBase}

**Reason:** ${reason}`);

        return interaction.editReply(`✅ Kicked ${user.name}`);
    }

    // 🔨 BAN
    if (interaction.commandName === 'ban') {
        await sendCommand('ban', user.name, userId, reason, days, adminId);

        await sendEmbedLog("BAN LOG", user.name, userId, avatar,
`${descBase}

**Duration:** ${days} day(s)
**Reason:** ${reason}`);

        return interaction.editReply(`✅ Banned ${user.name}`);
    }

    // ☠️ PERMABAN
    if (interaction.commandName === 'permaban') {
        await sendCommand('permaban', user.name, userId, reason, 0, adminId);

        await sendEmbedLog("PERMABAN LOG", user.name, userId, avatar,
`${descBase}

**Reason:** ${reason}`);

        return interaction.editReply(`✅ Permanently banned ${user.name}`);
    }

    // 🔓 UNBAN
    if (interaction.commandName === 'unban') {
        await sendCommand('unban', user.name, userId, "", 0, adminId);

        await sendEmbedLog("UNBAN LOG", user.name, userId, avatar,
`${descBase}`);

        return interaction.editReply(`✅ Unbanned ${user.name}`);
    }

    // 📋 BANLIST
    if (interaction.commandName === 'banlist') {
        const res = await fetch(`${SERVER_URL}/banlist`);
        const data = await res.json();

        if (data.length === 0) {
            return interaction.editReply("No bans.");
        }

        const text = data.map(b => 
            `${b.username} (${b.userId}) — ${b.daysLeft} day(s)`
        ).join("\n");

        return interaction.editReply("```" + text + "```");
    }
});

client.login(process.env.BOT_TOKEN);
