const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const { calculateHash } = require('../utils/hashUtils');

const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * POST /api/documents/upload
 * Upload a PDF document
 */
router.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file provided' });
        }

        // Read the uploaded file
        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        const pdfBuffer = fs.readFileSync(filePath);

        // Calculate SHA-256 hash of original document
        const originalHash = calculateHash(pdfBuffer);

        // Extract PDF metadata
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();
        const pages = [];

        for (let i = 0; i < pageCount; i++) {
            const page = pdfDoc.getPage(i);
            const { width, height } = page.getSize();
            pages.push({
                pageNumber: i + 1,
                widthPoints: width,
                heightPoints: height
            });
        }

        // Create document record
        const document = await Document.create({
            originalFileName: req.file.originalname,
            originalFileUrl: `/uploads/${req.file.filename}`,
            originalHash,
            pdfMetadata: { pageCount, pages },
            status: 'draft'
        });

        // Create audit log entry
        await AuditLog.create({
            documentId: document._id,
            action: 'uploaded',
            documentHashAfter: originalHash,
            performedBy: {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date()
            },
            details: {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                pageCount
            }
        });

        res.status(201).json({
            success: true,
            document: {
                id: document._id,
                fileName: document.originalFileName,
                fileUrl: document.originalFileUrl,
                hash: originalHash,
                metadata: document.pdfMetadata,
                status: document.status
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

/**
 * GET /api/documents/:id
 * Get document by ID with its fields
 */
router.get('/:id', async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const Field = require('../models/Field');
        const fields = await Field.find({ documentId: document._id });

        res.json({
            document: {
                id: document._id,
                fileName: document.originalFileName,
                fileUrl: document.originalFileUrl,
                signedFileUrl: document.signedFileUrl,
                hash: document.originalHash,
                signedHash: document.signedHash,
                metadata: document.pdfMetadata,
                status: document.status
            },
            fields
        });

    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({ error: 'Failed to get document' });
    }
});

/**
 * GET /api/documents/:id/audit
 * Get audit trail for a document
 */
router.get('/:id/audit', async (req, res) => {
    try {
        const logs = await AuditLog.find({ documentId: req.params.id })
            .sort({ 'performedBy.timestamp': -1 });

        res.json({ auditTrail: logs });

    } catch (error) {
        console.error('Get audit error:', error);
        res.status(500).json({ error: 'Failed to get audit trail' });
    }
});

module.exports = router;
