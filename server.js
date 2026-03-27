const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let commandQueue = [];
let bans = [];

app.post('/command', (req, res) => {
    const { type, username, reason, days, adminId } = req.body;
    if (!type || !username) return res.status(400).send({ error: "Missing type or username" });

    commandQueue.push({ type, username, reason, days, adminId, sent: false });

    if (type === 'ban') {
        bans.push({ username, userId: username, unbanDate: Date.now() + days*24*60*60*1000, reason });
    }
    if (type === 'permaban') {
        bans.push({ username, userId: username, unbanDate: null, reason });
    }

    res.send({ ok: true });
});

app.get('/get-commands', (req, res) => {
    const unsent = commandQueue.filter(c => !c.sent);
    unsent.forEach(c => c.sent = true);
    res.json(unsent);
});

app.get('/banlist', (req, res) => {
    const now = Date.now();
    const list = bans.map(b => {
        let daysLeft = b.unbanDate ? Math.ceil((b.unbanDate - now)/(1000*60*60*24)) : "PERMA";
        return { username: b.username, userId: b.userId, daysLeft, reason: b.reason };
    });
    res.json(list);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
