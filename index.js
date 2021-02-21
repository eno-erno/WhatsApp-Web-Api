const { Client } = require('whatsapp-web.js');
const express = require('express');
const socketio = require('socket.io');
const qrcode = require('qrcode');
const http = require("http")
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SESSION_FILE_PATH = './whatsapp-session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });

// Api 
app.get('/', (req, res) => {
    return res.status(200).json({
        status : true,
        message : 'Hello whatsapp web'
    })
})

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, {small : true});
});

// auth
client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg=session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.initialize();

app.post('/send-message', (req, res) => {
    const {number , message} = req.body;

    client.sendMessage(`${number}@c.us`, message).then(response => {
        return res.status(200).json({
            status : true,
            response: response
        })
    }).catch(err => {
        return res.status(500).json({
            status: false,
            response : err
        })
    })
})

app.listen(PORT, () => {
    console.log(`Running in port ${PORT}`);
})