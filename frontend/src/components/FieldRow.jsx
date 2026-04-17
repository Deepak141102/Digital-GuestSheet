import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FIELD_TYPES } from '../data/sampleForm'

export default function FieldRow({ field, onChange, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 999 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`field-row${isDragging ? ' dragging' : ''}`}
    >
      <button
        className="drag-handle"
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <DragDots />
      </button>

      <input
        className="field-name-input"
        value={field.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Field name"
      />

      <select
        className="field-type-select"
        value={field.type}
        onChange={(e) => onChange({ type: e.target.value })}
      >
        {FIELD_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <div className="req-toggle-wrap">
        <span className="req-label">Req</span>
        <button
          className={`toggle-btn${field.required ? ' toggle-on' : ' toggle-off'}`}
          onClick={() => onChange({ required: !field.required })}
          role="switch"
          aria-checked={field.required}
          type="button"
        >
          <span className="toggle-thumb" />
        </button>
      </div>

      <button
        className="btn-delete-field"
        onClick={onDelete}
        type="button"
        aria-label="Remove field"
      >
        ✕
      </button>
    </div>
  )
}

function DragDots() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true">
      {[4, 8, 12].map((cy) =>
        [3, 7].map((cx) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" fill="#b9b8b6" />
        )),
      )}
    </svg>
  )
}
