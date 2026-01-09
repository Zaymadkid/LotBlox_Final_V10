const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let pendingCommand = { command: "NONE" };

// Root Route for Verification
app.get('/', (req, res) => res.send("<h1>🟢 LotBlox Bridge is ONLINE</h1><p>The extension can talk to me now.</p>"));

app.get('/ping', (req, res) => res.send("pong"));

app.get('/get-command', (req, res) => {
    res.json(pendingCommand);
    if (pendingCommand.command !== "NONE") pendingCommand = { command: "NONE" };
});

// LISTEN ON 0.0.0.0 (REQUIRED FOR REPLIT)
app.listen(3000, '0.0.0.0', () => console.log("✅ Server running on 0.0.0.0:3000"));

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'cookie') { 
        pendingCommand = { command: "ADD_ACCOUNT", cookie: args[0] }; 
        message.reply("✅ Cookie Queued"); 
    }
    
    if (command === 'login') { 
        const [u, p] = args[0].split(':'); 
        pendingCommand = { command: "ADD_LOGIN", username: u, password: p }; 
        message.reply("✅ Login Queued"); 
    }
});

client.login(process.env.BOT_TOKEN);
