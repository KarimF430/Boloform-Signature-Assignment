/**
 * COORDINATE TRANSFORMER
 * 
 * THE KEY FILE - This handles the conversion between browser coordinates and 
 * normalized percentages (0-1 range) for resolution-independent positioning.
 * 
 * Why percentages?
 * - Browser coordinates are screen-dependent (500px on desktop ≠ 500px on mobile)
 * - PDF coordinates are fixed (595.28 x 841.89 points for A4)
 * - Percentages are universal: 0.5 always means "middle" regardless of screen size
 */

/**
 * Convert browser pixel coordinates to normalized percentages (0-1 range)
 * Used when: User drops/drags/resizes a field on the PDF viewer
 * 
 * @param {number} browserX - X position in pixels from container left
 * @param {number} browserY - Y position in pixels from container top
 * @param {number} browserWidth - Width in pixels
 * @param {number} browserHeight - Height in pixels
 * @param {number} containerWidth - PDF container width in pixels
 * @param {number} containerHeight - PDF container height in pixels
 * @returns {Object} Normalized position (0-1 range)
 */
export function browserToNormalized(
    browserX, browserY, browserWidth, browserHeight,
    containerWidth, containerHeight
) {
    return {
        xPercent: browserX / containerWidth,
        yPercent: browserY / containerHeight,
        widthPercent: browserWidth / containerWidth,
        heightPercent: browserHeight / containerHeight
    };
}

/**
 * Convert normalized percentages back to browser pixels
 * Used when: Re-rendering fields at a different screen size
 * 
 * This is what makes the system RESPONSIVE:
 * - Store position as percentages
 * - Convert to pixels based on CURRENT container size
 * - Field appears at the same RELATIVE position on any screen
 * 
 * @param {Object} normalized - Normalized position (0-1 range)
 * @param {number} containerWidth - Current container width in pixels
 * @param {number} containerHeight - Current container height in pixels
 * @returns {Object} Browser coordinates in pixels
 */
export function normalizedToBrowser(normalized, containerWidth, containerHeight) {
    return {
        x: normalized.xPercent * containerWidth,
        y: normalized.yPercent * containerHeight,
        width: normalized.widthPercent * containerWidth,
        height: normalized.heightPercent * containerHeight
    };
}

/**
 * Clamp a field position to stay within container bounds
 * Ensures fields don't overflow the PDF page
 * 
 * @param {Object} position - Current normalized position
 * @returns {Object} Clamped normalized position
 */
export function clampPosition(position) {
    return {
        xPercent: Math.max(0, Math.min(position.xPercent, 1 - position.widthPercent)),
        yPercent: Math.max(0, Math.min(position.yPercent, 1 - position.heightPercent)),
        widthPercent: Math.min(position.widthPercent, 1 - position.xPercent),
        heightPercent: Math.min(position.heightPercent, 1 - position.yPercent)
    };
}

/**
 * Default sizes for different field types (as percentage of container)
 */
export const DEFAULT_FIELD_SIZES = {
    signature: { widthPercent: 0.25, heightPercent: 0.08 },
    text: { widthPercent: 0.2, heightPercent: 0.04 },
    date: { widthPercent: 0.15, heightPercent: 0.04 },
    checkbox: { widthPercent: 0.03, heightPercent: 0.03 },
    radio: { widthPercent: 0.03, heightPercent: 0.03 },
    image: { widthPercent: 0.2, heightPercent: 0.15 }
};
