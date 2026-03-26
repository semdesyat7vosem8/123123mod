const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const PORT = 3000;
const WEBHOOK_URL = "https://discord.com/api/webhooks/1484944724564512981/bRioZ0eXrHwwHFxrKOYFOsA9RsV6BGS0nzAnGxy3fvQ49gyHjdCP8USSkngINRgwBw3Q"; // вставь свой Discord Webhook URL

let commandsQueue = [];
let bansCache = {};

console.log("SERVER STARTED");

// ===== Получить UserId по username =====
async function getUserId(username) {
    try {
        const res = await fetch(`https://users.roblox.com/v1/usernames/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
        });
        const data = await res.json();
        return data.data[0]?.id || null;
    } catch {
        return null;
    }
}

// ===== Получить username по UserId =====
async function getUsername(userId) {
    try {
        const res = await fetch(`https://users.roblox.com/v1/users/${userId}`);
        const data = await res.json();
        return data.name || "Unknown";
    } catch {
        return "Unknown";
    }
}

// ===== Логи Discord через Webhook =====
async function sendLog(command) {
    let title = "";
    let color = 16761035; // нежно-розовый по умолчанию
    let durationText = "";

    switch (command.type) {
        case "kick":
            title = "KICK LOG";
            color = 16753920; // оранжевый
            break;
        case "ban":
            title = "BAN LOG";
            color = 16711680; // красный
            durationText = `Duration: ${command.days || 1} day(s)`;
            break;
        case "permaban":
            title = "PERMABAN LOG";
            color = 8388736; // тёмно-красный
            durationText = "Duration: Permanent";
            break;
        case "unban":
            title = "UNBAN LOG";
            color = 5763719; // зелёный
            break;
        default:
            title = "ACTION LOG";
    }

    const fields = [
        {
            name: "Player",
            value: `${command.username || "Unknown"} (${command.userId || "N/A"})`,
            inline: false
        },
        {
            name: "Reason",
            value: command.reason || "No reason",
            inline: false
        },
        {
            name: "📄Administrator",
            value: `<@${command.adminId}>`,
            inline: false
        }
    ];

    if (durationText) {
        fields.splice(1, 0, { name: "Duration", value: durationText, inline: false });
    }

    const embed = {
        embeds: [
            {
                title: `**${title}**`,
                color: color,
                fields: fields,
                timestamp: new Date().toISOString()
            }
        ]
    };

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(embed)
        });
        console.log("✅ Log sent:", title);
    } catch (err) {
        console.error("❌ Webhook error:", err);
    }
}

// ===== Получение команд от бота =====
app.post('/command', async (req, res) => {
    const command = req.body;

    if (!command.userId && command.username) {
        command.userId = await getUserId(command.username);
    }

    commandsQueue.push(command);

    // Обновляем кеш банов
    if (command.type === "ban") {
        bansCache[command.userId] = {
            reason: command.reason,
            unbanTime: Date.now() + (command.days * 86400000),
            permanent: false
        };
    }
    if (command.type === "permaban") {
        bansCache[command.userId] = {
            reason: command.reason,
            permanent: true
        };
    }
    if (command.type === "unban") {
        delete bansCache[command.userId];
    }

    await sendLog(command);

    res.json({ success: true });
});

// ===== Roblox получает команды =====
app.get('/get-commands', (req, res) => {
    res.json(commandsQueue);
    commandsQueue = [];
});

// ===== Banlist =====
app.get('/banlist', async (req, res) => {
    let result = [];

    for (const userId in bansCache) {
        const ban = bansCache[userId];
        const username = await getUsername(userId);

        let daysLeft = "Permanent";
        if (!ban.permanent && ban.unbanTime) {
            const diff = ban.unbanTime - Date.now();
            daysLeft = Math.ceil(diff / 86400000) + " day(s)";
        }

        result.push({ username, userId, daysLeft });
    }

    res.json(result);
});

app.get('/', (req, res) => res.send("Server is working!"));

app.listen(PORT, () => console.log("Server running on port", PORT));