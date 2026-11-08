const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
app.use(express.json());

// Izinkan akses CORS agar bisa dipanggil dari pages.dev
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

let qrCodeData = '';
let isReady = false;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        qrCodeData = url;
    });
});

client.on('ready', () => {
    isReady = true;
    qrCodeData = '';
    console.log('WhatsApp Web Siap!');
});

client.initialize();

// Endpoint untuk mendapatkan QR Code
app.get('/qr', (req, res) => {
    if (isReady) return res.json({ status: 'connected', message: 'WhatsApp Sudah Terhubung!' });
    if (qrCodeData) return res.json({ status: 'qr', qr: qrCodeData });
    res.json({ status: 'loading', message: 'Sedang memuat QR Code...' });
});

// Endpoint untuk mengirim pesan
app.post('/send', async (req, res) => {
    const { nomor, pesan } = req.body;
    if (!isReady) return res.status(400).json({ error: 'WhatsApp belum terhubung!' });
    
    try {
        const chatId = nomor.replace('+', '').replace(' ', '') + '@c.us';
        await client.sendMessage(chatId, pesan);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
