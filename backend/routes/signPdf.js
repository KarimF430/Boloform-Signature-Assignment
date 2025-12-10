const express = require('express');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document');
const Field = require('../models/Field');
const AuditLog = require('../models/AuditLog');
const { calculateHash } = require('../utils/hashUtils');
const { transformToPdfCoordinates, containImageInBox } = require('../utils/pdfUtils');

const router = express.Router();

/**
 * POST /api/sign-pdf
 * The main signature injection endpoint
 * 
 * This is THE KEY ENDPOINT that:
 * 1. Loads the original PDF
 * 2. Transforms normalized coordinates to PDF points
 * 3. Embeds signatures/content with aspect ratio preservation
 * 4. Creates hash-based audit trail
 * 
 * Body: {
 *   documentId: string
 * }
 * 
 * All field values should already be set via /api/fields/:id/value
 */
router.post('/', async (req, res) => {
    try {
        const { documentId } = req.body;

        // 1. Fetch document
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // 2. Fetch all fields with values
        const fields = await Field.find({ documentId, value: { $exists: true, $ne: null } });
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No signed fields found' });
        }

        // 3. Load the PDF
        const pdfPath = path.join(__dirname, '..', document.originalFileUrl);
        const pdfBuffer = fs.readFileSync(pdfPath);

        // 4. Calculate hash BEFORE modification
        const hashBefore = calculateHash(pdfBuffer);

        // 5. Load PDF for modification
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        // 6. Process each field
        for (const field of fields) {
            const page = pdfDoc.getPage(field.position.pageNumber - 1);
            const { width: pdfWidth, height: pdfHeight } = page.getSize();

            // THE KEY TRANSFORMATION: Convert normalized coords to PDF points
            const pdfCoords = transformToPdfCoordinates(field.position, pdfWidth, pdfHeight);

            switch (field.fieldType) {
                case 'signature':
                case 'image':
                    await embedImage(pdfDoc, page, field.value, pdfCoords);
                    break;

                case 'text':
                    embedText(page, field.value, pdfCoords, pdfDoc);
                    break;

                case 'date':
                    const dateStr = new Date(field.value).toLocaleDateString();
                    embedText(page, dateStr, pdfCoords, pdfDoc);
                    break;

                case 'checkbox':
                    if (field.value) {
                        embedCheckmark(page, pdfCoords);
                    }
                    break;

                case 'radio':
                    if (field.value) {
                        embedRadioFill(page, pdfCoords);
                    }
                    break;
            }
        }

        // 7. Save the signed PDF
        const signedPdfBytes = await pdfDoc.save();
        const signedBuffer = Buffer.from(signedPdfBytes);

        // 8. Calculate hash AFTER modification
        const hashAfter = calculateHash(signedBuffer);

        // 9. Write signed PDF to disk
        const signedFileName = `signed-${uuidv4()}.pdf`;
        const signedPath = path.join(__dirname, '../signed', signedFileName);
        fs.writeFileSync(signedPath, signedBuffer);

        // 10. Update document record
        document.signedFileUrl = `/signed/${signedFileName}`;
        document.signedHash = hashAfter;
        document.status = 'signed';
        document.updatedAt = new Date();
        await document.save();

        // 11. Create audit log with hash chain
        await AuditLog.create({
            documentId,
            action: 'signed',
            documentHashBefore: hashBefore,
            documentHashAfter: hashAfter,
            performedBy: {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date()
            },
            details: {
                fieldsProcessed: fields.length,
                fieldTypes: fields.map(f => f.fieldType)
            }
        });

        res.json({
            success: true,
            signedPdfUrl: document.signedFileUrl,
            auditTrail: {
                hashBefore,
                hashAfter,
                timestamp: new Date().toISOString(),
                fieldsProcessed: fields.length
            }
        });

    } catch (error) {
        console.error('Sign PDF error:', error);
        res.status(500).json({ error: 'Failed to sign PDF' });
    }
});

/**
 * Embed image (signature) into PDF with aspect ratio preservation
 */
async function embedImage(pdfDoc, page, base64Data, coords) {
    // Extract base64 content
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Content, 'base64');

    // Detect image type and embed
    let image;
    if (base64Data.includes('image/png')) {
        image = await pdfDoc.embedPng(imageBuffer);
    } else {
        image = await pdfDoc.embedJpg(imageBuffer);
    }

    // Apply aspect ratio preservation (object-fit: contain)
    const { width, height, offsetX, offsetY } = containImageInBox(
        image.width,
        image.height,
        coords.width,
        coords.height
    );

    // Draw image centered in the field box
    page.drawImage(image, {
        x: coords.x + offsetX,
        y: coords.y + offsetY,
        width,
        height
    });
}

/**
 * Embed text into PDF
 */
function embedText(page, text, coords, pdfDoc) {
    const fontSize = Math.min(coords.height * 0.7, 12); // Max 12pt

    page.drawText(text || '', {
        x: coords.x + 2,
        y: coords.y + (coords.height - fontSize) / 2,
        size: fontSize,
    });
}

/**
 * Embed checkmark for checkbox fields
 */
function embedCheckmark(page, coords) {
    const centerX = coords.x + coords.width / 2;
    const centerY = coords.y + coords.height / 2;
    const size = Math.min(coords.width, coords.height) * 0.6;

    // Draw a simple checkmark
    page.drawText('✓', {
        x: centerX - size / 2,
        y: centerY - size / 2,
        size: size
    });
}

/**
 * Embed filled circle for radio fields
 */
function embedRadioFill(page, coords) {
    const centerX = coords.x + coords.width / 2;
    const centerY = coords.y + coords.height / 2;
    const radius = Math.min(coords.width, coords.height) * 0.3;

    // Draw a filled circle indicator
    page.drawCircle({
        x: centerX,
        y: centerY,
        size: radius,
        color: { red: 0, green: 0, blue: 0 }
    });
}

module.exports = router;
