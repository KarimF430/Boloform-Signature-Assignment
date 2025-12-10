import { useDrag } from 'react-dnd';
import './FieldToolbar.css';

const fieldTypes = [
    { type: 'signature', label: 'Signature', iconType: 'signature' },
    { type: 'upload', label: 'Upload\nSignature', iconType: 'upload' },
];

// SVG Icons matching BoloForms style
const SignatureIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17c3.333-3.333 5-5 5-5s2 4 5 4 6-8 8-8" />
        <path d="M3 21h18" />
    </svg>
);

const UploadIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const icons = {
    signature: SignatureIcon,
    upload: UploadIcon,
};

function DraggableField({ type, label, iconType }) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'field',
        item: { type, label: label.replace('\n', ' ') },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const IconComponent = icons[iconType];

    return (
        <div
            ref={drag}
            className={`field-box ${isDragging ? 'dragging' : ''}`}
        >
            <div className="field-icon">
                <IconComponent />
            </div>
            <div className="field-label">{label}</div>
        </div>
    );
}

export default function FieldToolbar() {
    return (
        <div className="field-toolbar">
            <div className="toolbar-header">
                <span className="toolbar-title">Fillable fields for</span>
                <button className="change-role-btn">
                    Change Role
                    <span className="role-icon">⚙</span>
                </button>
            </div>
            <div className="field-boxes">
                {fieldTypes.map((field) => (
                    <DraggableField
                        key={field.type}
                        type={field.type}
                        label={field.label}
                        iconType={field.iconType}
                    />
                ))}
            </div>
        </div>
    );
}
