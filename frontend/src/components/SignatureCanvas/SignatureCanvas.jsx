import { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import './SignatureCanvas.css';

/**
 * SignatureCanvas Component
 * Modal for drawing signatures or entering text values
 */
function SignatureCanvas({ field, onSave, onClose }) {
    const sigCanvas = useRef(null);
    const [textValue, setTextValue] = useState('');
    const [dateValue, setDateValue] = useState(new Date().toISOString().split('T')[0]);
    const [checkValue, setCheckValue] = useState(false);

    const handleClear = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
        }
    };

    const handleSave = () => {
        let value;

        switch (field?.fieldType) {
            case 'signature':
            case 'image':
                if (sigCanvas.current) {
                    if (sigCanvas.current.isEmpty()) {
                        alert('Please draw a signature');
                        return;
                    }
                    // Export as PNG base64
                    value = sigCanvas.current.toDataURL('image/png');
                }
                break;

            case 'text':
                value = textValue;
                break;

            case 'date':
                value = dateValue;
                break;

            case 'checkbox':
            case 'radio':
                value = checkValue;
                break;

            default:
                value = textValue;
        }

        onSave(value);
    };

    const renderInput = () => {
        switch (field?.fieldType) {
            case 'signature':
            case 'image':
                return (
                    <>
                        <h3>✍️ Draw Your {field.fieldType === 'signature' ? 'Signature' : 'Drawing'}</h3>
                        <div className="signature-canvas-container">
                            <SignaturePad
                                ref={sigCanvas}
                                canvasProps={{
                                    width: 550,
                                    height: 200,
                                    className: 'signature-canvas'
                                }}
                                backgroundColor="white"
                            />
                        </div>
                        <div className="signature-actions">
                            <button className="btn-clear" onClick={handleClear}>
                                Clear
                            </button>
                            <button className="btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="btn-save" onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </>
                );

            case 'text':
                return (
                    <div className="text-input-modal">
                        <h3>📝 Enter Text</h3>
                        <input
                            type="text"
                            value={textValue}
                            onChange={(e) => setTextValue(e.target.value)}
                            placeholder="Enter your text..."
                            autoFocus
                        />
                        <div className="signature-actions">
                            <button className="btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="btn-save" onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </div>
                );

            case 'date':
                return (
                    <div className="text-input-modal date-picker-modal">
                        <h3>📅 Select Date</h3>
                        <input
                            type="date"
                            value={dateValue}
                            onChange={(e) => setDateValue(e.target.value)}
                        />
                        <div className="signature-actions">
                            <button className="btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="btn-save" onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </div>
                );

            case 'checkbox':
            case 'radio':
                return (
                    <div className="text-input-modal">
                        <h3>{field.fieldType === 'checkbox' ? '☑️ Checkbox' : '⭕ Radio Option'}</h3>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 16 }}>
                            <input
                                type="checkbox"
                                checked={checkValue}
                                onChange={(e) => setCheckValue(e.target.checked)}
                                style={{ width: 24, height: 24 }}
                            />
                            <span style={{ fontSize: 16 }}>Mark as checked</span>
                        </label>
                        <div className="signature-actions">
                            <button className="btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="btn-save" onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="signature-modal-overlay" onClick={onClose}>
            <div className="signature-modal" onClick={e => e.stopPropagation()}>
                {renderInput()}
            </div>
        </div>
    );
}

export default SignatureCanvas;
