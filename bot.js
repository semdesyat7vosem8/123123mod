const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', () => console.log("Bot is ready!"));

// Функция отправки логов
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

function getColorForType(type) {
    if (type === "kick") return 0xFFC0CB; // розовый
    if (type === "ban") return 0xFFA500;
    if (type === "permaban") return 0xFF0000;
    if (type === "unban") return 0x00FF00;
    return 0xFFFFFF;
}

// команды (kick, ban, permaban, unban)
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    // Проверка роли
    if (!interaction.member.roles.cache.has('1432275054149894227')) {
        await interaction.reply({ content: "You don't have permission", ephemeral: true });
        return;
    }

    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason') || "No reason set";
    const days = interaction.options.getInteger('days');

    if (commandName === 'kick') {
        await sendLog("kick", `**Player:** ${username}\n**Reason:** ${reason}\n📄Admin: <@${interaction.user.id}>`);
        await interaction.reply(`✅ Kicked ${username}`);
    }

    if (commandName === 'ban') {
        await sendLog("ban", `**Player:** ${username}\n**Days:** ${days}\n**Reason:** ${reason}\n📄Admin: <@${interaction.user.id}>`);
        await interaction.reply(`✅ Banned ${username} for ${days} day(s)`);
    }

    if (commandName === 'permaban') {
        await sendLog("permaban", `**Player:** ${username}\n**Reason:** ${reason}\n📄Admin: <@${interaction.user.id}>`);
        await interaction.reply(`✅ Permanently banned ${username}`);
    }

    if (commandName === 'unban') {
        await sendLog("unban", `**Player:** ${username}\n📄Admin: <@${interaction.user.id}>`);
        await interaction.reply(`✅ Unbanned ${username}`);
    }
});

// **Используем токен из переменной окружения**
client.login(process.env.BOT_TOKEN);
