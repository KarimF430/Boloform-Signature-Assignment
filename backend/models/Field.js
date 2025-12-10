const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },

    // Field type
    fieldType: {
        type: String,
        enum: ['signature', 'text', 'date', 'checkbox', 'radio', 'image'],
        required: true
    },

    // Field label/placeholder
    label: { type: String, default: '' },

    // Position stored as PERCENTAGES (0-1 range) - THE KEY!
    // This makes coordinates resolution-independent
    position: {
        pageNumber: { type: Number, required: true },
        xPercent: { type: Number, required: true, min: 0, max: 1 },
        yPercent: { type: Number, required: true, min: 0, max: 1 },
        widthPercent: { type: Number, required: true, min: 0, max: 1 },
        heightPercent: { type: Number, required: true, min: 0, max: 1 },
    },

    // Field-specific data
    value: { type: mongoose.Schema.Types.Mixed }, // Signature base64, text, etc.

    // Required flag
    required: { type: Boolean, default: true },

    // Audit
    createdAt: { type: Date, default: Date.now },
    signedAt: { type: Date },
    signedByIP: { type: String },
});

// Index for quick lookup by document
FieldSchema.index({ documentId: 1 });

module.exports = mongoose.model('Field', FieldSchema);
