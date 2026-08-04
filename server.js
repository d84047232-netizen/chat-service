const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const queues = {};

app.post('/send', (req, res) => {
    const { jobId, userId, playerName, message } = req.body;
    if (!jobId || !userId || !playerName || !message) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    if (!queues[jobId]) queues[jobId] = [];
    queues[jobId].push({ userId, playerName, message });
    if (queues[jobId].length > 100) queues[jobId].shift();
    console.log(`[${jobId}] ${playerName}: ${message}`);
    res.json({ status: 'ok' });
});

app.get('/poll', (req, res) => {
    const jobId = req.query.jobId;
    if (!jobId) return res.status(400).json({ error: 'Missing jobId' });
    const messages = queues[jobId] || [];
    queues[jobId] = [];
    res.json({ messages });
});

app.listen(port, () => console.log(`Relay running on port ${port}`));
