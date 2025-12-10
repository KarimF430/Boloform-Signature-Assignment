import { useState, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import PDFViewer from '../PDFViewer';
import FieldToolbar from '../FieldToolbar';
import SignatureCanvas from '../SignatureCanvas';
import {
    uploadDocument,
    createField,
    updateField,
    deleteField,
    setFieldValue,
    signPdf,
    getFileUrl
} from '../../services/api';
import './DocumentEditor.css';

function DocumentEditor() {
    const [document, setDocument] = useState(null);
    const [fields, setFields] = useState([]);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [view, setView] = useState('home');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedField, setSelectedField] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    const fileInputRef = useRef(null);

    const handleUpload = async (file) => {
        if (!file) return;
        setLoading(true);
        try {
            const result = await uploadDocument(file);
            setDocument(result.document);
            setFields([]);
            setPdfUrl(getFileUrl(result.document.fileUrl));
            setView('editor');
            showSuccess('PDF uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload PDF');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === 'application/pdf') handleUpload(file);
    };

    const handleCardClick = () => {
        fileInputRef.current?.click();
    };

    const handleFieldAdd = useCallback(async (fieldData) => {
        if (!document) return;
        try {
            const result = await createField({ documentId: document.id, ...fieldData });
            setFields(prev => [...prev, result.field]);
        } catch (error) {
            console.error('Add field error:', error);
        }
    }, [document]);

    const handleFieldUpdate = useCallback(async (fieldId, updates) => {
        setFields(prev => prev.map(f =>
            (f._id === fieldId || f.id === fieldId) ? { ...f, ...updates } : f
        ));
        try { await updateField(fieldId, updates); } catch (error) { console.error(error); }
    }, []);

    const handleFieldDelete = useCallback(async (fieldId) => {
        try {
            await deleteField(fieldId);
            setFields(prev => prev.filter(f => (f._id !== fieldId && f.id !== fieldId)));
        } catch (error) { console.error(error); }
    }, []);

    const handleFieldClick = useCallback((field) => {
        setSelectedField(field);
    }, []);

    const handleFieldValueSave = useCallback(async (value) => {
        if (!selectedField) return;
        try {
            await setFieldValue(selectedField._id || selectedField.id, value);
            setFields(prev => prev.map(f =>
                (f._id === selectedField._id || f.id === selectedField.id) ? { ...f, value } : f
            ));
            setSelectedField(null);
            showSuccess('Field saved!');
        } catch (error) { console.error(error); }
    }, [selectedField]);

    const handleSign = async () => {
        if (!document) return;
        setLoading(true);
        try {
            const result = await signPdf(document.id);
            setDocument(prev => ({ ...prev, signedFileUrl: result.signedPdfUrl }));
            showSuccess('Document signed successfully!');
            window.open(getFileUrl(result.signedPdfUrl), '_blank');
        } catch (error) {
            console.error('Sign error:', error);
            alert('Failed to sign document');
        } finally {
            setLoading(false);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // HOME VIEW
    if (view === 'home') {
        return (
            <div className="bolosign home-view">
                <header className="header">
                    <div className="header-left">
                        <button className="menu-btn">☰</button>
                        <span className="nav-home">Home</span>
                        <span className="nav-arrow">›</span>
                        <span className="nav-create">Create</span>
                    </div>
                    <div className="header-right">
                        <span className="counter-badge">2/6</span>
                        <button className="icon-btn">文</button>
                        <button className="icon-btn">?</button>
                        <div className="user-avatar">R</div>
                    </div>
                </header>

                <main className="home-main">
                    <h1>How Do You Want To Take Signature?</h1>
                    <p className="home-subtitle">
                        Upload a PDF to sign your document.
                    </p>

                    <div className="type-cards">
                        <div
                            className="type-card horizontal"
                            onClick={handleCardClick}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <div className="card-icon yellow">
                                <span className="pdf-text">PDF</span>
                            </div>
                            <div className="card-content">
                                <h3>PDF</h3>
                                <p>Send PDF for Signature</p>
                            </div>
                        </div>
                    </div>
                </main>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    hidden
                />
                {loading && <div className="loading-overlay"><div className="spinner"></div></div>}
            </div>
        );
    }

    // EDITOR VIEW - Matching BoloForms design
    return (
        <DndProvider backend={HTML5Backend}>
            <div className="bolosign editor-view">
                {/* Editor Header */}
                <header className="editor-header">
                    <button className="close-btn" onClick={() => setView('home')}>✕</button>
                    <span className="doc-name">{document?.fileName || 'Untitled'}</span>
                    <div className="header-actions">
                        <button className="action-btn">👤+</button>
                        <button className="send-btn" onClick={handleSign} disabled={loading}>
                            Send
                        </button>
                        <button className="action-btn">?</button>
                    </div>
                </header>

                {/* Undo/Redo Bar */}
                <div className="undo-bar">
                    <button className="undo-btn">↩</button>
                    <button className="redo-btn">↪</button>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar"></div>

                {/* PDF Viewer */}
                <main className="pdf-container">
                    <PDFViewer
                        pdfUrl={pdfUrl}
                        fields={fields}
                        onFieldAdd={handleFieldAdd}
                        onFieldUpdate={handleFieldUpdate}
                        onFieldDelete={handleFieldDelete}
                        onFieldClick={handleFieldClick}
                        editable={true}
                    />
                </main>

                {/* Sparkle indicator */}
                <div className="sparkle-indicator">✦</div>

                {/* Bottom Field Toolbar */}
                <div className="bottom-toolbar">
                    <FieldToolbar />
                </div>

                {selectedField && (
                    <SignatureCanvas
                        field={selectedField}
                        onSave={handleFieldValueSave}
                        onClose={() => setSelectedField(null)}
                    />
                )}
                {loading && <div className="loading-overlay"><div className="spinner"></div></div>}
                {successMessage && <div className="toast">{successMessage}</div>}
            </div>
        </DndProvider>
    );
}

export default DocumentEditor;
