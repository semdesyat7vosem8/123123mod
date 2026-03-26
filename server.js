const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

app.use(express.json());

let bans = {};

// Загружаем баны из файла, если есть
if(fs.existsSync('bans.json')) {
    bans = JSON.parse(fs.readFileSync('bans.json'));
}

// Сохраняем баны
function saveBans() {
    fs.writeFileSync('bans.json', JSON.stringify(bans, null, 2));
}

// Лог в Discord
async function sendLog(action, playerName, userId, adminName, reason, days = null) {
    const embed = {
        title: `${action.toUpperCase()} LOG`,
        color: 0xFFC0CB,
        fields: [
            { name: "Player", value: `${playerName} (${userId})`, inline: true },
            { name: "Reason", value: reason, inline: true },
            { name: "📄Administrator", value: adminName, inline: false }
        ],
        timestamp: new Date()
    };

    if(days !== null) embed.fields.push({ name: "Days", value: `${days}`, inline: true });

    await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] })
    });
}

// Получение команд от Roblox
app.post('/command', async (req, res) => {
    const { type, username, userId, reason, days, adminName } = req.body;

    if(type === 'kick') {
        await sendLog('kick', username, userId, adminName, reason);
    } else if(type === 'ban') {
        const expire = days ? Date.now() + days * 24*60*60*1000 : null;
        bans[userId] = { username, reason, adminName, expire };
        saveBans();
        await sendLog('ban', username, userId, adminName, reason, days);
    } else if(type === 'permaban') {
        bans[userId] = { username, reason, adminName, expire: null };
        saveBans();
        await sendLog('permaban', username, userId, adminName, reason);
    } else if(type === 'unban') {
        delete bans[userId];
        saveBans();
        await sendLog('unban', username, userId, adminName, reason);
    }

    res.json({ status: 'ok' });
});

// Команда для Roblox получить текущие баны
app.get('/get-bans', (req, res) => {
    res.json(bans);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
