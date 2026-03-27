const { Client, GatewayIntentBits } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const config = { BOT_TOKEN: process.env.BOT_TOKEN, SERVER_URL: process.env.SERVER_URL };

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

async function sendCommand(type, username, reason, days, adminId) {
    await fetch(`${config.SERVER_URL}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, username, reason, days, adminId })
    });
}

client.once('ready', () => console.log("Bot ready!"));

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) return;
    const roleId = '1432275054149894227';
    if(!interaction.member.roles.cache.has(roleId)) {
        await interaction.reply({ content: "No permission", ephemeral: true });
        return;
    }

    const cmd = interaction.commandName;
    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason') || 'No reason';
    const days = interaction.options.getInteger('days') || 0;

    if(cmd === 'kick' || cmd === 'ban' || cmd === 'permaban' || cmd === 'unban') {
        await sendCommand(cmd, username, reason, days, interaction.user.id);
        await interaction.reply(`✅ ${cmd} executed for ${username}`);
    }

    if(cmd === 'banlist') {
        const res = await fetch(`${config.SERVER_URL}/banlist`);
        const list = await res.json();
        let text = list.map(b => `${b.username} — ${b.daysLeft} day(s)`).join("\n");
        await interaction.reply("```" + text + "```");
    }

    if(cmd === 'find') {
        const userId = interaction.options.getString('userid');
        await interaction.reply(`https://www.roblox.com/users/${userId}/profile`);
    }
});

client.login(config.BOT_TOKEN);
