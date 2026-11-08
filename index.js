const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3000;

let qrCodeData = '';
let isReady = false;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        qrCodeData = url;
    });
});

client.on('ready', () => {
    isReady = true;
    qrCodeData = '';
    console.log('WhatsApp Client Ready!');
});

client.on('authenticated', () => {
    console.log('Authenticated successfully');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

app.get('/status', (req, res) => {
    res.json({ ready: isReady, qr: qrCodeData });
});

app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;
    if (!isReady) {
        return res.status(400).json({ status: 'error', message: 'WhatsApp belum tersambung (scan QR dulu)' });
    }
    try {
        const formattedNumber = number.replace(/[^0-9]/g, '') + '@c.us';
        await client.sendMessage(formattedNumber, message);
        res.json({ status: 'success', message: 'Pesan berhasil dikirim!' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.toString() });
    }
});

app.get('/', (req, res) => {
    res.send('Backend WhatsApp Blast Aktif!');
});

client.initialize();

app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
});
