import http from 'http';
import { sponsorTransaction, executeSponsoredTransaction } from './enokiService';

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
    // CORS Headers for frontend access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Health check
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // Sponsor Transaction Endpoint
    if (req.url === '/api/sponsor' && req.method === 'POST') {
        const buffers = [];
        for await (const chunk of req) {
            buffers.push(chunk);
        }

        try {
            const data = JSON.parse(Buffer.concat(buffers).toString());
            const result = await sponsorTransaction(
                data.network,
                data.txBytes,
                data.sender
            );
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (e: any) {
            console.error(e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // Execute Transaction Endpoint
    if (req.url === '/api/execute' && req.method === 'POST') {
        const buffers = [];
        for await (const chunk of req) {
            buffers.push(chunk);
        }

        try {
            const data = JSON.parse(Buffer.concat(buffers).toString());
            const result = await executeSponsoredTransaction(
                data.digest,
                data.signature
            );
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (e: any) {
            console.error(e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
