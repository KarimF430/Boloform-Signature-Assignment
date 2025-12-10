import { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useDrop } from 'react-dnd';
import FieldOverlay from './FieldOverlay';
import { browserToNormalized, DEFAULT_FIELD_SIZES } from '../../utils/CoordinateTransformer';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './PDFViewer.css';

// Set worker path
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function PDFViewer({
    pdfUrl,
    fields = [],
    onFieldAdd,
    onFieldUpdate,
    onFieldDelete,
    onFieldClick,
    editable = true,
    currentPage = 1,
    onPageChange
}) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(currentPage);
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const pageRef = useRef(null);
    const containerRef = useRef(null);

    // Update container dimensions on resize
    useEffect(() => {
        const updateDimensions = () => {
            if (pageRef.current) {
                const rect = pageRef.current.getBoundingClientRect();
                setContainerDimensions({ width: rect.width, height: rect.height });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [numPages, pageNumber]);

    // Sync with external page control
    useEffect(() => {
        setPageNumber(currentPage);
    }, [currentPage]);

    // Drop zone for new fields
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'FIELD',
        drop: (item, monitor) => {
            if (!pageRef.current || !editable) return;

            const offset = monitor.getClientOffset();
            const pageRect = pageRef.current.getBoundingClientRect();

            // Calculate drop position relative to page
            const dropX = offset.x - pageRect.left;
            const dropY = offset.y - pageRect.top;

            // Get default size for this field type
            const defaultSize = DEFAULT_FIELD_SIZES[item.fieldType] || DEFAULT_FIELD_SIZES.text;

            // Calculate actual pixel dimensions for centering
            const fieldWidth = defaultSize.widthPercent * pageRect.width;
            const fieldHeight = defaultSize.heightPercent * pageRect.height;

            // Center the field on the cursor
            const adjustedX = dropX - fieldWidth / 2;
            const adjustedY = dropY - fieldHeight / 2;

            // Convert to normalized coordinates (0-1 range)
            const normalized = browserToNormalized(
                adjustedX, adjustedY,
                fieldWidth, fieldHeight,
                pageRect.width, pageRect.height
            );

            // Clamp to stay within bounds
            normalized.xPercent = Math.max(0, Math.min(normalized.xPercent, 1 - normalized.widthPercent));
            normalized.yPercent = Math.max(0, Math.min(normalized.yPercent, 1 - normalized.heightPercent));

            // Notify parent of new field
            if (onFieldAdd) {
                onFieldAdd({
                    fieldType: item.fieldType,
                    position: {
                        pageNumber,
                        ...normalized
                    }
                });
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver()
        })
    }), [pageNumber, containerDimensions, editable, onFieldAdd]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const onPageLoadSuccess = useCallback(() => {
        if (pageRef.current) {
            const rect = pageRef.current.getBoundingClientRect();
            setContainerDimensions({ width: rect.width, height: rect.height });
        }
    }, []);

    const goToPrevPage = () => {
        const newPage = Math.max(1, pageNumber - 1);
        setPageNumber(newPage);
        onPageChange?.(newPage);
    };

    const goToNextPage = () => {
        const newPage = Math.min(numPages, pageNumber + 1);
        setPageNumber(newPage);
        onPageChange?.(newPage);
    };

    // Filter fields for current page
    const currentPageFields = fields.filter(f => f.position?.pageNumber === pageNumber);

    return (
        <div className="pdf-viewer-container" ref={containerRef}>
            {/* Page Controls */}
            <div className="pdf-controls">
                <button onClick={goToPrevPage} disabled={pageNumber <= 1}>
                    ← Previous
                </button>
                <span>
                    Page {pageNumber} of {numPages || '?'}
                </span>
                <button onClick={goToNextPage} disabled={pageNumber >= numPages}>
                    Next →
                </button>
            </div>

            {/* PDF Document */}
            <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="pdf-loading">Loading PDF...</div>}
                error={<div className="pdf-error">Failed to load PDF</div>}
            >
                <div
                    ref={(el) => {
                        pageRef.current = el;
                        drop(el);
                    }}
                    className="pdf-page-wrapper"
                    style={{
                        outline: isOver && editable ? '3px dashed #4CAF50' : 'none',
                        position: 'relative'
                    }}
                >
                    <Page
                        pageNumber={pageNumber}
                        onLoadSuccess={onPageLoadSuccess}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />

                    {/* Render field overlays */}
                    {currentPageFields.map((field) => (
                        <FieldOverlay
                            key={field._id || field.id}
                            field={field}
                            containerDimensions={containerDimensions}
                            editable={editable}
                            onUpdate={(updates) => onFieldUpdate?.(field._id || field.id, updates)}
                            onDelete={() => onFieldDelete?.(field._id || field.id)}
                            onClick={() => onFieldClick?.(field)}
                        />
                    ))}
                </div>
            </Document>
        </div>
    );
}

export default PDFViewer;
