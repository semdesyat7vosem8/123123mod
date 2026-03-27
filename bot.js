const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', () => console.log("Bot ready!"));

// ОТПРАВКА
async function sendCommand(type, username, reason, days, adminId) {

    console.log("SEND:", type, username);

    // на сервер
    await fetch(process.env.SERVER_URL + '/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, username, reason, days, adminId })
    });

    // вебхук (ОДИН)
    await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content:
`**${type.toUpperCase()}**
👤 ${username}
📄 ${reason}
📅 ${days || 0} days`
        })
    });
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const roleId = '1432275054149894227';

    if (!interaction.member.roles.cache.has(roleId)) {
        return interaction.reply({ content: "No permission", ephemeral: true });
    }

    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason') || "No reason";
    const days = interaction.options.getInteger('days') || 0;

    if (interaction.commandName === 'kick') {
        await sendCommand('kick', username, reason, 0, interaction.user.id);
        await interaction.reply(`✅ Kick ${username}`);
    }

    if (interaction.commandName === 'ban') {
        await sendCommand('ban', username, reason, days, interaction.user.id);
        await interaction.reply(`✅ Ban ${username}`);
    }

    if (interaction.commandName === 'permaban') {
        await sendCommand('permaban', username, reason, 0, interaction.user.id);
        await interaction.reply(`✅ Permaban ${username}`);
    }

    if (interaction.commandName === 'unban') {
        await sendCommand('unban', username, reason, 0, interaction.user.id);
        await interaction.reply(`✅ Unban ${username}`);
    }
});

client.login(process.env.BOT_TOKEN);
