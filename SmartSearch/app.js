const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { performance } = require('perf_hooks');
const esClient = require('./config/elasticsearch');
const redisClient = require('./config/redis');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/info', (req, res) => {
    res.json({
        message: 'Simple Speech Recognition API',
        note: 'This app uses browser-based Web Speech API for speech recognition',
        features: [
            'Real-time speech recognition',
            'No external API keys needed',
            'Works directly in modern browsers (Chrome, Edge, Safari)',
            'Multiple language support'
        ],
        endpoints: {
            'GET /': 'Web interface for speech recognition',
            'GET /api/info': 'API information'
        }
    });
});

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    const lowerQuery = query.toLowerCase().trim();
    const startTime = performance.now(); // Start performance timer
    
    try {
        // 1. Check Redis Cache
        const cachedResult = await redisClient.get(`search:${lowerQuery}`);
        if (cachedResult) {
            const timeMs = (performance.now() - startTime).toFixed(2);
            console.log(`[Cache Hit] Redis returned result for: ${query} in ${timeMs}ms`);
            return res.json({ source: 'redis(cache)', timeMs: timeMs, data: JSON.parse(cachedResult) });
        }

        console.log(`[Cache Miss] Querying Elasticsearch for: ${query}`);

        // 2. Search Elasticsearch
        const esRes = await esClient.search({
            index: 'speech_data',
            body: {
                query: {
                    bool: {
                        should: [
                            { match: { title: lowerQuery } },
                            { match: { keywordId: lowerQuery } },
                            { match: { property_id: lowerQuery } },
                            { wildcard: { keywordId: `*${lowerQuery}*` } }
                        ]
                    }
                }
            }
        });

        const hits = esRes.hits.hits;
        if (hits.length > 0) {
            const resultData = hits.slice(0, 20).map(hit => hit._source);
            
            // 3. Store in Redis for future queries (expire in 1 hour)
            await redisClient.setEx(`search:${lowerQuery}`, 3600, JSON.stringify(resultData));
            const timeMs = (performance.now() - startTime).toFixed(2);
            console.log(`[Database Hit] Elasticsearch found ${resultData.length} results and saved to Cache: ${query} in ${timeMs}ms`);
            
            return res.json({ source: 'elasticsearch(database)', timeMs: timeMs, data: resultData });
        }

        const timeMs = (performance.now() - startTime).toFixed(2);
        console.log(`[Not Found] No results for: ${query} in ${timeMs}ms`);
        return res.status(404).json({ error: 'No information found', timeMs: timeMs, query });


    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error during search' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
    console.log('\nNote: This app uses browser-based Web Speech API.');
    console.log('For best results, use Chrome or Edge browsers.');
});

module.exports = app;
