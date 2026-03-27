// server.js
const express = require('express');
const app = express();
app.use(express.json());

let commands = []; // команды для Roblox
let bans = []; // {username, userId, type, endTime (ms), reason, adminId}

app.post('/command', (req, res) => {
    const { type, username, userId, reason, days, adminId } = req.body;
    const now = Date.now();

    // создаём объект команды для Roblox
    commands.push({ type, username, userId, reason, days, adminId, timestamp: now });

    // если бан, добавляем в бан-лист
    if (type === "ban" || type === "permaban") {
        let endTime = type === "permaban" ? null : now + (days * 24 * 60 * 60 * 1000);
        bans.push({ username, userId, type, reason, adminId, endTime });
    }

    // если unban, удаляем из бан-листа
    if (type === "unban") {
        bans = bans.filter(b => b.username !== username && b.userId !== userId);
    }

    res.json({ status: "ok" });
});

// Roblox забирает команды
app.get('/get-commands', (req, res) => {
    const toSend = [...commands];
    commands = []; // очищаем после выдачи
    res.json(toSend);
});

// Список банов
app.get('/banlist', (req, res) => {
    const now = Date.now();
    const activeBans = bans.map(b => {
        let daysLeft = b.endTime ? Math.ceil((b.endTime - now) / (24*60*60*1000)) : "PERM";
        if (b.endTime && b.endTime < now) return null; // бан истёк
        return {...b, daysLeft};
    }).filter(Boolean);
    res.json(activeBans);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
