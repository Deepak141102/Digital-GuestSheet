import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import SectionBlock from './SectionBlock'
import MobilePreview from './MobilePreview'

function deepClone(o) {
  return JSON.parse(JSON.stringify(o))
}

export default function CustomizeStep({ formConfig, onNext, onBack }) {
  const [config, setConfig] = useState(() => deepClone(formConfig))

  // Autosave draft on every config change
  useEffect(() => {
    localStorage.setItem('gs_draft', JSON.stringify(config))
  }, [config])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const updateField = (sectionId, fieldId, updates) =>
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f,
              ),
            }
          : s,
      ),
    }))

  const deleteField = (sectionId, fieldId) =>
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
          : s,
      ),
    }))

  const addField = (sectionId) => {
    const newField = {
      id: crypto.randomUUID(),
      name: 'New Field',
      type: 'text',
      required: false,
    }
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, fields: [...s.fields, newField] }
          : s,
      ),
    }))
  }

  const deleteSection = (sectionId) =>
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }))

  const moveSection = (sectionId, dir) =>
    setConfig((prev) => {
      const idx = prev.sections.findIndex((s) => s.id === sectionId)
      const next = idx + dir
      if (next < 0 || next >= prev.sections.length) return prev
      const arr = [...prev.sections]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return { ...prev, sections: arr }
    })

  const updateSection = (sectionId, updates) =>
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s,
      ),
    }))

  const addSection = () => {
    const newSec = {
      id: crypto.randomUUID(),
      name: 'New Section',
      icon: 'default',
      fields: [],
    }
    setConfig((prev) => ({
      ...prev,
      sections: [...prev.sections, newSec],
    }))
  }

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        const oldIdx = s.fields.findIndex((f) => f.id === active.id)
        const newIdx = s.fields.findIndex((f) => f.id === over.id)
        if (oldIdx === -1 || newIdx === -1) return s
        return { ...s, fields: arrayMove(s.fields, oldIdx, newIdx) }
      }),
    }))
  }

  return (
    <div className="customize-layout">
      {/* Navbar */}
      <nav className="cust-nav">
        <div className="nav-logo">
          <LogoIcon />
          <span>GuestSheet</span>
        </div>

        <div className="nav-steps">
          <button className="nav-step done nav-step-btn" onClick={onBack} type="button">
            <CheckIcon /> Upload &amp; Parse
          </button>
          <span className="nav-step-line" />
          <span className="nav-step active">
            <span className="nav-num">2</span> Customize
          </span>
          <span className="nav-step-line" />
          <span className="nav-step pending">
            <span className="nav-num pending-num">3</span> Share Link
          </span>
        </div>

        <button className="btn-primary nav-cta" onClick={() => onNext(config)}>
          Next: Get Share Link
          <ArrowRight />
        </button>
      </nav>

      {/* Body */}
      <div className="cust-body">
        {/* Left — editor */}
        <div className="cust-left">
          <h2 className="cust-heading">Customize Form Fields</h2>
          <p className="cust-sub">
            We extracted these fields from your uploaded paper sheet. Add,
            rename, or reorder fields below.
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {config.sections.map((section, idx) => (
              <SectionBlock
                key={section.id}
                section={section}
                isFirst={idx === 0}
                isLast={idx === config.sections.length - 1}
                onUpdateField={(fId, upd) => updateField(section.id, fId, upd)}
                onDeleteField={(fId) => deleteField(section.id, fId)}
                onAddField={() => addField(section.id)}
                onDelete={() => deleteSection(section.id)}
                onMoveUp={() => moveSection(section.id, -1)}
                onMoveDown={() => moveSection(section.id, 1)}
                onUpdateSection={(upd) => updateSection(section.id, upd)}
              />
            ))}
          </DndContext>

          <button className="btn-add-section" onClick={addSection} type="button">
            + Add Section
          </button>
        </div>

        {/* Right — live mobile preview */}
        <div className="cust-right">
          <MobilePreview config={config} />
        </div>
      </div>
    </div>
  )
}

function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8b73d" strokeWidth="2">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="13" y2="16" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}
