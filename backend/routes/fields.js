const express = require('express');
const Field = require('../models/Field');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

/**
 * POST /api/fields
 * Create a new field on a document
 * 
 * Body: {
 *   documentId: string,
 *   fieldType: 'signature' | 'text' | 'date' | 'checkbox' | 'radio' | 'image',
 *   label: string,
 *   position: {
 *     pageNumber: number,
 *     xPercent: number (0-1),
 *     yPercent: number (0-1),
 *     widthPercent: number (0-1),
 *     heightPercent: number (0-1)
 *   },
 *   required: boolean
 * }
 */
router.post('/', async (req, res) => {
    try {
        const { documentId, fieldType, label, position, required } = req.body;

        // Validate document exists
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Validate position percentages are in 0-1 range
        const { xPercent, yPercent, widthPercent, heightPercent } = position;
        if ([xPercent, yPercent, widthPercent, heightPercent].some(v => v < 0 || v > 1)) {
            return res.status(400).json({ error: 'Position percentages must be between 0 and 1' });
        }

        // Create field
        const field = await Field.create({
            documentId,
            fieldType,
            label: label || fieldType,
            position,
            required: required !== false
        });

        // Update document status
        await Document.findByIdAndUpdate(documentId, {
            status: 'pending_signature',
            updatedAt: new Date()
        });

        // Create audit log
        await AuditLog.create({
            documentId,
            action: 'field_added',
            performedBy: {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date()
            },
            details: {
                fieldId: field._id,
                fieldType,
                position
            }
        });

        res.status(201).json({ success: true, field });

    } catch (error) {
        console.error('Create field error:', error);
        res.status(500).json({ error: 'Failed to create field' });
    }
});

/**
 * PUT /api/fields/:id
 * Update a field's position or properties
 */
router.put('/:id', async (req, res) => {
    try {
        const { position, label, required } = req.body;

        const field = await Field.findById(req.params.id);
        if (!field) {
            return res.status(404).json({ error: 'Field not found' });
        }

        // Update fields
        if (position) {
            // Validate percentages
            const { xPercent, yPercent, widthPercent, heightPercent } = position;
            if ([xPercent, yPercent, widthPercent, heightPercent].some(v => v < 0 || v > 1)) {
                return res.status(400).json({ error: 'Position percentages must be between 0 and 1' });
            }
            field.position = position;
        }
        if (label !== undefined) field.label = label;
        if (required !== undefined) field.required = required;

        await field.save();

        // Audit log
        await AuditLog.create({
            documentId: field.documentId,
            action: 'field_modified',
            performedBy: {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date()
            },
            details: {
                fieldId: field._id,
                updates: req.body
            }
        });

        res.json({ success: true, field });

    } catch (error) {
        console.error('Update field error:', error);
        res.status(500).json({ error: 'Failed to update field' });
    }
});

/**
 * DELETE /api/fields/:id
 * Delete a field
 */
router.delete('/:id', async (req, res) => {
    try {
        const field = await Field.findByIdAndDelete(req.params.id);

        if (!field) {
            return res.status(404).json({ error: 'Field not found' });
        }

        // Audit log
        await AuditLog.create({
            documentId: field.documentId,
            action: 'field_deleted',
            performedBy: {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date()
            },
            details: { fieldId: field._id }
        });

        res.json({ success: true });

    } catch (error) {
        console.error('Delete field error:', error);
        res.status(500).json({ error: 'Failed to delete field' });
    }
});

/**
 * POST /api/fields/:id/value
 * Set the value of a field (for signing)
 */
router.post('/:id/value', async (req, res) => {
    try {
        const { value } = req.body;

        const field = await Field.findById(req.params.id);
        if (!field) {
            return res.status(404).json({ error: 'Field not found' });
        }

        field.value = value;
        field.signedAt = new Date();
        field.signedByIP = req.ip;
        await field.save();

        res.json({ success: true, field });

    } catch (error) {
        console.error('Set field value error:', error);
        res.status(500).json({ error: 'Failed to set field value' });
    }
});

module.exports = router;
