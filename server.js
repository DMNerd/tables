const express = require('express');
const path = require('path');
const fs = require('fs');
const { minify } = require('terser');

const app = express();

// In-memory cache for minified files
const minifiedCache = new Map();

// Middleware to intercept and minify JavaScript files before serving
app.use(async (req, res, next) => {
    if (req.url.endsWith('.js')) {
        const filePath = path.join(__dirname, 'public', req.url);

        if (fs.existsSync(filePath)) {
            try {
                // Check if the file is already cached
                if (minifiedCache.has(filePath)) {
                    console.log(`Serving cached minified file: ${filePath}`);
                    res.setHeader('Content-Type', 'application/javascript');
                    return res.send(minifiedCache.get(filePath));
                }

                console.log(`Minifying and caching file: ${filePath}`);

                const jsContent = fs.readFileSync(filePath, 'utf8');
                const minifiedContent = await minify(jsContent);

                // Cache the minified content
                minifiedCache.set(filePath, minifiedContent.code);

                res.setHeader('Content-Type', 'application/javascript');
                return res.send(minifiedContent.code);
            } catch (err) {
                console.error('Error during minification:', err);
                return res.status(500).send('Internal Server Error');
            }
        }
    }

    next(); // Continue to next middleware if not a JS file
});

// Serve static files after attempting to minify JavaScript
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
