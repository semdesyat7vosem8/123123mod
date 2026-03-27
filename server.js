const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

let commands = [];
let banData = {};

// ===== ПРИЁМ КОМАНД ОТ БОТА =====
app.post('/command', (req, res) => {
    const cmd = req.body;

    if (!cmd.type || !cmd.username) {
        return res.status(400).json({ error: "Invalid data" });
    }

    if (cmd.type === 'ban') {
        banData[cmd.username] = {
            username: cmd.username,
            daysLeft: cmd.days
        };
    }

    if (cmd.type === 'permaban') {
        banData[cmd.username] = {
            username: cmd.username,
            daysLeft: "PERM"
        };
    }

    if (cmd.type === 'unban') {
        delete banData[cmd.username];
    }

    commands.push(cmd);

    console.log("NEW COMMAND:", cmd);

    res.json({ status: 'ok' });
});

// ===== ROBLOX ЗАБИРАЕТ =====
app.get('/get-commands', (req, res) => {
    res.json(commands);
    commands = [];
});

// ===== СПИСОК БАНОВ =====
app.get('/banlist', (req, res) => {
    res.json(Object.values(banData));
});

// ===== ПРОВЕРКА =====
app.get('/', (req, res) => {
    res.send("Server is running ✅");
});

app.listen(port, '0.0.0.0', () => {
    console.log("Server started on port " + port);
});
