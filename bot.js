const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');
const config = require('./config.json');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', () => console.log("Bot is ready!"));

// Функция отправки логов на вебхуки
async function sendLog(type, description) {
    let webhook;

    if (type === "kick") webhook = process.env.WEBHOOK_KICK;
    if (type === "ban") webhook = process.env.WEBHOOK_BAN;
    if (type === "permaban") webhook = process.env.WEBHOOK_PERMABAN;
    if (type === "unban") webhook = process.env.WEBHOOK_UNBAN;

    if (!webhook) return console.error("No webhook for type:", type);

    const embed = {
        title: type.toUpperCase(),
        description,
        color: getColorForType(type),
        timestamp: new Date()
    };

    try {
        await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (err) {
        console.error("Webhook error:", err);
    }
}

// Функция для получения цвета для типа действия
function getColorForType(type) {
    if (type === "kick") return 0xFFFF00;   // Yellow
    if (type === "ban") return 0xFFA500;    // Orange
    if (type === "permaban") return 0xFF0000; // Red
    if (type === "unban") return 0x00FF00;  // Green
    return 0xFFFFFF; // Default
}

// Команды
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
        await sendLog("kick", `**Player:** ${username}\n**Reason:** ${reason}\n📄Admin: <@${interaction.user.id}>`);
        await interaction.reply(`✅ Kicked ${username}`);
    }

    // === BAN ===
    if (commandName === 'ban') {
        const username = interaction.options.getString('username');
        const days = interaction.options.getInteger('days');
        const reason = interaction.options.getString('reason') || "No reason set";
        await sendLog("ban", `**Player:** ${username}\n**Days:** ${days}\n**Reason:** ${reason}\n📄Admin: <@${interaction.user.id}>`);
        await interaction.reply(`✅ Banned ${username} for ${days} day(s)`);
    }

    // === PERMABAN ===
    if (commandName === 'permaban') {
        const username = interaction.options.getString('username');
        const reason = interaction.options.getString('reason') || "No reason set";
        await sendLog("permaban", `**Player:** ${username}\n**Reason:** ${reason}\n📄Admin: <@${interaction.user.id}>`);
        await interaction.reply(`✅ Permanently banned ${username}`);
    }

    // === UNBAN ===
    if (commandName === 'unban') {
        const username = interaction.options.getString('username');
        await sendLog("unban", `**Player:** ${username}\n📄Admin: <@${interaction.user.id}>`);
        await interaction.reply(`✅ Unbanned ${username}`);
    }
});

client.login(config.BOT_TOKEN);
