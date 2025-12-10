const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (uploaded and signed PDFs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/signed', express.static(path.join(__dirname, 'signed')));

// Routes
const documentsRouter = require('./routes/documents');
const fieldsRouter = require('./routes/fields');
const signPdfRouter = require('./routes/signPdf');

app.use('/api/documents', documentsRouter);
app.use('/api/fields', fieldsRouter);
app.use('/api/sign-pdf', signPdfRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/signature-engine';

// Start server first, then try MongoDB
const startServer = () => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        startServer();
    })
    .catch((err) => {
        console.error('⚠️  MongoDB connection failed:', err.message);
        console.log('📌 Starting server anyway for demo purposes...');
        console.log('📌 Note: Database features will not work. Set MONGODB_URI in .env for full functionality.');
        startServer();
    });

module.exports = app;

