/**
 * THE KEY COORDINATE TRANSFORMATION
 * 
 * Problem: Browser and PDF use different coordinate systems
 * - Browser: Origin at TOP-LEFT, Y increases DOWNWARD
 * - PDF: Origin at BOTTOM-LEFT, Y increases UPWARD
 * 
 * Solution: Store positions as percentages (0-1), then transform to PDF points
 */

/**
 * Transform normalized coordinates (0-1 percentages) to PDF coordinates (points)
 * 
 * @param {Object} position - Normalized position from frontend
 * @param {number} position.xPercent - X position as percentage (0-1)
 * @param {number} position.yPercent - Y position as percentage (0-1)
 * @param {number} position.widthPercent - Width as percentage (0-1)
 * @param {number} position.heightPercent - Height as percentage (0-1)
 * @param {number} pdfWidth - PDF page width in points
 * @param {number} pdfHeight - PDF page height in points
 * @returns {Object} - PDF coordinates in points
 */
function transformToPdfCoordinates(position, pdfWidth, pdfHeight) {
    // Step 1: Scale percentages to PDF dimensions
    const pdfX = position.xPercent * pdfWidth;
    const pdfBoxWidth = position.widthPercent * pdfWidth;
    const pdfBoxHeight = position.heightPercent * pdfHeight;

    // Step 2: CRITICAL - Flip Y-axis
    // Browser: Y=0 at top, increases downward
    // PDF: Y=0 at bottom, increases upward
    // 
    // Formula breakdown:
    // - position.yPercent * pdfHeight = distance from TOP in PDF points
    // - We need distance from BOTTOM, so: pdfHeight - (distance from top)
    // - Subtract box height because PDF draws from bottom-left of box
    const pdfY = pdfHeight - (position.yPercent * pdfHeight) - pdfBoxHeight;

    return {
        x: pdfX,
        y: pdfY,
        width: pdfBoxWidth,
        height: pdfBoxHeight
    };
}

/**
 * Fit an image inside a box while maintaining aspect ratio (object-fit: contain)
 * 
 * @param {number} imgWidth - Original image width
 * @param {number} imgHeight - Original image height
 * @param {number} boxWidth - Container box width
 * @param {number} boxHeight - Container box height
 * @returns {Object} - { width, height, offsetX, offsetY } for centered placement
 */
function containImageInBox(imgWidth, imgHeight, boxWidth, boxHeight) {
    const imgRatio = imgWidth / imgHeight;
    const boxRatio = boxWidth / boxHeight;

    let fitWidth, fitHeight;

    if (imgRatio > boxRatio) {
        // Image is WIDER than box ratio - constrain by width
        // Example: Wide signature in square box
        fitWidth = boxWidth;
        fitHeight = boxWidth / imgRatio;
    } else {
        // Image is TALLER than box ratio - constrain by height
        // Example: Tall signature in wide box
        fitHeight = boxHeight;
        fitWidth = boxHeight * imgRatio;
    }

    // Center the image in the box
    const offsetX = (boxWidth - fitWidth) / 2;
    const offsetY = (boxHeight - fitHeight) / 2;

    return { width: fitWidth, height: fitHeight, offsetX, offsetY };
}

module.exports = { transformToPdfCoordinates, containImageInBox };
