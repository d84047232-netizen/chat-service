const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = "s3cr3t_k3y_13375167"; 
const MAX_MESSAGE_LENGTH = 200;
const MAX_QUEUE_SIZE = 100;         
const queues = {}; 

app.use(express.json({ limit: '10kb' })); 
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.post('/send', (req, res) => {
    const signature = req.headers['x-signature'];
    if (signature !== SECRET_KEY) {
        console.warn('[send] Неверная подпись');
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { jobId, userId, playerName, message, timestamp, nonce } = req.body;
    if (!jobId || !userId || !playerName || !message) {
        console.warn('[send] Неполные данные');
        return res.status(400).json({ error: 'Missing fields' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        console.warn('[send] Сообщение слишком длинное:', message.length);
        return res.status(400).json({ error: 'Message too long' });
    }


    if (!queues[jobId]) {
        queues[jobId] = [];
    }
    queues[jobId].push({
        userId,
        playerName,
        message,
        timestamp: timestamp || Date.now(),
        nonce: nonce || Math.random().toString(36).substring(2, 15)
    });

    // 6. Ограничиваем размер очереди
    if (queues[jobId].length > MAX_QUEUE_SIZE) {
        queues[jobId].shift();
    }

    console.log(`[${jobId}] ${playerName}: ${message}`);
    res.json({ status: 'ok' });
});


app.get('/poll', (req, res) => {
    const jobId = req.query.jobId;
    if (!jobId) {
        return res.status(400).json({ error: 'Missing jobId' });
    }

    const messages = queues[jobId] || [];
    queues[jobId] = [];

    const signedMessages = messages.map(msg => ({
        ...msg,
        _signature: SECRET_KEY,       
        jobId: jobId                    
    }));

    console.log(`[poll] Отдано ${signedMessages.length} сообщений для ${jobId}`);
    res.json({ messages: signedMessages });
});

app.listen(port, () => {
    console.log(`🚀 Relay server running on port ${port}`);
    console.log(`🔑 Secret key: ${SECRET_KEY}`);
});
