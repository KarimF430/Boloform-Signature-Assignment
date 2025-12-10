const crypto = require('crypto');

/**
 * Calculate SHA-256 hash of a buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {string} - Hex-encoded hash
 */
function calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Verify document integrity by comparing hashes
 * @param {Buffer} buffer - Current PDF buffer
 * @param {string} expectedHash - Hash to compare against
 * @returns {boolean} - True if hashes match
 */
function verifyHash(buffer, expectedHash) {
    const currentHash = calculateHash(buffer);
    // Use timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(currentHash, 'hex'),
            Buffer.from(expectedHash, 'hex')
        );
    } catch {
        return false;
    }
}

module.exports = { calculateHash, verifyHash };
