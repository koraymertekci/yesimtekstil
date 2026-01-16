const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const router = require("./routers/index");
const errorHandler = require('./middlewares/validations/errorHandler');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from public/dist directory
app.use(express.static(path.join(__dirname, 'public', 'dist'), {
    maxAge: '1d',
    etag: false
}));

app.use("/api", router);

// Fallback for SPA - serve index.html for root and unknown routes (but not for files)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dist', 'index.html'));
});

// Handle SPA routing - but skip static file extensions
app.use((req, res, next) => {
    // Skip if it looks like a file with extension or API route
    if (req.path.includes('.') || req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'public', 'dist', 'index.html'));
});

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Sunucu port ${port} üzerinde çalışıyor...`);
});