const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },

    // Action tracking
    action: {
        type: String,
        enum: ['uploaded', 'field_added', 'field_modified', 'field_deleted', 'signed', 'downloaded'],
        required: true
    },

    // Hash chain (blockchain-like audit trail)
    documentHashBefore: { type: String },
    documentHashAfter: { type: String },

    // Actor info
    performedBy: {
        ip: { type: String },
        userAgent: { type: String },
        timestamp: { type: Date, default: Date.now }
    },

    // Metadata
    details: { type: mongoose.Schema.Types.Mixed }
});

// Index for efficient document history lookup
AuditLogSchema.index({ documentId: 1, 'performedBy.timestamp': -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
