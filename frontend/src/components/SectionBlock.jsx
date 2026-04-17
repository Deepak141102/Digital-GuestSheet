import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import FieldRow from './FieldRow'

export default function SectionBlock({
  section,
  isFirst,
  isLast,
  onUpdateField,
  onDeleteField,
  onAddField,
  onDelete,
  onMoveUp,
  onMoveDown,
  onUpdateSection,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [editingName, setEditingName] = useState(false)

  return (
    <div className="section-block">
      <div className="section-header">
        <SectionIcon icon={section.icon} />

        {editingName ? (
          <input
            className="section-name-input"
            value={section.name}
            onChange={(e) => onUpdateSection({ name: e.target.value })}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
            autoFocus
          />
        ) : (
          <span
            className="section-name"
            onClick={() => setEditingName(true)}
            title="Click to rename"
          >
            {section.name}
          </span>
        )}

        <div className="section-actions">
          <button
            className="sec-action-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
            type="button"
          >
            <ChevronIcon up={!collapsed} />
          </button>
          <button
            className="sec-action-btn"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move section up"
            type="button"
          >
            <ArrowIcon up />
          </button>
          <button
            className="sec-action-btn"
            onClick={onMoveDown}
            disabled={isLast}
            title="Move section down"
            type="button"
          >
            <ArrowIcon />
          </button>
          <button
            className="sec-action-btn sec-action-danger"
            onClick={onDelete}
            title="Delete section"
            type="button"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="section-body">
          <SortableContext
            items={section.fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.fields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                onChange={(updates) => onUpdateField(field.id, updates)}
                onDelete={() => onDeleteField(field.id)}
              />
            ))}
          </SortableContext>

          {section.fields.length === 0 && (
            <p className="empty-fields-hint">No fields yet. Add one below.</p>
          )}

          <button className="btn-add-field" onClick={onAddField} type="button">
            + Add Field
          </button>
        </div>
      )}
    </div>
  )
}

function SectionIcon({ icon }) {
  if (icon === 'person') {
    return (
      <svg className="section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
  return (
    <svg className="section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function ChevronIcon({ up }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points={up ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
    </svg>
  )
}

function ArrowIcon({ up }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points={up ? '12 19 12 5' : '12 5 12 19'} />
      <polyline points={up ? '5 12 12 5 19 12' : '5 12 12 19 19 12'} />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}
