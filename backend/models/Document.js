const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    // Original PDF info
    originalFileName: { type: String, required: true },
    originalFileUrl: { type: String, required: true },
    originalHash: { type: String, required: true }, // SHA-256 before modification

    // PDF metadata
    pdfMetadata: {
        pageCount: { type: Number, required: true },
        pages: [{
            pageNumber: Number,
            widthPoints: Number,  // PDF width in points (595.28 for A4)
            heightPoints: Number, // PDF height in points (841.89 for A4)
        }]
    },

    // Signed PDF info
    signedFileUrl: { type: String },
    signedHash: { type: String },

    // Status
    status: {
        type: String,
        enum: ['draft', 'pending_signature', 'signed', 'completed'],
        default: 'draft'
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Document', DocumentSchema);
