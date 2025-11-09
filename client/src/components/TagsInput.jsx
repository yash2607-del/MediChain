import React, { useState } from 'react'

export default function TagsInput({ label, placeholder = 'Type and press Enter', value = [], onChange }) {
  const [input, setInput] = useState('')

  const addTag = (tag) => {
    const t = tag.trim()
    if (!t) return
    if (value.includes(t)) return
    onChange?.([...value, t])
    setInput('')
  }

  const removeTag = (tag) => {
    onChange?.(value.filter((t) => t !== tag))
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="form-field">
      {label && <label>{label}</label>}
      <div className="tags-input" onClick={() => document.getElementById(label)?.focus()}>
        {value.map((t) => (
          <span className="tag" key={t}>
            {t}
            <button type="button" className="tag-remove" onClick={() => removeTag(t)} aria-label={`Remove ${t}`}>
              ×
            </button>
          </span>
        ))}
        <input
          id={label}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
