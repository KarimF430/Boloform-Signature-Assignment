import { useState, useRef, useEffect } from 'react';
import { normalizedToBrowser, browserToNormalized } from '../../utils/CoordinateTransformer';
import './FieldOverlay.css';

/**
 * FieldOverlay Component
 * 
 * Renders a draggable/resizable field on top of the PDF page.
 * Uses normalized coordinates (0-1) internally but displays in browser pixels.
 */
function FieldOverlay({
    field,
    containerDimensions,
    editable = true,
    onUpdate,
    onDelete,
    onClick
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const overlayRef = useRef(null);

    // Convert normalized position to browser pixels for display
    const browserCoords = normalizedToBrowser(
        field.position,
        containerDimensions.width,
        containerDimensions.height
    );

    // Handle drag start
    const handleMouseDown = (e) => {
        if (!editable || e.target.classList.contains('resize-handle')) return;

        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - browserCoords.x,
            y: e.clientY - browserCoords.y
        });
    };

    // Handle resize start
    const handleResizeStart = (e, corner) => {
        if (!editable) return;

        e.preventDefault();
        e.stopPropagation();
        setIsResizing(corner);
        setDragStart({
            x: e.clientX,
            y: e.clientY,
            initialWidth: browserCoords.width,
            initialHeight: browserCoords.height,
            initialX: browserCoords.x,
            initialY: browserCoords.y
        });
    };

    // Handle mouse move (drag or resize)
    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e) => {
            if (isDragging) {
                // Calculate new position
                let newX = e.clientX - dragStart.x;
                let newY = e.clientY - dragStart.y;

                // Clamp to container bounds
                newX = Math.max(0, Math.min(newX, containerDimensions.width - browserCoords.width));
                newY = Math.max(0, Math.min(newY, containerDimensions.height - browserCoords.height));

                // Convert back to normalized coordinates
                const normalized = browserToNormalized(
                    newX, newY,
                    browserCoords.width, browserCoords.height,
                    containerDimensions.width, containerDimensions.height
                );

                onUpdate?.({ position: { ...field.position, ...normalized } });
            } else if (isResizing) {
                const deltaX = e.clientX - dragStart.x;
                const deltaY = e.clientY - dragStart.y;

                let newWidth = dragStart.initialWidth;
                let newHeight = dragStart.initialHeight;
                let newX = dragStart.initialX;
                let newY = dragStart.initialY;

                // Handle different resize corners
                if (isResizing.includes('e')) {
                    newWidth = Math.max(30, dragStart.initialWidth + deltaX);
                }
                if (isResizing.includes('w')) {
                    newWidth = Math.max(30, dragStart.initialWidth - deltaX);
                    newX = dragStart.initialX + (dragStart.initialWidth - newWidth);
                }
                if (isResizing.includes('s')) {
                    newHeight = Math.max(20, dragStart.initialHeight + deltaY);
                }
                if (isResizing.includes('n')) {
                    newHeight = Math.max(20, dragStart.initialHeight - deltaY);
                    newY = dragStart.initialY + (dragStart.initialHeight - newHeight);
                }

                // Clamp to container
                newWidth = Math.min(newWidth, containerDimensions.width - newX);
                newHeight = Math.min(newHeight, containerDimensions.height - newY);

                // Convert to normalized
                const normalized = browserToNormalized(
                    newX, newY, newWidth, newHeight,
                    containerDimensions.width, containerDimensions.height
                );

                onUpdate?.({ position: { ...field.position, ...normalized } });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragStart, containerDimensions, browserCoords, field.position, onUpdate]);

    // Render field content based on type and value
    const renderContent = () => {
        if (field.value) {
            if (field.fieldType === 'signature' || field.fieldType === 'image') {
                return <img src={field.value} alt="Signature" />;
            }
            if (field.fieldType === 'checkbox' || field.fieldType === 'radio') {
                return field.value ? '✓' : '';
            }
            return <span>{field.value}</span>;
        }

        return <span className="field-label">{field.fieldType}</span>;
    };

    return (
        <div
            ref={overlayRef}
            className={`field-overlay ${field.fieldType} ${field.value ? 'filled' : ''}`}
            style={{
                left: browserCoords.x,
                top: browserCoords.y,
                width: browserCoords.width,
                height: browserCoords.height,
                cursor: editable ? 'move' : 'pointer'
            }}
            onMouseDown={handleMouseDown}
            onClick={() => onClick?.()}
        >
            <div className="field-content">
                {renderContent()}
            </div>

            {editable && (
                <>
                    <button
                        className="field-delete-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.();
                        }}
                    >
                        ×
                    </button>

                    {/* Resize handles */}
                    <div
                        className="resize-handle se"
                        onMouseDown={(e) => handleResizeStart(e, 'se')}
                    />
                    <div
                        className="resize-handle sw"
                        onMouseDown={(e) => handleResizeStart(e, 'sw')}
                    />
                    <div
                        className="resize-handle ne"
                        onMouseDown={(e) => handleResizeStart(e, 'ne')}
                    />
                    <div
                        className="resize-handle nw"
                        onMouseDown={(e) => handleResizeStart(e, 'nw')}
                    />
                </>
            )}
        </div>
    );
}

export default FieldOverlay;
