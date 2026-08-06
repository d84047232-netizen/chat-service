const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = "s3cr3t_k3y_13375167"; 
const MAX_MESSAGE_LENGTH = 200;
const MAX_QUEUE_SIZE = 200;         
const queues = {}; 

app.use(express.json({ limit: '10kb' }));

app.post('/send', (req, res) => {
    const signature = req.headers['x-signature'];
    if (signature !== SECRET_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { jobId, userId, playerName, message } = req.body;
    if (!jobId || !userId || !playerName || !message) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({ error: 'Message too long' });
    }

    if (!queues[jobId]) queues[jobId] = [];
    queues[jobId].push({ userId, playerName, message });
    if (queues[jobId].length > MAX_QUEUE_SIZE) queues[jobId].shift();

    console.log(`[${jobId}] ${playerName}: ${message}`);
    res.json({ status: 'ok' });
});

app.get('/poll', (req, res) => {
    const jobId = req.query.jobId;
    if (!jobId) return res.status(400).json({ error: 'Missing jobId' });

    const messages = queues[jobId] || [];
    queues[jobId] = [];

    const signedMessages = messages.map(msg => ({
        ...msg,
        _signature: SECRET_KEY,
        jobId: jobId
    }));

    if (signedMessages.length > 0) {
        console.log(`[poll] ${signedMessages.length} сообщений для ${jobId}`);
    }
    res.json({ messages: signedMessages });
});

app.listen(port, () => {
    console.log(`🚀 Relay server running on port ${port}`);
});
