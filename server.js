// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let commands = []; // сюда приходят команды с Discord
let banData = {};  // userId: { username, daysLeft, permaban }

app.post('/command', (req, res) => {
    const cmd = req.body;

    if(cmd.type === 'ban') {
        banData[cmd.username] = { username: cmd.username, daysLeft: cmd.days, permaban: false };
    }
    if(cmd.type === 'permaban') {
        banData[cmd.username] = { username: cmd.username, daysLeft: 0, permaban: true };
    }
    if(cmd.type === 'unban') {
        banData[cmd.username] = nil;
    }

    commands.push(cmd);
    res.json({ status: 'ok' });
});

app.get('/get-commands', (req, res) => {
    res.json(commands);
    commands = []; // очищаем после того как Roblox их забрал
});

app.get('/banlist', (req,res) => {
    const list = [];
    for(let user in banData){
        let data = banData[user];
        list.push({ username: data.username, daysLeft: data.daysLeft || 0 });
    }
    res.json(list);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
