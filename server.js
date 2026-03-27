const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let commandQueue = [];
let bans = [];

// ===== команда от Discord =====
app.post('/command', (req, res) => {
    const { type, username, reason, days, adminId } = req.body;

    if (!type || !username) {
        return res.status(400).json({ error: "Missing data" });
    }

    commandQueue.push({
        type,
        username,
        reason,
        days,
        adminId,
        sent: false
    });

    if (type === 'ban') {
        bans.push({
            username,
            unbanDate: Date.now() + days * 86400000,
            reason
        });
    }

    if (type === 'permaban') {
        bans.push({
            username,
            unbanDate: null,
            reason
        });
    }

    res.json({ ok: true });
});

// ===== Roblox забирает команды =====
app.get('/get-commands', (req, res) => {
    const cmds = commandQueue.filter(c => !c.sent);
    cmds.forEach(c => c.sent = true);
    res.json(cmds);
});

// ===== список банов =====
app.get('/banlist', (req, res) => {
    const now = Date.now();

    const list = bans.map(b => {
        let daysLeft = b.unbanDate
            ? Math.ceil((b.unbanDate - now) / 86400000)
            : "PERMA";

        return {
            username: b.username,
            daysLeft,
            reason: b.reason
        };
    });

    res.json(list);
});

// ===== тест =====
app.get('/', (req, res) => {
    res.send('Server is running ✅');
});

app.listen(PORT, () => {
    console.log("Server started on port " + PORT);
});
