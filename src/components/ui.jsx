import React from 'react';
import { X } from 'lucide-react';
import { FONT_FAMILIES } from '../data/fonts';

export const Panel = ({ title, hint, children, className = '' }) => (
  <section className={`panel ${className}`}>
    {title ? (
      <header className="panel-head">
        <h2>{title}</h2>
        {hint ? <p>{hint}</p> : null}
      </header>
    ) : null}
    {children}
  </section>
);

export const Field = ({ label, hint, children, htmlFor }) => (
  <div className="field">
    {label ? (
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
    ) : null}
    {children}
    {hint ? <p className="field-hint">{hint}</p> : null}
  </div>
);

export const TextInput = ({ id, value, onChange, placeholder, type = 'text', inputMode, ...rest }) => (
  <input
    id={id}
    className="input"
    type={type}
    value={value}
    placeholder={placeholder}
    inputMode={inputMode}
    onChange={(e) => onChange(e.target.value)}
    {...rest}
  />
);

export const TextArea = ({ id, value, onChange, placeholder, rows = 5, ...rest }) => (
  <textarea
    id={id}
    className="input textarea"
    value={value}
    rows={rows}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    {...rest}
  />
);

export const Slider = ({ label, value, min, max, step = 1, onChange, suffix = '' }) => (
  <div className="field">
    <div className="slider-head">
      <span className="field-label">{label}</span>
      <span className="slider-value">
        {value}
        {suffix}
      </span>
    </div>
    <input
      className="slider"
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
);

export const Toggle = ({ label, checked, onChange, hint }) => (
  <label className="toggle-row">
    <span className="toggle-text">
      <span className="field-label">{label}</span>
      {hint ? <span className="field-hint">{hint}</span> : null}
    </span>
    <span className={`switch ${checked ? 'is-on' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span className="knob" aria-hidden="true" />
    </span>
  </label>
);

export const FontPicker = ({ label, id, value, onChange }) => (
  <div className="field">
    <label className="field-label" htmlFor={id}>
      {label}
    </label>
    <div className="font-row">
      <select id={id} className="input select" value={value || ''} aria-label={label} onChange={(e) => onChange(e.target.value)}>
        <option value="">Theme default</option>
        {FONT_FAMILIES.map((f) => (
          <option key={f} value={f} style={{ fontFamily: `"${f}", sans-serif` }}>
            {f}
          </option>
        ))}
      </select>
      <span className="font-chip" aria-hidden="true" style={value ? { fontFamily: `"${value}", var(--serif)` } : undefined}>
        Aa
      </span>
    </div>
  </div>
);

export const ChoiceGroup = ({ label, value, options, onChange, columns }) => (
  <div className="field">
    <span className="field-label">{label}</span>
    <div className="choice-group" style={columns ? { '--cols': columns } : undefined} role="group" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`choice ${value === opt.id ? 'is-active' : ''}`}
          onClick={() => onChange(opt.id)}
          aria-pressed={value === opt.id}
        >
          {opt.icon || null}
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

export const ColorField = ({ label, value, onChange, swatches = [] }) => (
  <div className="field">
    <div className="slider-head">
      <span className="field-label">{label}</span>
      <span className="slider-value">{value}</span>
    </div>
    <div className="color-row">
      <input
        type="color"
        className="color-input"
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      />
      {swatches.map((c) => (
        <button
          key={c}
          type="button"
          className={`swatch ${value === c ? 'is-active' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-label={`Use color ${c}`}
        />
      ))}
    </div>
  </div>
);

export const Button = ({ children, variant = 'primary', className = '', ...rest }) => (
  <button type="button" className={`btn btn-${variant} ${className}`} {...rest}>
    {children}
  </button>
);

export const Sheet = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Sheet'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" aria-hidden="true" />
        {title ? (
          <header className="sheet-head">
            <h3>{title}</h3>
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
                <X size={17} />
              </button>
          </header>
        ) : null}
        <div className="sheet-body">{children}</div>
        {footer ? <div className="sheet-footer">{footer}</div> : null}
      </div>
    </div>
  );
};
