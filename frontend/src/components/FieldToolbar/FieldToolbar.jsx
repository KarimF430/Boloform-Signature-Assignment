import { useDrag } from 'react-dnd';
import './FieldToolbar.css';

const fieldTypes = [
    { type: 'signature', label: 'Signature', icon: '✍️' },
    { type: 'initials', label: 'Initials', icon: 'AA' },
    { type: 'stamp', label: 'Stamp', icon: '🔏' },
    { type: 'text', label: 'Text', icon: 'Tt' },
    { type: 'number', label: 'Num', icon: '123' },
    { type: 'date', label: 'Date', icon: '📅' },
];

function DraggableField({ type, label, icon }) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'field',
        item: { type, label },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            className={`field-box ${isDragging ? 'dragging' : ''}`}
        >
            <span className="field-icon">{icon}</span>
            <span className="field-label">{label}</span>
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
                        icon={field.icon}
                    />
                ))}
            </div>
        </div>
    );
}
